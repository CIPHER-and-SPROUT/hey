import { PencilIcon } from '@heroicons/react/24/outline';
import { LensHub } from '@hey/abis';
import { LENSHUB_PROXY } from '@hey/data/constants';
import { Errors } from '@hey/data/errors';
import { SETTINGS } from '@hey/data/tracking';
import type { OnchainSetProfileMetadataRequest } from '@hey/lens';
import {
  useBroadcastOnchainMutation,
  useCreateOnchainSetProfileMetadataTypedDataMutation,
  useProfileQuery,
  useSetProfileMetadataMutation
} from '@hey/lens';
import getProfileAttribute from '@hey/lib/getProfileAttribute';
import getSignature from '@hey/lib/getSignature';
import {
  Button,
  ErrorMessage,
  Form,
  Input,
  Spinner,
  useZodForm
} from '@hey/ui';
import errorToast from '@lib/errorToast';
import { Leafwatch } from '@lib/leafwatch';
import uploadToArweave from '@lib/uploadToArweave';
import type { FC } from 'react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import useHandleWrongNetwork from 'src/hooks/useHandleWrongNetwork';
import { useAppStore } from 'src/store/app';
import { useGlobalModalStateStore } from 'src/store/modals';
import { v4 as uuid } from 'uuid';
import { useContractWrite, useSignTypedData } from 'wagmi';
import { object, string } from 'zod';

import EmojiPicker from './EmojiPicker';
import Loader from './Loader';

const editStatusSchema = object({
  status: string()
    .min(1, { message: 'Status should not be empty' })
    .max(100, { message: 'Status should not exceed 100 characters' })
});

const Status: FC = () => {
  const currentProfile = useAppStore((state) => state.currentProfile);
  const setShowStatusModal = useGlobalModalStateStore(
    (state) => state.setShowStatusModal
  );
  const [isLoading, setIsLoading] = useState(false);
  const [emoji, setEmoji] = useState<string>('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const handleWrongNetwork = useHandleWrongNetwork();

  // Lens manager
  const canUseRelay = currentProfile?.lensManager;
  const isSponsored = currentProfile?.sponsor;

  const form = useZodForm({
    schema: editStatusSchema
  });

  const onCompleted = (
    __typename?: 'RelayError' | 'RelaySuccess' | 'LensProfileManagerRelayError'
  ) => {
    if (
      __typename === 'RelayError' ||
      __typename === 'LensProfileManagerRelayError'
    ) {
      return;
    }

    toast.success('Status updated successfully!');
    setIsLoading(false);
    setShowStatusModal(false);
  };

  const onError = (error: any) => {
    setIsLoading(false);
    errorToast(error);
  };

  const { data, loading, error } = useProfileQuery({
    variables: { request: { forProfileId: currentProfile?.id } },
    skip: !currentProfile?.id,
    onCompleted: ({ profile }) => {
      form.setValue(
        'status',
        getProfileAttribute(profile?.metadata?.attributes, 'statusMessage')
      );
      setEmoji(
        getProfileAttribute(profile?.metadata?.attributes, 'statusEmoji')
      );
    }
  });

  const { signTypedDataAsync } = useSignTypedData({ onError });
  const { write } = useContractWrite({
    address: LENSHUB_PROXY,
    abi: LensHub,
    functionName: 'setProfileMetadataURI',
    onSuccess: () => onCompleted(),
    onError
  });

  const [broadcastOnchain] = useBroadcastOnchainMutation({
    onCompleted: ({ broadcastOnchain }) =>
      onCompleted(broadcastOnchain.__typename)
  });
  const [createOnchainSetProfileMetadataTypedData] =
    useCreateOnchainSetProfileMetadataTypedDataMutation({
      onCompleted: async ({ createOnchainSetProfileMetadataTypedData }) => {
        const { id, typedData } = createOnchainSetProfileMetadataTypedData;
        const signature = await signTypedDataAsync(getSignature(typedData));
        const { data } = await broadcastOnchain({
          variables: { request: { id, signature } }
        });
        if (data?.broadcastOnchain.__typename === 'RelayError') {
          const { profileId, metadataURI } = typedData.value;
          return write?.({ args: [profileId, metadataURI] });
        }
      },
      onError
    });

  const [setProfileMetadata] = useSetProfileMetadataMutation({
    onCompleted: ({ setProfileMetadata }) =>
      onCompleted(setProfileMetadata.__typename),
    onError
  });

  const createOnChain = async (request: OnchainSetProfileMetadataRequest) => {
    const { data } = await setProfileMetadata({
      variables: { request }
    });
    if (
      data?.setProfileMetadata?.__typename === 'LensProfileManagerRelayError'
    ) {
      return await createOnchainSetProfileMetadataTypedData({
        variables: { request }
      });
    }
  };

  const profile = data?.profile;

  const editStatus = async (emoji: string, status: string) => {
    if (!currentProfile) {
      return toast.error(Errors.SignWallet);
    }

    if (handleWrongNetwork()) {
      return;
    }

    try {
      setIsLoading(true);
      const id = await uploadToArweave({
        name: profile?.metadata?.displayName ?? '',
        bio: profile?.metadata?.bio ?? '',
        cover_picture:
          profile?.metadata?.coverPicture?.raw.uri ||
          profile?.metadata?.coverPicture?.optimized?.uri ||
          '',
        attributes: [
          ...(profile?.metadata?.attributes
            ?.filter(
              (attr) =>
                ![
                  'location',
                  'website',
                  'x',
                  'statusEmoji',
                  'statusMessage',
                  'app'
                ].includes(attr.key)
            )
            .map(({ key, value }) => ({ key, value })) ?? []),
          {
            key: 'location',
            value: getProfileAttribute(
              profile?.metadata?.attributes,
              'location'
            )
          },
          {
            key: 'website',
            value: getProfileAttribute(profile?.metadata?.attributes, 'website')
          },
          {
            key: 'x',
            value: getProfileAttribute(
              profile?.metadata?.attributes,
              'x'
            )?.replace('https://x.com/', '')
          },
          { key: 'statusEmoji', value: emoji },
          { key: 'statusMessage', value: status }
        ],
        version: '1.0.0',
        metadata_id: uuid()
      });

      const request: OnchainSetProfileMetadataRequest = {
        metadataURI: `ar://${id}`
      };

      if (canUseRelay && isSponsored) {
        return await createOnChain(request);
      }

      return await createOnchainSetProfileMetadataTypedData({
        variables: { request }
      });
    } catch (error) {
      onError(error);
    }
  };

  if (loading) {
    return (
      <div className="p-5">
        <Loader message="Loading status settings" />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorMessage title="Failed to load status settings" error={error} />
    );
  }

  return (
    <div onClick={() => setShowEmojiPicker(false)} className="space-y-5 p-5">
      <Form
        form={form}
        className="space-y-4"
        onSubmit={async ({ status }) => {
          await editStatus(emoji, status);
          Leafwatch.track(SETTINGS.PROFILE.SET_PICTURE);
        }}
      >
        <Input
          prefix={
            <EmojiPicker
              setShowEmojiPicker={setShowEmojiPicker}
              showEmojiPicker={showEmojiPicker}
              emoji={emoji}
              setEmoji={setEmoji}
              emojiClassName="mt-[8px]"
            />
          }
          placeholder="What's happening?"
          {...form.register('status')}
        />
        <div className="ml-auto flex items-center space-x-2">
          <Button
            type="submit"
            variant="danger"
            disabled={isLoading}
            outline
            onClick={async () => {
              setEmoji('');
              form.setValue('status', '');
              await editStatus('', '');
              Leafwatch.track(SETTINGS.PROFILE.CLEAR_STATUS);
            }}
          >
            Clear status
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            icon={
              isLoading ? (
                <Spinner size="xs" />
              ) : (
                <PencilIcon className="h-4 w-4" />
              )
            }
          >
            Save
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default Status;

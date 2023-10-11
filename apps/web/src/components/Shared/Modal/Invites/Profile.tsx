import Slug from '@components/Shared/Slug';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { type InvitedResult } from '@hey/lens';
import formatAddress from '@hey/lib/formatAddress';
import formatHandle from '@hey/lib/formatHandle';
import { formatDate } from '@lib/formatTime';
import Link from 'next/link';
import type { FC } from 'react';

interface ProfileProps {
  invite: InvitedResult;
}

const Profile: FC<ProfileProps> = ({ invite }) => {
  return (
    <div className="lt-text-gray-500 flex items-center space-x-2 rounded-xl border px-3 py-2.5 text-sm">
      <CheckCircleIcon className="text-brand h-5 w-5" />
      <span>
        <b>
          {invite.profileMinted ? (
            invite.profileMinted.handle ? (
              <Link
                href={`/u/${formatHandle(invite.profileMinted.handle)}`}
                target="_blank"
              >
                <Slug
                  prefix="@"
                  slug={formatHandle(invite.profileMinted.handle) as string}
                />
              </Link>
            ) : (
              <Slug prefix="#" slug={invite.profileMinted.id} />
            )
          ) : (
            formatAddress(invite.by)
          )}
        </b>{' '}
        invited on {formatDate(invite.when)}
      </span>
    </div>
  );
};

export default Profile;

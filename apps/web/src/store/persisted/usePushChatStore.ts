import type { Profile } from '@hey/lens';
import type { IFeeds, IMessageIPFS, IUser } from '@pushprotocol/restapi';

import { IS_MAINNET } from '@hey/data/constants';
import { Localstorage } from '@hey/data/storage';
import { ENV } from '@pushprotocol/restapi/src/lib/constants';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const PUSH_TABS = {
  CHATS: 'CHATS',
  REQUESTS: 'REQUESTS'
} as const;

export const CHAT_TYPES = {
  CHAT: 'chat'
} as const;

export type ParsedChatType = {
  id: string;
  img: string;
  name: string;
  recipient: string;
  text: string;
  threadHash: string;
  time: string;
};

export type ChatTypes = (typeof CHAT_TYPES)[keyof typeof CHAT_TYPES];
export type PushTabs = (typeof PUSH_TABS)[keyof typeof PUSH_TABS];

export const PUSH_ENV = IS_MAINNET ? ENV.PROD : ENV.DEV;

interface IPushChatStore {
  activeReceiptientID: null | string;
  activeTab: PushTabs;
  clearRecipientChat: () => void;
  connectedProfile: IUser | null;
  deleteRequestFeed: (requestId: string) => void;
  deleteUnsentMessage: (message: IMessageIPFS) => void;
  pgpPassword: null | string;
  pgpPrivateKey: null | string;
  recipientChats: [] | IMessageIPFS[];
  recipientProfile: null | Profile;
  replyToMessage: IMessageIPFS | null;
  requestsFeed: IFeeds[];
  setActiveTab: (tabName: PushTabs) => void;
  setConnectedProfile: (profile: IUser) => void;
  setPgpPassword: (password: string) => void;
  setPgpPrivateKey: (pgpPrivateKey: string) => void;
  setRecipientChat: (chat: IMessageIPFS) => void;
  setRecipientProfile: (profile: Profile) => void;
  setReplyToMessage: (message: IMessageIPFS | null) => void;
  setUnsentMessage: (message: IMessageIPFS) => void;
  unsentMessages: [] | IMessageIPFS[];
  updateRequestsFeed: (requestsFeed: IFeeds[]) => void;
}

export const usePushChatStore = create(
  persist<IPushChatStore>(
    (set) => ({
      activeReceiptientID: null,
      activeTab: PUSH_TABS.CHATS,
      clearRecipientChat: () => set(() => ({ recipientChats: [] })),
      connectedProfile: null,
      deleteRequestFeed: (requestID: string) =>
        set((state) => {
          const requestsFeed = state.requestsFeed.filter(
            (feed) => feed.did !== requestID
          );
          return { requestsFeed };
        }),
      deleteUnsentMessage: (message: IMessageIPFS) =>
        set((state) => {
          const unsentMessages = state.unsentMessages.filter(
            (unsentMessage) => unsentMessage.link !== message.link
          );
          return { unsentMessages };
        }),
      pgpPassword: null,
      pgpPrivateKey: null,
      recipientChats: [],
      recipientProfile: null,
      replyToMessage: null,
      requestsFeed: [] as IFeeds[],
      resetPushChatStore: () =>
        set((state) => {
          return {
            ...state,
            activeTab: PUSH_TABS.CHATS,
            pgpPassword: null,
            pgpPrivateKey: null,
            recipientChats: []
          };
        }),
      selectedChatType: null,
      setActiveTab: (activeTab) => set(() => ({ activeTab })),
      setConnectedProfile: (connectedProfile) =>
        set(() => ({ connectedProfile })),
      setPgpPassword: (pgpPassword) => set(() => ({ pgpPassword })),
      setPgpPrivateKey: (pgpPrivateKey) => set(() => ({ pgpPrivateKey })),
      setRecipientChat: (chat: IMessageIPFS) =>
        set((state) => {
          const recipientChats = [...state.recipientChats, chat];
          return { recipientChats };
        }),
      setRecipientProfile: (receiptientProfile) =>
        set(() => ({ recipientProfile: receiptientProfile })),
      setReplyToMessage: (replyToMessage) => set(() => ({ replyToMessage })),
      setRequestFeed: (id: string, newRequestFeed: IFeeds) => {
        set((state) => {
          const requestsFeed = { ...state.requestsFeed, [id]: newRequestFeed };
          return { requestsFeed };
        });
      },
      setUnsentMessage: (message: IMessageIPFS) =>
        set((state) => {
          const unsentMessages: IMessageIPFS[] = state.unsentMessages || [];
          if (
            !unsentMessages.find(
              (unsentMessage) => unsentMessage.link === message.link
            )
          ) {
            unsentMessages.push(message);
          }
          return { unsentMessages };
        }),
      unsentMessages: [],
      updateRequestsFeed: (requestsFeed) =>
        set((state) => ({ ...state, requestsFeed }))
    }),
    {
      name: Localstorage.PushStore
    }
  )
);

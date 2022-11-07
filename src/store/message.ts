import type { Profile } from '@generated/types';
import getUniqueMessages from '@lib/getUniqueMessages';
import type { Client, Conversation, DecodedMessage } from '@xmtp/xmtp-js';
import { toNanoString } from '@xmtp/xmtp-js';
import { LS_KEYS } from 'src/constants';
import create from 'zustand';
import { persist } from 'zustand/middleware';

type TabValues = 'Following' | 'Requested';

interface MessageState {
  client: Client | undefined;
  setClient: (client: Client | undefined) => void;
  conversations: Map<string, Conversation>;
  setConversations: (conversations: Map<string, Conversation>) => void;
  addConversation: (key: string, newConversation: Conversation) => void;
  messages: Map<string, DecodedMessage[]>;
  setMessages: (messages: Map<string, DecodedMessage[]>) => void;
  addMessages: (key: string, newMessages: DecodedMessage[]) => number;
  followingProfiles: Map<string, Profile>;
  setFollowingProfiles: (followingProfiles: Map<string, Profile>) => void;
  requestedProfiles: Map<string, Profile>;
  setRequestedProfiles: (requestedProfiles: Map<string, Profile>) => void;
  addProfile: (key: string, profile: Profile) => void;
  previewMessages: Map<string, DecodedMessage>;
  setPreviewMessage: (key: string, message: DecodedMessage) => void;
  setPreviewMessages: (previewMessages: Map<string, DecodedMessage>) => void;
  reset: () => void;
  selectedProfileId: string;
  setSelectedProfileId: (selectedProfileId: string) => void;
  selectedTab: TabValues;
  setSelectedTab: (selectedTab: TabValues) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  client: undefined,
  setClient: (client) => set(() => ({ client })),
  conversations: new Map(),
  setConversations: (conversations) => set(() => ({ conversations })),
  addConversation: (key: string, newConverstaion: Conversation) => {
    set((state) => {
      const conversations = new Map(state.conversations);
      conversations.set(key, newConverstaion);
      return { conversations };
    });
  },
  messages: new Map(),
  setMessages: (messages) => set(() => ({ messages })),
  addMessages: (key: string, newMessages: DecodedMessage[]) => {
    let numAdded = 0;
    set((state) => {
      const messages = new Map(state.messages);
      const existing = state.messages.get(key) || [];
      const updated = getUniqueMessages([...existing, ...newMessages]);
      numAdded = updated.length - existing.length;
      // If nothing has been added, return the old item to avoid unnecessary refresh
      if (!numAdded) {
        return { messages: state.messages };
      }
      messages.set(key, updated);
      return { messages };
    });
    return numAdded;
  },
  followingProfiles: new Map(),
  setFollowingProfiles: (followingProfiles) => set(() => ({ followingProfiles })),
  requestedProfiles: new Map(),
  setRequestedProfiles: (requestedProfiles) => set(() => ({ requestedProfiles })),
  addProfile: (key, profile) =>
    set((state) => {
      if (profile.isFollowedByMe) {
        const following = new Map(state.followingProfiles);
        following.set(key, profile);
        return { followingProfiles: following };
      } else {
        const requested = new Map(state.requestedProfiles);
        requested.set(key, profile);
        return { requestedProfiles: requested };
      }
    }),
  previewMessages: new Map(),
  setPreviewMessage: (key: string, message: DecodedMessage) =>
    set((state) => {
      const newPreviewMessages = new Map(state.previewMessages);
      newPreviewMessages.set(key, message);
      return { previewMessages: newPreviewMessages };
    }),
  setPreviewMessages: (previewMessages) => set(() => ({ previewMessages })),
  selectedProfileId: '',
  setSelectedProfileId: (selectedProfileId) => set(() => ({ selectedProfileId })),
  selectedTab: 'Following',
  setSelectedTab: (selectedTab) => set(() => ({ selectedTab })),
  reset: () =>
    set((state) => {
      return {
        ...state,
        conversations: new Map(),
        messages: new Map(),
        followingProfiles: new Map(),
        requestedProfiles: new Map(),
        previewMessages: new Map(),
        selectedTab: 'Following'
      };
    })
}));

// Each Map is storing a profileId as the key.
interface MessagePersistState {
  viewedMessagesAtNs: Map<string, string | undefined>;
  showMessagesBadge: Map<string, boolean>;
  setShowMessagesBadge: (showMessagesBadge: Map<string, boolean>) => void;
  clearMessagesBadge: (profileId: string) => void;
}

export const useMessagePersistStore = create(
  persist<MessagePersistState>(
    (set) => ({
      viewedMessagesAtNs: new Map(),
      showMessagesBadge: new Map(),
      setShowMessagesBadge: (showMessagesBadge) => set(() => ({ showMessagesBadge })),
      clearMessagesBadge: (profileId: string) => {
        set((state) => {
          const viewedAt = new Map(state.viewedMessagesAtNs);
          viewedAt.set(profileId, toNanoString(new Date()));
          if (!state.showMessagesBadge.get(profileId)) {
            return { viewedMessagesAtNs: viewedAt };
          }
          const show = new Map(state.showMessagesBadge);
          show.set(profileId, false);
          return { viewedMessagesAtNs: viewedAt, showMessagesBadge: show };
        });
      }
    }),
    {
      name: LS_KEYS.MESSAGE_STORE,
      // Persist storage doesn't work well with Map by default.
      // Workaround from: https://github.com/pmndrs/zustand/issues/618#issuecomment-954806720.
      serialize: (data) => {
        return JSON.stringify({
          ...data,
          state: {
            ...data.state,
            viewedMessagesAtNs: Array.from(data.state.viewedMessagesAtNs),
            showMessagesBadge: Array.from(data.state.showMessagesBadge)
          }
        });
      },
      deserialize: (value) => {
        const data = JSON.parse(value);
        data.state.viewedMessagesAtNs = new Map(data.state.viewedMessagesAtNs);
        data.state.showMessagesBadge = new Map(data.state.showMessagesBadge);
        return data;
      }
    }
  )
);

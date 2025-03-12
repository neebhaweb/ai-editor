import { create } from "zustand";

interface User {
  peerId: string;
  cursorPosition: number;
}

interface StoreState {
  text: string;
  users: Record<string, User>;
  userCount: number;
  setText: (text: string) => void;
  updateCursor: (peerId: string, position: number) => void;
  addUser: (peerId: string) => void;
  removeUser: (peerId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
  text: "",
  users: {},
  userCount: 0,

  setText: (text) => set({ text }),

  updateCursor: (peerId, position) =>
    set((state) => ({
      users: {
        ...state.users,
        [peerId]: { ...state.users[peerId], cursorPosition: position },
      },
    })),

  addUser: (peerId) =>
    set((state) => {
      const newUsers = { ...state.users, [peerId]: { peerId, cursorPosition: 0 } };
      return { users: newUsers, userCount: Object.keys(newUsers).length };
    }),

  removeUser: (peerId) =>
    set((state) => {
      const newUsers = { ...state.users };
      delete newUsers[peerId];
      return { users: newUsers, userCount: Object.keys(newUsers).length };
    }),
}));

import { create } from "zustand";
import { RoomState } from "@/lib/types";

interface RoomStore {
  roomId: string | null;
  isPlaying: boolean;
  audioUrl: string | null;
  position: number;
  members: string[];
  setRoomId: (id: string) => void;
  setPlaying: (playing: boolean) => void;
  setAudioUrl: (url: string | null) => void;
  setPosition: (pos: number) => void;
  setMembers: (members: string[]) => void;
  syncState: (state: Partial<RoomState>) => void;
}

export const useRoomStore = create<RoomStore>((set) => ({
  roomId: null,
  isPlaying: false,
  audioUrl: null,
  position: 0,
  members: [],
  setRoomId: (id) => set({ roomId: id }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setPosition: (pos) => set({ position: pos }),
  setMembers: (members) => set({ members }),
  syncState: (state) => set((prev) => ({ ...prev, ...state })),
}));

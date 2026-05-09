import { create } from "zustand";
import { RoomState } from "@/lib/types";

interface RoomStore {
  roomId: string | null;
  isPlaying: boolean;
  audioUrl: string | null;
  position: number;
  members: string[];
  track: any | null;
  playlist: any[];
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
  track: null,
  playlist: [],
  setRoomId: (id) => set({ roomId: id }),
  setPlaying: (playing) => set({ isPlaying: playing }),
  setAudioUrl: (url) => set({ audioUrl: url }),
  setPosition: (pos) => set({ position: pos }),
  setMembers: (members) => set({ members }),
  syncState: (state) => set((prev) => {
    const newState: any = { ...prev, ...state };
    // Handle the playing vs isPlaying naming discrepancy
    if (state.playing !== undefined) newState.isPlaying = state.playing;
    return newState;
  }),
}));

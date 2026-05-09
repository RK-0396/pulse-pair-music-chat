import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRoomStore } from "@/store/useRoomStore";
import { SocketEvent } from "@/lib/types";

export const useSocket = (roomId: string | null) => {
  const { setRoomId, syncState } = useRoomStore();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (!roomId) {
      setSocket(null);
      return;
    }

    const s = io({
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      s.emit(SocketEvent.JOIN_ROOM, roomId);
      setRoomId(roomId);
      setSocket(s);
    });

    s.on(SocketEvent.ROOM_STATE_UPDATE, (state) => {
      syncState(state);
      if (state.memberCount !== undefined) {
        syncState({ members: new Array(state.memberCount).fill("") });
      }
    });

    s.on(SocketEvent.PLAY, ({ audioUrl, position, track, playlist }) => {
      syncState({ audioUrl, position, playing: true, track, playlist });
    });

    s.on(SocketEvent.PAUSE, () => {
      syncState({ playing: false });
    });

    s.on(SocketEvent.SYNC_TICK, ({ position }) => {
      syncState({ position });
    });

    s.on(SocketEvent.USER_JOINED, ({ userId, memberCount }) => {
      console.log("User joined:", userId);
      if (memberCount !== undefined) {
        // We'll use syncState to update the member count if we add it to the store,
        // but for now let's just log it or we can add it to the store if needed.
        useRoomStore.getState().syncState({ members: new Array(memberCount).fill("") });
      }
    });

    s.on(SocketEvent.USER_LEFT, ({ userId, memberCount }) => {
      console.log("User left:", userId);
      if (memberCount !== undefined) {
        useRoomStore.getState().syncState({ members: new Array(memberCount).fill("") });
      }
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [roomId, setRoomId, syncState]);

  return socket;
};

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useRoomStore } from "@/store/useRoomStore";
import { SocketEvent } from "@/lib/types";

export const useSocket = (roomId: string | null) => {
  const socketRef = useRef<Socket | null>(null);
  // Expose socket via state so consumers re-render when it's ready
  const [socket, setSocket] = useState<Socket | null>(null);
  const { setPlaying, setPosition, setAudioUrl } = useRoomStore();

  useEffect(() => {
    if (!roomId) return;

    const s = io({
      transports: ["websocket", "polling"],
    });

    socketRef.current = s;
    setSocket(s);

    s.on("connect", () => {
      console.log("✅ Socket connected:", s.id);
      s.emit(SocketEvent.JOIN_ROOM, roomId);
    });

    s.on(SocketEvent.PLAY, ({ audioUrl, position }) => {
      setAudioUrl(audioUrl);
      setPosition(position);
      setPlaying(true);
    });

    s.on(SocketEvent.PAUSE, () => {
      setPlaying(false);
    });

    s.on(SocketEvent.SYNC_TICK, ({ position }) => {
      setPosition(position);
    });

    s.on(SocketEvent.ROOM_STATE_UPDATE, (state) => {
      setAudioUrl(state.audioUrl);
      setPosition(state.position);
      setPlaying(state.playing);
    });

    s.on("connect_error", (err) => {
      console.error("❌ Socket connection error:", err.message);
    });

    return () => {
      s.disconnect();
      setSocket(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return socket;
};

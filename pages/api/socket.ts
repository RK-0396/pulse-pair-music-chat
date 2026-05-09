import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { SocketEvent, PlayEvent, SyncTickEvent } from "@/lib/types";

// Disable Next.js body parsing — required for raw WebSocket upgrade
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};


export type NextApiResponseWithSocket = NextApiResponse & {
  socket: {
    server: NetServer & {
      io?: SocketIOServer;
    };
  };
};

// In-memory room state (resets on cold start — use Redis/Upstash for persistence)
const roomState = new Map<
  string,
  { playing: boolean; audioUrl: string | null; position: number }
>();
const roomMembers = new Map<string, Set<string>>();

const SocketHandler = (
  req: NextApiRequest,
  res: NextApiResponseWithSocket
) => {
  if (res.socket.server.io) {
    // Already initialized — return OK so fetch('/api/socket') doesn't 400
    res.status(200).json({ ok: true });
    return;
  }

  const io = new SocketIOServer(res.socket.server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  res.socket.server.io = io;

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on(SocketEvent.JOIN_ROOM, (roomId: string) => {
      socket.join(roomId);

      if (!roomMembers.has(roomId)) {
        roomMembers.set(roomId, new Set());
      }
      roomMembers.get(roomId)?.add(socket.id);

      console.log(`User ${socket.id} joined room ${roomId}`);

      // Send current state to the new user
      const state = roomState.get(roomId);
      if (state) {
        socket.emit(SocketEvent.ROOM_STATE_UPDATE, state);
      }

      io.to(roomId).emit(SocketEvent.USER_JOINED, { userId: socket.id });
    });

    socket.on(
      SocketEvent.PLAY,
      ({
        roomId,
        audioUrl,
        position,
      }: PlayEvent & { roomId: string }) => {
        roomState.set(roomId, { playing: true, audioUrl, position });
        socket.to(roomId).emit(SocketEvent.PLAY, { audioUrl, position });
        console.log(`Room ${roomId} playing: ${audioUrl} at ${position}`);
      }
    );

    socket.on(SocketEvent.PAUSE, (roomId: string) => {
      const state = roomState.get(roomId);
      if (state) {
        state.playing = false;
        roomState.set(roomId, state);
      }
      socket.to(roomId).emit(SocketEvent.PAUSE);
      console.log(`Room ${roomId} paused`);
    });

    socket.on(
      SocketEvent.SYNC_TICK,
      ({ roomId, position }: SyncTickEvent & { roomId: string }) => {
        const state = roomState.get(roomId);
        if (state) {
          state.position = position;
          roomState.set(roomId, state);
        }
        socket
          .to(roomId)
          .emit(SocketEvent.SYNC_TICK, { position, timestamp: Date.now() });
      }
    );

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId !== socket.id) {
          roomMembers.get(roomId)?.delete(socket.id);
          io.to(roomId).emit(SocketEvent.PAUSE, {
            reason: "MEMBER_DISCONNECTED",
          });
          console.log(
            `User ${socket.id} left room ${roomId}. Pausing playback.`
          );
        }
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  res.status(200).json({ ok: true });
};

export default SocketHandler;


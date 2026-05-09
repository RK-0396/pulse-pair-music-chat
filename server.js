// Custom Next.js server with Socket.IO mounted directly on the HTTP server.
// This bypasses the API route pattern and gives Socket.IO direct access to
// the raw TCP upgrade, which is required for WebSocket transport to work.
const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.HOSTNAME || "127.0.0.1";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// ── Socket event constants (mirrors lib/types.ts) ─────────────────────────────
const SocketEvent = {
  JOIN_ROOM: "JOIN_ROOM",
  LEAVE_ROOM: "LEAVE_ROOM",
  USER_JOINED: "USER_JOINED",
  USER_LEFT: "USER_LEFT",
  PLAY: "PLAY",
  PAUSE: "PAUSE",
  SYNC_TICK: "SYNC_TICK",
  ROOM_STATE_UPDATE: "ROOM_STATE_UPDATE",
  CHAT_MESSAGE: "CHAT_MESSAGE",
};

// ── In-memory room state ───────────────────────────────────────────────────────
const roomState = new Map();   // roomId → { playing, audioUrl, position }
const roomMembers = new Map(); // roomId → Set<socketId>

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // ── Attach Socket.IO directly to the HTTP server ────────────────────────────
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log("✅ User connected:", socket.id);

    socket.on(SocketEvent.JOIN_ROOM, (roomId) => {
      socket.join(roomId);

      if (!roomMembers.has(roomId)) roomMembers.set(roomId, new Set());
      roomMembers.get(roomId).add(socket.id);

      console.log(`👤 ${socket.id} joined room: ${roomId}`);

      // Hydrate late joiner with current room state
      const state = roomState.get(roomId);
      if (state) {
        // Calculate the exact current position if the song is currently playing
        const currentPos = state.playing 
          ? state.position + (Date.now() - state.lastUpdateAt) / 1000 
          : state.position;
          
        const membersCount = roomMembers.get(roomId)?.size || 0;
        socket.emit(SocketEvent.ROOM_STATE_UPDATE, {
          playing: state.playing || false,
          audioUrl: state.audioUrl || null,
          position: currentPos || 0,
          track: state.track || null,
          playlist: state.playlist || [],
          memberCount: membersCount
        });
      }

      const members = Array.from(roomMembers.get(roomId) || []);
      io.to(roomId).emit(SocketEvent.USER_JOINED, { 
        userId: socket.id,
        memberCount: members.length
      });
    });

    socket.on(SocketEvent.PLAY, ({ roomId, audioUrl, position, track, playlist }) => {
      const state = roomState.get(roomId) || {};
      const newTrack = track !== undefined ? track : state.track;
      const newPlaylist = playlist !== undefined ? playlist : state.playlist;
      roomState.set(roomId, { playing: true, audioUrl, position, lastUpdateAt: Date.now(), track: newTrack, playlist: newPlaylist });
      socket.to(roomId).emit(SocketEvent.PLAY, { audioUrl, position, track: newTrack, playlist: newPlaylist });
      console.log(`▶  Room ${roomId} playing at ${position}s`);
    });

    socket.on(SocketEvent.PAUSE, (roomId) => {
      const state = roomState.get(roomId);
      if (state) { 
        if (state.playing) {
          state.position += (Date.now() - state.lastUpdateAt) / 1000;
        }
        state.playing = false; 
        state.lastUpdateAt = Date.now();
        roomState.set(roomId, state); 
      }
      socket.to(roomId).emit(SocketEvent.PAUSE);
      console.log(`⏸  Room ${roomId} paused`);
    });

    socket.on(SocketEvent.SYNC_TICK, ({ roomId, position }) => {
      const state = roomState.get(roomId);
      if (state) { 
        state.position = position; 
        state.lastUpdateAt = Date.now();
        roomState.set(roomId, state); 
      }
      socket.to(roomId).emit(SocketEvent.SYNC_TICK, { position, timestamp: Date.now() });
    });

    socket.on(SocketEvent.CHAT_MESSAGE, (data) => {
      // Broadcast chat message to the room
      io.to(data.roomId).emit(SocketEvent.CHAT_MESSAGE, data.message);
    });

    socket.on("disconnecting", () => {
      for (const roomId of socket.rooms) {
        if (roomId === socket.id) continue;
        roomMembers.get(roomId)?.delete(socket.id);
        const members = Array.from(roomMembers.get(roomId) || []);
        io.to(roomId).emit(SocketEvent.USER_LEFT, { 
          userId: socket.id,
          memberCount: members.length
        });
        console.log(`👋 ${socket.id} left room ${roomId} — members: ${members.length}`);
      }
    });

    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.id);
    });
  });

  httpServer.listen(port, hostname, () => {
    console.log(`🚀 PulsePair ready → http://${hostname === "0.0.0.0" ? "localhost" : hostname}:${port}`);
  });
});

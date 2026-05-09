"use client";

import { useState } from "react";
import { useSocket } from "@/hooks/useSocket";
import { AudioPlayer } from "@/components/AudioPlayer";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Radio, Heart } from "lucide-react";

export default function Home() {
  const [roomInput, setRoomInput] = useState("");
  const [roomId, setActiveRoomId] = useState<string | null>(null);
  const socket = useSocket(roomId);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomInput.trim()) {
      setActiveRoomId(roomInput.trim());
    }
  };

  return (
    <main className="min-h-[100dvh] w-full overflow-x-hidden overflow-y-auto bg-black flex flex-col items-center p-2 sm:p-4 selection:bg-indigo-500/30 relative">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(79,70,229,0.1),transparent)] pointer-events-none" />

      <AnimatePresence mode="wait">
        {!roomId ? (
          <motion.div
            key="join"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md text-center space-y-8 my-auto"
          >
            <div className="space-y-2">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)]">
                  <Radio className="text-white w-10 h-10" />
                </div>
              </div>
              <h1 className="text-5xl font-black text-white tracking-tighter">
                PulsePair
              </h1>
              <p className="text-zinc-400 text-lg">
                Listen together. Pause together.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <input
                type="text"
                id="room-id-input"
                placeholder="Enter Room ID"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 text-white px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-medium"
              />
              <button
                id="join-room-btn"
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
              >
                Join Listening Room
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="room"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full max-w-4xl flex flex-col items-center py-4 sm:py-8 my-auto"
          >
            {/* Top area - Room info */}
            <div className="flex-shrink-0 flex justify-center mb-auto pt-2 sm:pt-4">
              <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-full border border-white/5">
                <Users className="w-4 h-4 text-indigo-400" />
                <span className="text-zinc-400 text-sm font-medium">
                  Room: <span className="text-white">{roomId}</span>
                </span>
              </div>
            </div>

            {/* Main Audio Player container */}
            <div className="w-full flex flex-col items-center justify-center min-h-0 py-2">
              <AudioPlayer socket={socket} roomId={roomId} />
            </div>

            {/* Bottom area - Users and Leave */}
            <div className="flex-shrink-0 flex flex-col items-center mt-4">
              <div className="relative flex items-center justify-center w-full h-24 max-w-xs sm:max-w-sm">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                <motion.div 
                  animate={{ scaleX: [1, 1.5, 1], opacity: [0.3, 0.8, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-1 bg-indigo-500 blur-sm rounded-full"
                />

                {/* User 1 Avatar */}
                <motion.div 
                  animate={{ y: [-5, 5, -5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-8 w-16 h-16 rounded-full border-2 border-indigo-500/50 p-1 bg-zinc-900/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_-5px_rgba(79,70,229,0.4)]"
                >
                  <img src="https://api.dicebear.com/7.x/micah/svg?seed=Oliver&backgroundColor=transparent" alt="User 1" className="w-full h-full rounded-full object-cover" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                    className="absolute -right-1 -top-1 w-4 h-4 bg-indigo-500 rounded-full border-2 border-black" 
                  />
                </motion.div>

                {/* User 2 Avatar */}
                <motion.div 
                  animate={{ y: [5, -5, 5] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute right-8 w-16 h-16 rounded-full border-2 border-pink-500/50 p-1 bg-zinc-900/80 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_-5px_rgba(236,72,153,0.4)]"
                >
                  <img src="https://api.dicebear.com/7.x/micah/svg?seed=Sophia&backgroundColor=transparent" alt="User 2" className="w-full h-full rounded-full object-cover" />
                  <motion.div 
                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -left-1 -bottom-1 w-4 h-4 bg-pink-500 rounded-full border-2 border-black" 
                  />
                </motion.div>

                {/* Center pulse */}
                <motion.div 
                  animate={{ scale: [0.8, 1.3, 0.8], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="w-10 h-10 rounded-full bg-pink-500/10 border border-pink-500/30 flex items-center justify-center relative z-10 shadow-[0_0_20px_rgba(236,72,153,0.5)]"
                >
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </motion.div>
              </div>
            </div>
              
            <button
              id="leave-room-btn"
              onClick={() => setActiveRoomId(null)}
              className="text-zinc-600 hover:text-zinc-400 text-sm font-medium transition-colors mt-auto pb-4"
            >
              Leave Room
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

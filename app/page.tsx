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
            className="w-full max-w-md text-center space-y-8 my-auto z-10"
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
              <p className="text-zinc-400 text-lg font-medium">
                Listen together. Synchronized.
              </p>
            </div>

            <form onSubmit={handleJoin} className="space-y-4 px-4">
              <input
                type="text"
                id="room-id-input"
                placeholder="Enter Room ID"
                value={roomInput}
                onChange={(e) => setRoomInput(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg font-medium backdrop-blur-sm"
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
            className="w-full max-w-4xl h-full flex flex-col items-center justify-between py-4 sm:py-6 z-10 overflow-hidden"
          >
            {/* Top area - Room info */}
            <div className="flex-shrink-0">
              <div className="flex items-center gap-3 bg-white/5 px-4 py-1.5 rounded-full border border-white/5 backdrop-blur-md">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                <span className="text-zinc-500 text-[10px] sm:text-xs font-black tracking-[0.2em] uppercase">
                  ROOM: <span className="text-white">{roomId}</span>
                </span>
              </div>
            </div>

            {/* Main Audio Player container - Centered and takes remaining space */}
            <div className="w-full flex-1 flex flex-col items-center justify-center min-h-0 px-2 sm:px-4">
              <div className="w-full max-w-xl scale-[0.9] sm:scale-100 origin-center transition-transform">
                <AudioPlayer socket={socket} roomId={roomId} />
              </div>
            </div>

            {/* Bottom area - Users and Leave */}
            <div className="flex-shrink-0 w-full flex flex-col items-center pb-2">
              <div className="relative flex items-center justify-center w-full h-20 sm:h-24 max-w-md">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-0.5 bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

                {/* User 1 Avatar */}
                <motion.div
                  animate={{ y: [-3, 3, -3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-16 sm:left-20 w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-white/10 p-1 bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl"
                >
                  <img src="https://api.dicebear.com/7.x/micah/svg?seed=Oliver&backgroundColor=transparent" alt="User 1" className="w-full h-full rounded-lg object-cover" />
                  <div className="absolute -right-1 -top-1 w-3 h-3 bg-indigo-500 rounded-full border-2 border-black" />
                </motion.div>

                {/* User 2 Avatar */}
                <motion.div
                  animate={{ y: [3, -3, 3] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                  className="absolute right-16 sm:right-20 w-12 h-12 sm:w-16 sm:h-16 rounded-xl border border-white/10 p-1 bg-white/5 backdrop-blur-xl flex items-center justify-center shadow-2xl"
                >
                  <img src="https://api.dicebear.com/7.x/micah/svg?seed=Sophia&backgroundColor=transparent" alt="User 2" className="w-full h-full rounded-lg object-cover" />
                  <div className="absolute -left-1 -bottom-1 w-3 h-3 bg-pink-500 rounded-full border-2 border-black" />
                </motion.div>

                {/* Center connection heart */}
                <motion.div 
                  animate={{ 
                    scale: [1, 1.3, 1],
                    filter: ["drop-shadow(0 0 8px rgba(236,72,153,0.4))", "drop-shadow(0 0 20px rgba(236,72,153,0.7))", "drop-shadow(0 0 8px rgba(236,72,153,0.4))"]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="w-12 h-12 flex items-center justify-center relative z-10"
                >
                  <span className="text-3xl filter drop-shadow-lg">💖</span>
                  <motion.div 
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                    className="absolute inset-0 bg-pink-500/10 rounded-full blur-xl"
                  />
                </motion.div>
              </div>

              <button
                id="leave-room-btn"
                onClick={() => setActiveRoomId(null)}
                className="mt-2 sm:mt-4 text-zinc-600 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-all"
              >
                Leave Room
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

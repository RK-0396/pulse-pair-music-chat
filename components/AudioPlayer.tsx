"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useRoomStore } from "@/store/useRoomStore";
import { SocketEvent, ChatMessage } from "@/lib/types";
import { Play, Pause, SkipForward, SkipBack, Music2, ListMusic, Search, MessageCircle, Send, CornerUpLeft, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AudioVisualizer } from "./AudioVisualizer";

const PLAYLIST = [
  { id: "0", title: "Teri Ye Adaa", artist: "JK - Special Track", url: "/audio/teri-ye-adaa-romantic.mp3", color: "#f43f5e" },
  { id: "1", title: "Emotional Love Song", artist: "Hindi", url: "/audio/emotional-hindi-love-song.mp3", color: "#a855f7" },
  { id: "2", title: "At Every Turn There's You", artist: "MT Soundscapes", url: "/audio/mtsoundscapes-at-every-turn-theres-you.mp3", color: "#ec4899" },
  { id: "3", title: "Dilse Judaai", artist: "MT Soundscapes", url: "/audio/mtsoundscapes-dilse-judaai-song.mp3", color: "#f59e0b" },
  { id: "4", title: "Midnight Echo", artist: "PulsePair Original", url: "/audio/music.m4a", color: "#06b6d4" },
  { id: "5", title: "Pal Yahi", artist: "Hindi", url: "/audio/pal-yahi-romantic-hindi-love-ballad.mp3", color: "#10b981" },
  { id: "6", title: "Phir Se Mile Hum", artist: "Indian Love Song", url: "/audio/phir-se-mile-hum-indian-love-song.mp3", color: "#ef4444" },
  { id: "7", title: "Dil Ki Aag", artist: "Predicson Music", url: "/audio/predicson_music-dil-ki-aag.mp3", color: "#f97316" },
  { id: "8", title: "Teri Dastan", artist: "Predicson Music", url: "/audio/predicson_music-teri-dastan.mp3", color: "#8b5cf6" },
  { id: "9", title: "Sonican Love Music", artist: "Sonican", url: "/audio/sonican-love-music.mp3", color: "#14b8a6" },
  { id: "10", title: "Romantic Love Music", artist: "Tunetank", url: "/audio/tunetank-romantic-love-music.mp3", color: "#3b82f6" },
];

interface Props { socket: any; roomId: string; }

export const AudioPlayer: React.FC<Props> = ({ socket, roomId }) => {
  const { isPlaying, audioUrl, position, track: globalTrack, playlist: globalPlaylist, members, setPlaying, setPosition, setAudioUrl, syncState } = useRoomStore();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceCreated = useRef(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [activeTab, setActiveTab] = useState<'playlist' | 'search' | 'chat' | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showEmojiPalette, setShowEmojiPalette] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [lastMessage, setLastMessage] = useState<ChatMessage | null>(null);
  const [lastSeenMessageId, setLastSeenMessageId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const unreadMarkerRef = useRef<HTMLDivElement>(null);

  const EMOJIS = [
    "😊", "😂", "🤣", "❤️", "😍", "🥰", "😘", "😭", "😤", "😡", "😱", "😴",
    "🤔", "🤨", "🙄", "😏", "🥳", "😎", "🤩", "😇", "🤫", "🤥", "🤡", "👻",
    "✨", "🔥", "🎵", "🎸", "🎧", "🎹", "🥁", "🎻", "🎤", "🎬", "🎨", "🎮",
    "👍", "👎", "🙌", "👏", "🤝", "🙏", "💪", "👊", "🤞", "🤟", "🤘", "👌",
    "🎉", "🍰", "🎈", "🌟", "⭐", "🌈", "⚡", "🍭", "🍩", "🍕", "🍔", "🍦",
    "🌹", "🌸", "🌻", "🌴", "🌊", "🌙", "☀️", "☁️", "🍎", "🍓", "🍒", "🍹",
    "🐶", "🐱", "🐼", "🦊", "🦁", "🐧", "🦄", "🦋", "🦉", "🐨", "🐸", "🐢",
    "🚀", "🛸", "🌍", "🗺️", "⚽", "🏀", "🏆", "💎", "💰", "💡", "🔔", "📍"
  ];

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState("");

  const activeTrack = globalTrack || (audioUrl ? PLAYLIST.find(t => t.url === audioUrl) : null) || PLAYLIST[0];

  const initAudioCtx = useCallback(() => {
    if (!audioRef.current || sourceCreated.current) return;
    const ctx = new AudioContext();
    const an = ctx.createAnalyser();
    an.fftSize = 256;
    const src = ctx.createMediaElementSource(audioRef.current);
    src.connect(an);
    an.connect(ctx.destination);
    audioCtxRef.current = ctx;
    analyserRef.current = an;
    sourceCreated.current = true;
    setAnalyser(an);
  }, []);

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
      audioRef.current.play().catch(console.error);
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying, audioUrl]);

  useEffect(() => {
    if (audioRef.current && Math.abs(audioRef.current.currentTime - position) > 0.8) {
      audioRef.current.currentTime = position;
    }
  }, [position]);

  // Handle incoming chat messages
  useEffect(() => {
    if (!socket) return;
    const handleNewMessage = (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
      if (activeTab !== 'chat') {
        setUnreadCount(prev => prev + 1);
        setLastMessage(msg);
        setShowToast(true);
        // Hide toast after 4 seconds
        setTimeout(() => setShowToast(false), 4000);
      }
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    };
    socket.on(SocketEvent.CHAT_MESSAGE, handleNewMessage);
    return () => {
      socket.off(SocketEvent.CHAT_MESSAGE, handleNewMessage);
    };
  }, [socket, activeTab]);

  // Reset unread count when chat is opened and scroll to unread
  useEffect(() => {
    if (activeTab === 'chat') {
      setUnreadCount(0);
      // Scroll to the unread marker if it exists, otherwise bottom
      setTimeout(() => {
        if (unreadMarkerRef.current) {
          unreadMarkerRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
      }, 300);
      
      // Update last seen after viewing
      if (messages.length > 0) {
        setLastSeenMessageId(messages[messages.length - 1].id);
      }
    }
  }, [activeTab, messages.length]);

  const handlePlay = () => {
    if (!socket) return;
    initAudioCtx();
    if (audioCtxRef.current?.state === "suspended") audioCtxRef.current.resume();
    const url = audioUrl || PLAYLIST[0].url;
    socket.emit(SocketEvent.PLAY, { roomId, audioUrl: url, position: audioRef.current?.currentTime || 0, track: globalTrack, playlist: globalPlaylist });
    setAudioUrl(url);
    setPlaying(true);
  };

  const handlePause = () => {
    if (!socket) return;
    socket.emit(SocketEvent.PAUSE, roomId);
    setPlaying(false);
  };

  const handleSelectTrack = (track: any, sourcePlaylist?: any[]) => {
    if (!socket) return;
    initAudioCtx();
    const finalPlaylist = sourcePlaylist && sourcePlaylist.length > 0 ? sourcePlaylist : PLAYLIST;
    socket.emit(SocketEvent.PLAY, { roomId, audioUrl: track.url, position: 0, track, playlist: finalPlaylist });
    setAudioUrl(track.url);
    setPosition(0);
    setPlaying(true);
    syncState({ track, playlist: finalPlaylist });
  };

  const handleSkipNext = () => {
    const currentPlaylist = globalPlaylist && globalPlaylist.length > 0 ? globalPlaylist : PLAYLIST;
    const idx = currentPlaylist.findIndex(t => t.url === activeTrack.url);
    if (idx >= 0) {
      const next = currentPlaylist[(idx + 1) % currentPlaylist.length];
      handleSelectTrack(next, currentPlaylist);
    } else {
      handleSelectTrack(currentPlaylist[0], currentPlaylist);
    }
  };

  const handleSkipPrev = () => {
    const currentPlaylist = globalPlaylist && globalPlaylist.length > 0 ? globalPlaylist : PLAYLIST;
    const idx = currentPlaylist.findIndex(t => t.url === activeTrack.url);
    if (idx >= 0) {
      const prev = currentPlaylist[(idx - 1 + currentPlaylist.length) % currentPlaylist.length];
      handleSelectTrack(prev, currentPlaylist);
    } else {
      handleSelectTrack(currentPlaylist[0], currentPlaylist);
    }
  };

  const onTimeUpdate = () => {
    if (!audioRef.current) return;
    const c = audioRef.current.currentTime;
    const d = audioRef.current.duration || 1;
    setCurrentTime(c);
    setProgress((c / d) * 100);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    const t = ((e.clientX - r.left) / r.width) * duration;
    audioRef.current.currentTime = t;
    setPosition(t);

    if (socket) {
      if (isPlaying) {
        socket.emit(SocketEvent.PLAY, { roomId, audioUrl: audioUrl || PLAYLIST[0].url, position: t, track: globalTrack, playlist: globalPlaylist });
      } else {
        socket.emit(SocketEvent.SYNC_TICK, { roomId, position: t });
      }
    }
  };

  const fmt = (s: number) => {
    if (!isFinite(s)) return "0:00";
    return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      const msg: ChatMessage = {
        id: Math.random().toString(36).substr(2, 9),
        senderId: socket.id,
        senderName: "You", // The server will overwrite this or handle it
        text: chatInput,
        timestamp: Date.now(),
        ...(replyingTo && {
          replyTo: {
            id: replyingTo.id,
            text: replyingTo.text,
            senderName: replyingTo.senderName
          }
        })
      };
      socket.emit(SocketEvent.CHAT_MESSAGE, { roomId, message: msg });
      setChatInput("");
      setReplyingTo(null);
    }
  };

  const searchSpotify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchError("");
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to search");
      setSearchResults(data.tracks || []);
    } catch (err: any) {
      setSearchError(err.message);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="relative w-full max-w-xl">
      {/* Glow behind card */}
      <div
        className="absolute inset-0 rounded-3xl blur-2xl opacity-30 -z-10 transition-all duration-700"
        style={{ background: `radial-gradient(ellipse, ${(activeTrack?.color || '#a855f7')}88, transparent 70%)` }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative"
      >
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => setActiveTab(activeTab === 'search' ? null : 'search')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'search' ? "bg-green-500/30 text-green-300" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
            title="Search Online"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'chat' ? null : 'chat')}
            className={`p-2 rounded-xl transition-all relative ${activeTab === 'chat' ? "bg-blue-500/30 text-blue-300" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
            title="Room Chat"
          >
            <MessageCircle className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow-lg">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab(activeTab === 'playlist' ? null : 'playlist')}
            className={`p-2 rounded-xl transition-all ${activeTab === 'playlist' ? "bg-purple-500/30 text-purple-300" : "text-zinc-400 hover:text-white hover:bg-white/10"}`}
            title="Local Playlist"
          >
            <ListMusic className="w-5 h-5" />
          </button>
        </div>

        {/* Track header */}
        <div className="flex items-center gap-4 p-6 pb-0 pt-16">
          {/* Album art */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-xl flex-shrink-0 transition-all duration-500 overflow-hidden relative"
            style={{ background: `linear-gradient(135deg, ${(activeTrack?.color || '#a855f7')}cc, ${(activeTrack?.color || '#a855f7')}44)` }}
          >
            {activeTrack.albumArt ? (
              <motion.img
                src={activeTrack.albumArt}
                className="w-full h-full object-cover"
                animate={isPlaying ? { scale: 1.05, rotate: 3 } : { scale: 1, rotate: 0 }}
                transition={{ duration: 4, repeat: Infinity, repeatType: 'reverse', ease: "easeInOut" }}
              />
            ) : (
              <motion.div animate={isPlaying ? { rotate: 360 } : { rotate: 0 }} transition={{ duration: 8, repeat: Infinity, ease: "linear" }}>
                <Music2 className="text-white w-10 h-10" />
              </motion.div>
            )}
          </div>
          <div className="flex-1 min-w-0 pr-4">
            <motion.h3 key={activeTrack?.id || "unknown"} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-white font-extrabold text-2xl truncate tracking-tight">
              {activeTrack?.title || "Unknown Track"}
            </motion.h3>
            <p className="text-zinc-400 text-base font-medium truncate mt-1">{activeTrack?.artist || "Unknown Artist"}</p>
          </div>
        </div>

        {/* Visualizer */}
        <div className="px-6 pt-6">
          <AudioVisualizer analyser={analyser} isPlaying={isPlaying} />
        </div>

        {/* Progress */}
        <div className="px-6 pt-5">
          <div className="relative w-full h-2 bg-white/10 rounded-full cursor-pointer group" onClick={handleSeek}>
            <motion.div
              className="absolute top-0 left-0 h-full rounded-full transition-all"
              style={{ width: `${progress}%`, background: `linear-gradient(90deg, ${activeTrack?.color || '#a855f7'}, #ec4899)` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progress}% - 8px)`, background: activeTrack?.color || '#a855f7' }}
            />
          </div>
          <div className="flex justify-between text-zinc-400 text-xs font-medium tracking-wider mt-2">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-center items-center gap-10 px-6 pb-8 pt-4">
          <button onClick={handleSkipPrev} className="text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-90">
            <SkipBack className="w-8 h-8 fill-current" />
          </button>
          <button
            id="play-pause-btn"
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-20 h-20 rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.3)] hover:scale-105 active:scale-95 transition-all"
            style={{ background: `linear-gradient(135deg, ${activeTrack?.color || '#a855f7'}, #ec4899)` }}
          >
            <AnimatePresence mode="wait">
              {isPlaying
                ? <motion.span key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex"><Pause className="w-8 h-8 text-white fill-white" /></motion.span>
                : <motion.span key="play" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="flex"><Play className="w-8 h-8 text-white fill-white translate-x-1" /></motion.span>
              }
            </AnimatePresence>
          </button>
          <button onClick={handleSkipNext} className="text-zinc-400 hover:text-white transition-all hover:scale-110 active:scale-90">
            <SkipForward className="w-8 h-8 fill-current" />
          </button>
        </div>

        {/* Expanding Panels */}
        <AnimatePresence>
          {activeTab && (
            <motion.div
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 z-50 bg-[#12121a]/95 backdrop-blur-3xl flex flex-col rounded-3xl overflow-hidden border-t border-white/10"
            >
              <div className="flex items-center justify-between p-5 pb-3 border-b border-white/5 bg-white/5">
                <h3 className="text-white font-bold text-lg flex items-center gap-2 tracking-wide">
                  {activeTab === 'playlist' && <><ListMusic className="w-5 h-5 text-purple-400" /> Local Playlist</>}
                  {activeTab === 'search' && <><Search className="w-5 h-5 text-pink-400" /> Online Search</>}
                  {activeTab === 'chat' && (
                    <div className="flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-blue-400" />
                      <span>Room Chat</span>
                      <span className="ml-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/20">
                        {members.length} ONLINE
                      </span>
                    </div>
                  )}
                </h3>
                <button
                  onClick={() => setActiveTab(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-white/10 text-zinc-300 hover:text-white hover:bg-white/20 transition-all hover:rotate-90"
                >
                  ✕
                </button>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 relative">

                {/* PLAYLIST TAB */}
                {activeTab === 'playlist' && (
                  <div className="space-y-1">
                    {PLAYLIST.map((track, i) => {
                      const active = track.url === activeTrack.url;
                      return (
                        <TrackItem key={track.id} track={track} active={active} isPlaying={isPlaying} index={i + 1} onSelect={() => handleSelectTrack(track, PLAYLIST)} />
                      );
                    })}
                  </div>
                )}

                {/* SEARCH TAB */}
                {activeTab === 'search' && (
                  <div className="flex flex-col h-full">
                    <form onSubmit={searchSpotify} className="relative mb-4 shrink-0 px-1">
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search songs, artists..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-green-500/50 transition-all"
                      />
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <button type="submit" className="hidden">Search</button>
                    </form>

                    {isSearching && <div className="text-center text-zinc-400 py-8 animate-pulse">Searching catalog...</div>}
                    {searchError && <div className="text-center text-red-400 py-8 text-sm">{searchError}</div>}

                    <div className="space-y-1 overflow-y-auto flex-1">
                      {!isSearching && searchResults.length === 0 && searchQuery && !searchError && (
                        <div className="text-center text-zinc-500 py-8">No previewable tracks found</div>
                      )}
                      {searchResults.map((track, i) => {
                        const active = track.url === activeTrack.url;
                        return (
                          <TrackItem key={track.id} track={track} active={active} isPlaying={isPlaying} index={i + 1} onSelect={() => handleSelectTrack(track, searchResults)} isSearch />
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* CHAT TAB */}
                {activeTab === 'chat' && (
                  <div className="flex flex-col h-full">
                    <div className="flex-1 overflow-y-auto px-2 space-y-4 pb-4 scrollbar-hide">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
                          <MessageCircle className="w-8 h-8 opacity-20" />
                          <p>Start chatting with your room!</p>
                        </div>
                      ) : (
                        messages.map((msg, i) => {
                          const isMe = msg.senderId === socket?.id;
                          const isNew = lastSeenMessageId && msg.id !== lastSeenMessageId && !isMe && messages.findIndex(m => m.id === lastSeenMessageId) < i;
                          const isFirstNew = isNew && (i === 0 || messages[i-1].id === lastSeenMessageId || messages.findIndex(m => m.id === lastSeenMessageId) === i - 1);

                          return (
                            <React.Fragment key={msg.id}>
                              {isFirstNew && (
                                <div ref={unreadMarkerRef} className="flex items-center gap-4 py-2">
                                  <div className="h-px bg-blue-500/30 flex-1" />
                                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">New Messages</span>
                                  <div className="h-px bg-blue-500/30 flex-1" />
                                </div>
                              )}
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                              >
                                <span className="text-[10px] text-zinc-500 mb-1 px-1">{isMe ? "You" : msg.senderName}</span>
                                <div className="flex items-end gap-2 max-w-[85%] relative">
                                  {isMe && (
                                    <button
                                      onClick={() => setReplyingTo(msg)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity shrink-0"
                                    >
                                      <CornerUpLeft className="w-4 h-4" />
                                    </button>
                                  )}
                                  <div className={`px-4 py-2 rounded-2xl text-sm ${isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white/10 text-zinc-200 rounded-tl-sm border border-white/5'}`}>
                                    {msg.replyTo && (
                                      <div className="bg-black/20 rounded-lg p-2 mb-2 border-l-2 border-blue-400 text-[11px] opacity-80">
                                        <p className="font-bold text-blue-300 mb-0.5">{msg.replyTo.senderName}</p>
                                        <p className="truncate italic">{msg.replyTo.text}</p>
                                      </div>
                                    )}
                                    {msg.text}
                                  </div>
                                  {!isMe && (
                                    <button
                                      onClick={() => setReplyingTo(msg)}
                                      className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-white transition-opacity shrink-0"
                                    >
                                      <CornerUpLeft className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </motion.div>
                            </React.Fragment>
                          )
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleSendMessage} className="shrink-0 mt-2 px-1 relative">
                      <AnimatePresence>
                        {replyingTo && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full left-1 right-1 mb-2 bg-[#252533] border border-blue-500/30 rounded-xl p-3 flex items-center gap-3 shadow-2xl backdrop-blur-2xl"
                          >
                            <div className="w-1 h-8 bg-blue-500 rounded-full" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] text-blue-400 font-bold uppercase tracking-wider">Replying to {replyingTo.senderName}</p>
                              <p className="text-xs text-zinc-400 truncate italic">{replyingTo.text}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setReplyingTo(null)}
                              className="p-1 hover:bg-white/10 rounded-full transition-colors"
                            >
                              <X className="w-4 h-4 text-zinc-500" />
                            </button>
                          </motion.div>
                        )}
                        {showEmojiPalette && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                            className="absolute bottom-full left-0 mb-2 p-3 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-2xl z-[60] backdrop-blur-2xl w-64 h-48 overflow-y-auto scrollbar-hide"
                          >
                            <div className="grid grid-cols-6 gap-2">
                              {EMOJIS.map(emoji => (
                                <button
                                  key={emoji}
                                  type="button"
                                  onClick={() => {
                                    setChatInput(prev => prev + emoji);
                                    setShowEmojiPalette(false);
                                  }}
                                  className="text-2xl hover:scale-125 transition-transform p-1 flex items-center justify-center"
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setShowEmojiPalette(!showEmojiPalette)}
                          className={`absolute left-3 top-1/2 -translate-y-1/2 text-xl hover:scale-110 transition-transform ${showEmojiPalette ? 'grayscale-0' : 'grayscale'}`}
                        >
                          😊
                        </button>
                        <input
                          type="text"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          placeholder="Say something nice..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-11 pr-12 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                        />
                        <button
                          type="submit"
                          disabled={!chatInput.trim()}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-all disabled:opacity-50 disabled:hover:bg-transparent"
                        >
                          <Send className="w-5 h-5" />
                        </button>
                      </div>
                    </form>
                  </div>
                )}

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <audio
        ref={audioRef}
        src={audioUrl || PLAYLIST[0].url}
        crossOrigin="anonymous"
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={handleSkipNext}
      />

      {/* Message Toast Notification */}
      <AnimatePresence>
        {showToast && lastMessage && activeTab !== 'chat' && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            onClick={() => {
              setActiveTab('chat');
              setShowToast(false);
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md cursor-pointer"
          >
            <div className="bg-[#1a1a24]/95 backdrop-blur-3xl border border-blue-500/30 rounded-2xl p-4 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em] mb-0.5">New Message from {lastMessage.senderName}</p>
                <p className="text-sm text-zinc-100 truncate font-medium">{lastMessage.text}</p>
              </div>
              <div className="shrink-0">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper Component for Playlist/Search items
function TrackItem({ track, active, isPlaying, index, onSelect, isSearch = false }: any) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all ${active ? "bg-white/10 border border-white/15 shadow-lg" : "hover:bg-white/5 border border-transparent"}`}
    >
      {isSearch && track.albumArt ? (
        <img src={track.albumArt} className="w-10 h-10 rounded-lg object-cover shadow-md" />
      ) : (
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-inner"
          style={{ background: `${track.color}33`, color: track.color }}
        >
          {active && isPlaying ? <span className="animate-pulse text-base">♪</span> : index}
        </div>
      )}

      <div className="flex-1 min-w-0 pl-1">
        <p className={`text-sm font-semibold truncate ${active ? "text-white" : "text-zinc-300"}`}>{track.title}</p>
        <p className="text-zinc-500 text-xs truncate mt-0.5">{track.artist}</p>
      </div>
      {active && (
        <div className="flex gap-1 items-end h-4 pr-1">
          {[0, 1, 2].map(j => (
            <div key={j} className="w-1.5 rounded-full"
              style={{
                height: isPlaying ? undefined : "4px",
                background: track?.color || "#ff2d55",
                animation: isPlaying ? `idle-bar 0.6s ease-in-out ${j * 0.15}s infinite alternate` : "none",
                minHeight: "4px",
                maxHeight: "16px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export interface User {
  id: string;
  name: string;
  image?: string;
}

export interface RoomState {
  playing: boolean;
  audioUrl: string | null;
  position: number; // in seconds
  lastUpdated: number; // timestamp
  track?: any;
  playlist?: any[];
  members?: any[];
  memberCount?: number;
}

export interface Room {
  id: string;
  name: string;
  ownerId: string;
  members: User[];
  state: RoomState;
}

export enum SocketEvent {
  JOIN_ROOM = "JOIN_ROOM",
  LEAVE_ROOM = "LEAVE_ROOM",
  USER_JOINED = "USER_JOINED",
  USER_LEFT = "USER_LEFT",
  PLAY = "PLAY",
  PAUSE = "PAUSE",
  SYNC_TICK = "SYNC_TICK",
  ROOM_STATE_UPDATE = "ROOM_STATE_UPDATE",
  CHAT_MESSAGE = "CHAT_MESSAGE",
}

export interface PlayEvent {
  audioUrl: string;
  position: number;
  track?: any;
  playlist?: any[];
}

export interface SyncTickEvent {
  position: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  replyTo?: {
    id: string;
    text: string;
    senderName: string;
  };
}

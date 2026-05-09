# PulsePair 🎵

> **Real-time synchronized music sharing** — Listen together. Chat together.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![Socket.IO](https://img.shields.io/badge/Socket.IO-4.7-010101?logo=socket.io)
![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)
![Azure](https://img.shields.io/badge/Deployed%20on-Azure-0078D4?logo=microsoft-azure)

---

## What is PulsePair?

PulsePair lets multiple people listen to the same audio track in perfect sync, in real time. Users create or join a **room** using a shared Room ID. From that point, every play, pause, and seek event is instantly broadcast to all members of the room — so everyone hears the same thing at the same moment. 

We've recently added **Spotify Song Search**, a real-time **Room Chat**, and **Docker containerization** for simple deployment directly to Azure.

**Use cases:**
- 🎧 Long-distance listening sessions with friends
- 💬 Chat and hang out while discovering new music
- 🎶 Synchronized audio playback for remote teams

---

## Features

| Feature | Details |
|---|---|
| **Real-time Sync** | Play/pause/seek events broadcast instantly via Socket.IO |
| **Room Chat** | Built-in chat panel to talk with other members in the room |
| **Online Search** | Search for online tracks and play 30-second previews instantly using the public iTunes Search API (No auth required!) |
| **Room-based Presence** | Each room is isolated; join any room with a shared ID |
| **State Hydration** | Late joiners receive the current playback state on connect |
| **Disconnect Pause** | If any member disconnects, playback pauses for everyone |
| **Seekable Progress** | Click anywhere on the track bar to jump to that position |
| **Dockerized** | Easily deploy to Azure App Service or any Docker-compatible host |

---

## Architecture

PulsePair is a Next.js application running on a **custom Node.js server (`server.js`)**. The Socket.IO server is attached directly to the underlying Node.js HTTP server. This bypassing of the standard Next.js API route gives Socket.IO direct access to the raw TCP upgrade required for WebSocket transport to work reliably across different hosting environments like Azure.

```
PulsePair/
├── app/                        # Next.js App Router (UI layer)
│   ├── api/spotify/search/     # Spotify Search API Route
│   ├── globals.css             # Tailwind base styles
│   └── page.tsx                # Join screen + listening room
│
├── components/
│   └── AudioPlayer.tsx         # Synchronized audio player & Chat UI
│
├── lib/
│   └── types.ts                # Shared TypeScript types & Socket events
│
├── store/
│   └── useRoomStore.ts         # Global Zustand state
│
├── server.js                   # ⚡ Custom Next.js server + Socket.IO server
├── Dockerfile                  # Docker image build instructions
├── .dockerignore               # Docker build exclusions
├── next.config.mjs             # Next.js configuration (Standalone mode)
└── package.json                
```

---

## How It Works

### 1. Custom Socket.IO Server (`server.js`)
Instead of serverless API routes, PulsePair uses a custom Node.js HTTP server. The `Socket.IO` instance is attached directly to this server, listening for events like `PLAY`, `PAUSE`, `SYNC_TICK`, and the newly added `CHAT_MESSAGE`.

### 2. Global State & Client Connection
Zustand manages the single source of truth for playback state on the client. `components/AudioPlayer.tsx` interacts with this state, reconciling the HTML `<audio>` element with the rest of the room. `socket.emit` is used to send chat messages and playback controls securely.

### 3. iTunes Search API Integration
The application utilizes the public **iTunes Search API** wrapped inside the `app/api/search/route.ts` route. It safely queries the iTunes catalog without requiring any Developer API keys or user authentication, allowing all users to search for and synchronize high-quality 30s track previews instantly.

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Docker** (optional, for containerized deployment)
- **Spotify Developer Credentials** (required for search)

### Installation & Local Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/pulsepair.git
   cd pulsepair
   npm install
   ```

2. **Set up Environment Variables:**
   Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

3. **Run locally:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

---

## Deploying to Azure via Docker 🐳

PulsePair is fully containerized using a multi-stage Docker build that leverages Next.js `standalone` mode. This ensures a highly optimized, lightweight production image.

### 1. Build the Docker Image Locally
```bash
docker build -t pulsepair .
```

### 2. Run the Container Locally
```bash
docker run -p 3000:3000 --env-file .env.local pulsepair
```

### 3. Deploy to Azure App Service
You can easily deploy this Docker container to **Azure Web App for Containers**:
1. Push your built Docker image to **Azure Container Registry (ACR)** or Docker Hub.
2. In the Azure Portal, create a new **Web App** and select **Docker Container** as the publish method.
3. Point it to your container registry.
4. Azure App Service will automatically map incoming port 80/443 traffic to your container's exposed port `3000`.

---

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -m 'feat: add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

---

## License

MIT © PulsePair

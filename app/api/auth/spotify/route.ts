import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;

export async function GET(request: Request) {
  const url = new URL(request.url);
  let host = url.host;
  // Spotify is very picky about localhost vs 127.0.0.1
  // We'll normalize 0.0.0.0 and localhost to 127.0.0.1 for maximum compatibility
  if (host.includes('0.0.0.0') || host.includes('localhost')) {
    host = host.replace('0.0.0.0', '127.0.0.1').replace('localhost', '127.0.0.1');
  }
  const origin = `${url.protocol}//${host}`;
  const REDIRECT_URI = `${origin}/api/auth/callback`;
  
  const scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';
  
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: CLIENT_ID!,
    scope: scope,
    redirect_uri: REDIRECT_URI,
    show_dialog: 'true'
  });

  return NextResponse.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`);
}

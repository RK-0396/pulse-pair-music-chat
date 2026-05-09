import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(request: Request) {
  const url = new URL(request.url);
  let host = url.host;
  if (host.includes('0.0.0.0') || host.includes('localhost')) {
    host = host.replace('0.0.0.0', '127.0.0.1').replace('localhost', '127.0.0.1');
  }
  const origin = `${url.protocol}//${host}`;
  const REDIRECT_URI = `${origin}/api/auth/callback`;
  
  const { searchParams } = url;
  const code = searchParams.get('code');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Spotify Credentials Missing in Callback');
    return NextResponse.redirect(`${origin}/?error=missing_credentials`);
  }

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });

    const data = await res.json();

    if (data.error) {
      console.error('Spotify Token Error:', data);
      return NextResponse.redirect(`${origin}/?error=${data.error}`);
    }

    return NextResponse.redirect(`${origin}/?spotify_token=${data.access_token}`);
  } catch (error: any) {
    console.error('Callback Auth Error:', error.message);
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }
}

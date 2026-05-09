import { NextResponse } from 'next/server';

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

async function getAccessToken() {
  const clientId = (process.env.SPOTIFY_CLIENT_ID || "").trim();
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET || "").trim();
  
  if (!clientId || !clientSecret) {
    throw new Error('Spotify Credentials Missing');
  }

  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${auth}`,
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  if (!res.ok) {
    console.error('Spotify Auth Error:', data);
    throw new Error(`Spotify Auth failed: ${data.error_description || data.error || 'Unknown error'}`);
  }
  return data.access_token;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    const token = await getAccessToken();
    
    // Simplest possible URL construction
    const q = encodeURIComponent(query);
    const spotifyUrl = `https://api.spotify.com/v1/search?q=${q}&type=track&limit=10`;
    
    console.log('Final Spotify Request URL:', spotifyUrl);
    
    const res = await fetch(spotifyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('Spotify API Error Text:', errorText);
      try {
        const errorData = JSON.parse(errorText);
        throw new Error(errorData.error?.message || `Spotify API returned ${res.status}`);
      } catch (e) {
        throw new Error(`Spotify API returned ${res.status}: ${errorText}`);
      }
    }

    const data = await res.json();
    
    // Map Spotify results to our track format
    const tracks = data.tracks.items.map((track: any) => ({
      id: track.id,
      title: track.name,
      artist: track.artists.map((a: any) => a.name).join(', '),
      url: track.preview_url, // Note: This is still a 30s preview
      spotifyUri: track.uri,   // For full song playback via SDK
      color: '#1DB954',       // Spotify Green
      albumArt: track.album.images[0]?.url || '',
      duration: track.duration_ms / 1000,
    }));

    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('Spotify Search Error:', error.message);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 });
    }

    // Call the public iTunes Search API (No auth required!)
    const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=15`;
    const res = await fetch(itunesUrl);
    
    if (!res.ok) {
      throw new Error(`iTunes API returned ${res.status}`);
    }

    const data = await res.json();
    
    // Map iTunes results to our track format
    const tracks = data.results
      .filter((track: any) => track.previewUrl) // Ensure it has an audio preview
      .map((track: any) => ({
        id: track.trackId.toString(),
        title: track.trackName,
        artist: track.artistName,
        url: track.previewUrl,
        color: '#ff2d55', // Apple Music pinkish-red
        albumArt: track.artworkUrl100?.replace('100x100bb', '300x300bb') || '', // Get higher res artwork
      }));

    return NextResponse.json({ tracks });
  } catch (error: any) {
    console.error('Search Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

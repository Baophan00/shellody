'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/lib/types';
import { TrackArt } from '@/components/TrackArt';
import SaveToShelbyModal from '@/components/SaveToShelbyModal';
import { formatDuration, cn } from '@/lib/utils';
import { addBookmark, removeBookmark, isBookmarked, getBookmarks } from '@/lib/storage';
import { Play, Pause, Download, Music, RefreshCw, Heart, HeartOff } from 'lucide-react';
import type { JamendoTrack } from '@/app/api/discover/route';

function jamendoAsTrack(j: JamendoTrack): Track {
  return {
    id: `jamendo-${j.id}`,
    title: j.name,
    artist: j.artist_name,
    address: '',
    cid: '',
    audioUrl: j.audio,
    coverColor: '',
    duration: j.duration,
    plays: 0,
    uploadedAt: 0,
    genre: j.genre,
  };
}

const ORDERS = [
  { value: 'popularity_week', label: 'Trending' },
  { value: 'popularity_total', label: 'All-Time' },
  { value: 'releasedate', label: 'New' },
] as const;

type Order = (typeof ORDERS)[number]['value'];

const GENRES = ['Electronic', 'Hip-Hop', 'Ambient', 'Jazz', 'Lo-Fi', 'Rock'] as const;
type Genre = (typeof GENRES)[number];

export default function DiscoverTab() {
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<Order>('popularity_week');
  const [genres, setGenres] = useState<Genre[]>([]);
  const [saveTarget, setSaveTarget] = useState<JamendoTrack | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const { connected } = useWallet();
  const { currentTrack, playing, play, pause, resume, setQueue } = usePlayer();

  // Sync bookmarks on mount
  useEffect(() => {
    setBookmarkedIds(new Set(getBookmarks().map((b) => b.id)));
  }, []);

  const load = useCallback(async (o: Order, g: Genre[]) => {
    setLoaded(false);
    setError(false);
    try {
      const params = new URLSearchParams({ order: o, limit: '20' });
      if (g.length > 0) params.set('tags', g.map((x) => x.toLowerCase()).join('+'));
      const res = await fetch(`/api/discover?${params}`);
      if (!res.ok) throw new Error();
      const { tracks: data } = await res.json();
      setTracks(data);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(order, genres); }, [order, genres, load]);

  const toggleGenre = (g: Genre) => {
    setGenres((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const handlePlay = (j: JamendoTrack) => {
    const asTrack = jamendoAsTrack(j);
    if (currentTrack?.id === asTrack.id) {
      if (playing) pause(); else resume();
    } else {
      setQueue(tracks.map(jamendoAsTrack));
      play(asTrack);
    }
  };

  if (!loaded) {
    return (
      <div className="divide-y divide-[#111111]">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[64px] animate-pulse bg-[#E5E5E0]/50 my-1" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center border border-[#111111] p-8">
        <RefreshCw className="h-8 w-8 text-[#737373] mx-auto mb-4" />
        <h3 className="font-serif text-xl font-bold mb-2">Connection Error</h3>
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373] mb-4">Could not load Jamendo</p>
        <button onClick={() => load(order, genres)} className="font-sans text-xs uppercase tracking-widest underline underline-offset-4 decoration-2 decoration-[#CC0000] hover:text-[#CC0000]">
          Retry
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-24 text-center border border-[#111111] p-8">
        <Music className="h-8 w-8 text-[#737373] mx-auto mb-4" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#737373]">No tracks found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-[#111111]">
        {ORDERS.map((o) => (
          <button
            key={o.value}
            onClick={() => setOrder(o.value)}
            className={cn(
              'font-sans text-[10px] uppercase tracking-widest px-3 py-1.5 border border-[#111111] transition-all duration-200',
              order === o.value
                ? 'bg-[#111111] text-[#F9F9F7]'
                : 'bg-transparent text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0]'
            )}
          >
            {o.label}
          </button>
        ))}

        <span className="h-4 w-px bg-[#111111] mx-1" />

        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => toggleGenre(g)}
            className={cn(
              'font-sans text-[10px] uppercase tracking-widest px-3 py-1.5 border border-[#111111] transition-all duration-200',
              genres.includes(g)
                ? 'bg-[#111111] text-[#F9F9F7]'
                : 'bg-transparent text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0]'
            )}
          >
            {g}
          </button>
        ))}

        <span className="ml-auto font-mono text-[10px] uppercase tracking-widest text-[#737373]">
          via <a href="https://jamendo.com" target="_blank" rel="noopener noreferrer" className="underline decoration-[#CC0000] hover:text-[#CC0000]">Jamendo</a>
        </span>
      </div>

      <div className="divide-y divide-[#111111]">
        {tracks.map((j) => {
          const trackId = `jamendo-${j.id}`;
          const isThis = currentTrack?.id === trackId;
          const isPlaying = isThis && playing;

          return (
            <div key={j.id} className={cn('group flex items-center gap-4 py-3 px-2 hover:bg-[#F5F5F5]', isThis && 'bg-[#F5F5F5]')}>
              {/* Art + play */}
              <div className="relative flex-shrink-0">
                <TrackArt trackId={trackId} isPlaying={isPlaying} className="h-12 w-12 border border-[#111111] transition-opacity group-hover:opacity-75" />
                <button
                  onClick={() => handlePlay(j)}
                  className={cn(
                    'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center border border-[#111111] bg-[#111111] text-[#F9F9F7] opacity-0 transition-all duration-200',
                    'group-hover:opacity-100 group-hover:shadow-[4px_4px_0px_0px_#111111] group-hover:translate-x-[-2px] group-hover:translate-y-[-2px]',
                    isPlaying && 'opacity-100'
                  )}
                >
                  {isPlaying
                    ? <Pause className="h-4 w-4" />
                    : <Play className="h-4 w-4 translate-x-0.5" />
                  }
                </button>
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <p className={cn('truncate font-sans text-sm font-semibold uppercase tracking-wider', isThis && 'text-[#CC0000]')}>{j.name}</p>
                <p className="truncate font-mono text-[10px] uppercase tracking-widest text-[#737373]">
                  {j.artist_name}
                  {j.genre && <span className="text-[#A3A3A3]"> · {j.genre}</span>}
                </p>
              </div>

              {/* Duration + bookmark + save */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#737373] hidden sm:inline">
                  {formatDuration(j.duration)}
                </span>
                {/* Bookmark ♡ — free, no wallet needed */}
                <button
                  onClick={() => {
                    if (bookmarkedIds.has(trackId)) {
                      removeBookmark(trackId);
                      setBookmarkedIds((prev) => { const n = new Set(prev); n.delete(trackId); return n; });
                    } else {
                      addBookmark({
                        id: trackId,
                        title: j.name,
                        artist: j.artist_name,
                        audioUrl: j.audio,
                        duration: j.duration,
                        genre: j.genre,
                        savedAt: Date.now(),
                      });
                      setBookmarkedIds((prev) => { const n = new Set(prev); n.add(trackId); return n; });
                    }
                  }}
                  title={bookmarkedIds.has(trackId) ? 'Remove bookmark' : 'Bookmark this track'}
                  className={cn(
                    'flex items-center gap-1 font-sans text-[10px] uppercase tracking-widest transition-all duration-200 h-7 px-2 border',
                    bookmarkedIds.has(trackId)
                      ? 'border-[#CC0000] text-[#CC0000] bg-[#CC0000]/5'
                      : 'border-[#111111] text-[#737373] hover:text-[#CC0000] hover:border-[#CC0000] opacity-0 group-hover:opacity-100'
                  )}
                >
                  {bookmarkedIds.has(trackId)
                    ? <HeartOff className="h-3 w-3" />
                    : <Heart className="h-3 w-3" />
                  }
                </button>
                <button
                  onClick={() => setSaveTarget(j)}
                  title={connected ? 'Save to Shelby' : 'Connect wallet to save'}
                  className={cn(
                    'flex items-center gap-1.5 font-sans text-[10px] uppercase tracking-widest transition-all duration-200 opacity-0 group-hover:opacity-100 h-7 px-2 border border-[#111111]',
                    connected
                      ? 'text-[#737373] hover:text-[#111111] hover:bg-[#E5E5E0]'
                      : 'text-[#A3A3A3] cursor-not-allowed border-[#A3A3A3]'
                  )}
                >
                  <Download className="h-3 w-3" />
                  <span className="hidden sm:inline">Save</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {saveTarget && (
        <SaveToShelbyModal
          track={saveTarget}
          onClose={() => setSaveTarget(null)}
          onSaved={() => setSaveTarget(null)}
        />
      )}
    </>
  );
}

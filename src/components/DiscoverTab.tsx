'use client';

import { useEffect, useState, useCallback } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { usePlayer } from '@/context/PlayerContext';
import { Track } from '@/lib/types';
import { TrackArt } from '@/components/TrackArt';
import SaveToShelbyModal from '@/components/SaveToShelbyModal';
import { formatDuration, cn } from '@/lib/utils';
import { Play, Pause, Download, Music, RefreshCw } from 'lucide-react';
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
  { value: 'popularity_total', label: 'All-time' },
  { value: 'releasedate', label: 'New' },
] as const;

type Order = (typeof ORDERS)[number]['value'];

export default function DiscoverTab() {
  const [tracks, setTracks] = useState<JamendoTrack[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [order, setOrder] = useState<Order>('popularity_week');
  const [saveTarget, setSaveTarget] = useState<JamendoTrack | null>(null);
  const { connected } = useWallet();
  const { currentTrack, playing, play, pause, resume } = usePlayer();

  const load = useCallback(async (o: Order) => {
    setLoaded(false);
    setError(false);
    try {
      const res = await fetch(`/api/discover?order=${o}&limit=20`);
      if (!res.ok) throw new Error();
      const { tracks: data } = await res.json();
      setTracks(data);
    } catch {
      setError(true);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => { load(order); }, [order, load]);

  const handlePlay = (j: JamendoTrack) => {
    const asTrack = jamendoAsTrack(j);
    if (currentTrack?.id === asTrack.id) {
      if (playing) pause(); else resume();
    } else {
      play(asTrack);
    }
  };

  if (!loaded) {
    return (
      <div className="divide-y divide-border">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-[64px] animate-pulse bg-muted/30 rounded my-1" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-24 text-center">
        <RefreshCw className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Could not load Jamendo</h3>
        <p className="text-muted-foreground mb-4">Check your connection and try again.</p>
        <button onClick={() => load(order)} className="text-sm underline text-muted-foreground hover:text-foreground">
          Retry
        </button>
      </div>
    );
  }

  if (tracks.length === 0) {
    return (
      <div className="py-24 text-center">
        <Music className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">No tracks found.</p>
      </div>
    );
  }

  return (
    <>
      {/* Order filter */}
      <div className="flex items-center gap-2 mb-6">
        {ORDERS.map((o) => (
          <button
            key={o.value}
            onClick={() => setOrder(o.value)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border transition-colors',
              order === o.value
                ? 'bg-foreground text-background border-foreground'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/40'
            )}
          >
            {o.label}
          </button>
        ))}
        <span className="ml-auto text-xs text-muted-foreground">
          Powered by <a href="https://jamendo.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">Jamendo</a>
        </span>
      </div>

      <div className="divide-y divide-border">
        {tracks.map((j) => {
          const trackId = `jamendo-${j.id}`;
          const isThis = currentTrack?.id === trackId;
          const isPlaying = isThis && playing;

          return (
            <div key={j.id} className={cn('group flex items-center gap-4 py-3', isThis && 'bg-muted/50 -mx-4 px-4')}>
              {/* Art + play */}
              <div className="relative flex-shrink-0">
                <TrackArt trackId={trackId} isPlaying={isPlaying} className="h-12 w-12 transition-opacity group-hover:opacity-75" />
                <button
                  onClick={() => handlePlay(j)}
                  className={cn(
                    'absolute inset-0 m-auto flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background opacity-0 transition-opacity',
                    'group-hover:opacity-100',
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
                <p className={cn('truncate text-sm font-medium', isThis && 'text-primary')}>{j.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {j.artist_name}
                  {j.genre && <span className="text-muted-foreground/60"> · {j.genre}</span>}
                </p>
              </div>

              {/* Duration + save */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground font-mono hidden sm:inline">
                  {formatDuration(j.duration)}
                </span>
                <button
                  onClick={() => setSaveTarget(j)}
                  title={connected ? 'Save to Shelby' : 'Connect wallet to save'}
                  className={cn(
                    'flex items-center gap-1.5 text-xs transition-colors opacity-0 group-hover:opacity-100',
                    connected
                      ? 'text-muted-foreground hover:text-foreground'
                      : 'text-muted-foreground/40 cursor-not-allowed'
                  )}
                >
                  <Download className="h-3.5 w-3.5" />
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

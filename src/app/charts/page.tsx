'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Track } from '@/lib/types';
import { getTracks } from '@/lib/storage';
import { usePlayer } from '@/context/PlayerContext';
import { formatDuration, shortAddress } from '@/lib/utils';

interface ChartEntry {
  rank: number;
  track: Track;
  reason: string;
}

function SparkleIcon() {
  return (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1)
    return (
      <span className="text-lg font-black text-yellow-400 w-7 text-center shrink-0">
        1
      </span>
    );
  if (rank === 2)
    return (
      <span className="text-lg font-black text-zinc-300 w-7 text-center shrink-0">
        2
      </span>
    );
  if (rank === 3)
    return (
      <span className="text-lg font-black text-orange-400 w-7 text-center shrink-0">
        3
      </span>
    );
  return (
    <span className="text-base font-bold text-zinc-600 w-7 text-center shrink-0">
      {rank}
    </span>
  );
}

export default function ChartsPage() {
  const [chart, setChart] = useState<ChartEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiError, setAiError] = useState(false);
  const { currentTrack, playing, play, pause } = usePlayer();

  useEffect(() => {
    async function load() {
      const tracks = getTracks();

      try {
        const res = await fetch('/api/charts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tracks }),
        });

        if (!res.ok) throw new Error(await res.text());

        const data = await res.json();
        if (data.chart?.length) {
          setChart(data.chart);
          return;
        }
        throw new Error('Empty chart response');
      } catch {
        setAiError(true);
        // Fallback: rank by plays
        const fallback = [...tracks]
          .sort((a, b) => b.plays - a.plays)
          .slice(0, 10)
          .map((track, i) => ({
            rank: i + 1,
            track,
            reason: 'Ranked by play count',
          }));
        setChart(fallback);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            Top Charts
          </h1>
          <div className="flex items-center gap-2 text-sm">
            {aiError ? (
              <span className="text-zinc-500">Ranked by play count</span>
            ) : (
              <span className="flex items-center gap-1.5 text-violet-400">
                <SparkleIcon />
                AI-curated by Claude
              </span>
            )}
          </div>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-zinc-500 text-sm mt-1 shrink-0">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            Asking Claude…
          </div>
        )}
      </div>

      {aiError && !loading && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-xl px-4 py-3 mb-6 text-sm">
          AI analysis unavailable (check{' '}
          <code className="font-mono">ANTHROPIC_API_KEY</code>) — showing play
          count ranking.
        </div>
      )}

      {/* Chart list */}
      <div className="flex flex-col gap-3">
        {loading &&
          chart.length === 0 &&
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-[76px] bg-zinc-900 rounded-xl animate-pulse" />
          ))}

        {chart.map((entry) => {
          const isActive = currentTrack?.id === entry.track.id;
          const isPlaying = isActive && playing;

          return (
            <div
              key={entry.track.id}
              className={`flex items-center gap-4 bg-zinc-900 rounded-xl px-4 py-4 hover:bg-zinc-800/80 transition-colors ${
                isActive ? 'ring-1 ring-violet-500/70' : ''
              }`}
            >
              <RankBadge rank={entry.rank} />

              {/* Cover + play button */}
              <button
                onClick={() => (isPlaying ? pause() : play(entry.track))}
                className={`relative w-12 h-12 rounded-xl bg-gradient-to-br ${entry.track.coverColor} shrink-0 flex items-center justify-center hover:scale-105 transition-transform`}
              >
                {isPlaying ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-violet-500 rounded-full border-2 border-zinc-900" />
                )}
              </button>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <Link
                  href={`/track/${entry.track.id}`}
                  className="text-white font-semibold hover:text-violet-400 transition-colors block truncate leading-tight"
                >
                  {entry.track.title}
                </Link>
                <Link
                  href={`/profile/${entry.track.address}`}
                  className="text-zinc-400 text-sm hover:text-violet-400 transition-colors block truncate leading-tight mt-0.5"
                >
                  {entry.track.artist || shortAddress(entry.track.address)}
                </Link>
                {entry.reason && !aiError && (
                  <p className="text-zinc-600 text-xs mt-1 italic truncate">
                    &ldquo;{entry.reason}&rdquo;
                  </p>
                )}
              </div>

              {/* Stats */}
              <div className="text-right shrink-0 space-y-0.5">
                <p className="text-zinc-400 text-sm tabular-nums">
                  {entry.track.plays.toLocaleString()}{' '}
                  <span className="text-zinc-600">plays</span>
                </p>
                <p className="text-zinc-600 text-xs tabular-nums">
                  {formatDuration(entry.track.duration)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {!loading && chart.length === 0 && (
        <div className="text-center py-20 text-zinc-500">
          <p className="text-lg mb-2">No tracks to chart yet.</p>
          <Link
            href="/upload"
            className="text-violet-400 hover:text-violet-300 transition-colors text-sm"
          >
            Upload the first one →
          </Link>
        </div>
      )}
    </div>
  );
}

'use client';
import {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  ReactNode,
} from 'react';
import { Track } from '@/lib/types';

interface PlayerContextType {
  currentTrack: Track | null;
  playing: boolean;
  currentTime: number;
  duration: number;
  plays: Record<string, number>;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  // Real-time play count overrides: trackId → count visible this session
  const [plays, setPlays] = useState<Record<string, number>>({});

  const recordPlay = useCallback((track: Track) => {
    // Optimistic increment — show immediately without waiting for the API
    setPlays((prev) => ({
      ...prev,
      [track.id]: (prev[track.id] ?? track.plays) + 1,
    }));
    // Persist server-side (fire-and-forget)
    fetch('/api/plays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id }),
    }).catch(console.error);
  }, []);

  const play = useCallback(
    (track: Track) => {
      const el = audioRef.current;
      if (!el) return;

      if (currentTrack?.id === track.id) {
        el.play().then(() => setPlaying(true)).catch(console.error);
        return;
      }

      setCurrentTrack(track);
      setCurrentTime(0);
      setDuration(0);
      el.src = track.audioUrl;
      el.load();
      el.play()
        .then(() => {
          setPlaying(true);
          recordPlay(track);
        })
        .catch(console.error);
    },
    [currentTrack, recordPlay]
  );

  const pause = useCallback(() => {
    audioRef.current?.pause();
    setPlaying(false);
  }, []);

  const resume = useCallback(() => {
    audioRef.current?.play().then(() => setPlaying(true)).catch(console.error);
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  return (
    <PlayerContext.Provider
      value={{ currentTrack, playing, currentTime, duration, plays, play, pause, resume, seek }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() =>
          setCurrentTime(audioRef.current?.currentTime ?? 0)
        }
        onDurationChange={() =>
          setDuration(audioRef.current?.duration ?? 0)
        }
        onEnded={() => setPlaying(false)}
      />
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

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
  canSkipNext: boolean;
  canSkipPrev: boolean;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setQueue: (tracks: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Use refs for queue state so onEnded / playNext always see fresh values
  // without needing to re-register the event listener.
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(-1);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [plays, setPlays] = useState<Record<string, number>>({});
  const [canSkipNext, setCanSkipNext] = useState(false);
  const [canSkipPrev, setCanSkipPrev] = useState(false);

  const recordPlay = useCallback((track: Track) => {
    setPlays((prev) => ({
      ...prev,
      [track.id]: (prev[track.id] ?? track.plays) + 1,
    }));
    fetch('/api/plays', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trackId: track.id }),
    }).catch(console.error);
  }, []);

  const updateSkipState = useCallback((idx: number) => {
    setCanSkipPrev(idx > 0);
    setCanSkipNext(idx < queueRef.current.length - 1);
  }, []);

  // Core internal function — starts audio at a queue position.
  const playAtIndex = useCallback((idx: number) => {
    const track = queueRef.current[idx];
    if (!track || !audioRef.current) return;
    const el = audioRef.current;

    queueIndexRef.current = idx;
    updateSkipState(idx);
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
  }, [recordPlay, updateSkipState]);

  const play = useCallback(
    (track: Track) => {
      const el = audioRef.current;
      if (!el) return;

      // Same track — just resume.
      if (currentTrack?.id === track.id) {
        el.play().then(() => setPlaying(true)).catch(console.error);
        return;
      }

      // Look up in the current queue first.
      const idx = queueRef.current.findIndex((t) => t.id === track.id);
      if (idx !== -1) {
        playAtIndex(idx);
      } else {
        // Played from outside any queue — create a singleton queue.
        queueRef.current = [track];
        queueIndexRef.current = 0;
        updateSkipState(0);
        playAtIndex(0);
      }
    },
    [currentTrack, playAtIndex, updateSkipState]
  );

  const playNext = useCallback(() => {
    const nextIdx = queueIndexRef.current + 1;
    if (nextIdx < queueRef.current.length) {
      playAtIndex(nextIdx);
    }
  }, [playAtIndex]);

  const playPrev = useCallback(() => {
    const prevIdx = queueIndexRef.current - 1;
    if (prevIdx >= 0) {
      playAtIndex(prevIdx);
    }
  }, [playAtIndex]);

  // Called by pages when they load their track list.
  const setQueue = useCallback((tracks: Track[]) => {
    queueRef.current = tracks;
    // Re-sync the current index in case the current track is already playing.
    const currentId = queueRef.current[queueIndexRef.current]?.id;
    const newIdx = currentId ? tracks.findIndex((t) => t.id === currentId) : -1;
    if (newIdx !== -1) {
      queueIndexRef.current = newIdx;
      updateSkipState(newIdx);
    } else {
      updateSkipState(queueIndexRef.current);
    }
  }, [updateSkipState]);

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

  const handleEnded = useCallback(() => {
    const nextIdx = queueIndexRef.current + 1;
    if (nextIdx < queueRef.current.length) {
      playAtIndex(nextIdx);
    } else {
      setPlaying(false);
    }
  }, [playAtIndex]);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack, playing, currentTime, duration, plays,
        canSkipNext, canSkipPrev,
        play, pause, resume, seek, playNext, playPrev, setQueue,
      }}
    >
      <audio
        ref={audioRef}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime ?? 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration ?? 0)}
        onEnded={handleEnded}
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

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
  shuffle: boolean;
  repeat: boolean;
  nextTrack: Track | null;
  volume: number;
  muted: boolean;
  play: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  seek: (time: number) => void;
  playNext: () => void;
  playPrev: () => void;
  setQueue: (tracks: Track[]) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);

  // Refs so onEnded always reads the latest values without stale closures.
  const queueRef = useRef<Track[]>([]);
  const queueIndexRef = useRef<number>(-1);
  const shuffleRef = useRef(false);
  const repeatRef = useRef(false);
  const volumeRef = useRef(0.8);
  const mutedRef = useRef(false);

  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [plays, setPlays] = useState<Record<string, number>>({});
  const [canSkipNext, setCanSkipNext] = useState(false);
  const [canSkipPrev, setCanSkipPrev] = useState(false);
  const [shuffle, setShuffleState] = useState(false);
  const [repeat, setRepeatState] = useState(false);
  const [nextTrack, setNextTrack] = useState<Track | null>(null);
  const [volume, setVolumeState] = useState(0.8);
  const [muted, setMuted] = useState(false);

  // Recompute skip buttons and "Next up" track after any state change.
  const updatePlaybackState = useCallback((idx: number) => {
    const q = queueRef.current;
    setCanSkipPrev(idx > 0);
    // With shuffle there's always a random next track (if queue has >1 item).
    setCanSkipNext(shuffleRef.current ? q.length > 1 : idx < q.length - 1);
    // "Next up" only makes sense when not shuffling and not repeating.
    if (repeatRef.current || shuffleRef.current) {
      setNextTrack(null);
    } else {
      setNextTrack(q[idx + 1] ?? null);
    }
  }, []);

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

  const playAtIndex = useCallback((idx: number) => {
    const track = queueRef.current[idx];
    if (!track || !audioRef.current) return;
    const el = audioRef.current;

    queueIndexRef.current = idx;
    updatePlaybackState(idx);
    setCurrentTrack(track);
    setCurrentTime(0);
    setDuration(0);

    el.src = track.audioUrl;
    el.volume = volumeRef.current;
    el.muted = mutedRef.current;
    el.load();
    el.play()
      .then(() => {
        setPlaying(true);
        recordPlay(track);
      })
      .catch(console.error);
  }, [recordPlay, updatePlaybackState]);

  const play = useCallback((track: Track) => {
    const el = audioRef.current;
    if (!el) return;

    if (currentTrack?.id === track.id) {
      el.play().then(() => setPlaying(true)).catch(console.error);
      return;
    }

    const idx = queueRef.current.findIndex((t) => t.id === track.id);
    if (idx !== -1) {
      playAtIndex(idx);
    } else {
      queueRef.current = [track];
      queueIndexRef.current = 0;
      updatePlaybackState(0);
      playAtIndex(0);
    }
  }, [currentTrack, playAtIndex, updatePlaybackState]);

  const pickRandomIndex = useCallback(() => {
    const q = queueRef.current;
    if (q.length <= 1) return 0;
    let idx;
    do { idx = Math.floor(Math.random() * q.length); }
    while (idx === queueIndexRef.current);
    return idx;
  }, []);

  const playNext = useCallback(() => {
    if (shuffleRef.current && queueRef.current.length > 1) {
      playAtIndex(pickRandomIndex());
    } else {
      const nextIdx = queueIndexRef.current + 1;
      if (nextIdx < queueRef.current.length) playAtIndex(nextIdx);
    }
  }, [playAtIndex, pickRandomIndex]);

  const playPrev = useCallback(() => {
    const prevIdx = queueIndexRef.current - 1;
    if (prevIdx >= 0) playAtIndex(prevIdx);
  }, [playAtIndex]);

  const setQueue = useCallback((tracks: Track[]) => {
    queueRef.current = tracks;
    const currentId = queueRef.current[queueIndexRef.current]?.id;
    const newIdx = currentId ? tracks.findIndex((t) => t.id === currentId) : -1;
    const idx = newIdx !== -1 ? newIdx : queueIndexRef.current;
    if (newIdx !== -1) queueIndexRef.current = newIdx;
    updatePlaybackState(idx);
  }, [updatePlaybackState]);

  const toggleShuffle = useCallback(() => {
    const next = !shuffleRef.current;
    shuffleRef.current = next;
    // Turning on shuffle clears repeat.
    if (next) { repeatRef.current = false; setRepeatState(false); }
    setShuffleState(next);
    updatePlaybackState(queueIndexRef.current);
  }, [updatePlaybackState]);

  const toggleRepeat = useCallback(() => {
    const next = !repeatRef.current;
    repeatRef.current = next;
    // Turning on repeat clears shuffle.
    if (next) { shuffleRef.current = false; setShuffleState(false); }
    setRepeatState(next);
    updatePlaybackState(queueIndexRef.current);
  }, [updatePlaybackState]);

  const handleEnded = useCallback(() => {
    if (repeatRef.current && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().then(() => setPlaying(true)).catch(console.error);
      return;
    }
    if (shuffleRef.current && queueRef.current.length > 1) {
      playAtIndex(pickRandomIndex());
      return;
    }
    const nextIdx = queueIndexRef.current + 1;
    if (nextIdx < queueRef.current.length) {
      playAtIndex(nextIdx);
    } else {
      setPlaying(false);
    }
  }, [playAtIndex, pickRandomIndex]);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    volumeRef.current = clamped;
    mutedRef.current = false;
    setVolumeState(clamped);
    setMuted(false);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      audioRef.current.muted = false;
    }
  }, []);

  const toggleMute = useCallback(() => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    if (audioRef.current) audioRef.current.muted = next;
  }, []);

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
      value={{
        currentTrack, playing, currentTime, duration, plays,
        canSkipNext, canSkipPrev, shuffle, repeat, nextTrack,
        volume, muted,
        play, pause, resume, seek, playNext, playPrev,
        setQueue, toggleShuffle, toggleRepeat, setVolume, toggleMute,
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

import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  Trash2,
  FileText,
  Mic,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { VerbalExplanation } from '../types/study';
import { formatAudioDuration } from '../utils/voiceUtils';

interface CardAudioPlayerProps {
  explanation: VerbalExplanation;
  onDelete?: () => void;
  onRerecord?: () => void;
  compact?: boolean;
  className?: string;
}

export const CardAudioPlayer: React.FC<CardAudioPlayerProps> = ({
  explanation,
  onDelete,
  onRerecord,
  compact = false,
  className = '',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(explanation.durationSeconds || 0);
  const [showTranscript, setShowTranscript] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize or update audio element
  useEffect(() => {
    if (!audioRef.current && explanation.audioUrl) {
      const audio = new Audio(explanation.audioUrl);
      audioRef.current = audio;

      audio.onloadedmetadata = () => {
        if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
          setDuration(Math.round(audio.duration));
        }
      };

      audio.ontimeupdate = () => {
        setCurrentTime(Math.round(audio.currentTime));
      };

      audio.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [explanation.audioUrl]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!audioRef.current && explanation.audioUrl) {
      audioRef.current = new Audio(explanation.audioUrl);
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => console.error('Audio playback error:', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation();
    const target = Number(e.target.value);
    setCurrentTime(target);
    if (audioRef.current) {
      audioRef.current.currentTime = target;
    }
  };

  if (compact) {
    return (
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex items-center gap-2 bg-indigo-950/50 border border-indigo-500/30 px-2.5 py-1 rounded-xl text-xs ${className}`}
      >
        <button
          onClick={togglePlay}
          className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          title={isPlaying ? 'Pause verbal explanation' : 'Play verbal explanation'}
        >
          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
        </button>
        <span className="font-mono text-[11px] text-indigo-200">
          {formatAudioDuration(currentTime)} / {formatAudioDuration(duration || explanation.durationSeconds)}
        </span>
        {explanation.transcript && (
          <span
            className="text-[10px] text-slate-400 truncate max-w-[120px] italic"
            title={explanation.transcript}
          >
            "{explanation.transcript}"
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={`bg-slate-950/80 border border-indigo-500/40 rounded-2xl p-3.5 space-y-2.5 shadow-md ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-300">
            <Mic className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              Recorded Verbal Explanation
            </span>
            <span className="text-[10px] text-slate-500 block">
              {new Date(explanation.recordedAt).toLocaleDateString()} at{' '}
              {new Date(explanation.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {onRerecord && (
            <button
              onClick={onRerecord}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Re-record verbal explanation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-300 transition-colors"
              title="Delete verbal explanation"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Audio Playback Controls */}
      <div className="flex items-center gap-3 bg-slate-900/90 px-3 py-2 rounded-xl border border-slate-800">
        <button
          onClick={togglePlay}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-md active:scale-95 cursor-pointer"
          title={isPlaying ? 'Pause' : 'Play voice note'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
        </button>

        <div className="flex-1 space-y-1">
          <input
            type="range"
            min={0}
            max={duration || explanation.durationSeconds || 1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-400">
            <span>{formatAudioDuration(currentTime)}</span>
            <span>{formatAudioDuration(duration || explanation.durationSeconds)}</span>
          </div>
        </div>
      </div>

      {/* Transcript toggle */}
      {explanation.transcript && (
        <div className="space-y-1.5">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="flex items-center gap-1.5 text-xs text-indigo-300 hover:text-indigo-200 font-medium transition-colors cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>{showTranscript ? 'Hide Verbal Transcript' : 'View Spoken Transcript'}</span>
            {showTranscript ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          {showTranscript && (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-xs text-slate-300 leading-relaxed font-sans animate-fadeIn">
              <p className="italic text-slate-200">"{explanation.transcript}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

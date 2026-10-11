import React from 'react';

interface AudioWaveformProps {
  isRecording: boolean;
  audioLevel?: number; // 0 to 100
  barCount?: number;
  className?: string;
  theme?: 'indigo' | 'emerald' | 'amber';
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isRecording,
  audioLevel = 0,
  barCount = 18,
  className = '',
  theme = 'indigo',
}) => {
  // Color palette based on theme
  const getBarColor = (index: number) => {
    if (!isRecording) return 'bg-slate-700';

    if (theme === 'emerald') {
      return index % 2 === 0 ? 'bg-emerald-400' : 'bg-emerald-500';
    }
    if (theme === 'amber') {
      return index % 2 === 0 ? 'bg-amber-400' : 'bg-amber-500';
    }
    return index % 3 === 0
      ? 'bg-indigo-400'
      : index % 3 === 1
      ? 'bg-violet-400'
      : 'bg-cyan-400';
  };

  return (
    <div
      className={`flex items-center justify-center gap-1 h-8 px-2 ${className}`}
      aria-label="Microphone audio activity visualizer"
    >
      {Array.from({ length: barCount }).map((_, i) => {
        // Natural waveform height variation with dynamic audioLevel boost
        const baseVariance = Math.sin((i / barCount) * Math.PI) * 0.7 + 0.3;
        const normalizedLevel = Math.max(0.15, Math.min(1, (audioLevel / 100) * 1.5));
        
        // Random dynamic jitter when active
        const dynamicHeight = isRecording
          ? Math.max(15, Math.min(100, Math.round(baseVariance * normalizedLevel * 100)))
          : 20;

        return (
          <div
            key={i}
            className={`w-1 rounded-full transition-all duration-75 ${getBarColor(i)}`}
            style={{
              height: `${dynamicHeight}%`,
              opacity: isRecording ? Math.max(0.4, normalizedLevel) : 0.3,
            }}
          />
        );
      })}
    </div>
  );
};

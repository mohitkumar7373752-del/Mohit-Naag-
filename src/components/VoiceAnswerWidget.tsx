import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  isSpeechRecognitionSupported,
  createSpeechRecognition,
  matchSpokenTextToOption,
  VoiceMatchResult,
  ISpeechRecognition,
} from '../utils/voiceUtils';
import { AudioWaveform } from './AudioWaveform';
import { useStreak } from '../context/StreakContext';

interface VoiceAnswerWidgetProps {
  options: string[];
  currentSelectedIdx?: number | null;
  onSelectOption: (idx: number) => void;
  isAnswerLocked?: boolean;
  questionText?: string;
  className?: string;
}

export const VoiceAnswerWidget: React.FC<VoiceAnswerWidgetProps> = ({
  options,
  currentSelectedIdx,
  onSelectOption,
  isAnswerLocked = false,
  className = '',
}) => {
  const { recordInteraction } = useStreak();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [lastMatch, setLastMatch] = useState<VoiceMatchResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const [autoSelect, setAutoSelect] = useState(true);
  const [showTips, setShowTips] = useState(false);

  // References
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Verify speech recognition availability on mount
  useEffect(() => {
    setIsSupported(isSpeechRecognitionSupported());
  }, []);

  // Cleanup helper
  const stopAudioAnalysis = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    stopAudioAnalysis();
    setIsListening(false);
  }, [stopAudioAnalysis]);

  // Handle detected voice text
  const handleSpokenResult = useCallback(
    (text: string) => {
      if (!text || isAnswerLocked) return;
      setTranscript(text);

      const match = matchSpokenTextToOption(text, options);
      if (match) {
        setLastMatch(match);
        if (autoSelect) {
          onSelectOption(match.matchedIndex);
          recordInteraction();
        }
      }
    },
    [options, isAnswerLocked, autoSelect, onSelectOption, recordInteraction]
  );

  // Start listening with microphone access
  const startListening = async () => {
    if (isAnswerLocked) return;
    setPermissionError(null);
    setTranscript('');
    setInterimTranscript('');
    setLastMatch(null);

    // 1. Request microphone access for audio metering
    let stream: MediaStream | null = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        mediaStreamRef.current = stream;

        // Setup AudioContext for visualizer
        try {
          const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) {
            const ctx = new AudioCtx();
            audioContextRef.current = ctx;
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);
            const updateLevel = () => {
              if (!analyserRef.current) return;
              analyserRef.current.getByteFrequencyData(dataArray);
              let sum = 0;
              for (let i = 0; i < dataArray.length; i++) {
                sum += dataArray[i];
              }
              const average = sum / dataArray.length;
              // Map to 0 - 100
              const level = Math.min(100, Math.round((average / 128) * 100));
              setAudioLevel(level);
              animationFrameRef.current = requestAnimationFrame(updateLevel);
            };
            updateLevel();
          }
        } catch (e) {
          console.warn('Audio visualization not supported:', e);
        }
      }
    } catch (err: any) {
      console.error('Microphone access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied. Please allow microphone access in your browser address bar.');
      } else if (err.name === 'NotFoundError') {
        setPermissionError('No microphone detected on your device.');
      } else {
        setPermissionError('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
      return;
    }

    // 2. Initialize Speech Recognition
    const recognition = createSpeechRecognition();
    if (!recognition) {
      setPermissionError('Voice speech-to-text recognition is not supported in this browser. Please try Chrome, Edge, or Safari.');
      stopAudioAnalysis();
      return;
    }

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let currentFinal = '';
      let currentInterim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const item = event.results[i];
        if (item.isFinal) {
          currentFinal += item[0].transcript;
        } else {
          currentInterim += item[0].transcript;
        }
      }

      if (currentInterim) {
        setInterimTranscript(currentInterim);
        // Also attempt early match on interim transcript
        const earlyMatch = matchSpokenTextToOption(currentInterim, options);
        if (earlyMatch) {
          setLastMatch(earlyMatch);
          if (autoSelect) {
            onSelectOption(earlyMatch.matchedIndex);
            recordInteraction();
          }
        }
      }

      if (currentFinal) {
        setInterimTranscript('');
        handleSpokenResult(currentFinal);
      }
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setPermissionError('Speech recognition was blocked. Please grant microphone permissions.');
        stopListening();
      } else if (event.error === 'network') {
        setPermissionError('Network issue communicating with speech recognition service.');
      }
    };

    recognition.onend = () => {
      // If still supposed to be listening, speech engine might have timed out on silence
      // Keep UI synchronized
      setIsListening(false);
      stopAudioAnalysis();
    };

    try {
      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    } catch (e) {
      console.error('Error starting recognition:', e);
      stopListening();
    }
  };

  // Cleanup on unmount or options change
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  // Reset matched badge when question options change
  useEffect(() => {
    setLastMatch(null);
    setTranscript('');
    setInterimTranscript('');
  }, [options]);

  const letterLabels = ['A', 'B', 'C', 'D', 'E'];

  return (
    <div
      className={`rounded-2xl border transition-all ${
        isListening
          ? 'bg-indigo-950/40 border-indigo-500/50 shadow-lg shadow-indigo-950/50'
          : 'bg-slate-950/60 border-slate-800'
      } p-4 ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Button & status */}
        <div className="flex items-center gap-3">
          <button
            onClick={isListening ? stopListening : startListening}
            disabled={isAnswerLocked}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer ${
              isAnswerLocked
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                : isListening
                ? 'bg-rose-600 hover:bg-rose-500 text-white border border-rose-400 ring-2 ring-rose-500/30 animate-pulse'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/40 hover:scale-[1.02]'
            }`}
            title={isListening ? 'Click to stop microphone' : 'Click to speak your answer'}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                <span>Stop Listening</span>
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                <span>Speak Answer</span>
              </>
            )}
          </button>

          {/* Audio Waveform Visualizer */}
          {isListening && (
            <div className="flex items-center gap-2">
              <AudioWaveform isRecording={isListening} audioLevel={audioLevel} barCount={14} />
              <span className="text-[11px] font-mono text-indigo-300 font-semibold animate-pulse">
                Listening...
              </span>
            </div>
          )}

          {!isListening && (
            <span className="text-xs text-slate-400 hidden sm:inline">
              Speak{' '}
              <span className="font-mono font-semibold text-slate-300">"Option A"</span>,{' '}
              <span className="font-mono font-semibold text-slate-300">"B"</span> or the answer
            </span>
          )}
        </div>

        {/* Right: Controls & Tips toggle */}
        <div className="flex items-center gap-2 text-xs">
          <label className="flex items-center gap-1.5 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoSelect}
              onChange={(e) => setAutoSelect(e.target.checked)}
              className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0 focus:ring-offset-0 h-3.5 w-3.5"
            />
            <span className="text-[11px]">Auto-select</span>
          </label>

          <button
            onClick={() => setShowTips(!showTips)}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Voice Tips</span>
            {showTips ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Voice Tips Drawer */}
      {showTips && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="font-semibold text-indigo-300 block mb-0.5">By Letter:</span>
            Say <code className="text-slate-200">"Option A"</code>, <code className="text-slate-200">"Choice B"</code>, or <code className="text-slate-200">"Answer C"</code>.
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="font-semibold text-indigo-300 block mb-0.5">By Number:</span>
            Say <code className="text-slate-200">"Option 1"</code>, <code className="text-slate-200">"First one"</code>, or <code className="text-slate-200">"Number two"</code>.
          </div>
          <div className="bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
            <span className="font-semibold text-indigo-300 block mb-0.5">By Answer Text:</span>
            Say words from the choice (e.g., <code className="text-slate-200">"Mitochondria"</code>).
          </div>
        </div>
      )}

      {/* Permission or Error Banner */}
      {permissionError && (
        <div className="mt-3 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
          <div className="space-y-1">
            <p className="font-semibold">Microphone Permission Notice</p>
            <p className="text-rose-200/90 text-[11px]">{permissionError}</p>
          </div>
        </div>
      )}

      {/* Live Transcript and Recognition Result */}
      {(transcript || interimTranscript || lastMatch) && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
          {/* Spoken Text Display */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="text-[11px] font-semibold text-slate-400 shrink-0">Heard:</span>
            <div className="text-xs text-slate-200 truncate bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800/80">
              <span className="text-white font-medium">{transcript || interimTranscript}</span>
              {interimTranscript && !transcript && (
                <span className="text-slate-400 italic"> ...</span>
              )}
            </div>
          </div>

          {/* Matched Option Feedback */}
          {lastMatch && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>
                  Recognized:{' '}
                  <span className="font-bold">
                    {letterLabels[lastMatch.matchedIndex] || lastMatch.matchedIndex + 1})
                  </span>{' '}
                  <span className="truncate max-w-[140px] inline-block align-bottom">
                    {options[lastMatch.matchedIndex]}
                  </span>
                </span>
              </div>

              {!autoSelect && currentSelectedIdx !== lastMatch.matchedIndex && (
                <button
                  onClick={() => onSelectOption(lastMatch.matchedIndex)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors"
                >
                  Select This
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

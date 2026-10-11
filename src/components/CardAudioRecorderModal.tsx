import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  RotateCcw,
  Check,
  X,
  Volume2,
  FileText,
  AlertCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { Flashcard, VerbalExplanation } from '../types/study';
import {
  blobToBase64,
  formatAudioDuration,
  createSpeechRecognition,
  isSpeechRecognitionSupported,
  ISpeechRecognition,
} from '../utils/voiceUtils';
import { AudioWaveform } from './AudioWaveform';
import { useStreak } from '../context/StreakContext';

interface CardAudioRecorderModalProps {
  card: Flashcard | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveExplanation: (cardId: string, explanation: VerbalExplanation) => void;
}

export const CardAudioRecorderModal: React.FC<CardAudioRecorderModalProps> = ({
  card,
  isOpen,
  onClose,
  onSaveExplanation,
}) => {
  const { recordInteraction } = useStreak();

  // State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when opening
  useEffect(() => {
    if (isOpen) {
      setRecordingSeconds(0);
      setAudioLevel(0);
      setPermissionError(null);
      setAudioBlob(null);
      setPreviewUrl(null);
      setTranscript(card?.verbalExplanation?.transcript || '');
      setInterimTranscript('');
      setIsRecording(false);
      setIsPlayingPreview(false);
    } else {
      stopAllAudio();
    }
  }, [isOpen, card]);

  // Clean up all streams and audio contexts
  const stopAllAudio = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
      mediaRecorderRef.current = null;
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
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsRecording(false);
    setIsPlayingPreview(false);
    setAudioLevel(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAllAudio();
    };
  }, [stopAllAudio]);

  // Start recording
  const startRecording = async () => {
    setPermissionError(null);
    setAudioBlob(null);
    setPreviewUrl(null);
    setRecordingSeconds(0);
    setTranscript('');
    setInterimTranscript('');
    audioChunksRef.current = [];

    let stream: MediaStream | null = null;
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported by your browser.');
      }

      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = stream;

      // Set up AudioContext for live waveform visualizer
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
            const avg = sum / dataArray.length;
            setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
            animationFrameRef.current = requestAnimationFrame(updateLevel);
          };
          updateLevel();
        }
      } catch (e) {
        console.warn('AudioContext visualization setup failed:', e);
      }

      // Set up MediaRecorder
      const options = { mimeType: 'audio/webm;codecs=opus' };
      let recorder: MediaRecorder;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recorder = new MediaRecorder(stream, options);
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        recorder = new MediaRecorder(stream, { mimeType: 'audio/mp4' });
      } else {
        recorder = new MediaRecorder(stream);
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        const objUrl = URL.createObjectURL(blob);
        setPreviewUrl(objUrl);
      };

      recorder.start(250); // collect chunks every 250ms
      mediaRecorderRef.current = recorder;
      setIsRecording(true);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingSeconds((prev) => {
          if (prev >= 180) {
            // Auto-stop at 3 minutes
            stopRecording();
            return 180;
          }
          return prev + 1;
        });
      }, 1000);

      // Optional: Start real-time speech transcription
      if (isSpeechRecognitionSupported()) {
        const recognition = createSpeechRecognition();
        if (recognition) {
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (e) => {
            let fullFinal = '';
            let interim = '';
            for (let i = 0; i < e.results.length; i++) {
              const res = e.results[i];
              if (res.isFinal) {
                fullFinal += res[0].transcript + ' ';
              } else {
                interim += res[0].transcript;
              }
            }
            if (fullFinal) setTranscript(fullFinal.trim());
            setInterimTranscript(interim);
          };

          recognition.onerror = () => {
            // Speech transcription is secondary to audio recording
          };

          try {
            recognition.start();
            recognitionRef.current = recognition;
          } catch (e) {
            // ignore
          }
        }
      }
    } catch (err: any) {
      console.error('Microphone recording error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionError('Microphone permission was denied. Please allow microphone permissions in your browser address bar.');
      } else {
        setPermissionError(err.message || 'Could not start microphone recording.');
      }
      stopAllAudio();
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch (e) {
        // ignore
      }
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
    setIsRecording(false);
    setAudioLevel(0);
  };

  // Preview playback
  const togglePlayPreview = () => {
    if (!previewUrl) return;

    if (!previewAudioRef.current) {
      const audio = new Audio(previewUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPlayingPreview(false);
      audio.onerror = () => setIsPlayingPreview(false);
    }

    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current
        .play()
        .then(() => setIsPlayingPreview(true))
        .catch(() => setIsPlayingPreview(false));
    }
  };

  // Save explanation to card
  const handleSave = async () => {
    if (!card || !audioBlob) return;
    setIsSaving(true);

    try {
      const base64Audio = await blobToBase64(audioBlob);
      const explanation: VerbalExplanation = {
        id: `explanation-${Date.now()}`,
        audioUrl: base64Audio,
        transcript: transcript.trim() || undefined,
        recordedAt: new Date().toISOString(),
        durationSeconds: Math.max(1, recordingSeconds),
      };

      onSaveExplanation(card.id, explanation);
      recordInteraction();
      onClose();
    } catch (e) {
      console.error('Failed to convert and save audio explanation:', e);
      alert('Could not save audio recording. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Record Verbal Explanation
              </h2>
              <p className="text-xs text-slate-400">
                Explain this concept out loud in your own words (Feynman Technique)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Flashcard Reference Context */}
          <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800/90 space-y-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">
                Card Prompt:
              </span>
              <p className="text-sm font-semibold text-white leading-snug">{card.front}</p>
            </div>
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Correct Answer / Key Points:
              </span>
              <p className="text-xs text-slate-300 leading-relaxed">{card.back}</p>
            </div>
          </div>

          {/* Error Banner */}
          {permissionError && (
            <div className="p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-semibold text-rose-200">Microphone Permission Needed</p>
                <p className="mt-0.5 text-rose-300/90">{permissionError}</p>
              </div>
            </div>
          )}

          {/* Recording Studio Stage */}
          <div className="bg-slate-950/90 border border-slate-800 rounded-3xl p-6 text-center space-y-4">
            {/* Status & Timer */}
            <div className="space-y-1">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                {isRecording ? '🔴 Recording Verbal Note' : audioBlob ? 'Recorded Audio Preview' : 'Microphone Ready'}
              </span>
              <div className="text-3xl font-extrabold font-mono text-white">
                {formatAudioDuration(recordingSeconds)}
              </div>
            </div>

            {/* Audio Waveform Meter */}
            <div className="py-2">
              <AudioWaveform
                isRecording={isRecording}
                audioLevel={audioLevel}
                barCount={24}
                className="h-12"
                theme="indigo"
              />
            </div>

            {/* Main Action Record / Stop Button */}
            <div className="flex items-center justify-center gap-3">
              {!isRecording && !audioBlob && (
                <button
                  onClick={startRecording}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-xl shadow-rose-950/60 hover:scale-[1.02] transition-all cursor-pointer"
                >
                  <Mic className="w-5 h-5 animate-pulse" />
                  <span>Start Recording My Voice</span>
                </button>
              )}

              {isRecording && (
                <button
                  onClick={stopRecording}
                  className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/40 font-bold text-sm shadow-lg transition-all cursor-pointer"
                >
                  <Square className="w-5 h-5 fill-current" />
                  <span>Stop Recording</span>
                </button>
              )}

              {audioBlob && !isRecording && (
                <div className="flex items-center gap-3">
                  <button
                    onClick={togglePlayPreview}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                  >
                    {isPlayingPreview ? (
                      <>
                        <Pause className="w-4 h-4" />
                        <span>Pause Preview</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 fill-current" />
                        <span>Play Audio ({formatAudioDuration(recordingSeconds)})</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={startRecording}
                    className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs border border-slate-700 transition-colors cursor-pointer"
                    title="Discard and re-record"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Re-record</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Real-time Spoken Transcript */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>Spoken Transcript / Verbal Notes:</span>
              </label>
              {isRecording && (
                <span className="text-[11px] text-indigo-400 font-mono animate-pulse">
                  Transcribing live...
                </span>
              )}
            </div>

            <textarea
              value={isRecording ? (transcript + (interimTranscript ? ' ' + interimTranscript : '')) : transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder={
                isRecording
                  ? 'Your spoken words will appear here in real time...'
                  : 'Speak your explanation or add personal notes about this card...'
              }
              rows={3}
              className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-2xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none resize-none"
            />
            <p className="text-[11px] text-slate-500 flex items-center gap-1">
              <Info className="w-3 h-3 shrink-0" />
              <span>Transcripts are generated automatically via browser speech recognition and can be edited.</span>
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-800/80 bg-slate-900/60 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            onClick={handleSave}
            disabled={!audioBlob || isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white shadow-lg shadow-indigo-950 transition-all cursor-pointer"
          >
            <Check className="w-4 h-4" />
            <span>{isSaving ? 'Saving Audio...' : 'Save Explanation to Card'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

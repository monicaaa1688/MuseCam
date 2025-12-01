import { useEffect, useRef, useState, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';

interface UseLiveInterviewerProps {
  isActive: boolean;
  initialPrompt: string;
}

// Simple encoder for PCM audio
function encodePCM(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function createBlob(data: Float32Array) {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] to avoid distortion before converting
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return {
    data: encodePCM(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

export const useLiveInterviewer = ({ isActive, initialPrompt }: UseLiveInterviewerProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<string>("");
  const [isConnected, setIsConnected] = useState(false);
  
  // Audio & Stream Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  // Session State Refs
  const sessionRef = useRef<Promise<any> | null>(null);
  const textBufferRef = useRef<string>("");
  const isNewTurnRef = useRef<boolean>(true);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Close the session if it exists
    if (sessionRef.current) {
      sessionRef.current.then(session => {
        try {
          session.close();
        } catch (e) {
          console.warn("Error closing session", e);
        }
      });
      sessionRef.current = null;
    }
    
    setIsConnected(false);
  }, []);

  useEffect(() => {
    if (!isActive || !process.env.API_KEY) {
      cleanup();
      return;
    }

    // Reset state for new session
    textBufferRef.current = "";
    isNewTurnRef.current = true;
    setCurrentQuestion("");

    const startSession = async () => {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Setup Audio Input
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const source = audioContext.createMediaStreamSource(stream);
        sourceRef.current = source;
        
        // 4096 buffer size
        const processor = audioContext.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        // 2. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
          model: 'gemini-2.5-flash-native-audio-preview-09-2025',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
            },
            // Inject the context/topic into the system instruction to start the interview right
            systemInstruction: `${SYSTEM_INSTRUCTION}\n\nCONTEXT: The user wants to talk about "${initialPrompt}". Start the interview immediately by asking a relevant, short, engaging opening question about this topic.`,
            outputAudioTranscription: {}, 
          },
          callbacks: {
            onopen: () => {
              console.log("Gemini Live Connected");
              setIsConnected(true);
            },
            onmessage: (message: LiveServerMessage) => {
              const content = message.serverContent;
              
              // Handle Transcription (Text Overlay)
              // We accumulate text until a turn is complete or interrupted
              const transcription = content?.outputTranscription?.text;
              if (transcription) {
                if (isNewTurnRef.current) {
                   textBufferRef.current = "";
                   isNewTurnRef.current = false;
                }
                textBufferRef.current += transcription;
                setCurrentQuestion(textBufferRef.current);
              }

              // Handle Turn Boundaries
              if (content?.turnComplete) {
                 isNewTurnRef.current = true;
              }
              
              if (content?.interrupted) {
                 // If interrupted, we might want to keep the last text or clear it?
                 // Usually keeping it is better context until new text arrives.
                 isNewTurnRef.current = true;
              }
            },
            onclose: () => {
              console.log("Gemini Live Closed");
              setIsConnected(false);
            },
            onerror: (e) => {
              console.error("Gemini Live Error", e);
            }
          }
        });
        
        sessionRef.current = sessionPromise;

        // 3. Start Streaming Audio
        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmBlob = createBlob(inputData);
          
          sessionPromise.then(session => {
             session.sendRealtimeInput({ media: pcmBlob });
          });
        };

        source.connect(processor);
        processor.connect(audioContext.destination);

      } catch (err) {
        console.error("Failed to start Live session", err);
        cleanup();
      }
    };

    startSession();

    return cleanup;
  }, [isActive, initialPrompt, cleanup]);

  return {
    currentQuestion,
    isConnected
  };
};
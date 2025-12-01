import React, { useEffect, useRef, useState } from 'react';
import { AspectRatio } from '../types';
import { ASPECT_RATIOS } from '../constants';
import { useLiveInterviewer } from '../hooks/useLiveInterviewer';
import { Square, Download, RefreshCw } from 'lucide-react';

interface RecorderProps {
  aspectRatio: AspectRatio;
  topicPrompt: string;
  onBack: () => void;
}

export const Recorder: React.FC<RecorderProps> = ({ aspectRatio, topicPrompt, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  
  const [isRecording, setIsRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [timer, setTimer] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Live Interviewer Hook
  const { currentQuestion, isConnected } = useLiveInterviewer({
    isActive: isRecording,
    initialPrompt: topicPrompt
  });

  // Start Camera
  useEffect(() => {
    let stream: MediaStream | null = null;
    
    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 3840 }, height: { ideal: 2160 } },
          audio: true
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error", err);
        setError("Could not access camera. Please allow permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Draw to Canvas Loop (for cropping)
  useEffect(() => {
    let animationFrameId: number;
    
    const draw = () => {
      if (videoRef.current && canvasRef.current && videoRef.current.readyState === 4) {
        const vid = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          const targetDim = ASPECT_RATIOS[aspectRatio];
          
          if (canvas.width !== targetDim.width || canvas.height !== targetDim.height) {
            canvas.width = targetDim.width;
            canvas.height = targetDim.height;
          }
          
          const videoAspect = vid.videoWidth / vid.videoHeight;
          const targetAspect = targetDim.ratio;
          
          let renderW, renderH, offsetX, offsetY;
          
          if (videoAspect > targetAspect) {
            renderH = targetDim.height;
            renderW = renderH * videoAspect;
            offsetY = 0;
            offsetX = (targetDim.width - renderW) / 2;
          } else {
            renderW = targetDim.width;
            renderH = renderW / videoAspect;
            offsetX = 0;
            offsetY = (targetDim.height - renderH) / 2;
          }
          
          ctx.drawImage(vid, offsetX, offsetY, renderW, renderH);
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    };
    
    draw();
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [aspectRatio]);

  // Recording Logic
  const startRecording = () => {
    if (!canvasRef.current || !videoRef.current) return;
    
    chunksRef.current = [];
    const canvasStream = canvasRef.current.captureStream(30);
    
    // Add audio track from original source
    const videoStream = videoRef.current.srcObject as MediaStream;
    const audioTrack = videoStream.getAudioTracks()[0];
    if (audioTrack) {
        canvasStream.addTrack(audioTrack);
    }

    let mimeType = 'video/webm;codecs=vp9';
    if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
    } else {
        mimeType = 'video/webm';
    }

    const recorder = new MediaRecorder(canvasStream, { mimeType });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeType });
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
    };
    
    recorder.start();
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
    setTimer(0);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const downloadVideo = () => {
    if (recordedUrl) {
      const a = document.createElement('a');
      a.href = recordedUrl;
      const ext = MediaRecorder.isTypeSupported('video/mp4') ? 'mp4' : 'webm';
      a.download = `musecam-session-${new Date().toISOString()}.${ext}`;
      a.click();
    }
  };

  if (recordedUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 animate-fade-in bg-pastel-cream w-full overflow-y-auto">
        <h2 className="text-3xl font-serif text-pastel-dark mb-6">Your Session</h2>
        <div className="relative shadow-2xl rounded-2xl overflow-hidden border-4 border-white bg-black">
             <div style={{
                 aspectRatio: `${ASPECT_RATIOS[aspectRatio].ratio}`,
                 maxHeight: '60vh',
                 maxWidth: '100%',
                 display: 'flex',
                 justifyContent: 'center'
             }}>
                 <video 
                   src={recordedUrl} 
                   controls 
                   className="h-full w-auto object-contain"
                 />
             </div>
        </div>
        
        <div className="flex flex-wrap justify-center gap-4 mt-8">
            <button 
                onClick={() => {
                    setRecordedUrl(null);
                    setTimer(0);
                }}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-sans font-bold shadow-sm"
            >
                <RefreshCw size={20} />
                Record Again
            </button>
            <button 
                onClick={downloadVideo}
                className="flex items-center gap-2 px-8 py-3 bg-pastel-dark text-white rounded-full hover:bg-gray-800 transition-all font-sans font-bold shadow-lg transform hover:scale-105"
            >
                <Download size={20} />
                Download Video
            </button>
        </div>
      </div>
    );
  }

  const targetRatio = ASPECT_RATIOS[aspectRatio].ratio;
  const isPortrait = targetRatio < 1;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-gray-900 overflow-hidden">
        <video ref={videoRef} className="hidden" muted playsInline autoPlay />
        
        <div 
            className="relative shadow-2xl bg-black overflow-hidden transition-all duration-500 ease-in-out"
            style={{
                aspectRatio: `${targetRatio}`,
                height: isPortrait ? '85vh' : 'auto',
                width: isPortrait ? 'auto' : '90vw',
                maxHeight: '85vh',
                maxWidth: '100%',
                borderRadius: '24px'
            }}
        >
            <canvas 
                ref={canvasRef} 
                className="w-full h-full object-cover"
            />

            {/* Overlay Layer */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6 md:p-8 bg-gradient-to-b from-black/40 via-transparent to-black/70">
                {/* Header */}
                <div className="flex justify-between items-center text-white/90">
                    <div className="flex items-center gap-2 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                        <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-300'}`} />
                        <span className="font-mono text-xs font-bold tracking-wider">{formatTime(timer)}</span>
                    </div>
                    {isRecording && isConnected && (
                         <div className="flex items-center gap-2 bg-indigo-500/80 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-lg animate-pulse border border-white/20">
                            AI Interviewer Active
                         </div>
                    )}
                </div>

                {/* AI Question Area */}
                <div className="mb-12 flex justify-center w-full">
                     <div className={`transition-all duration-700 transform w-full max-w-lg ${currentQuestion ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'}`}>
                        <div className="bg-black/40 backdrop-blur-md border border-white/20 p-6 md:p-8 rounded-2xl shadow-2xl text-center">
                            <p className="text-white text-xl md:text-3xl font-serif font-medium leading-snug drop-shadow-lg italic">
                                "{currentQuestion}"
                            </p>
                        </div>
                     </div>
                </div>
            </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-6 w-full flex justify-center items-center gap-8 z-50">
             {!isRecording ? (
                 <>
                    <button onClick={onBack} className="px-6 py-3 rounded-full bg-white/10 backdrop-blur-md text-white font-bold hover:bg-white/20 transition-all border border-white/10">
                        Back
                    </button>
                    <button 
                        onClick={startRecording}
                        className="w-20 h-20 rounded-full bg-red-500 border-4 border-white/30 flex items-center justify-center hover:scale-105 transition-all shadow-lg hover:shadow-red-500/50"
                    >
                        <div className="w-8 h-8 rounded-full bg-white" />
                    </button>
                    <div className="w-20" /> {/* Spacer */}
                 </>
             ) : (
                <button 
                    onClick={stopRecording}
                    className="w-20 h-20 rounded-full bg-white border-4 border-red-500/30 flex items-center justify-center hover:scale-105 transition-all shadow-lg"
                >
                    <Square size={32} className="text-red-500 fill-current" />
                </button>
             )}
        </div>
        
        {error && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur p-6 rounded-xl shadow-2xl text-red-500 font-bold z-50 text-center max-w-xs">
                {error}
            </div>
        )}
    </div>
  );
};
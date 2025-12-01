import React, { useState } from 'react';
import { AppState, AspectRatio, Topic } from './types';
import { ASPECT_RATIOS, INITIAL_TOPICS } from './constants';
import { Recorder } from './components/Recorder';
import { Video, Camera, Mic, Sparkles, Settings } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Setup);
  const [selectedTopic, setSelectedTopic] = useState<Topic>(INITIAL_TOPICS[0]);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>(AspectRatio.Portrait);

  if (appState === AppState.Recording) {
    return (
      <div className="w-full h-screen bg-black">
        <Recorder 
          aspectRatio={selectedRatio}
          topicPrompt={selectedTopic.prompt}
          onBack={() => setAppState(AppState.Setup)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pastel-cream text-pastel-dark font-sans selection:bg-rose-200">
      {/* Navbar */}
      <nav className="fixed top-0 w-full p-6 flex justify-between items-center z-10 bg-gradient-to-b from-pastel-cream to-transparent">
        <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-pastel-dark rounded-full flex items-center justify-center text-white">
                <Camera size={20} />
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">MuseCam</h1>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-24 pb-12 min-h-screen flex flex-col justify-center max-w-4xl">
        
        {/* Header Section */}
        <div className="text-center mb-12 space-y-4">
            <div className="inline-flex items-center gap-2 bg-white px-4 py-1.5 rounded-full border border-gray-100 shadow-sm text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">
                <Sparkles size={14} className="text-yellow-500" />
                AI-Powered Video Journal
            </div>
            <h2 className="text-4xl md:text-6xl font-serif font-medium leading-tight text-gray-800">
                Capture your thoughts,<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-400">
                    guided by curiosity.
                </span>
            </h2>
            <p className="text-lg text-gray-500 max-w-xl mx-auto font-light leading-relaxed">
                Record beautiful videos while our AI interviewer listens and helps you tell your story with live, on-screen prompts.
            </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-start">
            
            {/* Left Column: Topics */}
            <div className="space-y-6">
                <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                    1. Choose a Topic
                </h3>
                <div className="grid gap-3">
                    {INITIAL_TOPICS.map((topic) => (
                        <button
                            key={topic.id}
                            onClick={() => setSelectedTopic(topic)}
                            className={`text-left p-5 rounded-xl border transition-all duration-200 hover:shadow-md group relative overflow-hidden ${
                                selectedTopic.id === topic.id 
                                ? 'bg-white border-rose-300 shadow-lg ring-1 ring-rose-200' 
                                : 'bg-white/50 border-transparent hover:bg-white hover:border-gray-200'
                            }`}
                        >
                            <div className={`absolute top-0 left-0 w-1 h-full transition-all duration-300 ${
                                selectedTopic.id === topic.id ? 'bg-rose-400' : 'bg-transparent group-hover:bg-gray-200'
                            }`} />
                            <h4 className="font-bold text-lg text-gray-800 mb-1">{topic.title}</h4>
                            <p className="text-sm text-gray-500">{topic.description}</p>
                        </button>
                    ))}
                </div>
            </div>

            {/* Right Column: Settings & Start */}
            <div className="space-y-8 bg-white/60 p-8 rounded-3xl border border-white backdrop-blur-sm shadow-sm">
                
                {/* Aspect Ratio Selector */}
                <div className="space-y-4">
                    <h3 className="text-xl font-bold font-serif flex items-center gap-2">
                        2. Video Format
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {Object.entries(ASPECT_RATIOS).map(([key, dim]) => (
                            <button
                                key={key}
                                onClick={() => setSelectedRatio(key as AspectRatio)}
                                className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all ${
                                    selectedRatio === key
                                    ? 'border-indigo-400 bg-indigo-50 text-indigo-900'
                                    : 'border-gray-100 hover:border-indigo-100 hover:bg-gray-50 text-gray-500'
                                }`}
                            >
                                <div 
                                    className="border-2 border-current rounded mb-2 opacity-50"
                                    style={{
                                        width: '24px',
                                        height: `${24 / dim.ratio}px`,
                                        maxHeight: '32px'
                                    }}
                                />
                                <span className="text-xs font-bold uppercase tracking-wide">{dim.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* API Key Check (Implicit via Environment) - visual cue only */}
                {!process.env.API_KEY && (
                     <div className="p-4 bg-amber-50 text-amber-800 text-sm rounded-lg border border-amber-200">
                        <strong>Note:</strong> API Key is missing. Live interview features will be disabled, but you can still record.
                     </div>
                )}

                {/* Start Button */}
                <div className="pt-4">
                    <button 
                        onClick={() => setAppState(AppState.Recording)}
                        className="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-black hover:scale-[1.02] transition-all transform flex items-center justify-center gap-3"
                    >
                        <Video size={24} />
                        Start Session
                    </button>
                    <p className="text-center text-xs text-gray-400 mt-3">
                        Camera and microphone access required
                    </p>
                </div>
            </div>
        </div>

      </main>
      
      {/* Footer Decoration */}
      <footer className="fixed bottom-0 w-full p-4 text-center text-gray-300 text-sm pointer-events-none">
        MuseCam © {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default App;

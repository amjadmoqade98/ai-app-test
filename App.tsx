import React, { useState, useCallback } from 'react';
import { useAudioRecorder } from './hooks/useAudioRecorder';
import { translateAudio, generateTts } from './services/geminiService';
import { RecordButton } from './components/RecordButton';
import { ResultCard } from './components/ResultCard';
import { Waveform } from './components/Waveform';
import { AppState, TranslationResponse } from './types';

// Helper to convert Blob to Base64 string
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      // Remove the "data:audio/webm;base64," prefix to get raw base64
      const base64 = dataUrl.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Helper to decode and play raw PCM audio from Gemini
const playRawAudio = async (base64String: string) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    // Gemini TTS default is 24kHz
    const sampleRate = 24000; 
    const ctx = new AudioContextClass({ sampleRate });
    
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // Convert raw bytes (16-bit signed LE) to float [-1, 1]
    const int16Data = new Int16Array(bytes.buffer);
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 32768.0;
    }
    
    const buffer = ctx.createBuffer(1, float32Data.length, sampleRate);
    buffer.copyToChannel(float32Data, 0);
    
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  } catch (err) {
    console.error("Audio playback failed:", err);
  }
};

const App: React.FC = () => {
  const { isRecording, startRecording, stopRecording, hasPermission } = useAudioRecorder();
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [result, setResult] = useState<TranslationResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastForeignLanguage, setLastForeignLanguage] = useState<string | null>(null);
  const [englishDialect, setEnglishDialect] = useState<string>('American English');

  const handleStartRecording = useCallback(async () => {
    setErrorMessage(null);
    setAppState(AppState.RECORDING);
    setResult(null); // Clear previous result when starting new
    await startRecording();
  }, [startRecording]);

  const handleStopRecording = useCallback(async () => {
    // Only proceed if we were actually recording
    if (appState !== AppState.RECORDING) return;

    const audioBlob = await stopRecording();
    
    if (!audioBlob || audioBlob.size === 0) {
      setAppState(AppState.IDLE);
      return;
    }

    setAppState(AppState.PROCESSING);

    try {
      const base64Audio = await blobToBase64(audioBlob);

      // 1. Translate Audio (handles language switching logic based on history)
      const translationResponse = await translateAudio(
        base64Audio, 
        audioBlob.type,
        {
          previousForeignLanguage: lastForeignLanguage,
          preferredEnglishDialect: englishDialect
        }
      );
      
      setResult(translationResponse);
      
      // Smart update of language/dialect contexts
      const detectedLower = translationResponse.detectedLanguage.toLowerCase();
      if (detectedLower.includes('english')) {
        // If user spoke English, update their preferred English dialect
        setEnglishDialect(translationResponse.detectedLanguage);
      } else {
        // If user spoke a foreign language, update the last foreign language
        setLastForeignLanguage(translationResponse.detectedLanguage);
      }

      setAppState(AppState.SUCCESS);

      // 2. Generate Speech from the translation
      try {
        const audioData = await generateTts(translationResponse.translatedText);
        await playRawAudio(audioData);
      } catch (ttsError) {
        console.error("TTS generation failed", ttsError);
      }
      
    } catch (error) {
      console.error("Translation process failed", error);
      setErrorMessage("Translation failed. Please try again.");
      setAppState(AppState.ERROR);
    }
  }, [appState, stopRecording, lastForeignLanguage, englishDialect]);

  return (
    <div className="min-h-screen w-full bg-[#0f172a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0f172a] to-black flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
         <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <div className="z-10 text-center mb-12">
        <h1 className="font-display text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 mb-4">
          LinguaLink AI
        </h1>
        <p className="text-slate-400 max-w-xs mx-auto text-sm md:text-base">
          Universal Translator. Speak in any language.
        </p>
      </div>

      {/* Main Interaction Area */}
      <div className="z-10 flex flex-col items-center w-full max-w-lg space-y-12">
        
        {/* Button & Waveform */}
        <div className="flex flex-col items-center justify-center h-48">
          {!hasPermission ? (
            <div className="text-red-400 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
              Please allow microphone access to use the app.
            </div>
          ) : (
            <>
               {/* Spacer to keep button centered vertically relative to waveform */}
               <div className="h-12 mb-8 w-full flex justify-center">
                  {appState === AppState.RECORDING && <Waveform active={true} />}
               </div>
               
               <RecordButton 
                  isRecording={appState === AppState.RECORDING}
                  onMouseDown={handleStartRecording}
                  onMouseUp={handleStopRecording}
                  disabled={appState === AppState.PROCESSING}
               />
            </>
          )}
        </div>

        {/* Status & Errors */}
        <div className="h-8">
          {appState === AppState.PROCESSING && (
            <div className="flex items-center space-x-2 text-cyan-400 animate-pulse">
              <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
              <span className="text-sm font-medium uppercase tracking-widest">Translating...</span>
            </div>
          )}
          
          {appState === AppState.ERROR && errorMessage && (
             <div className="text-red-400 text-sm font-medium">{errorMessage}</div>
          )}
        </div>

        {/* Result Display */}
        <div className="w-full flex justify-center min-h-[200px]">
          <ResultCard 
            data={result} 
            isLoading={appState === AppState.PROCESSING} 
          />
        </div>

      </div>
      
      {/* Footer */}
      <div className="absolute bottom-6 text-slate-600 text-xs">
        Powered by Gemini 2.5 Flash & Gemini TTS
      </div>
    </div>
  );
};

export default App;
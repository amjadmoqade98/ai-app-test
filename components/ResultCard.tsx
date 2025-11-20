import React from 'react';
import { TranslationResponse } from '../types';

interface ResultCardProps {
  data: TranslationResponse | null;
  isLoading: boolean;
}

export const ResultCard: React.FC<ResultCardProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-md bg-slate-800/50 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-3 bg-slate-700 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md rounded-2xl p-6 border border-slate-700 shadow-xl transition-all duration-500 ease-out transform translate-y-0 opacity-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold tracking-wider text-cyan-400 uppercase">
          Detected: {data.detectedLanguage}
        </span>
        <div className="h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.6)]"></div>
      </div>

      <div className="mb-6">
        <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-2">Original</h3>
        <p className="text-slate-200 italic text-lg font-light leading-relaxed">
          "{data.originalTranscription}"
        </p>
      </div>

      <div className="relative">
        <div className="absolute -left-3 top-0 bottom-0 w-0.5 bg-gradient-to-b from-cyan-500 to-purple-600 rounded-full"></div>
        <h3 className="text-slate-400 text-xs uppercase tracking-widest mb-2 pl-3">
          {data.targetLanguage} Translation
        </h3>
        <p className="text-white text-xl font-medium leading-relaxed pl-3">
          {data.translatedText}
        </p>
      </div>
    </div>
  );
};
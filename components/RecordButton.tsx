import React from 'react';

interface RecordButtonProps {
  isRecording: boolean;
  onMouseDown: () => void;
  onMouseUp: () => void;
  disabled: boolean;
}

export const RecordButton: React.FC<RecordButtonProps> = ({ isRecording, onMouseDown, onMouseUp, disabled }) => {
  // Handlers for both mouse and touch events to support mobile devices
  const handleStart = (e: React.SyntheticEvent) => {
    if (disabled) return;
    e.preventDefault();
    onMouseDown();
  };

  const handleEnd = (e: React.SyntheticEvent) => {
    if (disabled) return;
    e.preventDefault();
    onMouseUp();
  };

  return (
    <div className="relative group">
      {/* Glowing Rings Effect when Recording */}
      {isRecording && (
        <>
          <div className="absolute inset-0 rounded-full bg-cyan-500 opacity-20 animate-ping"></div>
          <div className="absolute -inset-4 rounded-full bg-purple-500 opacity-10 animate-pulse"></div>
        </>
      )}

      <button
        onMouseDown={handleStart}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        disabled={disabled}
        className={`
          relative z-10 flex items-center justify-center 
          w-32 h-32 rounded-full 
          transition-all duration-200 ease-in-out
          ${disabled ? 'bg-slate-700 cursor-not-allowed opacity-50' : 'cursor-pointer active:scale-95'}
          ${isRecording 
            ? 'bg-gradient-to-br from-red-500 to-pink-600 shadow-[0_0_40px_rgba(239,68,68,0.6)]' 
            : 'bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]'}
        `}
      >
        {/* Icon */}
        <svg 
          className={`w-12 h-12 text-white transition-transform duration-300 ${isRecording ? 'scale-110' : 'scale-100'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          {isRecording ? (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          ) : (
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          )}
        </svg>
      </button>
      
      <div className="absolute -bottom-12 left-0 right-0 text-center">
         <span className={`text-sm font-medium tracking-wider transition-colors duration-300 ${isRecording ? 'text-red-400' : 'text-slate-400'}`}>
            {isRecording ? 'LISTENING...' : 'HOLD TO SPEAK'}
         </span>
      </div>
    </div>
  );
};

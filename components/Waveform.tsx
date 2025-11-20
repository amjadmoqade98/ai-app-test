import React from 'react';

interface WaveformProps {
  active: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ active }) => {
  if (!active) return <div className="h-12" />;

  return (
    <div className="flex items-center justify-center space-x-1 h-12 transition-opacity duration-300">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="w-2 bg-cyan-400 rounded-full animate-pulse"
          style={{
            height: active ? `${Math.random() * 100}%` : '20%',
            animationDuration: `${0.5 + Math.random() * 0.5}s`,
            minHeight: '10px'
          }}
        />
      ))}
    </div>
  );
};


import React from 'react';

interface CounterProps {
  count: number;
  onCountChange: (newCount: number) => void;
}

const Counter: React.FC<CounterProps> = ({ count, onCountChange }) => {
  const increment = () => onCountChange(count + 1);
  const decrement = () => onCountChange(Math.max(0, count - 1));

  return (
    <div className="flex items-center justify-center gap-3 mt-4">
      <button
        onClick={decrement}
        className="w-12 h-12 bg-pink-600 rounded-full text-white text-3xl font-bold flex items-center justify-center hover:bg-pink-700 active:scale-95 transition-transform"
        aria-label="Decrement count"
      >
        -
      </button>
      <span className="text-4xl font-bold text-center w-20 tabular-nums bg-gray-900/50 px-2 py-1 rounded-md">
        {count}
      </span>
      <button
        onClick={increment}
        className="w-12 h-12 bg-purple-600 rounded-full text-white text-3xl font-bold flex items-center justify-center hover:bg-purple-700 active:scale-95 transition-transform"
        aria-label="Increment count"
      >
        +
      </button>
    </div>
  );
};

export default Counter;
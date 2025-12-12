import React from 'react';

interface FooterProps {
  title: string;
  count: number;
  onReset?: () => void;
  showReset?: boolean;
  gradient: string;
}

const Footer: React.FC<FooterProps> = ({ title, count, onReset, showReset, gradient }) => {
  return (
    <footer className="sticky bottom-0 z-10 bg-gray-900/80 backdrop-blur-md mt-8 py-4 px-4 shadow-[0_-4px_15px_-5px_rgba(147,51,234,0.2)]">
      <div className="container mx-auto flex justify-center items-center relative">
        <div className="text-center">
          <p className="text-lg font-semibold">{title}</p>
          <p className={`text-3xl font-bold text-transparent bg-clip-text ${gradient}`}>
            {count.toLocaleString()}
          </p>
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <p className="text-xs text-gray-400">Developed By</p>
            <p className="text-sm font-medium text-gray-300">Mufti Mahmud Mollah</p>
            <p className="text-xs text-gray-400">AGM (Maintenance & SCD, FP, TFW)</p>
          </div>
        </div>
        {showReset && onReset && (
           <div className="absolute right-4 top-1/2 -translate-y-1/2">
             <button 
               onClick={onReset}
               className="px-4 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 active:scale-95 transition-all text-sm"
             >
               Reset Today's Counts
             </button>
           </div>
        )}
      </div>
    </footer>
  );
};

export default Footer;

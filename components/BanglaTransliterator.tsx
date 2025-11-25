import React, { useState, useEffect } from 'react';

const transliterationMap: Record<string, string> = {
  // FIX: Removed duplicate keys (i, I, U, e, E, O, OU) to resolve compilation errors.
  // The first declaration of these keys, representing vowel signs (kars), has been kept.
  // Vowels
  'o': 'অ', 'a': 'া', 'i': 'ি', 'I': 'ী', 'u': 'ু', 'U': 'ূ', 'e': 'ে', 'E': 'ৈ', 'O': 'ো', 'OU': 'ৌ',
  'A': 'আ', 'ao': 'আও', 'oo': 'উ', 'OO': 'ঊ', 'OI': 'ঐ',
  
  // Consonants
  'k': 'ক', 'kh': 'খ', 'g': 'গ', 'gh': 'ঘ', 'Ng': 'ঙ',
  'c': 'চ', 'ch': 'ছ', 'j': 'জ', 'jh': 'ঝ', 'NG': 'ঞ', 'J': 'ঝ',
  'T': 'ট', 'Th': 'ঠ', 'D': 'ড', 'Dh': 'ঢ', 'N': 'ণ',
  't': 'ত', 'th': 'থ', 'd': 'দ', 'dh': 'ধ', 'n': 'ন',
  'p': 'প', 'ph': 'ফ', 'f': 'ফ',
  'b': 'ব', 'bh': 'ভ', 'v': 'ভ',
  'm': 'ম', 'z': 'য', 'Z': 'ঝ',
  'r': 'র', 'l': 'ল',
  'sh': 'শ', 'S': 'ষ', 's': 'স',
  'h': 'হ', 'y': 'য়', 'Y': 'য়',
  'R': 'ড়', 'Rh': 'ঢ়',
  
  // Special characters
  '..': '।।', '.': '।',
  'H': 'ঃ',
  'ng': 'ং',
  'nd': 'ঁ',
  
  // Juktakkhor helpers
  'kS': 'ক্ষ', 'h`m': 'হ্ম', '`': '্',
};

const vowels = "aAiIuUeEoO";
const consonants = "kKgGNcCjJNTD tTdDnpPbBmvzZrlSshHyR";

const helpMap: Record<string, string[]> = {
    'Vowels': ['a=া', 'A=আ', 'i=ই/ি', 'I=ঈ/ী', 'u=উ/ু', 'U=ঊ/ূ', 'e=এ/ে', 'E=ঐ/ৈ', 'o=ও/ো', 'O=ঔ/ৌ', 'rri=ঋ/ৃ'],
    'Consonants (k-group)': ['k=ক', 'kh=খ', 'g=গ', 'gh=ঘ', 'Ng=ঙ'],
    'Consonants (c-group)': ['c=চ', 'ch=ছ', 'j=জ', 'jh=ঝ', 'NG=ঞ'],
    'Consonants (T-group)': ['T=ট', 'Th=ঠ', 'D=ড', 'Dh=ঢ', 'N=ণ'],
    'Consonants (t-group)': ['t=ত', 'th=থ', 'd=দ', 'dh=ধ', 'n=ন'],
    'Consonants (p-group)': ['p=প', 'f/ph=ফ', 'b=ব', 'v/bh=ভ', 'm=ম'],
    'Consonants (others)': ['z=য', 'r=র', 'l=ল', 'sh/S=শ/ষ', 's=স', 'h=হ', 'y/Y=য়', 'R=ড়', 'Rh=ঢ়'],
    'Special Symbols': ['.=।', '..=।।', 'H=ঃ', 'ng=ং', 'nd=ঁ (chandrabindu)'],
    'Conjuncts (Juktakkhor)': ['Use ` (backtick) between consonants to form a conjunct. Example: k`t = ক্ত'],
};

const BanglaKeyboardHelp: React.FC = () => (
    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-600 mt-2 text-xs">
        <h4 className="font-bold text-gray-300 mb-2">Bangla Typing Guide</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2">
            {Object.entries(helpMap).map(([group, keys]) => (
                <div key={group}>
                    <p className="font-semibold text-purple-400">{group}</p>
                    <ul className="text-gray-400">
                        {keys.map(key => <li key={key}>{key}</li>)}
                    </ul>
                </div>
            ))}
        </div>
    </div>
);

const transliterate = (text: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const doubleChar = text.substring(i, i + 2);
    const singleChar = text.substring(i, i + 1);

    if (transliterationMap[doubleChar]) {
      result += transliterationMap[doubleChar];
      i++;
    } else if (transliterationMap[singleChar]) {
      result += transliterationMap[singleChar];
    } else {
      result += singleChar;
    }
  }
  return result;
};


interface BanglaTransliteratorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export const BanglaTransliterator: React.FC<BanglaTransliteratorProps> = ({ value, onChange, placeholder }) => {
  const [englishText, setEnglishText] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const bangla = transliterate(englishText);
    onChange(bangla);
  }, [englishText, onChange]);

  return (
    <div>
        <div className="relative">
            <textarea
                value={englishText}
                onChange={(e) => setEnglishText(e.target.value)}
                placeholder={placeholder}
                className="w-full h-20 p-2 bg-gray-900 border border-gray-600 rounded-md text-sm mb-2"
                aria-label="Phonetic Bangla Input"
            />
            <div 
                className="w-full h-20 p-2 bg-gray-800 border border-gray-500 rounded-md text-sm text-gray-200 absolute top-0 left-0 pointer-events-none"
                aria-hidden="true"
            >
                {value}
            </div>
        </div>
      <button onClick={() => setShowHelp(!showHelp)} className="text-xs text-purple-400 hover:text-purple-300">
        {showHelp ? 'Hide' : 'Show'} Typing Help
      </button>
      {showHelp && <BanglaKeyboardHelp />}
    </div>
  );
};

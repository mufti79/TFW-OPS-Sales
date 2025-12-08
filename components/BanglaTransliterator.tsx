import React, { useState } from 'react';

const BanglaTransliterator: React.FC = () => {
    const [transliteratedText, setTransliteratedText] = useState('');

    return (
        <div>{transliteratedText}</div>
    );
}

export default BanglaTransliterator;
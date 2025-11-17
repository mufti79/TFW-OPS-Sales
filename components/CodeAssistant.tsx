
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { marked } from 'marked';
import { Ride } from '../types';

interface CodeAssistantProps {
  rides: Ride[];
  dailyCounts: Record<string, Record<string, number>>;
  onClose: () => void;
}

interface Message {
    role: 'user' | 'model';
    content: string;
}

const AssistantIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const UserIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
);


const CodeAssistant: React.FC<CodeAssistantProps> = ({ rides, dailyCounts, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
      { role: 'model', content: "Hello! I'm your AI assistant. Ask me anything about your ride data, like 'Which rides were most popular yesterday?' or 'Summarize guest activity for the 17th floor'." }
  ]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSend = async () => {
    if (!prompt.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: prompt };
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setIsLoading(true);
    setError('');

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const today = new Date().toISOString().split('T')[0];
        const context = `
          You are an AI assistant for the owner of Toggi Fun World amusement park.
          Your task is to analyze the provided data and answer questions.
          Be concise and helpful.

          **Application Architecture & Setup:**
          - This application uses Firebase Realtime Database to store and synchronize all data in real-time across devices.
          - The Firebase configuration is located in a file named 'firebaseConfig.ts'.
          - If the configuration is missing or incorrect, the application will display a full-screen error and will not be usable.
          - **Crucially, you, the AI assistant, cannot set up or configure the database yourself.** If a user asks you to "install Firebase" or "set up the database", you must explain that this is a manual process that a developer needs to perform by editing the 'firebaseConfig.ts' file, following the instructions within it.

          **User Management:**
          - IMPORTANT: You cannot add, edit, or delete operators directly. If a user asks to perform these actions, you must inform them that any changes must be made by a developer in the application's source code for security and data integrity.

          **Data for Analysis:**
          Current Date: ${today}

          Rides Information (ID, Name, Floor):
          ${rides.map(r => `${r.id}, ${r.name}, ${r.floor}`).join('\n')}

          Daily Guest Counts (Date, Ride ID, Count):
          ${JSON.stringify(dailyCounts, null, 2)}
        `;

        const fullPrompt = `${context}\n\nUser Question: ${userMessage.content}`;
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: fullPrompt,
        });

        const modelMessage: Message = { role: 'model', content: response.text };
        setMessages(prev => [...prev, modelMessage]);

    } catch (err) {
        console.error(err);
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(`Failed to get response from AI. ${errorMessage}`);
        setMessages(prev => [...prev, { role: 'model', content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
        setIsLoading(false);
    }
  };

  const renderMarkdown = (content: string) => {
    const rawMarkup = marked.parse(content, { gfm: true, breaks: true, async: false }) as string;
    // This is safe because we trust the output from Gemini and Marked.
    return { __html: rawMarkup };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-[80vh] flex flex-col border border-gray-700 animate-fade-in-up">
        <header className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-teal-400 to-blue-500 rounded-full">
              <AssistantIcon />
            </div>
            <h2 className="text-xl font-bold text-gray-100">AI Data Assistant</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        <main className="flex-grow p-4 overflow-y-auto space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'model' && <div className="p-2 bg-gray-700 rounded-full self-start"><AssistantIcon/></div>}
                <div className={`max-w-md lg:max-w-lg p-3 rounded-lg prose prose-invert prose-p:my-0 prose-headings:my-1 prose-ul:my-1 prose-li:my-0 ${msg.role === 'user' ? 'bg-purple-600' : 'bg-gray-700'}`}>
                    <div dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                </div>
                {msg.role === 'user' && <div className="p-2 bg-gray-700 rounded-full self-start"><UserIcon/></div>}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <div className="p-2 bg-gray-700 rounded-full self-start"><AssistantIcon/></div>
                <div className="p-3 rounded-lg bg-gray-700 flex items-center space-x-2">
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-0"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></span>
                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></span>
                </div>
            </div>
          )}
           <div ref={messagesEndRef} />
        </main>

        {error && <p className="text-red-400 text-sm px-4 pb-2">{error}</p>}
        
        <footer className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your data..."
              className="flex-grow px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={isLoading || !prompt.trim()}
              className="px-5 py-2 bg-pink-600 text-white font-semibold rounded-lg hover:bg-pink-700 active:scale-95 transition-all disabled:bg-gray-600 disabled:cursor-not-allowed"
            >
              Send
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default CodeAssistant;

// components/SpartanOracleAgent.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { getGeminiChatResponse } from '../services/geminiService';
import { KaggleCompetition, TrainedModel, ChatMessage } from '../types';
// Add missing import for Spinner component
import Spinner from './Spinner';

interface SpartanOracleAgentProps {
  competitions: KaggleCompetition[];
  selectedCompetition: KaggleCompetition | null;
  trainedModels: TrainedModel[];
  onSuggestConceptualizerPrompt: (prompt: string) => void;
  isKaggleAccountLinked: boolean; // New prop
}

const SpartanOracleAgent: React.FC<SpartanOracleAgentProps> = ({
  competitions,
  selectedCompetition,
  trainedModels,
  onSuggestConceptualizerPrompt,
  isKaggleAccountLinked, // Use the new prop
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const oracleIcon = '💬';

  // Scroll to bottom whenever messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initial greeting from the Oracle
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{ role: 'model', content: "Greetings, seeker! I am the Spartan Oracle, here to guide you on your Kaggle quest. How may I assist you?" }]);
    }
  }, [isOpen, messages.length]);

  // Effect for custom scrollbar styles
  useEffect(() => {
    const styleId = 'spartan-oracle-scrollbar-styles';
    let styleElement = document.getElementById(styleId);

    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.textContent = `
      .custom-scrollbar::-webkit-scrollbar {
        width: 8px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #888;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #555;
      }
    `;

    return () => {
      // Clean up the style element when the component unmounts
      if (styleElement && styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement);
      }
    };
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount


  const appContext = useMemo(() => ({
    selectedCompetition: selectedCompetition,
    trainedModels: trainedModels.map(m => ({ id: m.id, name: m.name })),
    competitions: competitions.map(c => ({ id: c.id, title: c.title })),
    isKaggleAccountLinked: isKaggleAccountLinked, // Include linked status
  }), [selectedCompetition, trainedModels, competitions, isKaggleAccountLinked]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim()) return;

    const newUserMessage: ChatMessage = { role: 'user', content: inputValue.trim() };
    
    // Capture the current messages state *before* adding the new user message for the API call
    const currentMessagesForApi = messages; 
    
    // Update local state with the new user message immediately
    setMessages((prev) => [...prev, newUserMessage]); 
    setInputValue('');
    setIsLoading(true);

    try {
      // Pass the chat history *before* the new user message (currentMessagesForApi), 
      // and the new user message content separately as latestUserMessage
      const response = await getGeminiChatResponse(currentMessagesForApi, newUserMessage.content, appContext);
      if (response) {
        setMessages((prev) => [...prev, { role: 'model', content: response }]);
      }
    } catch (error) {
      console.error("Error sending message to Oracle:", error);
      setMessages((prev) => [...prev, { role: 'model', content: "Forgive me, seeker, but the celestial currents are disturbed. I cannot commune with the cosmos at this moment. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  }, [inputValue, messages, appContext]); // `messages` is a dependency here because `currentMessagesForApi` depends on it.

  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 z-50 transition-transform duration-200 transform hover:scale-110"
        aria-label={isOpen ? "Close Spartan Oracle chat" : "Open Spartan Oracle chat"}
      >
        <span className="text-2xl">{oracleIcon}</span>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 w-80 h-96 bg-white shadow-xl rounded-lg flex flex-col z-50 border border-gray-200">
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-indigo-600 text-white rounded-t-lg">
            <h3 className="text-lg font-semibold flex items-center">
              <span className="text-xl mr-2">{oracleIcon}</span>
              Spartan Oracle
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200 focus:outline-none text-2xl"
              aria-label="Close chat"
            >
              &times;
            </button>
          </div>

          <div className="flex-1 p-3 overflow-y-auto space-y-3 custom-scrollbar">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-4 py-2 rounded-lg text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 px-4 py-2 rounded-lg text-sm">
                  <Spinner />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 p-3 flex items-center">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ask the Oracle..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className="ml-2 bg-indigo-600 text-white p-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              disabled={isLoading || !inputValue.trim()}
              aria-label="Send message"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default SpartanOracleAgent;
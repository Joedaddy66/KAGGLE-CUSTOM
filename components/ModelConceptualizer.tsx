// components/ModelConceptualizer.tsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { getGeminiModelSuggestion } from '../services/geminiService';
import { GeminiModelSuggestion, KaggleCompetition } from '../types';
import Spinner from './Spinner';
import MarkdownRenderer from './MarkdownRenderer';

interface ModelConceptualizerProps {
  selectedCompetition: KaggleCompetition | null;
  onUseSuggestionForTraining: (suggestion: GeminiModelSuggestion) => void;
  oracleSuggestedPrompt: string | null; // New prop for Oracle suggestions
  onOraclePromptHandled: () => void; // New callback to clear Oracle prompt
}

const ModelConceptualizer: React.FC<ModelConceptualizerProps> = ({
  selectedCompetition,
  onUseSuggestionForTraining,
  oracleSuggestedPrompt,
  onOraclePromptHandled,
}) => {
  const [userPrompt, setUserPrompt] = useState<string>('');
  const [suggestion, setSuggestion] = useState<GeminiModelSuggestion | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Ref to track if the prompt came from the Oracle to avoid clearing manually entered prompt
  const isOraclePromptActive = useRef(false);

  // Effect to handle prompts suggested by the Spartan Oracle
  useEffect(() => {
    if (oracleSuggestedPrompt && oracleSuggestedPrompt !== userPrompt) {
      setUserPrompt(oracleSuggestedPrompt);
      isOraclePromptActive.current = true;
      // Optionally, auto-generate suggestion here if desired
      // handleGenerateSuggestion(); // This might be too aggressive, let user trigger
      onOraclePromptHandled(); // Mark the prompt as handled immediately
    }
  }, [oracleSuggestedPrompt, userPrompt, onOraclePromptHandled]);


  const handleGenerateSuggestion = useCallback(async () => {
    if (!selectedCompetition) {
      setError("Please select a competition first.");
      return;
    }
    if (!userPrompt.trim()) {
      setError("Please enter a prompt for the model suggestion.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuggestion(null);

    try {
      const result = await getGeminiModelSuggestion(selectedCompetition.description, userPrompt);
      if (result) {
        setSuggestion({ ...result, promptUsed: userPrompt }); // Store the prompt that led to this suggestion
      }
    } catch (err) {
      setError("Failed to get model suggestion. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
      isOraclePromptActive.current = false; // Reset after generation
    }
  }, [selectedCompetition, userPrompt]);

  const handleUseSuggestion = useCallback(() => {
    if (suggestion) {
      onUseSuggestionForTraining(suggestion);
    }
  }, [suggestion, onUseSuggestionForTraining]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">AI-Powered Model Conceptualizer <span role="img" aria-label="Sparkles">✨</span></h2>
      <p className="text-gray-600 mb-4">
        Describe your approach or what kind of model you're thinking about, and Gemini will provide a conceptual suggestion.
      </p>

      <div className="mb-4">
        <label htmlFor="user-model-prompt" className="block text-sm font-medium text-gray-700 mb-2">
          Your Model Idea / Focus:
        </label>
        <textarea
          id="user-model-prompt"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-24"
          placeholder="e.g., 'a simple ensemble model for classification', 'a regression model considering feature interaction'"
          value={userPrompt}
          onChange={(e) => {
            setUserPrompt(e.target.value);
            isOraclePromptActive.current = false; // User is typing, it's not an Oracle prompt anymore
          }}
          disabled={!selectedCompetition || isLoading}
        ></textarea>
      </div>

      <button
        onClick={handleGenerateSuggestion}
        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={!selectedCompetition || isLoading || !userPrompt.trim()}
      >
        {isLoading ? (
          <>
            <Spinner />
            <span className="ml-2">Generating...</span>
          </>
        ) : (
          'Get Model Suggestion'
        )}
      </button>

      {error && (
        <p className="mt-4 text-red-600 text-sm">{error}</p>
      )}

      {suggestion && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-bold text-gray-700 mb-3">Suggested Model: <span className="text-indigo-600">{suggestion.modelName}</span></h3>
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="font-semibold text-gray-800 mb-2">Description:</h4>
            <MarkdownRenderer content={suggestion.description} className="text-gray-700 text-sm mb-4" />

            {suggestion.codeSnippet && (
              <>
                <h4 className="font-semibold text-gray-800 mb-2">High-level Code Snippet:</h4>
                <MarkdownRenderer content={suggestion.codeSnippet} className="text-gray-700 text-sm mb-4" />
              </>
            )}

            {suggestion.bestPractices && suggestion.bestPractices.length > 0 && (
              <>
                <h4 className="font-semibold text-gray-800 mb-2">Best Practices:</h4>
                <ul className="list-disc pl-5 text-gray-700 text-sm">
                  {suggestion.bestPractices.map((practice, index) => (
                    <li key={index}>{practice}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
          <button
            onClick={handleUseSuggestion}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-indigo-700 bg-indigo-100 hover:bg-indigo-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Use this suggestion for training
          </button>
        </div>
      )}
    </div>
  );
};

export default ModelConceptualizer;
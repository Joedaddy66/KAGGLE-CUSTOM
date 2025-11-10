// App.tsx
import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import CompetitionSelector from './components/CompetitionSelector';
import ModelConceptualizer from './components/ModelConceptualizer';
import SubmissionForm from './components/SubmissionForm';
import ModelTrainer from './components/ModelTrainer';
import SpartanOracleAgent from './components/SpartanOracleAgent';
import DataForge from './components/DataForge';
import KaggleAuthSection from './components/KaggleAuthSection'; // New import
import SubmissionHistory from './components/SubmissionHistory'; // New import
import { fetchKaggleCompetitions, hasKaggleCredentialsConfigured } from './services/kaggleService'; // New import
import { KaggleCompetition, TrainedModel, GeminiModelSuggestion, UserSubmission } from './types';

const LOCAL_STORAGE_MODELS_KEY = 'kaggleAssistantTrainedModels';
const LOCAL_STORAGE_SUBMISSIONS_KEY = 'kaggleAssistantSubmissionHistory';


const App: React.FC = () => {
  const [competitions, setCompetitions] = useState<KaggleCompetition[]>([]);
  const [selectedCompetitionId, setSelectedCompetitionId] = useState<string | null>(null);
  const [isLoadingCompetitions, setIsLoadingCompetitions] = useState<boolean>(true);
  const [errorCompetitions, setErrorCompetitions] = useState<string | null>(null);
  const [trainedModels, setTrainedModels] = useState<TrainedModel[]>([]);
  const [prefillTrainingSuggestion, setPrefillTrainingSuggestion] = useState<GeminiModelSuggestion | null>(null);
  const [oracleConceptualizerPrompt, setOracleConceptualizerPrompt] = useState<string | null>(null);
  const [isKaggleAccountLinked, setIsKaggleAccountLinked] = useState<boolean>(false); // New state for Kaggle linked status
  const [submissionHistory, setSubmissionHistory] = useState<UserSubmission[]>([]); // New state for submission history

  const selectedCompetition = competitions.find(comp => comp.id === selectedCompetitionId) || null;

  // Effect to load competitions on component mount
  useEffect(() => {
    const getCompetitions = async () => {
      setIsLoadingCompetitions(true);
      setErrorCompetitions(null);
      try {
        const fetchedCompetitions = await fetchKaggleCompetitions();
        setCompetitions(fetchedCompetitions);
        // Automatically select the first competition if available
        if (fetchedCompetitions.length > 0) {
          setSelectedCompetitionId(fetchedCompetitions[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch Kaggle competitions:", error);
        setErrorCompetitions("Failed to load competitions. Please try again later.");
      } finally {
        setIsLoadingCompetitions(false);
      }
    };

    getCompetitions();
    setIsKaggleAccountLinked(hasKaggleCredentialsConfigured()); // Initialize linked status
  }, []); // Empty dependency array means this runs once on mount

  // Effect to load trained models from localStorage on initial render
  useEffect(() => {
    try {
      const storedModels = localStorage.getItem(LOCAL_STORAGE_MODELS_KEY);
      if (storedModels) {
        setTrainedModels(JSON.parse(storedModels));
      }
    } catch (error) {
      console.error("Failed to load trained models from localStorage:", error);
    }
  }, []); // Run only once on mount

  // Effect to save trained models to localStorage whenever the trainedModels state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_MODELS_KEY, JSON.stringify(trainedModels));
    } catch (error) {
      console.error("Failed to save trained models to localStorage:", error);
    }
  }, [trainedModels]); // Run whenever trainedModels changes

  // Effect to load submission history from localStorage on initial render
  useEffect(() => {
    try {
      const storedSubmissions = localStorage.getItem(LOCAL_STORAGE_SUBMISSIONS_KEY);
      if (storedSubmissions) {
        setSubmissionHistory(JSON.parse(storedSubmissions));
      }
    } catch (error) {
      console.error("Failed to load submission history from localStorage:", error);
    }
  }, []); // Run only once on mount

  // Effect to save submission history to localStorage whenever the submissionHistory state changes
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_SUBMISSIONS_KEY, JSON.stringify(submissionHistory));
    } catch (error) {
      console.error("Failed to save submission history to localStorage:", error);
    }
  }, [submissionHistory]); // Run whenever submissionHistory changes


  const handleSelectCompetition = (id: string) => {
    setSelectedCompetitionId(id);
  };

  const handleNewTrainedModel = useCallback((model: TrainedModel) => {
    setTrainedModels(prevModels => [...prevModels, model]);
  }, []);

  const handleUseSuggestionForTraining = useCallback((suggestion: GeminiModelSuggestion) => {
    setPrefillTrainingSuggestion(suggestion);
  }, []);

  const clearPrefillSuggestion = useCallback(() => {
    setPrefillTrainingSuggestion(null);
  }, []);

  // Callback for SpartanOracleAgent to suggest a prompt for ModelConceptualizer
  const handleSuggestConceptualizerPrompt = useCallback((prompt: string) => {
    setOracleConceptualizerPrompt(prompt);
  }, []);

  // Callback for ModelConceptualizer to indicate it has handled the Oracle's prompt
  const handleOraclePromptHandled = useCallback(() => {
    setOracleConceptualizerPrompt(null);
  }, []);

  // Callback for KaggleAuthSection to update linked status
  const handleKaggleAuthStatusChange = useCallback((isLinked: boolean) => {
    setIsKaggleAccountLinked(isLinked);
  }, []);

  const handleNewSubmission = useCallback((submission: UserSubmission) => {
    setSubmissionHistory(prevHistory => [...prevHistory, submission]);
  }, []);


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 lg:p-8">
        {errorCompetitions && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Error:</strong>
            <span className="block sm:inline ml-2">{errorCompetitions}</span>
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <CompetitionSelector
              competitions={competitions}
              selectedCompetitionId={selectedCompetitionId}
              onSelectCompetition={handleSelectCompetition}
              isLoading={isLoadingCompetitions}
            />
            <ModelConceptualizer
              selectedCompetition={selectedCompetition}
              onUseSuggestionForTraining={handleUseSuggestionForTraining}
              oracleSuggestedPrompt={oracleConceptualizerPrompt}
              onOraclePromptHandled={handleOraclePromptHandled}
            />
          </div>
          <div>
            <ModelTrainer
              competitions={competitions}
              selectedCompetitionId={selectedCompetitionId}
              onNewTrainedModel={handleNewTrainedModel}
              isLoadingCompetitions={isLoadingCompetitions}
              prefillSuggestion={prefillTrainingSuggestion}
              clearPrefillSuggestion={clearPrefillSuggestion}
              trainedModels={trainedModels}
              selectedCompetition={selectedCompetition} // Pass full competition object
            />
            <KaggleAuthSection onAuthStatusChange={handleKaggleAuthStatusChange} />
            <SubmissionForm
              competitions={competitions}
              selectedCompetitionId={selectedCompetitionId}
              trainedModels={trainedModels}
              isKaggleAccountLinked={isKaggleAccountLinked}
              onNewSubmission={handleNewSubmission}
            />
            <SubmissionHistory
              competitions={competitions}
              submissionHistory={submissionHistory}
            />
          </div>
        </div>
        {/* New Data Forge Section */}
        <div className="mt-8">
          <DataForge />
        </div>
      </main>
      <footer className="bg-gray-800 text-white text-center p-4 mt-8">
        <p>&copy; {new Date().getFullYear()} Kaggle Submission Assistant. All rights reserved.</p>
        <p className="text-sm mt-1">Powered by Google Gemini API.</p>
      </footer>

      <SpartanOracleAgent
        competitions={competitions}
        selectedCompetition={selectedCompetition}
        trainedModels={trainedModels}
        onSuggestConceptualizerPrompt={handleSuggestConceptualizerPrompt}
        isKaggleAccountLinked={isKaggleAccountLinked}
        submissionHistory={submissionHistory}
      />
    </div>
  );
};

export default App;
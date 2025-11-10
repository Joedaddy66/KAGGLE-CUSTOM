// components/ModelTrainer.tsx
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { KaggleCompetition, TrainedModel, GeminiModelSuggestion, ModelTemplate, ForgeInputFile, TrainingReport } from '../types';
import { MOCK_MODEL_TEMPLATES, BACKEND_API_BASE_URL } from '../constants'; // Import BACKEND_API_BASE_URL
import Spinner from './Spinner';
import MarkdownRenderer from './MarkdownRenderer';
// getGeminiTrainingEvaluation is now orchestrated by the backend, so we don't call it directly here.

interface ModelTrainerProps {
  competitions: KaggleCompetition[];
  selectedCompetitionId: string | null;
  onNewTrainedModel: (model: TrainedModel) => void;
  isLoadingCompetitions: boolean;
  prefillSuggestion: GeminiModelSuggestion | null;
  clearPrefillSuggestion: () => void;
  trainedModels: TrainedModel[];
  selectedCompetition: KaggleCompetition | null;
}

const ModelTrainer: React.FC<ModelTrainerProps> = ({
  competitions,
  selectedCompetitionId,
  onNewTrainedModel,
  isLoadingCompetitions,
  prefillSuggestion,
  clearPrefillSuggestion,
  trainedModels,
  selectedCompetition,
}) => {
  const [modelName, setModelName] = useState<string>('');
  const [modelDescription, setModelDescription] = useState<string>('');
  const [modelCode, setModelCode] = useState<string>('');
  const [datasetFiles, setDatasetFiles] = useState<ForgeInputFile[]>([]); // For conceptual data files
  const [trainerCompetitionId, setTrainerCompetitionId] = useState<string>(selectedCompetitionId || '');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [isTraining, setIsTraining] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false); // New state for saving without training
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [trainingSuccess, setTrainingSuccess] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null); // New state for save success
  const [saveError, setSaveError] = useState<string | null>(null); // New state for save error
  const [showCodeModal, setShowCodeModal] = useState<TrainedModel | null>(null);

  const datasetFileInputRef = useRef<HTMLInputElement>(null);

  const availableCompetitions = useMemo(() => competitions.filter(comp => comp.status === 'active'), [competitions]);

  // Effect to apply prefill suggestion from Gemini or initial selected competition
  React.useEffect(() => {
    if (prefillSuggestion) {
      setModelName(prefillSuggestion.modelName || '');
      setModelDescription(prefillSuggestion.description || '');
      setModelCode(prefillSuggestion.codeSnippet || '');
      // If a specific competition was implied by the suggestion (not currently in suggestion, but could be added),
      // or if there's no competition selected in trainer yet, use the overall selectedCompetitionId
      if (selectedCompetitionId && !trainerCompetitionId) {
        setTrainerCompetitionId(selectedCompetitionId);
      }
      setTrainingSuccess(null); // Clear previous success message
      setSaveSuccess(null); // Clear previous save success
      setTrainingError(null); // Clear previous error
      setSaveError(null); // Clear previous save error
      clearPrefillSuggestion(); // Clear the suggestion after use
    }
  }, [prefillSuggestion, clearPrefillSuggestion, selectedCompetitionId, trainerCompetitionId]);

  // Update trainerCompetitionId when overall selectedCompetitionId changes, if not already set by user
  React.useEffect(() => {
    if (selectedCompetitionId && trainerCompetitionId !== selectedCompetitionId) {
      setTrainerCompetitionId(selectedCompetitionId);
    }
  }, [selectedCompetitionId, trainerCompetitionId]);

  const handleTemplateSelect = useCallback((templateId: string) => {
    const template = MOCK_MODEL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setModelName(template.name);
      setModelCode(template.codeSnippet);
      setModelDescription(template.description);
      setTrainingError(null); // Clear any previous errors
      setTrainingSuccess(null); // Clear previous success message
      setSaveError(null); // Clear any previous errors
      setSaveSuccess(null); // Clear previous save success
    }
  }, []);

  const handleDatasetFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: ForgeInputFile[] = Array.from(event.target.files).map((file: File) => ({
        id: `${file.name}_${Date.now()}`,
        file,
      }));
      setDatasetFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleRemoveDatasetFile = useCallback((fileId: string) => {
    setDatasetFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const validateInputs = useCallback(() => {
    if (!trainerCompetitionId) {
      return "Please select a competition.";
    }
    if (!modelName.trim()) {
      return "Please enter a name for your model.";
    }
    if (!modelCode.trim()) {
      return "Please provide Python training code for your model.";
    }
    return null; // No error
  }, [modelName, modelCode, trainerCompetitionId]);


  const handleTrainModel = useCallback(async () => {
    const validationError = validateInputs();
    if (validationError) {
      setTrainingError(validationError);
      setTrainingSuccess(null);
      setSaveSuccess(null);
      setSaveError(null);
      return;
    }
    if (!selectedCompetition) {
      setTrainingError("Competition details are not loaded. Cannot simulate training evaluation.");
      return;
    }

    setIsTraining(true);
    setTrainingError(null);
    setTrainingSuccess(null);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      // Call backend to simulate training and get Gemini evaluation
      const response = await fetch(`${BACKEND_API_BASE_URL}/api/train-model`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelCode: modelCode,
          competitionId: trainerCompetitionId,
          competitionTitle: selectedCompetition.title,
          competitionDescription: selectedCompetition.description,
          datasetFileNames: datasetFiles.map(f => f.file.name), // Send only file names conceptually
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Backend failed to simulate training or evaluation.");
      }

      const trainingReport: TrainingReport = {
        mockTrainingLog: data.mockTrainingLog,
        mockEvaluationReasoning: data.mockEvaluationReasoning,
        recommendationToSubmit: data.recommendationToSubmit,
      };

      const newModel: TrainedModel = {
        id: `model_${Date.now()}`,
        name: modelName.trim(),
        competitionId: trainerCompetitionId,
        trainingDate: new Date().toISOString(),
        description: modelDescription,
        modelCode: modelCode.trim(),
        datasetFiles: datasetFiles.map(f => f.file.name),
        mockMetrics: data.mockMetrics, // Metrics now come from backend
        mockTrainingLog: trainingReport.mockTrainingLog,
        mockEvaluationReasoning: trainingReport.mockEvaluationReasoning,
        recommendationToSubmit: trainingReport.recommendationToSubmit,
      };
      onNewTrainedModel(newModel); // Add to parent state and localStorage

      setModelName(''); // Clear inputs
      setModelDescription('');
      setModelCode('');
      setDatasetFiles([]);
      setSelectedTemplateId(null);
      if (datasetFileInputRef.current) {
        datasetFileInputRef.current.value = '';
      }

      let successMsg = `Model "${newModel.name}" successfully "trained" (simulated by backend) for ${competitions.find(c => c.id === trainerCompetitionId)?.title || trainerCompetitionId}!`;
      successMsg += ` Its configuration has been saved to your local collection.`;
      if (newModel.recommendationToSubmit === true) {
        successMsg += ` The Oracle (via backend) recommends: **SUBMIT!** 🚀`;
      } else if (newModel.recommendationToSubmit === false) {
        successMsg += ` The Oracle (via backend) recommends: **HOLD.** 🛡️`;
      } else {
        successMsg += ` The Oracle (via backend) provides a nuanced recommendation. Check the 'Training Report' for details.`;
      }
      setTrainingSuccess(successMsg);

    } catch (err: any) {
      setTrainingError(`Failed to simulate model training or get Oracle evaluation from backend: ${err.message || String(err)}. Please ensure your backend is running.`);
      console.error(err);
    } finally {
      setIsTraining(false);
    }
  }, [validateInputs, modelName, modelDescription, modelCode, datasetFiles, trainerCompetitionId, onNewTrainedModel, competitions, selectedCompetition]);

  const handleSaveModel = useCallback(() => {
    const validationError = validateInputs();
    if (validationError) {
      setSaveError(validationError);
      setSaveSuccess(null);
      setTrainingSuccess(null);
      setTrainingError(null);
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(null);
    setTrainingSuccess(null);
    setTrainingError(null);

    try {
      const newModel: TrainedModel = {
        id: `model_${Date.now()}`,
        name: modelName.trim(),
        competitionId: trainerCompetitionId,
        trainingDate: new Date().toISOString(),
        description: modelDescription,
        modelCode: modelCode.trim(),
        datasetFiles: datasetFiles.map(f => f.file.name), // Save just the names
        // No mock metrics/logs/evaluation for 'save' action as training simulation was not performed
      };
      onNewTrainedModel(newModel); // Add to parent state and localStorage

      setModelName(''); // Clear inputs
      setModelDescription('');
      setModelCode('');
      setDatasetFiles([]);
      setSelectedTemplateId(null);
      if (datasetFileInputRef.current) {
        datasetFileInputRef.current.value = '';
      }

      setSaveSuccess(`Model "${newModel.name}" configuration saved successfully to your local collection! (Training simulation not performed.)`);
    } catch (err) {
      setSaveError("Failed to save model. Please try again.");
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  }, [validateInputs, modelName, modelDescription, modelCode, datasetFiles, trainerCompetitionId, onNewTrainedModel]);


  const isActionDisabled = isTraining || isSaving;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Simulated Model Training 📊</h2>
      <p className="text-gray-600 mb-4">
        This is where you "train" a new model for a selected competition. Think of it as preparing your code for a Kaggle submission.
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4" role="alert">
        <p className="font-bold mb-2">How to "Train" Your Model (like teaching a 5-year-old!):</p>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li><strong>Step 1: Pick a Competition:</strong> Choose which Kaggle challenge your model will solve.</li>
          <li><strong>Step 2: Provide Data (Conceptual):</strong> Select the local data files your model would train on.</li>
          <li><strong>Step 3: Choose a Model Helper:</strong> Pick a template or paste your Python code. This is like telling your model what kind of smart helper it should be!</li>
          <li><strong>Step 4: Name Your Model:</strong> Give your model a cool name so you remember it!</li>
          <li><strong>Step 5: Press "Train Model":</strong> Watch the spinner go! This is your computer thinking really hard. This process involves your backend, which simulates the training and provides an Oracle evaluation.</li>
          <li><strong>(Optional) Save Model:</strong> If you just want to save your model's code without "training," use the 'Save Model' button.</li>
        </ol>
      </div>

      <div className="mb-4">
        <label htmlFor="trainer-competition-select" className="block text-sm font-medium text-gray-700 mb-2">
          1. Train for Competition:
        </label>
        <select
          id="trainer-competition-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          value={trainerCompetitionId}
          onChange={(e) => setTrainerCompetitionId(e.target.value)}
          disabled={isActionDisabled || isLoadingCompetitions}
        >
          <option value="" disabled>-- Select Competition --</option>
          {availableCompetitions.map((comp) => (
            <option key={comp.id} value={comp.id}>
              {comp.title}
            </option>
          ))}
        </select>
      </div>

      {/* Dataset File Input Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          2. Provide Your Training Data (Conceptual Upload):
        </label>
        <div
          className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
          onClick={() => datasetFileInputRef.current?.click()}
        >
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-4V20m0 0z"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-gray-600">
              <p className="pl-1">Click to select training data files</p>
            </div>
            <p className="text-xs text-gray-500">Any file type (conceptually handled for training simulation)</p>
          </div>
          <input
            id="dataset-file-upload"
            name="dataset-file-upload"
            type="file"
            multiple
            className="sr-only"
            ref={datasetFileInputRef}
            onChange={handleDatasetFileChange}
            disabled={isActionDisabled}
          />
        </div>
        {datasetFiles.length > 0 && (
          <ul className="mt-4 space-y-2">
            {datasetFiles.map((fileItem) => (
              <li key={fileItem.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <span className="text-sm text-gray-800 truncate">{fileItem.file.name} ({Math.round(fileItem.file.size / 1024)} KB)</span>
                <button
                  onClick={() => handleRemoveDatasetFile(fileItem.id)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  disabled={isActionDisabled}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mb-4">
        <label htmlFor="model-template-select" className="block text-sm font-medium text-gray-700 mb-2">
          3. Choose a Model Template (or paste your own code below):
        </label>
        <select
          id="model-template-select"
          className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
          value={selectedTemplateId || ''}
          onChange={(e) => handleTemplateSelect(e.target.value)}
          disabled={isActionDisabled}
        >
          <option value="" disabled>-- Select Model Template --</option>
          {MOCK_MODEL_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-gray-500">Selecting a template will pre-fill the name and code!</p>
      </div>

      <div className="mb-4">
        <label htmlFor="model-name" className="block text-sm font-medium text-gray-700 mb-2">
          4. Give Your Model a Name:
        </label>
        <input
          type="text"
          id="model-name"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          placeholder="e.g., 'My Random Forest Classifier v1'"
          value={modelName}
          onChange={(e) => setModelName(e.target.value)}
          disabled={isActionDisabled}
        />
        <p className="mt-2 text-sm text-gray-500">Make it a fun name!</p>
      </div>

      <div className="mb-6">
        <label htmlFor="model-code" className="block text-sm font-medium text-gray-700 mb-2">
          5. Your Model's Python Training Code:
        </label>
        <textarea
          id="model-code"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 font-mono text-xs focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-48"
          placeholder="Paste your Python code here, or select a template above to see example code. This code will be stored with your model."
          value={modelCode}
          onChange={(e) => setModelCode(e.target.value)}
          disabled={isActionDisabled}
        ></textarea>
        <p className="mt-2 text-sm text-gray-500">
          This Python code is conceptually sent to your backend for simulated training and evaluation.
        </p>
      </div>

      <div className="flex space-x-4 mb-4">
        <button
          onClick={handleTrainModel}
          className="flex-1 inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isActionDisabled || !modelName.trim() || !trainerCompetitionId || !modelCode.trim() || datasetFiles.length === 0}
        >
          {isTraining ? (
            <>
              <Spinner />
              <span className="ml-2">Training Model...</span>
            </>
          ) : (
            '6. Train Model!'
          )}
        </button>
        <button
          onClick={handleSaveModel}
          className="flex-1 inline-flex justify-center py-3 px-4 border border-indigo-600 shadow-sm text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isActionDisabled || !modelName.trim() || !trainerCompetitionId || !modelCode.trim()}
        >
          {isSaving ? (
            <>
              <Spinner />
              <span className="ml-2">Saving Model...</span>
            </>
          ) : (
            'Save Model'
          )}
        </button>
      </div>

      {trainingError && (
        <p className="mt-4 text-red-600 text-sm">{trainingError}</p>
      )}
      {trainingSuccess && (
        <MarkdownRenderer className="mt-4 text-green-600 text-sm" content={trainingSuccess} />
      )}
      {saveError && (
        <p className="mt-4 text-red-600 text-sm">{saveError}</p>
      )}
      {saveSuccess && (
        <p className="mt-4 text-green-600 text-sm">{saveSuccess}</p>
      )}

      {/* Display of Trained Models */}
      <div className="mt-8 border-t pt-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-3">Your Trained Models 🤖</h3>
        {isLoadingCompetitions && trainedModels.length === 0 ? (
          <Spinner />
        ) : (
          <>
            {trainedModels.length === 0 ? (
              <p className="text-gray-500">You haven't trained or saved any models yet. Train or save one above!</p>
            ) : (
              <ul className="space-y-4">
                {trainedModels.map((model) => (
                  <li key={model.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <div className="flex justify-between items-center">
                      <p className="font-medium text-indigo-700">{model.name}</p>
                      <button
                        onClick={() => setShowCodeModal(model)}
                        className="text-sm text-indigo-600 hover:underline"
                      >
                        View Details & Report
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">For: {competitions.find(c => c.id === model.competitionId)?.title || model.competitionId}</p>
                    <p className="text-xs text-gray-500">Trained/Saved: {new Date(model.trainingDate).toLocaleString()}</p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      {/* Code & Report Viewer Modal */}
      {showCodeModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-900">Details for "{showCodeModal.name}"</h3>
              <button
                onClick={() => setShowCodeModal(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            <div className="p-4">
              <h4 className="text-md font-semibold text-gray-800 mb-2">Competition: <span className="font-normal">{competitions.find(c => c.id === showCodeModal.competitionId)?.title || showCodeModal.competitionId}</span></h4>
              <h4 className="text-md font-semibold text-gray-800 mb-2">Trained/Saved On: <span className="font-normal">{new Date(showCodeModal.trainingDate).toLocaleString()}</span></h4>
              {showCodeModal.datasetFiles && showCodeModal.datasetFiles.length > 0 && (
                <h4 className="text-md font-semibold text-gray-800 mb-2">Dataset Files (Conceptual): <span className="font-normal">{showCodeModal.datasetFiles.join(', ')}</span></h4>
              )}
              <h4 className="text-md font-semibold text-gray-800 mt-4 mb-2">Python Code:</h4>
              <MarkdownRenderer content={`\`\`\`python\n${showCodeModal.modelCode}\n\`\``} />

              {showCodeModal.mockTrainingLog && showCodeModal.mockMetrics && showCodeModal.mockEvaluationReasoning && (
                <div className="mt-6 border-t pt-4">
                  <h4 className="text-xl font-bold text-indigo-700 mb-3 flex items-center">
                    Spartan Oracle's Training Report
                    {showCodeModal.recommendationToSubmit === true && <span className="ml-2 text-green-600 text-2xl">🚀</span>}
                    {showCodeModal.recommendationToSubmit === false && <span className="ml-2 text-red-600 text-2xl">🛡️</span>}
                    {showCodeModal.recommendationToSubmit === null && <span className="ml-2 text-yellow-600 text-2xl">🤔</span>}
                  </h4>

                  <div className="bg-indigo-50 p-4 rounded-md mb-4">
                    <h5 className="font-semibold text-indigo-800 mb-2">Simulated Training Log:</h5>
                    <MarkdownRenderer content={`\`\`\`text\n${showCodeModal.mockTrainingLog}\n\`\``} className="text-sm" />
                  </div>

                  <div className="bg-gray-100 p-4 rounded-md mb-4">
                    <h5 className="font-semibold text-gray-800 mb-2">Simulated Key Metrics:</h5>
                    <ul className="list-disc pl-5 text-sm text-gray-700">
                      {Object.entries(showCodeModal.mockMetrics).map(([key, value]) => (
                        <li key={key}><strong>{key}:</strong> {value}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-orange-50 p-4 rounded-md mb-4">
                    <h5 className="font-semibold text-orange-800 mb-2">Oracle's Evaluation & Reasoning:</h5>
                    <MarkdownRenderer content={showCodeModal.mockEvaluationReasoning} className="text-sm text-orange-700" />
                  </div>

                  <div className={`p-4 rounded-md text-white font-bold text-center text-lg ${
                    showCodeModal.recommendationToSubmit === true ? 'bg-green-600' :
                    showCodeModal.recommendationToSubmit === false ? 'bg-red-600' :
                    'bg-yellow-600'
                  }`}>
                    {showCodeModal.recommendationToSubmit === true && 'Oracle Says: SUBMIT! This model holds great promise for the competition. 🚀'}
                    {showCodeModal.recommendationToSubmit === false && 'Oracle Says: HOLD. This model requires further refinement or is for analytical purposes. 🛡️'}
                    {showCodeModal.recommendationToSubmit === null && 'Oracle Says: FURTHER WISDOM REQUIRED. The path is unclear, more data or insight is needed. 🤔'}
                  </div>
                </div>
              )}
            </div>
            <div className="border-t p-4 flex justify-end">
              <button
                onClick={() => setShowCodeModal(null)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelTrainer;
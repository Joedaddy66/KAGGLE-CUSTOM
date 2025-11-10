// components/SubmissionForm.tsx
import React, { useState, useRef, useMemo } from 'react';
import { KaggleCompetition, SubmissionResponse, TrainedModel, UserSubmission } from '../types';
import { submitKagglePrediction, generateAndSubmitPredictionWithModel } from '../services/kaggleService';
import Spinner from './Spinner';

type SubmissionMethod = 'file' | 'trainedModel';

interface SubmissionFormProps {
  competitions: KaggleCompetition[];
  selectedCompetitionId: string | null;
  trainedModels: TrainedModel[];
  isKaggleAccountLinked: boolean; // New prop
  onNewSubmission: (submission: UserSubmission) => void; // New prop
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({
  competitions,
  selectedCompetitionId,
  trainedModels,
  isKaggleAccountLinked, // Use the new prop
  onNewSubmission,
}) => {
  const [submissionMethod, setSubmissionMethod] = useState<SubmissionMethod>('file');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submissionMessage, setSubmissionMessage] = useState<string>('');
  const [selectedTrainedModelId, setSelectedTrainedModelId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] = useState<SubmissionResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedCompetition = useMemo(
    () => competitions.find(comp => comp.id === selectedCompetitionId),
    [competitions, selectedCompetitionId]
  );

  const selectedTrainedModel = useMemo(
    () => trainedModels.find(model => model.id === selectedTrainedModelId),
    [trainedModels, selectedTrainedModelId]
  );

  // Determine the target competition ID based on submission method
  const targetCompetitionId = submissionMethod === 'trainedModel' && selectedTrainedModel
    ? selectedTrainedModel.competitionId
    : selectedCompetitionId;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSubmissionFile(event.target.files[0]);
    } else {
      setSubmissionFile(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isKaggleAccountLinked) {
      setSubmissionResult({ success: false, message: 'Kaggle account not linked. Please link your account in the "Kaggle Account Status" section before submitting.' });
      return;
    }

    if (!targetCompetitionId) {
      setSubmissionResult({ success: false, message: 'Please select a competition first.' });
      return;
    }
    if (!submissionMessage.trim()) {
      setSubmissionResult({ success: false, message: 'Please enter a submission message.' });
      return;
    }

    setIsLoading(true);
    setSubmissionResult(null);

    let submissionSource = '';
    if (submissionMethod === 'file' && submissionFile) {
      submissionSource = submissionFile.name;
    } else if (submissionMethod === 'trainedModel' && selectedTrainedModel) {
      submissionSource = selectedTrainedModel.name;
    } else {
      // Should not happen due to disabled button/validation, but for safety
      setSubmissionResult({ success: false, message: 'Invalid submission source.' });
      setIsLoading(false);
      return;
    }

    try {
      let response: SubmissionResponse;

      if (submissionMethod === 'file') {
        if (!submissionFile) {
          setSubmissionResult({ success: false, message: 'Please select a submission file.' });
          return;
        }
        response = await submitKagglePrediction(
          targetCompetitionId,
          submissionFile,
          submissionMessage,
        );
      } else { // submissionMethod === 'trainedModel'
        if (!selectedTrainedModel) {
          setSubmissionResult({ success: false, message: 'Please select a trained model.' });
          return;
        }
        response = await generateAndSubmitPredictionWithModel(
          selectedTrainedModel,
          targetCompetitionId,
          submissionMessage,
        );
      }

      setSubmissionResult(response);

      // Record the submission in history
      const competitionTitle = competitions.find(c => c.id === targetCompetitionId)?.title || targetCompetitionId;
      onNewSubmission({
        id: `sub_${Date.now()}`,
        competitionId: targetCompetitionId,
        competitionTitle: competitionTitle,
        sourceName: submissionSource,
        message: submissionMessage,
        date: new Date().toISOString(),
        status: response.success ? 'success' : 'failed',
        kaggleLink: response.kaggleLink,
      });

      // Reset form on successful submission
      if (response.success) {
        setSubmissionFile(null);
        setSubmissionMessage('');
        setSelectedTrainedModelId(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Clear file input
        }
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmissionResult({ success: false, message: 'An unexpected error occurred during submission.' });
      // Still record as failed in history if it was an API error
      const competitionTitle = competitions.find(c => c.id === targetCompetitionId)?.title || targetCompetitionId;
      onNewSubmission({
        id: `sub_${Date.now()}`,
        competitionId: targetCompetitionId,
        competitionTitle: competitionTitle,
        sourceName: submissionSource,
        message: submissionMessage,
        date: new Date().toISOString(),
        status: 'failed',
        kaggleLink: undefined, // No link for failed API call
      });
    } finally {
      setIsLoading(false);
    }
  };

  const isFormDisabled = isLoading || !targetCompetitionId || !isKaggleAccountLinked;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Submit to Kaggle Competition</h2>

      {!isKaggleAccountLinked && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4" role="alert">
          <p className="font-bold">Kaggle Account Not Linked</p>
          <p className="text-sm">Please link your Kaggle account in the "Kaggle Account Status" section above to enable submissions.</p>
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Submission Method:</label>
        <div className="flex space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="submissionMethod"
              value="file"
              checked={submissionMethod === 'file'}
              onChange={() => setSubmissionMethod('file')}
              disabled={isFormDisabled}
            />
            <span className="ml-2">Upload a CSV File</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              className="form-radio text-indigo-600"
              name="submissionMethod"
              value="trainedModel"
              checked={submissionMethod === 'trainedModel'}
              onChange={() => setSubmissionMethod('trainedModel')}
              disabled={isFormDisabled || trainedModels.length === 0}
            />
            <span className="ml-2">Submit with a Trained Model</span>
          </label>
        </div>
        {trainedModels.length === 0 && submissionMethod === 'trainedModel' && (
          <p className="text-red-500 text-xs mt-1">No trained models available. Please train a model first.</p>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {submissionMethod === 'file' ? (
          <div className="mb-4">
            <label htmlFor="submission-file" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Submission File (.csv):
            </label>
            <input
              type="file"
              id="submission-file"
              ref={fileInputRef}
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-md file:border-0
                         file:text-sm file:font-semibold
                         file:bg-indigo-50 file:text-indigo-700
                         hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isFormDisabled}
            />
            {submissionFile && (
              <p className="mt-2 text-sm text-gray-600">Selected file: {submissionFile.name} ({Math.round(submissionFile.size / 1024)} KB)</p>
            )}
            {!submissionFile && <p className="mt-2 text-red-500 text-xs">A submission file is required.</p>}
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="trained-model-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Trained Model:
            </label>
            <select
              id="trained-model-select"
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
              value={selectedTrainedModelId || ''}
              onChange={(e) => setSelectedTrainedModelId(e.target.value)}
              disabled={isFormDisabled || trainedModels.length === 0}
            >
              <option value="" disabled>-- Select a Trained Model --</option>
              {trainedModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} (for {competitions.find(c => c.id === model.competitionId)?.title || model.competitionId})
                </option>
              ))}
            </select>
            {selectedTrainedModel && (
              <p className="mt-2 text-sm text-gray-600">
                Submitting for: <strong>{competitions.find(c => c.id === selectedTrainedModel.competitionId)?.title || selectedTrainedModel.competitionId}</strong>
                <span className="ml-4 text-gray-500 text-xs">Trained: {new Date(selectedTrainedModel.trainingDate).toLocaleDateString()}</span>
              </p>
            )}
            {!selectedTrainedModel && trainedModels.length > 0 && <p className="mt-2 text-red-500 text-xs">Please select a trained model.</p>}
          </div>
        )}

        <div className="mb-6">
          <label htmlFor="submission-message" className="block text-sm font-medium text-gray-700 mb-2">
            Submission Message:
          </label>
          <input
            type="text"
            id="submission-message"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 'My first submission with Logistic Regression'"
            value={submissionMessage}
            onChange={(e) => setSubmissionMessage(e.target.value)}
            disabled={isFormDisabled}
          />
          {!submissionMessage.trim() && <p className="mt-2 text-red-500 text-xs">A submission message is required.</p>}
        </div>

        <button
          type="submit"
          className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={
            isFormDisabled ||
            !submissionMessage.trim() ||
            (submissionMethod === 'file' && !submissionFile) ||
            (submissionMethod === 'trainedModel' && !selectedTrainedModel)
          }
        >
          {isLoading ? (
            <>
              <Spinner />
              <span className="ml-2">Submitting...</span>
            </>
          ) : (
            submissionMethod === 'file' ? 'Upload & Submit to Kaggle' : 'Generate & Submit with Model'
          )}
        </button>
      </form>

      {submissionResult && (
        <div className={`mt-6 p-4 rounded-md ${submissionResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
          <p className="font-semibold">{submissionResult.message}</p>
          {submissionResult.kaggleLink && (
            <p className="mt-2 text-sm">
              View your submission on Kaggle: <a href={submissionResult.kaggleLink} target="_blank" rel="noopener noreferrer" className="text-green-700 hover:underline">{submissionResult.kaggleLink}</a>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default SubmissionForm;
// services/kaggleService.ts
import { MOCK_KAGGLE_COMPETITIONS, BACKEND_API_BASE_URL } from '../constants';
import { KaggleCompetition, SubmissionResponse, TrainedModel } from '../types';

/**
 * Checks if backend Kaggle credentials are "configured".
 * This now makes a real call to the backend's health endpoint.
 * @returns A promise resolving to a boolean.
 */
export const checkBackendKaggleConfigured = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/health`);
    if (!response.ok) {
      console.error("Backend /health endpoint failed:", response.statusText);
      return false;
    }
    const data = await response.json();
    return data.kaggleConfigured === true;
  } catch (error) {
    console.error("Failed to connect to backend health check:", error);
    return false;
  }
};

/**
 * Mocks fetching a list of Kaggle competitions.
 * In a real application, this would fetch from a backend API that wraps the Kaggle API.
 * @returns A promise resolving to an array of KaggleCompetition.
 */
export const fetchKaggleCompetitions = async (): Promise<KaggleCompetition[]> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_KAGGLE_COMPETITIONS;
};

/**
 * Mocks submitting a file to a Kaggle competition, now via backend.
 * This sends the file and metadata to the backend API which then interacts with Kaggle.
 * @param competitionId The ID of the competition.
 * @param file The submission file (e.g., CSV).
 * @param message The submission message.
 * @returns A promise resolving to a SubmissionResponse.
 */
export const submitKagglePrediction = async (
  competitionId: string,
  file: File,
  message: string,
): Promise<SubmissionResponse> => {
  const formData = new FormData();
  formData.append('competitionId', competitionId);
  formData.append('message', message);
  formData.append('submissionFile', file);

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/kaggle/submit`, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    return data as SubmissionResponse;
  } catch (error) {
    console.error('Error calling backend for Kaggle submission:', error);
    return { success: false, message: 'Failed to connect to backend for submission.' };
  }
};

/**
 * Mocks generating a submission from a trained model and submitting it to a Kaggle competition, now via backend.
 * @param trainedModel The simulated trained model to use.
 * @param competitionId The ID of the competition.
 * @param message The submission message.
 * @returns A promise resolving to a SubmissionResponse.
 */
export const generateAndSubmitPredictionWithModel = async (
  trainedModel: TrainedModel,
  competitionId: string,
  message: string,
): Promise<SubmissionResponse> => {
  // For model-based submission, we can send the model ID and backend generates the submission.
  // Or, if the trained model logic implies a file, it would be generated on backend.
  // For simplicity, we'll use the same backend /api/kaggle/submit endpoint for now,
  // conceptually telling it to use the stored model data.
  // In a real app, you might have a dedicated endpoint like `/api/kaggle/submit-from-model`.

  const payload = {
    competitionId: competitionId,
    message: message,
    trainedModelId: trainedModel.id, // Pass trained model ID to backend
  };

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/kaggle/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }, // Sending JSON, not FormData
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data as SubmissionResponse;
  } catch (error) {
    console.error('Error calling backend for model-based Kaggle submission:', error);
    return { success: false, message: 'Failed to connect to backend for model submission.' };
  }
};
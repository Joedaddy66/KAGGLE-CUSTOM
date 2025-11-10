// services/kaggleService.ts
import { MOCK_KAGGLE_COMPETITIONS } from '../constants';
import { KaggleCompetition, SubmissionResponse, TrainedModel } from '../types';

const KAGGLE_CREDENTIALS_LINKED_KEY = 'KaggleCredentialsLinked';

/**
 * Checks if Kaggle credentials are "configured" in this simulation.
 * @returns boolean
 */
export const hasKaggleCredentialsConfigured = (): boolean => {
  return localStorage.getItem(KAGGLE_CREDENTIALS_LINKED_KEY) === 'true';
};

/**
 * Simulates setting Kaggle credentials.
 */
export const simulateSetKaggleCredentials = (): void => {
  localStorage.setItem(KAGGLE_CREDENTIALS_LINKED_KEY, 'true');
  console.log('Kaggle credentials simulated as set.');
};

/**
 * Simulates clearing Kaggle credentials.
 */
export const simulateClearKaggleCredentials = (): void => {
  localStorage.removeItem(KAGGLE_CREDENTIALS_LINKED_KEY);
  console.log('Kaggle credentials simulated as cleared.');
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
 * Performs basic simulated validation for a submission file.
 * This is NOT competition-specific, but a generic client-side check.
 * @param file The submission file.
 * @returns A string error message if validation fails, null otherwise.
 */
const validateSubmissionFile = (file: File | null): string | null => {
  if (!file) {
    return 'No submission file selected.';
  }
  if (!file.name.toLowerCase().endsWith('.csv')) {
    return 'Submission file must be a .csv file.';
  }
  if (file.size === 0) {
    return 'Submission file cannot be empty.';
  }
  // In a real scenario, more advanced (server-side) validation would occur here,
  // potentially checking CSV headers, number of columns, data types, etc.
  return null;
};

/**
 * Mocks submitting a file to a Kaggle competition.
 * In a real application, this would send the file and metadata to a backend API.
 * The backend would then use the `kaggle` CLI or Python API to make the submission.
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
  if (!hasKaggleCredentialsConfigured()) {
    return {
      success: false,
      message: 'Kaggle account not linked. Please link your account before submitting.',
    };
  }

  const fileValidationMessage = validateSubmissionFile(file);
  if (fileValidationMessage) {
    return {
      success: false,
      message: `Submission file validation failed: ${fileValidationMessage}`,
    };
  }

  console.log(`Submitting to Kaggle Competition: ${competitionId}`);
  console.log(`File Name: ${file.name}, File Size: ${file.size} bytes`);
  console.log(`Submission Message: "${message}"`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate success or failure
  const isSuccess = Math.random() > 0.1; // 90% chance of success

  if (isSuccess) {
    const submissionId = `sub_${Date.now()}`;
    const kaggleLink = `https://www.kaggle.com/competitions/${competitionId}/submissions/${submissionId}`;
    return {
      success: true,
      message: `Submission "${file.name}" successful! Submission ID: ${submissionId}.`,
      submissionId,
      kaggleLink,
    };
  } else {
    return {
      success: false,
      message: 'Submission failed: An unexpected error occurred on the Kaggle API. Please check your file and try again.',
    };
  }
};

/**
 * Mocks generating a submission from a trained model and submitting it to a Kaggle competition.
 * In a real application, this would involve sending model details to a backend to
 * perform inference and then submit the generated file.
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
  if (!hasKaggleCredentialsConfigured()) {
    return {
      success: false,
      message: 'Kaggle account not linked. Please link your account before submitting.',
    };
  }

  console.log(`Generating and submitting for competition: ${competitionId}`);
  console.log(`Using Trained Model: ${trainedModel.name} (ID: ${trainedModel.id})`);
  console.log(`Submission Message: "${message}"`);

  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 3000)); // Longer delay for generation + submission

  const isSuccess = Math.random() > 0.15; // Slightly higher chance of failure for model-based submission

  if (isSuccess) {
    const submissionId = `sub_model_${Date.now()}`;
    const kaggleLink = `https://www.kaggle.com/competitions/${competitionId}/submissions/${submissionId}`;
    return {
      success: true,
      message: `Model "${trainedModel.name}" generated predictions and submitted successfully! Submission ID: ${submissionId}.`,
      submissionId,
      kaggleLink,
    };
  } else {
    return {
      success: false,
      message: `Submission with model "${trainedModel.name}" failed: Error during prediction generation or Kaggle API call.`,
    };
  }
};
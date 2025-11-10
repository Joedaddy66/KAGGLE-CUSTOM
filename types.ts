// types.ts

export interface KaggleCompetition {
  id: string;
  title: string;
  description: string;
  deadline: string; // ISO 8601 string
  prize: string;
  status: 'active' | 'ended' | 'upcoming';
  bannerImage: string; // URL for a banner image
}

export interface SubmissionResponse {
  success: boolean;
  message: string;
  submissionId?: string;
  kaggleLink?: string;
}

export interface GeminiModelSuggestion {
  modelName: string;
  description: string;
  codeSnippet?: string;
  bestPractices?: string[];
  promptUsed?: string; // New: stores the prompt used to generate this suggestion
}

export interface TrainingReport {
  mockTrainingLog: string;
  mockEvaluationReasoning: string;
  recommendationToSubmit: boolean | null; // True, False, or null if not applicable/needs more data
}

export interface TrainedModel {
  id: string; // Unique ID for the trained model
  name: string;
  competitionId: string;
  trainingDate: string; // ISO 8601 string
  description?: string; // Optional description, possibly from Gemini suggestion
  modelCode?: string; // New: Stores the Python code used for this model
  datasetFiles?: string[]; // New: Names of files conceptually uploaded for training
  mockMetrics?: Record<string, number>; // New: Simulated metrics
  mockTrainingLog?: string; // New: Simulated training log from Gemini evaluation
  mockEvaluationReasoning?: string; // New: Gemini's detailed reasoning
  recommendationToSubmit?: boolean | null; // New: Gemini's submission recommendation
}

export interface ModelTemplate {
  id: string;
  name: string;
  description: string;
  codeSnippet: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface UserSubmission {
  id: string;
  competitionId: string;
  competitionTitle: string; // For display
  sourceName: string; // Model name or file name
  message: string;
  date: string; // ISO 8601 string
  status: 'success' | 'failed';
  kaggleLink?: string; // Mock link
}

// New interfaces for Data Forge
export interface ForgeInputFile {
  id: string;
  file: File;
}

export type ForgeOutputFormat = 'CSV' | 'Parquet' | 'JSON';

export interface ForgeConfiguration {
  processingRules: string; // User-defined text describing processing logic
  outputFormat: ForgeOutputFormat;
  outputDatasetName: string;
}

export type ForgeJobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ForgeJob {
  id: string;
  inputFiles: ForgeInputFile[];
  config: ForgeConfiguration;
  status: ForgeJobStatus;
  startTime: string; // ISO 8601 string
  endTime?: string; // ISO 8601 string
  outputUrl?: string; // Conceptual URL for downloading the structured data
  errorMessage?: string;
}
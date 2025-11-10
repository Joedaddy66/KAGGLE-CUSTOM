// services/dataForgeService.ts
import { ForgeInputFile, ForgeConfiguration, ForgeJob, ForgeJobStatus, ForgeOutputFormat } from '../types';

/**
 * Mocks the initiation of a data forge job.
 * Simulates an asynchronous backend process that takes raw input files
 * and a configuration to produce a structured dataset.
 * @param inputFiles The files to be processed by the forge.
 * @param config The configuration for the data structuring process.
 * @returns A promise resolving to the initial ForgeJob state.
 */
export const initiateDataForge = async (
  inputFiles: ForgeInputFile[],
  config: ForgeConfiguration,
): Promise<ForgeJob> => {
  console.log('Initiating Data Forge with:', { inputFiles, config });

  // Simulate API call delay for initiating
  await new Promise(resolve => setTimeout(resolve, 1000));

  const jobId = `forge_${Date.now()}`;
  const newJob: ForgeJob = {
    id: jobId,
    inputFiles: inputFiles,
    config: config,
    status: 'processing', // Initially processing
    startTime: new Date().toISOString(),
  };

  // In a real system, this would trigger a backend process.
  // We'll simulate its completion/failure with a subsequent call or internal timer.
  return newJob;
};

/**
 * Mocks monitoring the status of a data forge job.
 * In a real application, this would poll a backend endpoint.
 * @param job The current ForgeJob object to update.
 * @returns A promise resolving to the updated ForgeJob state.
 */
export const monitorForgeJob = async (currentJob: ForgeJob): Promise<ForgeJob> => {
  // Simulate polling delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Simulate job completion or failure
  const isSuccess = Math.random() > 0.2; // 80% chance of success
  const endTime = new Date().toISOString();

  let updatedJob: ForgeJob;

  if (isSuccess) {
    updatedJob = {
      ...currentJob,
      status: 'completed',
      endTime: endTime,
      outputUrl: `/mock-data-forge-output-${currentJob.id}.${currentJob.config.outputFormat.toLowerCase()}`,
    };
  } else {
    updatedJob = {
      ...currentJob,
      status: 'failed',
      endTime: endTime,
      errorMessage: 'Simulated processing error: Could not structure data as configured.',
    };
  }
  console.log('Forge job updated:', updatedJob);
  return updatedJob;
};

/**
 * Mocks downloading the structured data output from a completed forge job.
 * @param jobId The ID of the completed forge job.
 * @returns A promise resolving to a Blob containing the mock structured data.
 */
export const downloadStructuredData = async (jobId: string, outputFormat: ForgeOutputFormat): Promise<Blob> => {
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate download delay

  const mockData = `id,feature1,feature2,target\n1,10.5,A,0\n2,20.1,B,1\n3,5.9,C,0`;
  const mimeType = {
    'CSV': 'text/csv',
    'Parquet': 'application/octet-stream', // Mock as binary
    'JSON': 'application/json',
  }[outputFormat];

  return new Blob([mockData], { type: mimeType });
};
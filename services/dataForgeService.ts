// services/dataForgeService.ts
import { ForgeInputFile, ForgeConfiguration, ForgeJob, ForgeJobStatus, ForgeOutputFormat } from '../types';
import { BACKEND_API_BASE_URL } from '../constants'; // Import backend URL

/**
 * Mocks the initiation of a data forge job, now calling the backend.
 * @param inputFiles The files to be processed by the forge (only names/metadata sent for now).
 * @param config The configuration for the data structuring process.
 * @returns A promise resolving to the initial ForgeJob state from the backend.
 */
export const initiateDataForge = async (
  inputFiles: ForgeInputFile[],
  config: ForgeConfiguration,
): Promise<ForgeJob> => {
  console.log('Initiating Data Forge (via backend) with:', { inputFiles, config });

  // Send conceptual file names and config to backend
  const payload = {
    inputFileNames: inputFiles.map(f => f.file.name),
    config: config,
  };

  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/data-forge/initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend failed to initiate forge job.');
    }

    const data = await response.json();
    return data.job as ForgeJob;
  } catch (error) {
    console.error('Error calling backend for Data Forge initiation:', error);
    throw new Error('Failed to connect to backend for Data Forge initiation.');
  }
};

/**
 * Mocks monitoring the status of a data forge job, now polling the backend.
 * @param job The current ForgeJob object to update.
 * @returns A promise resolving to the updated ForgeJob state from the backend.
 */
export const monitorForgeJob = async (currentJob: ForgeJob): Promise<ForgeJob> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/data-forge/monitor/${currentJob.id}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend failed to monitor forge job.');
    }

    const data = await response.json();
    return data.job as ForgeJob;
  } catch (error) {
    console.error(`Error calling backend for Data Forge monitoring (job ${currentJob.id}):`, error);
    throw new Error('Failed to connect to backend for Data Forge monitoring.');
  }
};

/**
 * Mocks downloading the structured data output from a completed forge job, now from backend.
 * @param jobId The ID of the completed forge job.
 * @returns A promise resolving to a Blob containing the mock structured data from backend.
 */
export const downloadStructuredData = async (jobId: string, outputFormat: ForgeOutputFormat): Promise<Blob> => {
  try {
    const response = await fetch(`${BACKEND_API_BASE_URL}/api/data-forge/download/${jobId}`);

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Backend failed to download structured data.');
    }

    // Backend should return the file directly
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error(`Error calling backend for Data Forge download (job ${jobId}):`, error);
    throw new Error('Failed to connect to backend for Data Forge download.');
  }
};
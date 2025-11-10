// components/DataForge.tsx
import React, { useState, useCallback, useRef } from 'react';
import { ForgeInputFile, ForgeConfiguration, ForgeJob, ForgeOutputFormat } from '../types';
import { initiateDataForge, monitorForgeJob, downloadStructuredData } from '../services/dataForgeService';
import Spinner from './Spinner';

interface DataForgeProps {}

const DataForge: React.FC<DataForgeProps> = () => {
  const [inputFiles, setInputFiles] = useState<ForgeInputFile[]>([]);
  const [processingRules, setProcessingRules] = useState<string>('');
  const [outputFormat, setOutputFormat] = useState<ForgeOutputFormat>('CSV');
  const [outputDatasetName, setOutputDatasetName] = useState<string>('');
  const [currentJob, setCurrentJob] = useState<ForgeJob | null>(null);
  const [forgeError, setForgeError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: ForgeInputFile[] = Array.from(event.target.files).map((file: File) => ({
        id: `${file.name}_${Date.now()}`,
        file,
      }));
      setInputFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.add('border-indigo-500', 'bg-indigo-50');
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.classList.remove('border-indigo-500', 'bg-indigo-50');

    if (event.dataTransfer.files) {
      const newFiles: ForgeInputFile[] = Array.from(event.dataTransfer.files).map((file: File) => ({
        id: `${file.name}_${Date.now()}`,
        file,
      }));
      setInputFiles((prev) => [...prev, ...newFiles]);
    }
  }, []);

  const handleRemoveFile = useCallback((fileId: string) => {
    setInputFiles((prev) => prev.filter((f) => f.id !== fileId));
  }, []);

  const handleStartForge = useCallback(async () => {
    if (inputFiles.length === 0) {
      setForgeError('Please upload some data files to start the forge!');
      return;
    }
    if (!processingRules.trim()) {
      setForgeError('Please describe your processing rules.');
      return;
    }
    if (!outputDatasetName.trim()) {
      setForgeError('Please give your output dataset a name.');
      return;
    }

    setForgeError(null);
    setCurrentJob(null); // Clear previous job status

    const config: ForgeConfiguration = {
      processingRules: processingRules.trim(),
      outputFormat: outputFormat,
      outputDatasetName: outputDatasetName.trim(),
    };

    try {
      const newJob = await initiateDataForge(inputFiles, config);
      setCurrentJob(newJob);

      // Simulate monitoring the job until completion/failure
      let jobStatus = newJob.status;
      let monitoredJob = newJob;
      while (jobStatus === 'processing') {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Add a small delay for UI updates
        monitoredJob = await monitorForgeJob(monitoredJob);
        jobStatus = monitoredJob.status;
        setCurrentJob(monitoredJob);
      }

      if (monitoredJob.status === 'completed') {
        // Optionally, reset inputs after successful completion
        setInputFiles([]);
        setProcessingRules('');
        setOutputDatasetName('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }

    } catch (err: any) { // Catch as 'any' to handle potential non-Error objects
      console.error('Data forge initiation error:', err);
      // Ensure currentJob is not null before attempting to spread it
      const baseJob = currentJob || { id: 'unknown', inputFiles: [], config: config, startTime: new Date().toISOString(), status: 'failed' };
      setCurrentJob({
        ...baseJob,
        status: 'failed',
        endTime: new Date().toISOString(),
        errorMessage: err.message || 'An unexpected error occurred in the forge backend.',
      });
      setForgeError(err.message || 'An unexpected error occurred in the forge backend.');
    }
  }, [inputFiles, processingRules, outputFormat, outputDatasetName, currentJob]);


  const handleDownloadOutput = useCallback(async () => {
    if (currentJob && currentJob.status === 'completed' && currentJob.config && currentJob.id) {
      try {
        const blob = await downloadStructuredData(currentJob.id, currentJob.config.outputFormat);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentJob.config.outputDatasetName}.${currentJob.config.outputFormat.toLowerCase()}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading output:', error);
        setForgeError('Failed to download the structured data.');
      }
    }
  }, [currentJob]);

  const isForgeRunning = currentJob?.status === 'processing';

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">The Spartan Data Forge ⚒️</h2>
      <p className="text-gray-600 mb-4">
        Bring your raw data here! The forge will conceptualize how to transform your text, zip, and other files into a structured dataset ready for model training. This process is handled by your **Python backend**.
      </p>

      <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-4" role="alert">
        <p className="font-bold mb-2">How the Data Forge Works (like building with LEGOs!):</p>
        <ol className="list-decimal list-inside text-sm space-y-1">
          <li><strong>Step 1: Feed the Forge:</strong> Drag-and-drop your data files or pick them from your computer.</li>
          <li><strong>Step 2: Tell the Forge What to Do:</strong> Describe how you want to clean, combine, or shape your data (e.g., "extract all text from zips," "merge CSVs").</li>
          <li><strong>Step 3: Name Your Creation:</strong> Give your new, structured dataset a cool name!</li>
          <li><strong>Step 4: Start the Forge!</strong> Watch it work its magic. This sends a request to your **Python backend** to conceptually process your data. Soon, your data will be ready for training!</li>
        </ol>
      </div>

      {/* File Upload Section */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          1. Feed the Forge: Upload Your Raw Data (Text, Zip, CSV, etc.)
        </label>
        <div
          className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 transition"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
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
              <p className="pl-1">Drag and drop files here or click to browse</p>
            </div>
            <p className="text-xs text-gray-500">Any file type supported conceptually (up to 10MB per file simulated)</p>
          </div>
          <input
            id="file-upload"
            name="file-upload"
            type="file"
            multiple
            className="sr-only"
            ref={fileInputRef}
            onChange={handleFileChange}
            disabled={isForgeRunning}
          />
        </div>
        {inputFiles.length > 0 && (
          <ul className="mt-4 space-y-2">
            {inputFiles.map((fileItem) => (
              <li key={fileItem.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-md border border-gray-200">
                <span className="text-sm text-gray-800 truncate">{fileItem.file.name} ({Math.round(fileItem.file.size / 1024)} KB)</span>
                <button
                  onClick={() => handleRemoveFile(fileItem.id)}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                  disabled={isForgeRunning}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {inputFiles.length === 0 && <p className="mt-2 text-red-500 text-xs">At least one file is required.</p>}
      </div>

      {/* Processing Configuration */}
      <div className="mb-6">
        <label htmlFor="processing-rules" className="block text-sm font-medium text-gray-700 mb-2">
          2. Tell the Forge What to Do: Your Data Processing Rules
        </label>
        <textarea
          id="processing-rules"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm h-32"
          placeholder="e.g., 'Extract text from all .zip files, combine all .csv files into a single DataFrame, then normalize numerical columns. Remove duplicate rows.' "
          value={processingRules}
          onChange={(e) => setProcessingRules(e.target.value)}
          disabled={isForgeRunning}
        ></textarea>
        <p className="mt-2 text-sm text-gray-500">
          Describe the steps you want the forge to take to turn your raw data into a structured dataset.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label htmlFor="output-format" className="block text-sm font-medium text-gray-700 mb-2">
            Output Format:
          </label>
          <select
            id="output-format"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as ForgeOutputFormat)}
            disabled={isForgeRunning}
          >
            <option value="CSV">CSV (Comma Separated Values)</option>
            <option value="Parquet">Parquet (Columnar Storage)</option>
            <option value="JSON">JSON (JavaScript Object Notation)</option>
          </select>
        </div>
        <div>
          <label htmlFor="output-dataset-name" className="block text-sm font-medium text-gray-700 mb-2">
            3. Name Your Structured Dataset:
          </label>
          <input
            type="text"
            id="output-dataset-name"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            placeholder="e.g., 'titanic_processed_data'"
            value={outputDatasetName}
            onChange={(e) => setOutputDatasetName(e.target.value)}
            disabled={isForgeRunning}
          />
        </div>
      </div>

      {/* Start Forge Button */}
      <button
        onClick={handleStartForge}
        className="w-full inline-flex justify-center py-3 px-4 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isForgeRunning || inputFiles.length === 0 || !processingRules.trim() || !outputDatasetName.trim()}
      >
        {isForgeRunning ? (
          <>
            <Spinner />
            <span className="ml-2">Forging Data...</span>
          </>
        ) : (
          '4. Start Data Forge!'
        )}
      </button>

      {/* Forge Job Status & Results */}
      {forgeError && (
        <p className="mt-4 text-red-600 text-sm">{forgeError}</p>
      )}

      {currentJob && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-3">Forge Job Status:</h3>
          <div className={`p-4 rounded-md ${
            currentJob.status === 'processing' ? 'bg-blue-50 text-blue-800' :
            currentJob.status === 'completed' ? 'bg-green-50 text-green-800' :
            'bg-red-50 text-red-800'
          }`}>
            <p className="font-semibold capitalize flex items-center">
              Status: {currentJob.status}
              {currentJob.status === 'processing' && <Spinner />}
            </p>
            <p className="text-sm">Started: {new Date(currentJob.startTime).toLocaleString()}</p>
            {currentJob.endTime && <p className="text-sm">Finished: {new Date(currentJob.endTime).toLocaleString()}</p>}
            {currentJob.errorMessage && (
              <p className="text-red-600 text-sm mt-2">Error: {currentJob.errorMessage}</p>
            )}
            {currentJob.status === 'completed' && (
              <>
                <p className="mt-2 font-medium">
                  Success! Your structured dataset "{currentJob.config.outputDatasetName}" is ready.
                </p>
                <button
                  onClick={handleDownloadOutput}
                  className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Download Structured Data
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataForge;
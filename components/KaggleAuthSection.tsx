// components/KaggleAuthSection.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { hasKaggleCredentialsConfigured, simulateSetKaggleCredentials, simulateClearKaggleCredentials } from '../services/kaggleService';
import Spinner from './Spinner';

interface KaggleAuthSectionProps {
  onAuthStatusChange: (isLinked: boolean) => void;
}

const KaggleAuthSection: React.FC<KaggleAuthSectionProps> = ({ onAuthStatusChange }) => {
  const [isLinked, setIsLinked] = useState<boolean>(hasKaggleCredentialsConfigured());
  const [showModal, setShowModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false); // For simulating auth process

  useEffect(() => {
    setIsLinked(hasKaggleCredentialsConfigured());
  }, []);

  const handleSimulateLink = useCallback(async () => {
    setIsLoading(true);
    // Simulate an async auth process
    await new Promise(resolve => setTimeout(resolve, 1500));
    simulateSetKaggleCredentials();
    setIsLinked(true);
    setShowModal(false);
    setIsLoading(false);
    onAuthStatusChange(true);
  }, [onAuthStatusChange]);

  const handleSimulateUnlink = useCallback(async () => {
    setIsLoading(true);
    // Simulate an async unlink process
    await new Promise(resolve => setTimeout(resolve, 1000));
    simulateClearKaggleCredentials();
    setIsLinked(false);
    setIsLoading(false);
    onAuthStatusChange(false);
  }, [onAuthStatusChange]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Kaggle Account Status 🔑</h2>
      <p className="text-gray-600 mb-4">
        To submit your models to Kaggle, you need to link your account. This is a **frontend simulation**
        of connecting your Kaggle API credentials securely. In a real application, this would involve a
        secure backend service.
      </p>

      {isLinked ? (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-4" role="alert">
          <p className="font-bold mb-2">Kaggle Account Connected!</p>
          <p className="text-sm">You are ready to make submissions. Thank you for securing your credentials.</p>
          <button
            onClick={handleSimulateUnlink}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Unlink Kaggle Account'}
          </button>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4" role="alert">
          <p className="font-bold mb-2">Kaggle Account Not Linked</p>
          <p className="text-sm">
            Please link your Kaggle account to enable submissions. This simulation does not
            expose your real API key.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            disabled={isLoading}
          >
            {isLoading ? <Spinner /> : 'Link Kaggle Account'}
          </button>
        </div>
      )}

      {/* Linking Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
            <div className="flex justify-between items-center border-b p-4">
              <h3 className="text-lg font-semibold text-gray-900">Simulate Kaggle Account Linking</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
            <div className="p-4 text-gray-700">
              <p className="mb-3">
                In a real scenario, you would obtain your `kaggle.json` file from your Kaggle account page
                (Account &gt; API &gt; Create New API Token). This file contains your username and API key.
              </p>
              <p className="mb-3">
                You would then securely provide these credentials to a backend service that
                would handle all interactions with the Kaggle API.
              </p>
              <p className="font-bold text-red-700">
                For this **frontend demonstration**, clicking "Simulate Link Account"
                will simply set a flag in your browser's local storage to enable submission features.
                No real credentials are exchanged or stored here.
              </p>
            </div>
            <div className="border-t p-4 flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateLink}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? <Spinner /> : 'Simulate Link Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KaggleAuthSection;
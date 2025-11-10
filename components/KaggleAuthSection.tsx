// components/KaggleAuthSection.tsx
import React from 'react';
import Spinner from './Spinner';

interface KaggleAuthSectionProps {
  isBackendKaggleConfigured: boolean; // Prop indicating if backend is configured
  onConfigStatusChange: (isConfigured: boolean) => void; // Callback to update App.tsx if status changes (e.g., from a refresh button)
}

const KaggleAuthSection: React.FC<KaggleAuthSectionProps> = ({ isBackendKaggleConfigured }) => {
  // The logic for linking/unlinking is now entirely on the backend and its environment variables.
  // This component simply reflects that status and guides the user.

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Kaggle Backend Status 🔑</h2>
      <p className="text-gray-600 mb-4">
        To enable real Kaggle submissions, your **Python backend** needs to be running and configured with your Kaggle API credentials.
      </p>

      {isBackendKaggleConfigured ? (
        <div className="bg-green-50 border-l-4 border-green-400 text-green-800 p-4" role="alert">
          <p className="font-bold mb-2">Backend Kaggle Credentials Configured!</p>
          <p className="text-sm">Your backend is ready to make submissions on your behalf. Ensure your API key is secure on your server.</p>
        </div>
      ) : (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4" role="alert">
          <p className="font-bold mb-2">Backend Kaggle Credentials NOT Configured</p>
          <p className="text-sm">
            Please ensure your **Python backend** is running and configured with your `KAGGLE_USERNAME` and `KAGGLE_KEY`
            environment variables (e.g., in your `backend/app.py` environment or `Dockerfile`).
            Without these, submissions will fail.
          </p>
          <p className="text-xs mt-2 text-gray-700">
            (The frontend periodically checks the backend's status. If you just updated your backend, give it a moment.)
          </p>
        </div>
      )}
    </div>
  );
};

export default KaggleAuthSection;
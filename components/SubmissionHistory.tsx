// components/SubmissionHistory.tsx
import React from 'react';
import { KaggleCompetition, UserSubmission } from '../types';

interface SubmissionHistoryProps {
  competitions: KaggleCompetition[];
  submissionHistory: UserSubmission[];
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  competitions,
  submissionHistory,
}) => {
  if (submissionHistory.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Submission History</h2>
        <p className="text-gray-600">No submissions yet. Submit your first prediction above!</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Your Submission History</h2>
      <div className="space-y-4">
        {submissionHistory.slice().reverse().map((submission) => (
          <div
            key={submission.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-medium text-gray-900">
                {submission.competitionTitle}
              </h3>
              <span
                className={`px-2 py-1 text-xs font-semibold rounded ${
                  submission.status === 'success'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {submission.status}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Source:</span> {submission.sourceName}
            </p>
            <p className="text-sm text-gray-600 mb-1">
              <span className="font-medium">Message:</span> {submission.message}
            </p>
            <p className="text-xs text-gray-500 mb-2">
              {new Date(submission.date).toLocaleString()}
            </p>
            {submission.kaggleLink && (
              <a
                href={submission.kaggleLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                View on Kaggle →
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default SubmissionHistory;

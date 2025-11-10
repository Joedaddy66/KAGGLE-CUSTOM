// components/CompetitionSelector.tsx
import React from 'react';
import { KaggleCompetition } from '../types';
import Spinner from './Spinner';

interface CompetitionSelectorProps {
  competitions: KaggleCompetition[];
  selectedCompetitionId: string | null;
  onSelectCompetition: (id: string) => void;
  isLoading: boolean;
}

const CompetitionSelector: React.FC<CompetitionSelectorProps> = ({
  competitions,
  selectedCompetitionId,
  onSelectCompetition,
  isLoading,
}) => {
  const selectedCompetition = competitions.find(comp => comp.id === selectedCompetitionId);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Select a Kaggle Competition</h2>
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="mb-4">
          <label htmlFor="competition-select" className="block text-sm font-medium text-gray-700 mb-2">
            Choose Competition:
          </label>
          <select
            id="competition-select"
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md shadow-sm"
            value={selectedCompetitionId || ''}
            onChange={(e) => onSelectCompetition(e.target.value)}
          >
            <option value="" disabled>-- Select Competition --</option>
            {competitions.map((comp) => (
              <option key={comp.id} value={comp.id}>
                {comp.title}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCompetition && (
        <div className="mt-6 border-t pt-4">
          <h3 className="text-xl font-bold text-gray-700 mb-2">{selectedCompetition.title}</h3>
          <img src={selectedCompetition.bannerImage} alt={selectedCompetition.title} className="w-full h-40 object-cover rounded-md mb-3" />
          <p className="text-gray-600 mb-2">{selectedCompetition.description}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-500">
            <p><strong>Status:</strong> <span className={`font-semibold ${selectedCompetition.status === 'active' ? 'text-green-600' : 'text-gray-500'}`}>{selectedCompetition.status}</span></p>
            <p><strong>Deadline:</strong> {new Date(selectedCompetition.deadline).toLocaleDateString()}</p>
            <p><strong>Prize:</strong> {selectedCompetition.prize}</p>
            <p><strong>Kaggle ID:</strong> <span className="font-mono">{selectedCompetition.id}</span></p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompetitionSelector;

// components/Header.tsx
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between">
        <div className="flex items-center space-x-2 mb-2 sm:mb-0">
          <img src="https://www.kaggle.com/static/images/site-logo.png" alt="Kaggle Logo" className="h-8" />
          <h1 className="text-2xl font-bold text-gray-800">Kaggle Submission Assistant</h1>
        </div>
        <p className="text-gray-600 text-sm text-center sm:text-right">
          Streamline your Kaggle workflow with AI-powered assistance.
        </p>
      </div>
    </header>
  );
};

export default Header;

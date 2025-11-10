<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Kaggle Submission Assistant

A powerful AI-assisted platform for streamlining your Kaggle machine learning workflow. This app helps you conceptualize models, simulate training, and manage submissions with the power of Google's Gemini API.

View your app in AI Studio: https://ai.studio/apps/drive/1dCfkZZMv7qNzfpsi5KoayM8kKO-4j_hx

## Features

- 🤖 **AI-Powered Model Conceptualizer** - Get ML model suggestions from Gemini AI
- 📊 **Simulated Model Training** - Train and test models with conceptual datasets
- 🔥 **Spartan Data Forge** - Process and transform raw data files
- 💬 **Spartan Oracle Agent** - Interactive AI assistant for guidance
- 📈 **Submission Management** - Track your Kaggle submission history
- 🔑 **Kaggle Integration** - Submit directly to Kaggle competitions (requires backend)

## Run Locally

**Prerequisites:**  
- Node.js (v16 or higher)
- npm or yarn

### Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set your Gemini API key:**
   
   Create or edit the `.env.local` file and add your API key:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
   
   Get your API key from: https://aistudio.google.com/app/apikey

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   
   Navigate to http://localhost:3000/

### Optional: Backend Setup

For full Kaggle submission functionality, you'll need a Flask backend running on port 5000 with Kaggle API credentials configured. The frontend will work without the backend, but some features will be limited.

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini API
- Flask Backend (optional)

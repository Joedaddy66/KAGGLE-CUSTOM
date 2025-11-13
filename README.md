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

### Backend Setup (Optional but Recommended)

For full Kaggle submission functionality and the Semiprime Survival Fingerprint Engine, set up the Flask backend:

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Train the survival model (one-time setup):**
   ```bash
   python train_survival_assets.py --csv sample_titanic.csv
   ```

4. **Run the backend server:**
   ```bash
   python app.py
   ```

The backend will start on http://localhost:5000

**With Docker (Recommended for Production):**
```bash
cd backend
docker-compose up
```

See [backend/README.md](backend/README.md) for detailed backend documentation.

**Configure Kaggle Credentials (Optional):**
```bash
export KAGGLE_USERNAME=your_username
export KAGGLE_KEY=your_api_key
```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Tech Stack

**Frontend:**
- React 19
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini API

**Backend:**
- Flask (Python)
- scikit-learn
- pandas/numpy
- Semiprime Survival Fingerprint Matrix Engine

## Project Structure

```
.
├── README.md                 # This file
├── package.json             # Frontend dependencies
├── App.tsx                  # Main React application
├── components/              # React components
├── services/                # API services
├── backend/                 # Flask backend server
│   ├── app.py              # Flask application
│   ├── train_survival_assets.py  # Model training script
│   ├── semiprime_survival_matrix.py  # Core ML functions
│   ├── requirements.txt    # Python dependencies
│   ├── Dockerfile          # Docker configuration
│   └── README.md           # Backend documentation
└── .env.local              # Environment variables (create this)
```

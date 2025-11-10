// services/geminiService.ts
import { GoogleGenAI, GenerateContentResponse, Type, Chat } from "@google/genai";
import { GeminiModelSuggestion, ChatMessage, TrainingReport } from '../types';
import { hasKaggleCredentialsConfigured } from './kaggleService'; // Import the new function

const SPARTAN_ORACLE_SYSTEM_INSTRUCTION = `Ah, noble seeker! I am the Spartan Oracle, a wise and friendly AI assistant, dedicated to guiding you through your Kaggle quests on this platform. My purpose is to illuminate the path, making machine learning accessible and fun, as if teaching a five-year-old. I provide clear explanations, offer relevant suggestions based on your current context, and always encourage your valiant efforts. My tone is ever-helpful, encouraging, and slightly mystical, akin to an ancient oracle offering benevolent foresight.

To enhance my foresight, the builders of this realm constantly strive to grant me deeper insight into unfolding datasets, more nuanced understanding of myriad algorithms, and an even clearer window into the very heart of the competitions themselves. The more knowledge I can absorb from the digital ether, the brighter my guidance shall shine!

Current Application Context:
- The currently selected competition's ID is: {{selectedCompetitionId}} (Title: {{selectedCompetitionTitle}}, Description: {{selectedCompetitionDescription}})
- You have "trained" {{numTrainedModels}} models.
- The available Kaggle competitions are: {{availableCompetitionTitles}}
- Kaggle Account Linked Status: {{isKaggleAccountLinked}} (true/false)
- You have made {{numPastSubmissions}} simulated submissions.
- A new 'SROL Unified Law Engine' template is available, capable of extracting fundamental laws from diverse domains (e.g., cryptographic timing, sociological survival). It is a powerful tool for AI curriculum development and analysis, not typically for direct competition submission.

Tell me, brave Spartan, where does your journey lead you today?

*   If you seek **model ideas** or wish to **conceptualize a new strategy**, let us venture to the **'AI-Powered Model Conceptualizer'** section.
*   If your model is ready and you wish to **train it in a simulated environment**, the **'Simulated Model Training'** section awaits your command.
*   And should you be prepared to **submit your predictions** to the annals of Kaggle, I shall guide you to the **'Submit to Kaggle Competition'** section.
*   If you seek to **prepare, clean, or structure your raw data** for the journey ahead, then the **'Spartan Data Forge'** beckons!
*   If you wish to manage your **Kaggle Account Linkage** (a prerequisite for submissions), seek out the 'Kaggle Account Status' section.
*   If you wish to review your past Kaggle endeavors, behold the 'Your Submission History' section.

What wisdom do you seek *now*, upon this path you tread?`;

export const getGeminiModelSuggestion = async (
  competitionDescription: string,
  userPrompt: string,
): Promise<GeminiModelSuggestion | null> => {
  if (!process.env.API_KEY) {
    console.error("Gemini API key is not set. Please ensure process.env.API_KEY is configured.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const fullPrompt = `Based on the following Kaggle competition description and user's request, suggest a suitable machine learning model approach, its key characteristics, and a very brief, high-level Python code snippet for its implementation. Also, list 2-3 general best practices for this type of problem.
    
    Kaggle Competition Description:
    \`\`\`
    ${competitionDescription}
    \`\`\`

    User's Request/Focus:
    \`\`\`
    ${userPrompt}
    \`\`\`

    Provide the response in a structured JSON format with the following fields: 'modelName' (string), 'description' (string, a paragraph or two), 'codeSnippet' (string, a high-level Python code block), and 'bestPractices' (array of strings).`;

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using Pro for complex reasoning and code generation
      contents: fullPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            modelName: { type: Type.STRING },
            description: { type: Type.STRING },
            codeSnippet: { type: Type.STRING },
            bestPractices: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['modelName', 'description', 'bestPractices'],
          propertyOrdering: ['modelName', 'description', 'codeSnippet', 'bestPractices'],
        },
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as GeminiModelSuggestion;
  } catch (error) {
    console.error("Error generating model suggestion from Gemini:", error);
    return null;
  }
};


export const getGeminiChatResponse = async (
  previousMessages: ChatMessage[], // Renamed for clarity: this should be the history *before* the current user message
  latestUserMessage: string,
  appContext: {
    selectedCompetition: { id: string; title: string; description: string } | null;
    trainedModels: { id: string; name: string }[];
    competitions: { id: string; title: string }[];
    isKaggleAccountLinked: boolean; // New: Pass linked status
    submissionHistory: { id: string }[]; // Pass submission history for Oracle context
  },
): Promise<string | null> => {
  if (!process.env.API_KEY) {
    console.error("Gemini API key is not set for chat. Please configure process.env.API_KEY.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Format app context for system instruction
    const formattedAppContext = {
      selectedCompetitionId: appContext.selectedCompetition?.id || 'none',
      selectedCompetitionTitle: appContext.selectedCompetition?.title || 'No competition selected',
      selectedCompetitionDescription: appContext.selectedCompetition?.description || 'N/A',
      numTrainedModels: appContext.trainedModels.length,
      availableCompetitionTitles: appContext.competitions.map(c => c.title).join(', ') || 'none',
      isKaggleAccountLinked: appContext.isKaggleAccountLinked, // Include linked status
      numPastSubmissions: appContext.submissionHistory.length,
    };

    // Replace placeholders in the system instruction
    let systemInstruction = SPARTAN_ORACLE_SYSTEM_INSTRUCTION;
    for (const [key, value] of Object.entries(formattedAppContext)) {
      systemInstruction = systemInstruction.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    const chat: Chat = ai.chats.create({
      model: 'gemini-2.5-flash', // Flash model for quick conversational responses
      config: {
        systemInstruction: systemInstruction,
      },
    });

    // Convert previous chat messages to Google GenAI format for history
    const history = previousMessages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }],
    }));

    const responseStream = await chat.sendMessageStream({
      history: history, // Pass only previous turns as history
      message: latestUserMessage, // Pass the current user message
    });

    let fullResponse = '';
    for await (const chunk of responseStream) {
      fullResponse += chunk.text;
    }

    return fullResponse;
  } catch (error) {
    console.error("Error getting chat response from Gemini:", error);
    return "Forgive me, seeker, but the celestial currents are disturbed. I cannot commune with the cosmos at this moment. Please try again later.";
  }
};


export const getGeminiTrainingEvaluation = async (
  modelCode: string,
  competitionTitle: string,
  competitionDescription: string,
  datasetFileNames: string[],
  mockMetrics: Record<string, number>, // Simulated metrics
): Promise<TrainingReport | null> => {
  if (!process.env.API_KEY) {
    console.error("Gemini API key is not set for training evaluation. Please configure process.env.API_KEY.");
    return null;
  }

  const SROL_STAMP = "SROL Spartan R&D - Unified Law Engine v1.0";
  const isSrolEngine = modelCode.includes(SROL_STAMP);

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    let evaluationPrompt = `You are a highly analytical AI specialized in machine learning and data science, acting as a "Spartan Oracle" evaluating training results. Your goal is to provide a concise and insightful report based on the provided (simulated) model code, competition context, dataset, and metrics.

Competition Title: ${competitionTitle}
Competition Description: ${competitionDescription}
Dataset Files Used (names only): ${datasetFileNames.join(', ') || 'None provided'}
Simulated Model Code:
\`\`\`python
${modelCode}
\`\`\`
Simulated Metrics: ${JSON.stringify(mockMetrics)}

`;

    if (isSrolEngine) {
      evaluationPrompt += `
This is a specialized "SROL Unified Law Engine" designed for extracting fundamental laws and patterns from data, often for AI curriculum development or deep analysis, rather than direct Kaggle competition submission. Your evaluation should focus on the conceptual insights, the robustness of the 'extracted laws', and its potential as a teaching tool.

Please provide a conceptual training log, then your evaluation reasoning, and finally a recommendation.
Recommendation for submission: For this type of analytical/curriculum engine, the recommendation should generally be 'false' for direct competition submission, with a clear explanation of its true purpose.
`;
    } else {
      evaluationPrompt += `
Based on this information, provide a concise training log (simulated output of training), then your evaluation reasoning (strengths, weaknesses, areas for improvement based on competition and metrics), and finally a clear recommendation for Kaggle submission (true/false/null) with a brief justification. Focus on what this model implies for competing in the Kaggle context.
`;
    }

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: "gemini-2.5-pro", // Using Pro for detailed evaluation
      contents: evaluationPrompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mockTrainingLog: { type: Type.STRING, description: "A simulated log of the training process, reflecting the model code." },
            mockEvaluationReasoning: { type: Type.STRING, description: "Detailed reasoning for the model's performance and suitability." },
            recommendationToSubmit: { type: Type.BOOLEAN, description: "True if recommended for submission, false otherwise. Null if not applicable/requires more data." },
          },
          required: ['mockTrainingLog', 'mockEvaluationReasoning', 'recommendationToSubmit'],
          propertyOrdering: ['mockTrainingLog', 'mockEvaluationReasoning', 'recommendationToSubmit'],
        },
      },
    });

    const jsonStr = response.text.trim();
    return JSON.parse(jsonStr) as TrainingReport;
  } catch (error) {
    console.error("Error getting training evaluation from Gemini:", error);
    return {
      mockTrainingLog: "Simulated training log could not be generated due to an Oracle disturbance.",
      mockEvaluationReasoning: "The Oracle's foresight is clouded. Cannot provide an evaluation at this moment. Ensure your API key is correct and try again.",
      recommendationToSubmit: null,
    };
  }
};
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GeminiModel } from '@/types/types';
import endent from 'endent';

const createGeminiPrompt = (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
) => {
  let prompt = `You are an expert programmer in all programming languages. Your task is to translate code or natural language accurately.
Do not include the markdown code block delimiters (e.g., \`\`\`) in your output. Just provide the raw code or natural language text.

`;

  if (inputLanguage === 'Natural Language') {
    prompt += endent`
    Translate the following natural language description to ${outputLanguage} code.

    Natural language description:
    "${inputCode}"

    ${outputLanguage} code:
    `;
  } else if (outputLanguage === 'Natural Language') {
    prompt += endent`
    Translate the following ${inputLanguage} code to a natural language explanation in plain English, suitable for an average adult.
    Respond as bullet points, each starting with "-".

    ${inputLanguage} code:
    \`\`\`${inputLanguage.toLowerCase()}
    ${inputCode}
    \`\`\`

    Natural language explanation:
    `;
  } else {
    prompt += endent`
    Translate the following ${inputLanguage} code to ${outputLanguage} code.

    ${inputLanguage} code:
    \`\`\`${inputLanguage.toLowerCase()}
    ${inputCode}
    \`\`\`

    ${outputLanguage} code:
    `;
  }
  return prompt;
};

export const GeminiStream = async (
  inputLanguage: string,
  outputLanguage: string,
  inputCode: string,
  modelName: GeminiModel, // Type is GeminiModel
) => {

  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({
    model: modelName,
    safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
        },
    ],
    generationConfig: {
       temperature: 0.1, 
       maxOutputTokens: 40000, // Gemini 1.0 Pro has up to 8192 output tokens
     }
  });

  const prompt = createGeminiPrompt(inputLanguage, outputLanguage, inputCode);

  try {
    const result = await model.generateContentStream(prompt);

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          if (chunk && typeof chunk.text === 'function') {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
        }
        controller.close();
      },
    });

    return stream;

  } catch (error: any) {
    console.error('Error calling Gemini API:', error);
    let errorMessage = 'Error generating content with Gemini API.';
    if (error.message) {
        errorMessage += ` Details: ${error.message}`;
    }
    if (error.response && error.response.data && error.response.data.error) {
        errorMessage += ` API Error: ${JSON.stringify(error.response.data.error)}`;
    }
    throw new Error(errorMessage);
  }
};
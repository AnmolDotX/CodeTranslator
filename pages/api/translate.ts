import { TranslateBody, GeminiModel } from '@/types/types';
import { GeminiStream } from '@/utils';
import type { NextApiRequest, NextApiResponse } from 'next';

const handler = async (req: NextApiRequest, res: NextApiResponse) => {

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    const { inputLanguage, outputLanguage, inputCode, model } = req.body as TranslateBody;


    // Basic validation
    if (!inputLanguage || !outputLanguage || !inputCode || !model) {
        return res.status(400).json({ error: "Missing required fields in request body." });
    }

    const geminiModel: GeminiModel = model as GeminiModel;

    const stream = await GeminiStream(
      inputLanguage,
      outputLanguage,
      inputCode,
      geminiModel
    );

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');


    const reader = stream.getReader();
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          break;
        }
        res.write(value); 
      }
    } catch (streamError) {
      console.error("Error reading from Gemini stream:", streamError);

      if (!res.writableEnded) {
        res.write(JSON.stringify({ error: "Error processing translation stream."}));
      }
    } finally {
      if (!res.writableEnded) {
        res.end();
      }
    }

  } catch (error: any) {
    console.error("API Route Handler Error:", error);
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'An unexpected error occurred in the API route.' });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
};

export default handler;
export type GeminiModel = 'gemini-2.5-pro-preview-05-06' | 'gemini-2.5-flash-preview-05-20';

export interface TranslateBody {
  inputLanguage: string;
  outputLanguage: string;
  inputCode: string;
  model: GeminiModel; // Updated
}

export interface TranslateResponse {
  code: string;
}

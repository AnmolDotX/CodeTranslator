import { Code, Zap, FileCode, Languages } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from "sonner";

import { APIKeyInput } from '@/components/APIKeyInput';
import { CodeBlock } from '@/components/CodeBlock';
import { LanguageSelect } from '@/components/LanguageSelect';
import { ModelSelect } from '@/components/ModelSelect';
import { TextBlock } from '@/components/TextBlock';
import { GeminiModel, TranslateBody } from '@/types/types';

export default function Home() {
  const [inputLanguage, setInputLanguage] = useState<string>('JavaScript');
  const [outputLanguage, setOutputLanguage] = useState<string>('Python');
  const [inputCode, setInputCode] = useState<string>('');
  const [outputCode, setOutputCode] = useState<string>('');
  const [model, setModel] = useState<GeminiModel>('gemini-2.5-flash-preview-05-20');
  const [loading, setLoading] = useState<boolean>(false);
  const [hasTranslated, setHasTranslated] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'warning' | 'error', message: string } | null>(null);

  const showNotification = (type: 'success' | 'warning' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };

  const handleTranslate = async () => {
    const maxCodeLength = 100000;

    if (inputLanguage === outputLanguage) {
      showNotification("warning","Languages can't be same ");
      return;
    }

    if (!inputCode) {
      showNotification("warning",'There is No Code to convert!');
      return;
    }

    if (inputCode.length > maxCodeLength) {
      showNotification("warning",`Please enter code less than ${maxCodeLength} characters. You are currently at ${inputCode.length} characters.`,
      );
      return;
    }

    setLoading(true);
    setOutputCode('');

    const controller = new AbortController();

    const body: TranslateBody = {
      inputLanguage,
      outputLanguage,
      inputCode,
      model
    };

    const response = await fetch('/api/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      setLoading(false);
      showNotification("warning",'Something went wrong.');
      return;
    }

    const data = response.body;

    if (!data) {
      setLoading(false);
      showNotification("warning",'Something went wrong.');
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;
    let code = '';

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      const chunkValue = decoder.decode(value);

      code += chunkValue;

      setOutputCode((prevCode) => prevCode + chunkValue);
    }

    setLoading(false);
    setHasTranslated(true);
    copyToClipboard(code);
  };

  const copyToClipboard = (text: string) => {
    const el = document.createElement('textarea');
    el.value = text;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
  };

  useEffect(() => {
    if (hasTranslated) {
      handleTranslate();
    }
  }, [outputLanguage]);

  return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-950 text-gray-100">
    {/* Header */}
    <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-center space-x-2">
          <Code className="h-8 w-8 text-indigo-400" />
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Translator
          </h1>
        </div>
        <p className="mt-2 text-center text-gray-400">
          Translate code between programming languages using Google Gemini AI
        </p>
      </div>
    </header>

    {/* Main content */}
    <main className="container mx-auto px-4 py-8">

      {/* Controls */}
      <div className="mb-6 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <div className="w-full sm:w-auto">
          <ModelSelect model={model} onChange={(value) => setModel(value as GeminiModel)} />
        </div>
        <button
          className={`group flex w-full items-center justify-center gap-2 rounded-lg px-6 py-3 font-medium transition-all sm:w-auto
              ${loading
              ? "bg-gray-700 text-gray-300"
              : "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 active:bg-indigo-800"
            }`}
          onClick={handleTranslate}
          disabled={loading}
        >
          {loading ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-transparent"></div>
              <span>Translating...</span>
            </>
          ) : (
            <>
              <Zap className="h-5 w-5 transition-transform group-hover:scale-110" />
              <span>Translate</span>
            </>
          )}
        </button>
      </div>

      {/* Notification */}
      {notification && (
        <div
          className={`mb-6 rounded-lg px-4 py-3 text-center text-sm transition-all ${notification.type === 'success' ? 'bg-green-500/20 text-green-300' :
              notification.type === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                'bg-red-500/20 text-red-300'
            }`}
        >
          {notification.message}
        </div>
      )}

      {/* Editor panels */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input panel */}
        <div className="rounded-xl bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
            <FileCode className="h-5 w-5 text-indigo-400" />
            <h2>Input</h2>
          </div>

          <div className="mb-3">
            <LanguageSelect
              language={inputLanguage}
              onChange={(value) => {
                setInputLanguage(value);
                setHasTranslated(false);
                setInputCode('');
                setOutputCode('');
              }}
            />
          </div>

          {inputLanguage === 'Natural Language' ? (
            <TextBlock
              text={inputCode}
              editable={!loading}
              onChange={(value) => {
                setInputCode(value);
                setHasTranslated(false);
              }}
            />
          ) : (
            <CodeBlock
              code={inputCode}
              editable={!loading}
              onChange={(value) => {
                setInputCode(value);
                setHasTranslated(false);
              }}
            />
          )}
        </div>

        {/* Output panel */}
        <div className="rounded-xl bg-gray-800/50 p-4 shadow-lg backdrop-blur-sm">
          <div className="mb-3 flex items-center gap-2 text-xl font-semibold text-white">
            <Languages className="h-5 w-5 text-indigo-400" />
            <h2>Output</h2>
          </div>

          <div className="mb-3">
            <LanguageSelect
              language={outputLanguage}
              onChange={(value) => {
                setOutputLanguage(value);
                setOutputCode('');
              }}
            />
          </div>

          {outputLanguage === 'Natural Language' ? (
            <TextBlock text={outputCode} />
          ) : (
            <CodeBlock code={outputCode} />
          )}
        </div>
      </div>
    </main>

    {/* Footer */}
    <footer className="border-t border-gray-800 py-6 text-center text-sm text-gray-500">
      <div className="container mx-auto px-4">
        <p>Powered by Google Gemini AI models</p>
      </div>
    </footer>
  </div>

}

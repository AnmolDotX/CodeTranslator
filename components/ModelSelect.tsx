import { GeminiModel } from '@/types/types';
import { FC } from 'react';

interface Props {
  model: GeminiModel;
  onChange: (model: GeminiModel) => void;
}

export const ModelSelect: FC<Props> = ({ model, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value as GeminiModel);
  };

  return (
    <select
      className="h-[40px] w-[140px] rounded-md bg-[#1F2937] px-4 py-2 text-neutral-200"
      value={model}
      onChange={handleChange}
    >
      <option value="gemini-2.5-pro-preview-05-06">Gemini 2.5 Pro</option>
      <option value="gemini-2.5-flash-preview-05-20">Gemini-2.5 Flash</option>
    </select>
  );
};

import React, { useState, useMemo } from 'react';
import { generateMarkdown } from '../utils';

const ExportScreen = ({ entries, customFields }) => {
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(() => generateMarkdown(entries, customFields), [entries, customFields]);
  const handleCopy = () => {
    const el = document.createElement('textarea');
    el.value = markdown;
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex gap-4">
        <button onClick={handleCopy} className="flex-1 bg-indigo-600 text-white p-4 rounded-xl font-bold">{copied ? '¡Copiado!' : 'Copiar Markdown'}</button>
      </div>
      <div className="bg-slate-900 p-6 rounded-xl text-slate-300 font-mono text-xs overflow-auto h-96 whitespace-pre">{markdown}</div>
    </div>
  );
};

export default ExportScreen;

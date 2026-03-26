import React, { useState, useMemo } from 'react';
import { generateMarkdown } from '../utils/markdown';
import { copyToClipboard } from '../utils/clipboard';

const ExportScreen = ({ entries, columns }) => {
  const [copied, setCopied] = useState(false);
  const markdown = useMemo(() => generateMarkdown(entries, columns), [entries, columns]);

  const handleCopy = async () => {
    await copyToClipboard(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 p-5 md:p-8 max-w-4xl mx-auto w-full space-y-6">
      <div className="flex gap-4">
        <button
          onClick={handleCopy}
          className={`flex-1 p-4 rounded-organic font-semibold text-lg transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-leaf-100 text-leaf-800 border-2 border-leaf-400'
              : 'organic-btn-primary'
          }`}
        >
          {copied ? 'Copiado' : 'Copiar Markdown'}
        </button>
      </div>
      <div className="bg-organic-900 p-6 rounded-organic-lg text-organic-300 font-mono text-xs overflow-auto h-96 whitespace-pre border border-organic-700 shadow-organic-lg">
        {markdown}
      </div>
    </div>
  );
};

export default ExportScreen;

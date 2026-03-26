import React, { useState, useMemo } from 'react';
import { FileJson, FileText, Copy, Download, Check, MessageSquare } from 'lucide-react';
import { generateMarkdown, generateJson, generateConversationMarkdown, generateConversationJson } from '../utils/markdown';
import { formatDate } from '../utils/date';
import { copyToClipboard } from '../utils/clipboard';

const ExportSection = ({ title, icon: Icon, colorClass, content, onCopy, onDownload, children }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="organic-card p-5 md:p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-organic ${colorClass}`}>
          <Icon size={20} />
        </div>
        <h2 className="font-heading text-lg font-semibold text-organic-800">{title}</h2>
      </div>

      <div className="flex gap-3">
        <button
          onClick={handleCopy}
          className={`flex-1 flex items-center justify-center gap-2 p-3 rounded-organic font-medium transition-all duration-200 cursor-pointer ${
            copied
              ? 'bg-leaf-100 text-leaf-800 border-2 border-leaf-400'
              : 'organic-btn-primary text-sm'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? 'Copiado' : 'Copiar'}
        </button>
        <button
          onClick={onDownload}
          className="flex-1 flex items-center justify-center gap-2 organic-btn-secondary text-sm font-medium cursor-pointer"
        >
          <Download size={16} /> Descargar
        </button>
      </div>

      {children || (
        <div className="bg-organic-50 border border-organic-200 rounded-organic p-4 max-h-72 overflow-auto">
          <pre className="text-xs text-organic-700 font-mono whitespace-pre-wrap break-words leading-relaxed">
            {content}
          </pre>
        </div>
      )}
    </div>
  );
};

const getTableData = (entries, columns) => {
  const builtin = (columns || []).filter(c => c.type === 'builtin');
  const custom = (columns || []).filter(c => c.type === 'custom');
  const cols = [...builtin, ...custom];
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  return { cols, rows: sorted };
};

const getCellValue = (entry, col) => {
  if (col.type === 'custom') {
    return entry[`customField${col.dataIndex}Value`] || '-';
  }
  if (col.key === 'fecha') return formatDate(entry.fecha);
  if (col.key === 'sintoma_tipo') return entry.sintoma_tipo?.join(', ') || '-';
  if (col.key === 'intensidad') return `${entry.intensidad}/10`;
  if (col.key === 'ubicacion') return entry.ubicacion || '-';
  if (col.key === 'comida') return entry.comida || '-';
  if (col.key === 'estres') return `${entry.estres}/10`;
  if (col.key === 'sueno_horas') return `${entry.sueno_horas}h`;
  if (col.key === 'medicacion') return entry.medicacion || '-';
  if (col.key === 'notas') return entry.notas || '-';
  return entry[col.key] || '-';
};

const ExportScreen = ({ entries, columns, conversations = [] }) => {
  const { cols, rows } = useMemo(() => getTableData(entries, columns), [entries, columns]);
  const markdown = useMemo(() => generateMarkdown(entries, columns), [entries, columns]);
  const json = useMemo(() => generateJson(entries, columns), [entries, columns]);
  const convMarkdown = useMemo(() => generateConversationMarkdown(conversations), [conversations]);
  const convJson = useMemo(() => generateConversationJson(conversations), [conversations]);

  const downloadFile = (content, filename, mimeType) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (entries.length === 0 && conversations.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-organic-400">
        <FileText size={48} className="mb-4 opacity-30" />
        <p className="font-body text-lg">Sin datos para exportar</p>
        <p className="text-sm text-organic-300 mt-1">Agrega registros o conversaciones primero</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-5 md:p-8 max-w-5xl mx-auto w-full space-y-6">
      <p className="text-sm text-organic-500 font-body">
        {entries.length} registro{entries.length !== 1 ? 's' : ''}
        {conversations.length > 0 && ` — ${conversations.length} conversación${conversations.length !== 1 ? 'es' : ''}`}
      </p>

      <ExportSection
        title="Vista Previa de la Tabla"
        icon={FileText}
        colorClass="bg-leaf-100 text-leaf-600"
      >
        <div className="organic-card overflow-hidden">
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-xs font-body">
              <thead className="bg-organic-100 border-b border-organic-200 sticky top-0">
                <tr>
                  {cols.map(col => (
                    <th key={col.key || col.dataIndex} className="px-4 py-3 text-left font-semibold text-organic-700 whitespace-nowrap">
                      {col.type === 'custom' ? (col.label || `Campo ${col.dataIndex + 1}`) : col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-organic-100">
                {rows.map(entry => (
                  <tr key={entry.id} className="hover:bg-organic-50 transition-colors duration-150">
                    {cols.map(col => (
                      <td key={col.key || col.dataIndex} className="px-4 py-2.5 text-organic-700 whitespace-nowrap">
                        {getCellValue(entry, col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </ExportSection>

      <ExportSection
        title="Exportar como JSON"
        icon={FileJson}
        colorClass="bg-sky-100 text-sky-600"
        content={json}
        onCopy={() => copyToClipboard(json)}
        onDownload={() => downloadFile(json, 'dispepsia-datos.json', 'application/json')}
      />

      <ExportSection
        title="Exportar como Markdown"
        icon={FileText}
        colorClass="bg-organic-100 text-organic-600"
        content={markdown}
        onCopy={() => copyToClipboard(markdown)}
        onDownload={() => downloadFile(markdown, 'dispepsia-datos.md', 'text/markdown')}
      />

      {conversations.length > 0 && (
        <>
          <p className="text-sm text-organic-500 font-body pt-4">
            {conversations.length} conversación{conversations.length !== 1 ? 'es' : ''}
          </p>

          <ExportSection
            title="Conversaciones — JSON"
            icon={MessageSquare}
            colorClass="bg-violet-100 text-violet-600"
            content={convJson}
            onCopy={() => copyToClipboard(convJson)}
            onDownload={() => downloadFile(convJson, 'dispepsia-conversaciones.json', 'application/json')}
          />

          <ExportSection
            title="Conversaciones — Markdown"
            icon={MessageSquare}
            colorClass="bg-violet-100 text-violet-600"
            content={convMarkdown}
            onCopy={() => copyToClipboard(convMarkdown)}
            onDownload={() => downloadFile(convMarkdown, 'dispepsia-conversaciones.md', 'text/markdown')}
          />
        </>
      )}
    </div>
  );
};

export default ExportScreen;

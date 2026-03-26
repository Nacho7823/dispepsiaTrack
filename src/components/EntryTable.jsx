import React, { useState } from 'react';
import { Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/date';

const getCellValue = (entry, col) => {
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

const EntryTable = ({ entries, columns, onEdit, onDelete }) => (
  <section className="organic-card overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm font-body">
        <thead className="bg-organic-100 border-b border-organic-200">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-5 py-3.5 text-left font-semibold text-organic-700">{col.label}</th>
            ))}
            <th className="px-5 py-3.5 text-left font-semibold text-organic-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-organic-100">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-organic-50 transition-colors duration-150">
              {columns.map((col, idx) => (
                <td key={idx} className="px-5 py-3.5 text-organic-700 whitespace-nowrap">
                  {getCellValue(entry, col)}
                </td>
              ))}
              <td className="px-5 py-3.5">
                <div className="flex gap-1.5">
                  <button
                    onClick={() => onEdit(entry)}
                    className="p-2 text-leaf-600 hover:bg-leaf-50 rounded-organic-sm transition-colors cursor-pointer"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(entry.id)}
                    className="p-2 text-terracotta-400 hover:bg-terracotta-50 rounded-organic-sm transition-colors cursor-pointer"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const EntryList = ({ entries, columns, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);
  const customFieldCols = (columns || []).filter(c => c.type === 'custom');

  return (
    <section className="organic-card overflow-hidden">
      <div className="p-5 border-b border-organic-200 bg-organic-100/50 font-heading font-semibold text-organic-700">Historial Completo</div>
      <div className="divide-y divide-organic-100">
        {entries.map(entry => (
          <div key={entry.id} className="p-5 hover:bg-organic-50 transition-colors duration-150">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-organic-400 font-body">{formatDate(entry.fecha)}</p>
                <p className="font-heading font-semibold text-organic-800 mt-0.5">{entry.sintoma_tipo?.join(', ') || 'Registro'}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(entry)}
                  className="p-2 text-leaf-600 hover:bg-leaf-50 rounded-organic-sm transition-colors cursor-pointer"
                >
                  <Edit3 size={18} />
                </button>
                <button
                  onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                  className="p-2 text-organic-400 hover:bg-organic-100 rounded-organic-sm transition-colors cursor-pointer"
                >
                  {expandedId === entry.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                <button
                  onClick={() => onDelete(entry.id)}
                  className="p-2 text-terracotta-400 hover:bg-terracotta-50 rounded-organic-sm transition-colors cursor-pointer"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            {expandedId === entry.id && (
              <div className="mt-4 text-sm grid gap-2 bg-organic-50 p-4 rounded-organic">
                <p className="font-body text-organic-700"><strong className="text-organic-800">Intensidad:</strong> {entry.intensidad}/10 | <strong className="text-organic-800">Ubicacion:</strong> {entry.ubicacion || '-'}</p>
                <p className="font-body text-organic-700"><strong className="text-organic-800">Comida:</strong> {entry.comida || '-'}</p>
                <p className="font-body text-organic-700"><strong className="text-organic-800">Estres:</strong> {entry.estres}/10 | <strong className="text-organic-800">Sueno:</strong> {entry.sueno_horas}h</p>
                {customFieldCols.map(col => <p key={col.key} className="font-body text-organic-700"><strong className="text-organic-800">{col.label || `Campo ${col.dataIndex + 1}`}:</strong> {entry[`customField${col.dataIndex}Value`] || '-'}</p>)}
                <p className="font-body text-organic-700"><strong className="text-organic-800">Medicacion:</strong> {entry.medicacion || '-'}</p>
                <p className="font-body text-organic-700"><strong className="text-organic-800">Notas:</strong> {entry.notas || '-'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export { EntryTable, EntryList };

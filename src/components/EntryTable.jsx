import React, { useState } from 'react';
import { Edit3, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { formatDate } from '../utils/date';

const getCellValue = (entry, col, customFields) => {
  if (col.key === 'fecha') return formatDate(entry.fecha);
  if (col.key === 'sintoma_tipo') return entry.sintoma_tipo?.join(', ') || '-';
  if (col.key === 'intensidad') return `${entry.intensidad}/10`;
  if (col.key === 'ubicacion') return entry.ubicacion || '-';
  if (col.key === 'comida') return entry.comida || '-';
  if (col.key === 'estres') return `${entry.estres}/10`;
  if (col.key === 'sueno_horas') return `${entry.sueno_horas}h`;
  if (col.key === 'medicacion') return entry.medicacion || '-';
  if (col.key === 'notas') return entry.notas || '-';
  if (col.key === 'customFields') {
    return customFields.map((cf, idx) => entry[`customField${idx}Value`] || '-').join(', ');
  }
  if (col.key.startsWith('col_')) return entry[col.key] || '-';
  return '-';
};

const EntryTable = ({ entries, columns, customFields, onEdit, onDelete }) => (
  <section className="bg-white rounded-2xl border overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b">
          <tr>
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-left font-bold text-slate-600">{col.label}</th>
            ))}
            <th className="px-4 py-3 text-left font-bold text-slate-600">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map(entry => (
            <tr key={entry.id} className="hover:bg-slate-50">
              {columns.map((col, idx) => (
                <td key={idx} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                  {getCellValue(entry, col, customFields)}
                </td>
              ))}
              <td className="px-4 py-3">
                <div className="flex gap-1">
                  <button onClick={() => onEdit(entry)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"><Edit3 size={16} /></button>
                  <button onClick={() => onDelete(entry.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16} /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </section>
);

const EntryList = ({ entries, customFields, onEdit, onDelete }) => {
  const [expandedId, setExpandedId] = useState(null);

  return (
    <section className="bg-white rounded-2xl border overflow-hidden">
      <div className="p-4 border-b bg-slate-50 font-bold">Historial Completo</div>
      <div className="divide-y">
        {entries.map(entry => (
          <div key={entry.id} className="p-4 hover:bg-slate-50">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-400">{formatDate(entry.fecha)}</p>
                <p className="font-bold">{entry.sintoma_tipo?.join(', ') || 'Registro'}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(entry)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded"><Edit3 size={18} /></button>
                <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="p-2 text-slate-400">
                  {expandedId === entry.id ? <ChevronUp /> : <ChevronDown />}
                </button>
                <button onClick={() => onDelete(entry.id)} className="p-2 text-red-400"><Trash2 size={18} /></button>
              </div>
            </div>
            {expandedId === entry.id && (
              <div className="mt-4 text-sm grid gap-2">
                <p><strong>Intensidad:</strong> {entry.intensidad}/10 | <strong>Ubicación:</strong> {entry.ubicacion || '-'}</p>
                <p><strong>Comida:</strong> {entry.comida || '-'}</p>
                <p><strong>Estrés:</strong> {entry.estres}/10 | <strong>Sueño:</strong> {entry.sueno_horas}h</p>
                {customFields.map((cf, idx) => <p key={idx}><strong>{cf.name}:</strong> {entry[`customField${idx}Value`] || '-'}</p>)}
                <p><strong>Medicación:</strong> {entry.medicacion || '-'}</p>
                <p><strong>Notas:</strong> {entry.notas || '-'}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export { EntryTable, EntryList };

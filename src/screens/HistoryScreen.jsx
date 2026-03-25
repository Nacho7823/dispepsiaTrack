import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, BarChart, Bar, AreaChart as RechartsAreaChart, Area
} from 'recharts';
import { Calendar, ChevronDown, ChevronUp, Edit3, Trash2, X, TrendingUp, TrendingDown, BarChart2, Circle } from 'lucide-react';
import { formatDate } from '../utils';

const EditEntryModal = ({ entry, onSave, onClose, customFields }) => {
  const initialFormData = {
    fecha: entry?.fecha ? new Date(entry.fecha).toISOString().slice(0, 16) : '',
    sintoma_tipo: entry?.sintoma_tipo?.join(', ') || '',
    intensidad: entry?.intensidad || 5,
    ubicacion: entry?.ubicacion || '',
    comida: entry?.comida || '',
    estres: entry?.estres || 5,
    sueno_horas: entry?.sueno_horas || 8,
    medicacion: entry?.medicacion || '',
    notas: entry?.notas || ''
  };

  (customFields || []).forEach((cf, idx) => {
    initialFormData[`customField${idx}Value`] = entry?.[`customField${idx}Value`] || '';
  });

  const [formData, setFormData] = useState(initialFormData);

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...formData,
      fecha: formData.fecha ? new Date(formData.fecha).toISOString() : new Date().toISOString(),
      sintoma_tipo: formData.sintoma_tipo.split(',').map(s => s.trim()).filter(s => s)
    };
    onSave(entry.id, data);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="font-bold">Editar Registro</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-slate-500 mb-1">Fecha y Hora</label>
            <input type="datetime-local" value={formData.fecha} onChange={(e) => setFormData({...formData, fecha: e.target.value})} className="w-full border p-2 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Tipo de Síntoma (separados por coma)</label>
            <input type="text" value={formData.sintoma_tipo} onChange={(e) => setFormData({...formData, sintoma_tipo: e.target.value})} className="w-full border p-2 rounded-xl text-sm" placeholder="dolor, ardor, náuseas" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Intensidad (0-10)</label>
              <input type="number" min="0" max="10" value={formData.intensidad} onChange={(e) => setFormData({...formData, intensidad: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Estrés (0-10)</label>
              <input type="number" min="0" max="10" value={formData.estres} onChange={(e) => setFormData({...formData, estres: parseInt(e.target.value) || 0})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Ubicación</label>
            <input type="text" value={formData.ubicacion} onChange={(e) => setFormData({...formData, ubicacion: e.target.value})} className="w-full border p-2 rounded-xl text-sm" placeholder="ej: abdomen superior" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Comida</label>
            <input type="text" value={formData.comida} onChange={(e) => setFormData({...formData, comida: e.target.value})} className="w-full border p-2 rounded-xl text-sm" placeholder="¿Qué comiste?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Horas de Sueño</label>
              <input type="number" step="0.5" min="0" value={formData.sueno_horas} onChange={(e) => setFormData({...formData, sueno_horas: parseFloat(e.target.value) || 0})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Medicación</label>
              <input type="text" value={formData.medicacion} onChange={(e) => setFormData({...formData, medicacion: e.target.value})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          </div>
          {customFields.map((cf, idx) => (
            <div key={idx}>
              <label className="block text-sm text-slate-500 mb-1">{cf.name}</label>
              <input type="text" value={formData[`customField${idx}Value`]} onChange={(e) => setFormData({...formData, [`customField${idx}Value`]: e.target.value})} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-500 mb-1">Notas</label>
            <textarea value={formData.notas} onChange={(e) => setFormData({...formData, notas: e.target.value})} className="w-full border p-2 rounded-xl text-sm" rows={3} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="submit" className="flex-1 bg-indigo-600 text-white py-2 rounded-xl font-medium hover:bg-indigo-700">Guardar</button>
            <button type="button" onClick={onClose} className="px-4 py-2 border rounded-xl hover:bg-slate-50">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const HistoryScreen = ({ entries, onDelete, onUpdate, customFields, columns, settings, setSettings }) => {
  const [expandedId, setExpandedId] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [chartType, setChartType] = useState('line');
  const [chartMetric, setChartMetric] = useState('intensidad');
  const [showTable, setShowTable] = useState(false);

  const activeColumns = (columns || []).filter(col => col.visible);

  const sortedData = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
      .map(e => ({
        fecha: new Date(e.fecha).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
        fullFecha: e.fecha,
        intensidad: e.intensidad || 0,
        estres: e.estres || 0,
        sueno: e.sueno_horas || 0,
        customField0Value: parseFloat(e.customField0Value) || 0,
        customField1Value: parseFloat(e.customField1Value) || 0,
        customField2Value: parseFloat(e.customField2Value) || 0
      }));
  }, [entries]);

  const displayEntries = useMemo(() => {
    return [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  }, [entries]);

  const renderChart = () => {
    const data = sortedData.map(d => ({
      ...d,
      value: chartMetric === 'sueno' ? d.sueno : chartMetric.startsWith('customField') ? d[chartMetric] : d[chartMetric]
    }));
    const domain = chartMetric === 'sueno' || chartMetric.startsWith('customField') ? [0, 24] : [0, 10];

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" fontSize={10} />
              <YAxis domain={domain} fontSize={10} />
              <Tooltip />
              <Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <RechartsAreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" fontSize={10} />
              <YAxis domain={domain} fontSize={10} />
              <Tooltip />
              <Area type="monotone" dataKey="value" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
            </RechartsAreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="estres" name="Estrés" domain={[0, 10]} />
              <YAxis type="number" dataKey="intensidad" name="Dolor" domain={[0, 10]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={data} fill="#f43f5e" />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="fecha" fontSize={10} />
              <YAxis domain={domain} fontSize={10} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={2} dot={{ fill: '#4f46e5' }} />
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  if (entries.length === 0) return <div className="flex-1 flex flex-col items-center justify-center text-slate-400"><Calendar size={48} className="mb-4 opacity-20" /><p>Sin registros.</p></div>;

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
    if (col.key === 'customFields') {
      return customFields.map((cf, idx) => entry[`customField${idx}Value`] || '-').join(', ');
    }
    if (col.key.startsWith('col_')) {
      return entry[col.key] || '-';
    }
    return '-';
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
            <button onClick={() => setChartType('line')} className="p-2 rounded"><TrendingUp size={18} /></button>
            <button onClick={() => setChartType('bar')} className="p-2 rounded"><BarChart2 size={18} /></button>
            <button onClick={() => setChartType('area')} className="p-2 rounded"><TrendingDown size={18} /></button>
            <button onClick={() => setChartType('scatter')} className="p-2 rounded"><Circle size={18} /></button>
          </div>
          <select value={chartMetric} onChange={(e) => setChartMetric(e.target.value)} className="border p-2 rounded-lg text-sm">
            <option value="intensidad">Intensidad</option>
            <option value="estres">Estrés</option>
            <option value="sueno">Horas de Sueño</option>
            {customFields.map((cf, idx) => <option key={idx} value={`customField${idx}Value`}>{cf.name}</option>)}
          </select>
        </div>
        {renderChart()}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => setShowTable(!showTable)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700"
        >
          {showTable ? 'Ver Lista' : 'Ver Tabla'}
        </button>
      </div>

      {showTable ? (
        <section className="bg-white rounded-2xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr>
                  {activeColumns.map((col, idx) => (
                    <th key={idx} className="px-4 py-3 text-left font-bold text-slate-600">{col.label}</th>
                  ))}
                  <th className="px-4 py-3 text-left font-bold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {displayEntries.map(entry => (
                  <tr key={entry.id} className="hover:bg-slate-50">
                    {activeColumns.map((col, idx) => (
                      <td key={idx} className="px-4 py-3 text-slate-700 whitespace-nowrap">
                        {getCellValue(entry, col)}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={() => setEditingEntry(entry)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"><Edit3 size={16} /></button>
                        <button onClick={() => onDelete(entry.id)} className="p-1 text-red-400 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
      <section className="bg-white rounded-2xl border overflow-hidden">
        <div className="p-4 border-b bg-slate-50 font-bold">Historial Completo</div>
        <div className="divide-y">
          {displayEntries.map(entry => (
            <div key={entry.id} className="p-4 hover:bg-slate-50">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-slate-400">{formatDate(entry.fecha)}</p>
                  <p className="font-bold">{entry.sintoma_tipo?.join(', ') || 'Registro'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setEditingEntry(entry)} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded"><Edit3 size={18} /></button>
                  <button onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)} className="p-2 text-slate-400">{expandedId === entry.id ? <ChevronUp/> : <ChevronDown/>}</button>
                  <button onClick={() => onDelete(entry.id)} className="p-2 text-red-400"><Trash2 size={18}/></button>
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
      )}

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          onSave={onUpdate}
          onClose={() => setEditingEntry(null)}
          customFields={customFields}
        />
      )}
    </div>
  );
};

export default HistoryScreen;

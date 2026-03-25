import React, { useState, useMemo } from 'react';
import { Calendar } from 'lucide-react';
import { formatDate } from '../utils/date';
import EditEntryModal from '../components/EditEntryModal';
import EntryChart from '../components/EntryChart';
import { EntryTable, EntryList } from '../components/EntryTable';

const HistoryScreen = ({ entries, onDelete, onUpdate, customFields, columns }) => {
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

  if (entries.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
        <Calendar size={48} className="mb-4 opacity-20" />
        <p>Sin registros.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
      <EntryChart
        data={sortedData}
        chartType={chartType}
        chartMetric={chartMetric}
        onChartTypeChange={setChartType}
        onChartMetricChange={setChartMetric}
        customFields={customFields}
      />

      <div className="flex justify-end">
        <button onClick={() => setShowTable(!showTable)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700">
          {showTable ? 'Ver Lista' : 'Ver Tabla'}
        </button>
      </div>

      {showTable ? (
        <EntryTable entries={displayEntries} columns={activeColumns} customFields={customFields} onEdit={setEditingEntry} onDelete={onDelete} />
      ) : (
        <EntryList entries={displayEntries} customFields={customFields} onEdit={setEditingEntry} onDelete={onDelete} />
      )}

      {editingEntry && (
        <EditEntryModal entry={editingEntry} onSave={onUpdate} onClose={() => setEditingEntry(null)} customFields={customFields} />
      )}
    </div>
  );
};

export default HistoryScreen;

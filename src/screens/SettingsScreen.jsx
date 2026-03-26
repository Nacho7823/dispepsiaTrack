import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { DEFAULT_COLUMNS } from '../constants';
import { fetchModels } from '../services/api';

const SettingsScreen = ({ settings, setSettings, setEntries }) => {
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);
  const [models, setModels] = useState([]);

  const updateSettings = (partial) => setSettings({ ...settings, ...partial });

  const getColumns = () => {
    const cols = settings.columns || DEFAULT_COLUMNS;
    return cols.map(c => ({ type: 'builtin', ...c }));
  };

  const addCustomField = () => {
    const newFields = [...(settings.customFields || []), { name: '' }];
    const cols = getColumns();
    const dataIndex = newFields.length - 1;
    const newCol = { key: `customField${dataIndex}Value`, label: '', visible: true, type: 'custom', dataIndex };
    updateSettings({ customFields: newFields, columns: [...cols, newCol] });
  };

  const removeCustomField = (colIndex) => {
    const cols = getColumns();
    const col = cols[colIndex];
    const newFields = [...(settings.customFields || [])];
    if (col.dataIndex !== undefined) {
      newFields.splice(col.dataIndex, 1);
    }
    const newCols = cols.filter((_, i) => i !== colIndex);
    updateSettings({ customFields: newFields, columns: newCols });
  };

  const updateColumnLabel = (index, value) => {
    const cols = getColumns();
    const col = cols[index];
    cols[index] = { ...cols[index], label: value };
    const updates = { columns: cols };
    if (col.type === 'custom' && col.dataIndex !== undefined) {
      const newFields = [...(settings.customFields || [])];
      if (newFields[col.dataIndex]) {
        newFields[col.dataIndex] = { name: value };
        updates.customFields = newFields;
      }
    }
    updateSettings(updates);
  };

  const toggleColumnVisibility = (index) => {
    const cols = getColumns();
    cols[index] = { ...cols[index], visible: !cols[index].visible };
    updateSettings({ columns: cols });
  };

  const handleFetchModels = async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const data = await fetchModels();
      if (data.models?.length > 0) {
        setModels(data.models);
        updateSettings({ model: data.models[0].id });
      }
    } catch (err) {
      setModelsError(err.message || "Error al obtener modelos");
    }
    setLoadingModels(false);
  };

  return (
    <div className="flex-1 p-5 md:p-8 max-w-4xl mx-auto w-full space-y-8 overflow-y-auto">
      <section className="organic-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-lg text-organic-800">IA Asistente</h3>
        <input
          type="text"
          value={settings.assistantName}
          onChange={(e) => updateSettings({ assistantName: e.target.value })}
          className="organic-input"
          placeholder="Nombre del asistente"
        />
      </section>

      <section className="organic-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-lg text-organic-800">Configuracion API</h3>
        <div>
          <label className="block text-sm text-organic-500 mb-1.5 font-medium">URL de la API</label>
          <input
            type="text"
            value={settings.apiUrl}
            onChange={(e) => updateSettings({ apiUrl: e.target.value })}
            className="organic-input text-sm"
            placeholder="https://api.openai.com/v1/chat/completions"
          />
        </div>
        <div>
          <label className="block text-sm text-organic-500 mb-1.5 font-medium">API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={(e) => updateSettings({ apiKey: e.target.value })}
            className="organic-input text-sm"
            placeholder="sk-..."
          />
        </div>
        <div>
          <label className="block text-sm text-organic-500 mb-1.5 font-medium">Modelo</label>
          <div className="flex gap-2">
            {models.length > 0 ? (
              <select
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                className="flex-1 organic-input text-sm"
              >
                {models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
              </select>
            ) : (
              <input
                type="text"
                value={settings.model}
                onChange={(e) => updateSettings({ model: e.target.value })}
                className="flex-1 organic-input text-sm"
                placeholder="gpt-3.5-turbo"
              />
            )}
            <button
              onClick={handleFetchModels}
              disabled={loadingModels || !settings.apiKey}
              className="bg-leaf-100 text-leaf-700 px-4 rounded-organic text-sm font-medium hover:bg-leaf-200 disabled:opacity-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              {loadingModels ? 'Cargando...' : 'Obtener Modelos'}
            </button>
          </div>
          {modelsError && <p className="text-xs text-terracotta-500 mt-1.5">{modelsError}</p>}
        </div>
        <p className="text-xs text-organic-400">Compatible con OpenAI y Anthropic.</p>
      </section>

      <section className="organic-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-lg text-organic-800">Campos de la Tabla</h3>
        <p className="text-xs text-organic-400">Configura qué campos registrar y mostrar en el historial</p>
        {getColumns().map((col, i) => (
          <div key={col.key} className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => toggleColumnVisibility(i)}
              className="w-4 h-4 text-leaf-600 rounded border-organic-300 focus:ring-leaf-400 cursor-pointer"
            />
            <input
              type="text"
              value={col.label}
              onChange={(e) => updateColumnLabel(i, e.target.value)}
              className="flex-1 organic-input text-sm"
              placeholder={col.type === 'custom' ? 'Nombre del campo' : col.key}
            />
            {col.type === 'custom' ? (
              <button
                onClick={() => removeCustomField(i)}
                className="text-terracotta-400 hover:bg-terracotta-50 p-2 rounded-organic transition-colors cursor-pointer"
              >
                <Trash2 size={16} />
              </button>
            ) : (
              <div className="w-8" />
            )}
          </div>
        ))}
        <button
          onClick={addCustomField}
          className="text-leaf-700 text-sm font-medium flex items-center gap-1.5 hover:text-leaf-800 cursor-pointer"
        >
          <Plus size={16} /> Agregar Campo Personalizado
        </button>
      </section>

      <section className="organic-card p-6 space-y-4">
        <h3 className="font-heading font-bold text-lg text-organic-800">System Prompt</h3>
        <textarea
          rows={8}
          value={settings.systemPrompt}
          onChange={(e) => updateSettings({ systemPrompt: e.target.value })}
          className="organic-input font-mono text-xs"
        />
      </section>

      <button
        onClick={() => { if (confirm('Borrar todo?')) setEntries(); }}
        className="w-full text-terracotta-500 p-4 border-2 border-terracotta-200 rounded-organic hover:bg-terracotta-50 font-medium transition-colors cursor-pointer"
      >
        Eliminar Historial
      </button>
    </div>
  );
};

export default SettingsScreen;

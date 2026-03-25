import React, { useState } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import { API_URL, DEFAULT_COLUMNS } from '../constants';

const SettingsScreen = ({ settings, setSettings, setEntries }) => {
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);
  const [models, setModels] = useState([]);

  const addCustomField = () => {
    setSettings({
      ...settings,
      customFields: [...(settings.customFields || []), { name: '' }]
    });
  };

  const removeCustomField = (index) => {
    const newFields = [...(settings.customFields || [])];
    newFields.splice(index, 1);
    setSettings({ ...settings, customFields: newFields });
  };

  const updateCustomField = (index, value) => {
    const newFields = [...(settings.customFields || [])];
    newFields[index] = { name: value };
    setSettings({ ...settings, customFields: newFields });
  };

  const addColumn = () => {
    const newCol = { key: `col_${Date.now()}`, label: 'Nueva Columna', visible: true };
    setSettings({
      ...settings,
      columns: [...(settings.columns || DEFAULT_COLUMNS), newCol]
    });
  };

  const removeColumn = (index) => {
    const newCols = [...(settings.columns || DEFAULT_COLUMNS)];
    newCols.splice(index, 1);
    setSettings({ ...settings, columns: newCols });
  };

  const toggleColumnVisibility = (index) => {
    const newCols = [...(settings.columns || DEFAULT_COLUMNS)];
    newCols[index] = { ...newCols[index], visible: !newCols[index].visible };
    setSettings({ ...settings, columns: newCols });
  };

  const updateColumnLabel = (index, value) => {
    const newCols = [...(settings.columns || DEFAULT_COLUMNS)];
    newCols[index] = { ...newCols[index], label: value };
    setSettings({ ...settings, columns: newCols });
  };

  const fetchModels = async () => {
    setLoadingModels(true);
    setModelsError(null);
    try {
      const res = await fetch(`${API_URL}/models`);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        setModelsError(errData.error || `Error HTTP ${res.status}`);
        setLoadingModels(false);
        return;
      }
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
        setSettings({ ...settings, model: data.models[0].id });
      }
    } catch (err) {
      setModelsError("Error al obtener modelos");
    }
    setLoadingModels(false);
  };

  return (
    <div className="flex-1 p-8 max-w-4xl mx-auto w-full space-y-8 overflow-y-auto">
      <section className="bg-white p-6 rounded-2xl border space-y-4">
        <h3 className="font-bold">IA Asistente</h3>
        <input type="text" value={settings.assistantName} onChange={(e) => setSettings({...settings, assistantName: e.target.value})} className="w-full border p-3 rounded-xl" placeholder="Nombre del asistente" />
      </section>

      <section className="bg-white p-6 rounded-2xl border space-y-4">
        <h3 className="font-bold">Configuración API</h3>
        <div>
          <label className="block text-sm text-slate-500 mb-1">URL de la API</label>
          <input type="text" value={settings.apiUrl} onChange={(e) => setSettings({...settings, apiUrl: e.target.value})} className="w-full border p-3 rounded-xl text-sm" placeholder="https://api.openai.com/v1/chat/completions" />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-1">API Key</label>
          <input type="password" value={settings.apiKey} onChange={(e) => setSettings({...settings, apiKey: e.target.value})} className="w-full border p-3 rounded-xl text-sm" placeholder="sk-..." />
        </div>
        <div>
          <label className="block text-sm text-slate-500 mb-1">Modelo</label>
          <div className="flex gap-2">
            {models.length > 0 ? (
              <select value={settings.model} onChange={(e) => setSettings({...settings, model: e.target.value})} className="flex-1 border p-3 rounded-xl text-sm">
                {models.map(m => <option key={m.id} value={m.id}>{m.name || m.id}</option>)}
              </select>
            ) : (
              <input type="text" value={settings.model} onChange={(e) => setSettings({...settings, model: e.target.value})} className="flex-1 border p-3 rounded-xl text-sm" placeholder="gpt-3.5-turbo" />
            )}
            <button onClick={fetchModels} disabled={loadingModels || !settings.apiKey} className="bg-indigo-100 text-indigo-700 px-4 rounded-xl text-sm font-medium hover:bg-indigo-200 disabled:opacity-50">
              {loadingModels ? 'Cargando...' : 'Obtener Modelos'}
            </button>
          </div>
          {modelsError && <p className="text-xs text-red-500 mt-1">{modelsError}</p>}
        </div>
        <p className="text-xs text-slate-400">Compatible con OpenAI y Anthropic. Haz clic en "Obtener Modelos" para cargar los disponibles.</p>
      </section>

      <section className="bg-white p-6 rounded-2xl border space-y-4">
        <h3 className="font-bold">Campos Personalizados</h3>
        <p className="text-xs text-slate-400">Agrega campos adicionales para tracking</p>
        {(settings.customFields || []).map((field, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="text"
              value={field?.name || ''}
              onChange={(e) => updateCustomField(i, e.target.value)}
              className="flex-1 border p-2 rounded-xl text-sm"
              placeholder={`Campo ${i + 1} (ej: Ejercicio, Agua)`}
            />
            <button onClick={() => removeCustomField(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">
              <X size={18} />
            </button>
          </div>
        ))}
        <button onClick={addCustomField} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
          <Plus size={16} /> Agregar Campo
        </button>
      </section>

      <section className="bg-white p-6 rounded-2xl border space-y-4">
        <h3 className="font-bold">Columnas de la Tabla</h3>
        <p className="text-xs text-slate-400">Configura qué columnas mostrar en el historial</p>
        {(settings.columns || DEFAULT_COLUMNS).map((col, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input
              type="checkbox"
              checked={col.visible}
              onChange={() => toggleColumnVisibility(i)}
              className="w-4 h-4 text-indigo-600 rounded"
            />
            <input
              type="text"
              value={col.label}
              onChange={(e) => updateColumnLabel(i, e.target.value)}
              className="flex-1 border p-2 rounded-xl text-sm"
            />
            <button onClick={() => removeColumn(i)} className="text-red-500 hover:bg-red-50 p-2 rounded-xl">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
        <button onClick={addColumn} className="text-indigo-600 text-sm font-medium flex items-center gap-1">
          <Plus size={16} /> Agregar Columna
        </button>
      </section>

      <section className="bg-white p-6 rounded-2xl border space-y-4">
        <h3 className="font-bold">System Prompt</h3>
        <textarea rows={8} value={settings.systemPrompt} onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})} className="w-full border p-3 rounded-xl font-mono text-xs" />
      </section>

      <button onClick={() => { if(confirm('¿Borrar todo?')) { setEntries(); } }} className="w-full text-red-500 p-4 border border-red-200 rounded-xl hover:bg-red-50">Eliminar Historial</button>
    </div>
  );
};

export default SettingsScreen;

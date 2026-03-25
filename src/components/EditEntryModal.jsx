import React, { useState } from 'react';
import { X } from 'lucide-react';

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

  const updateField = (field, value) => setFormData({ ...formData, [field]: value });

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
            <input type="datetime-local" value={formData.fecha} onChange={(e) => updateField('fecha', e.target.value)} className="w-full border p-2 rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Tipo de Síntoma (separados por coma)</label>
            <input type="text" value={formData.sintoma_tipo} onChange={(e) => updateField('sintoma_tipo', e.target.value)} className="w-full border p-2 rounded-xl text-sm" placeholder="dolor, ardor, náuseas" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Intensidad (0-10)</label>
              <input type="number" min="0" max="10" value={formData.intensidad} onChange={(e) => updateField('intensidad', parseInt(e.target.value) || 0)} className="w-full border p-2 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Estrés (0-10)</label>
              <input type="number" min="0" max="10" value={formData.estres} onChange={(e) => updateField('estres', parseInt(e.target.value) || 0)} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Ubicación</label>
            <input type="text" value={formData.ubicacion} onChange={(e) => updateField('ubicacion', e.target.value)} className="w-full border p-2 rounded-xl text-sm" placeholder="ej: abdomen superior" />
          </div>
          <div>
            <label className="block text-sm text-slate-500 mb-1">Comida</label>
            <input type="text" value={formData.comida} onChange={(e) => updateField('comida', e.target.value)} className="w-full border p-2 rounded-xl text-sm" placeholder="¿Qué comiste?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-500 mb-1">Horas de Sueño</label>
              <input type="number" step="0.5" min="0" value={formData.sueno_horas} onChange={(e) => updateField('sueno_horas', parseFloat(e.target.value) || 0)} className="w-full border p-2 rounded-xl text-sm" />
            </div>
            <div>
              <label className="block text-sm text-slate-500 mb-1">Medicación</label>
              <input type="text" value={formData.medicacion} onChange={(e) => updateField('medicacion', e.target.value)} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          </div>
          {customFields.map((cf, idx) => (
            <div key={idx}>
              <label className="block text-sm text-slate-500 mb-1">{cf.name}</label>
              <input type="text" value={formData[`customField${idx}Value`]} onChange={(e) => updateField(`customField${idx}Value`, e.target.value)} className="w-full border p-2 rounded-xl text-sm" />
            </div>
          ))}
          <div>
            <label className="block text-sm text-slate-500 mb-1">Notas</label>
            <textarea value={formData.notas} onChange={(e) => updateField('notas', e.target.value)} className="w-full border p-2 rounded-xl text-sm" rows={3} />
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

export default EditEntryModal;

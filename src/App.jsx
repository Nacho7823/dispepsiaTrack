import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MessageSquare, 
  BarChart3, 
  Download, 
  Settings, 
  Send, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Activity,
  Calendar,
  Plus,
  X,
  Edit3,
  BarChart2,
  TrendingUp,
  TrendingDown,
  Circle
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ScatterChart, Scatter, BarChart, Bar, AreaChart as RechartsAreaChart, Area, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';

const API_URL = 'http://localhost:5001/api';

const getActiveCustomFields = (customFields) => {
  return (customFields || []).filter(f => f && f.name && f.name.trim());
};

const DEFAULT_COLUMNS = [
  { key: 'fecha', label: 'Fecha', visible: true },
  { key: 'sintoma_tipo', label: 'Síntoma', visible: true },
  { key: 'intensidad', label: 'Intensidad', visible: true },
  { key: 'ubicacion', label: 'Ubicación', visible: true },
  { key: 'comida', label: 'Comida', visible: true },
  { key: 'estres', label: 'Estrés', visible: true },
  { key: 'sueno_horas', label: 'Sueño', visible: true },
  { key: 'medicacion', label: 'Medicación', visible: false },
  { key: 'notas', label: 'Notas', visible: false },
  { key: 'customFields', label: 'Campos Personalizados', visible: true }
];

const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-3.5-turbo";
const DEFAULT_SYSTEM_PROMPT = `Eres un médico asistente especializado en dispepsia funcional. 
Tu objetivo es ayudar al usuario a registrar sus síntomas, alimentación, medicación y estilo de vida.
Tono: empático, breve y conversacional. 
PASOS PARA REGISTRAR:
1. Primero pregunta la fecha y hora del síntoma (puedes usar la actual si no especifica)
2. Luego pregunta el tipo de síntoma
3. Pregunta la intensidad del 1 al 10
4. Pregunta otros detalles (ubicación, comida, estrés, sueño, medicación)
5. Al FINALIZAR, genera un bloque de código JSON con esta estructura exacta:
{
  "fecha": "2024-01-01T12:00:00.000Z",
  "sintoma_tipo": ["tipo"],
  "intensidad": 5,
  "ubicacion": "texto",
  "comida": "descripción",
  "estres": 5,
  "sueno_horas": 8,
  "medicacion": "texto",
  "notas": "texto",
  "customFieldValue": ""
}`;

const COLORS = ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Fecha no válida";
    return d.toLocaleDateString('es-ES', { 
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' 
    });
  } catch (e) {
    return "Error fecha";
  }
};

const formatShortDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch (e) {
    return "-";
  }
};

const generateMarkdown = (entries, customFields) => {
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  let md = "# Reporte de Seguimiento - Dispepsia\n\n";
  let header = "| Fecha | Síntoma | Int. | Comida | Estrés | Sueño |";
  let separator = "| :--- | :--- | :--- | :--- | :--- | :--- |";
  
  customFields.forEach(() => {
    header += " | :--- |";
  });
  header += " Notas\n" + separator + "\n";
  
  sorted.forEach(e => {
    let row = `| ${formatDate(e.fecha)} | ${e.sintoma_tipo?.join(', ') || '-'} | ${e.intensidad}/10 | ${e.comida || '-'} | ${e.estres}/10 | ${e.sueno_horas}h |`;
    customFields.forEach((cf, i) => {
      row += ` ${e[`customField${i}Value`] || '-'} |`;
    });
    row += ` ${e.notas || '-'}\n`;
    md += row;
  });
  
  return md;
};

const App = () => {
  const [activeTab, setActiveTab] = useState('assistant');
  const [entries, setEntries] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [settings, setSettings] = useState({
    assistantName: 'DigestiveBot',
    systemPrompt: DEFAULT_SYSTEM_PROMPT,
    model: DEFAULT_MODEL,
    apiUrl: DEFAULT_API_URL,
    apiKey: '',
    customFields: [],
    columns: DEFAULT_COLUMNS
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entriesRes, settingsRes, convRes] = await Promise.all([
          fetch(`${API_URL}/entries`),
          fetch(`${API_URL}/settings`),
          fetch(`${API_URL}/conversations`)
        ]);
        
        if (entriesRes.ok) {
          const entriesData = await entriesRes.json();
          setEntries(entriesData);
        }
        
        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          if (settingsData.systemPrompt) {
            setSettings(prev => ({ ...prev, ...settingsData }));
          }
        }

        if (convRes.ok) {
          const convData = await convRes.json();
          setConversations(convData);
        }
        
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('No se pudo conectar con el servidor. Usando modo local.');
        setIsLoaded(true);
      }
    };
    
    loadData();
  }, []);

  const saveSettings = async (newSettings) => {
    setSettings(newSettings);
    try {
      await fetch(`${API_URL}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSettings)
      });
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  };

  const addEntry = async (rawEntry) => {
    const validatedEntry = {
      ...rawEntry,
      id: Date.now(),
      fecha: rawEntry.fecha && !isNaN(new Date(rawEntry.fecha).getTime()) 
             ? rawEntry.fecha 
             : new Date().toISOString()
    };
    
    setEntries(prev => [validatedEntry, ...prev]);
    
    try {
      await fetch(`${API_URL}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validatedEntry)
      });
    } catch (err) {
      console.error('Error saving entry:', err);
    }
  };

  const updateEntry = async (id, data) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    try {
      await fetch(`${API_URL}/entries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
    } catch (err) {
      console.error('Error updating entry:', err);
    }
  };

  const deleteEntry = async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await fetch(`${API_URL}/entries/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const clearAllEntries = async () => {
    setEntries([]);
    try {
      await fetch(`${API_URL}/entries`, {
        method: 'DELETE'
      });
    } catch (err) {
      console.error('Error clearing entries:', err);
    }
  };

  const createConversation = async (title) => {
    try {
      const res = await fetch(`${API_URL}/conversations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, messages: [] })
      });
      const data = await res.json();
      if (data.conversation) {
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
      }
      return data.conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  };

  const updateConversation = async (id, messages) => {
    try {
      await fetch(`${API_URL}/conversations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages })
      });
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, messages, updatedAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  };

  const deleteConversation = async (id) => {
    try {
      await fetch(`${API_URL}/conversations/${id}`, { method: 'DELETE' });
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  };

  const loadConversation = (conv) => {
    setActiveConversationId(conv.id);
  };

  const startNewConversation = async () => {
    const conv = await createConversation(`Conversación ${new Date().toLocaleString('es-ES')}`);
    if (conv) {
      setActiveConversationId(conv.id);
    }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row font-sans text-slate-900">
      {error && (
        <div className="fixed top-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-2 rounded-lg z-50">
          {error}
        </div>
      )}
      <nav className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 p-4 flex md:flex-col justify-between">
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center gap-2 px-2 py-4">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <Activity size={24} />
            </div>
            <h1 className="font-bold text-xl tracking-tight">Dispepsia Tracker</h1>
          </div>
          <div className="flex md:flex-col gap-1 w-full overflow-x-auto">
            <NavButton active={activeTab === 'assistant'} onClick={() => setActiveTab('assistant')} icon={<MessageSquare size={20}/>} label="Asistente" />
            <NavButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<BarChart3 size={20}/>} label="Historial" />
            <NavButton active={activeTab === 'export'} onClick={() => setActiveTab('export')} icon={<Download size={20}/>} label="Exportar" />
            <NavButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<Settings size={20}/>} label="Ajustes" />
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'assistant' && (
          <AssistantScreen 
            settings={settings} 
            onSave={addEntry}
            conversations={conversations}
            activeConversation={activeConversation}
            onLoadConversation={loadConversation}
            onNewConversation={startNewConversation}
            onUpdateConversation={updateConversation}
            onDeleteConversation={deleteConversation}
          />
        )}
        {activeTab === 'history' && <HistoryScreen entries={entries} onDelete={deleteEntry} onUpdate={updateEntry} customFields={getActiveCustomFields(settings.customFields)} columns={settings.columns} setSettings={saveSettings} settings={settings} />}
        {activeTab === 'export' && <ExportScreen entries={entries} customFields={getActiveCustomFields(settings.customFields)} />}
        {activeTab === 'settings' && <SettingsScreen settings={settings} setSettings={saveSettings} setEntries={clearAllEntries} />}
      </main>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
);

const AssistantScreen = ({ settings, onSave, conversations, activeConversation, onLoadConversation, onNewConversation, onUpdateConversation, onDeleteConversation }) => {
  const [messages, setMessages] = useState([{ role: 'assistant', content: `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?` }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, isTyping]);

  useEffect(() => {
    if (activeConversation && activeConversation.messages) {
      if (activeConversation.messages.length > 0) {
        setMessages(activeConversation.messages);
      } else {
        setMessages([{ role: 'assistant', content: `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?` }]);
      }
    } else {
      setMessages([{ role: 'assistant', content: `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?` }]);
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    if (messages.length === 1 && messages[0].role === 'assistant' && !activeConversation) {
      setMessages([{ role: 'assistant', content: `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?` }]);
    }
  }, [settings.assistantName]);

  const callAI = async (userMessages) => {
    setIsTyping(true);
    setError(null);
    
    if (!settings.apiKey) {
      setError('Configura la API Key en Ajustes');
      setIsTyping(false);
      return;
    }

    let attempts = 0;
    const formattedMessages = userMessages.map(m => ({ 
      role: m.role === 'assistant' ? 'assistant' : 'user', 
      content: m.content 
    }));

    while (attempts < 5) {
      try {
        const response = await fetch(settings.apiUrl, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${settings.apiKey}`
          },
          body: JSON.stringify({ 
            model: settings.model,
            messages: [
              { role: 'system', content: settings.systemPrompt },
              ...formattedMessages
            ],
            temperature: 0.7
          })
        });
        
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        
        if (text) {
          const newMessages = [...userMessages, { role: 'assistant', content: text }];
          setMessages(newMessages);
          
          if (activeConversation) {
            onUpdateConversation(activeConversation.id, newMessages);
          }
          
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const entryData = JSON.parse(jsonMatch[0]);
              onSave(entryData);
              const savedMsg = [...newMessages, { role: 'assistant', content: "Registro guardado correctamente. ¿Deseas anotar algo más?" }];
              setMessages(savedMsg);
              if (activeConversation) {
                onUpdateConversation(activeConversation.id, savedMsg);
              }
            } catch (e) { }
          }
          break;
        }
      } catch (error) {
        console.error('API Error:', error);
        attempts++;
        if (attempts >= 5) {
          setError(error.message || 'Error al conectar con la API');
        }
        await new Promise(r => setTimeout(r, Math.pow(2, attempts) * 1000));
      }
    }
    setIsTyping(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    
    if (activeConversation) {
      onUpdateConversation(activeConversation.id, newMessages);
    }
    
    callAI(newMessages);
  };

  const handleNewConversation = async () => {
    if (activeConversation) {
      await onNewConversation();
    } else {
      setMessages([{ role: 'assistant', content: `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?` }]);
    }
  };

  return (
    <div className="flex-1 flex h-full">
      <div className={`${showConversations ? 'block' : 'hidden'} md:block w-64 bg-white border-r border-slate-200 flex flex-col`}>
        <div className="p-4 border-b">
          <button onClick={handleNewConversation} className="w-full bg-indigo-600 text-white py-2 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-indigo-700">
            <Plus size={18} /> Nueva
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.map(conv => (
            <div key={conv.id} className={`p-3 border-b cursor-pointer hover:bg-slate-50 ${activeConversation?.id === conv.id ? 'bg-indigo-50' : ''}`}>
              <div className="flex justify-between items-start">
                <div onClick={() => onLoadConversation(conv)} className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{conv.title}</p>
                  <p className="text-xs text-slate-400">{formatShortDate(conv.updatedAt || conv.createdAt)}</p>
                </div>
                <button onClick={() => onDeleteConversation(conv.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-slate-400 text-center">Sin conversaciones</p>
          )}
        </div>
      </div>
      
      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full p-4 overflow-hidden">
        <div className="md:hidden mb-2">
          <button onClick={() => setShowConversations(!showConversations)} className="text-slate-500 p-2">
            {showConversations ? <X size={20} /> : <MessageSquare size={20} />}
          </button>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
            {error}
          </div>
        )}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" ref={scrollRef}>
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border text-slate-800 rounded-tl-none'}`}>{m.content}</div>
            </div>
          ))}
          {isTyping && <div className="flex justify-start"><div className="bg-white border p-4 rounded-2xl flex gap-1 animate-pulse">...</div></div>}
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-lg border flex gap-2">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Escribe aquí..." className="flex-1 outline-none" />
          <button onClick={handleSend} className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700"><Send size={20} /></button>
        </div>
      </div>
    </div>
  );
};

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

  const activeColumns = (columns || DEFAULT_COLUMNS).filter(col => col.visible);

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

const ChartCard = ({ title, children }) => (
  <div className="bg-white p-6 rounded-2xl border shadow-sm">
    <h3 className="text-slate-500 text-xs font-bold uppercase mb-4">{title}</h3>
    {children}
  </div>
);

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

const SettingsScreen = ({ settings, setSettings, setEntries }) => {
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelsError, setModelsError] = useState(null);

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
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        setSettings({ ...settings, model: data.models[0].id });
      } else if (data.error) {
        setModelsError(data.error);
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
            <input type="text" value={settings.model} onChange={(e) => setSettings({...settings, model: e.target.value})} className="flex-1 border p-3 rounded-xl text-sm" placeholder="gpt-3.5-turbo" />
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

export default App;

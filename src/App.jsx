import React, { useState, useEffect } from 'react';
import {
  MessageSquare, BarChart3, Download, Settings, Activity
} from 'lucide-react';
import { API_URL, DEFAULT_SYSTEM_PROMPT, DEFAULT_API_URL, DEFAULT_MODEL, DEFAULT_COLUMNS } from './constants';
import { getActiveCustomFields } from './utils';
import AssistantScreen from './screens/AssistantScreen';
import HistoryScreen from './screens/HistoryScreen';
import ExportScreen from './screens/ExportScreen';
import SettingsScreen from './screens/SettingsScreen';

const NavButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-slate-500 hover:bg-slate-100'}`}>
    {icon}
    <span className="hidden md:inline">{label}</span>
  </button>
);

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
      await fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' });
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  };

  const clearAllEntries = async () => {
    setEntries([]);
    try {
      await fetch(`${API_URL}/entries`, { method: 'DELETE' });
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
    return conv;
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

export default App;

import React, { useState, useEffect } from 'react';
import { MessageSquare, BarChart3, Download, Settings, Activity } from 'lucide-react';
import { fetchEntries, fetchSettings, fetchConversations } from './services/api';
import { getActiveCustomFields } from './utils';
import { useEntries } from './hooks/useEntries';
import { useConversations } from './hooks/useConversations';
import { useSettings } from './hooks/useSettings';
import NavButton from './components/NavButton';
import AssistantScreen from './screens/AssistantScreen';
import HistoryScreen from './screens/HistoryScreen';
import ExportScreen from './screens/ExportScreen';
import SettingsScreen from './screens/SettingsScreen';

const App = () => {
  const [activeTab, setActiveTab] = useState('assistant');
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(null);

  const { entries, setEntries, addEntry, updateEntry, deleteEntry, clearAllEntries } = useEntries();
  const { settings, setSettings } = useSettings();
  const conversationHooks = useConversations();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [entriesData, settingsData, convData] = await Promise.all([
          fetchEntries().catch(() => []),
          fetchSettings().catch(() => null),
          fetchConversations().catch(() => []),
        ]);

        if (entriesData) setEntries(entriesData);
        if (settingsData?.systemPrompt) setSettings(settingsData);
        if (convData) conversationHooks.setConversations(convData);
        setIsLoaded(true);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('No se pudo conectar con el servidor. Usando modo local.');
        setIsLoaded(true);
      }
    };
    loadData();
  }, []);

  const tabs = [
    { id: 'assistant', label: 'Asistente', icon: <MessageSquare size={20} /> },
    { id: 'history', label: 'Historial', icon: <BarChart3 size={20} /> },
    { id: 'export', label: 'Exportar', icon: <Download size={20} /> },
    { id: 'settings', label: 'Ajustes', icon: <Settings size={20} /> },
  ];

  if (!isLoaded) return null;

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
            <div className="bg-indigo-600 p-2 rounded-lg text-white"><Activity size={24} /></div>
            <h1 className="font-bold text-xl tracking-tight">Dispepsia Tracker</h1>
          </div>
          <div className="flex md:flex-col gap-1 w-full overflow-x-auto">
            {tabs.map(tab => (
              <NavButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        {activeTab === 'assistant' && (
          <AssistantScreen
            settings={settings}
            onSave={addEntry}
            conversations={conversationHooks.conversations}
            activeConversation={conversationHooks.activeConversation}
            onLoadConversation={conversationHooks.loadConversation}
            onNewConversation={conversationHooks.startNewConversation}
            onUpdateConversation={conversationHooks.updateConversation}
            onDeleteConversation={conversationHooks.deleteConversation}
          />
        )}
        {activeTab === 'history' && (
          <HistoryScreen entries={entries} onDelete={deleteEntry} onUpdate={updateEntry} customFields={getActiveCustomFields(settings.customFields)} columns={settings.columns} />
        )}
        {activeTab === 'export' && (
          <ExportScreen entries={entries} customFields={getActiveCustomFields(settings.customFields)} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen settings={settings} setSettings={setSettings} setEntries={clearAllEntries} />
        )}
      </main>
    </div>
  );
};

export default App;

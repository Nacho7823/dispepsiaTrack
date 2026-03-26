import React, { useState, useEffect } from 'react';
import { MessageSquare, BarChart3, Download, Settings, Leaf } from 'lucide-react';
import { fetchEntries, fetchSettings, fetchConversations } from './services/api';
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
    <div className="min-h-screen bg-organic-50 flex flex-col md:flex-row font-body text-organic-900 organic-grain">
      <div className="organic-blob w-96 h-96 bg-leaf-300 -top-48 -right-48" />
      <div className="organic-blob w-64 h-64 bg-terracotta-200 bottom-20 -left-32" />
      {error && (
        <div className="fixed top-4 right-4 bg-terracotta-50 border border-terracotta-300 text-terracotta-700 px-5 py-3 rounded-organic z-50 shadow-organic">
          {error}
        </div>
      )}
      <nav className="w-full md:w-72 bg-white/90 backdrop-blur-sm border-b md:border-r border-organic-200 p-5 flex md:flex-col justify-between relative z-10">
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center gap-3 px-3 py-5">
            <div className="bg-leaf-700 p-2.5 rounded-organic text-white shadow-leaf">
              <Leaf size={24} />
            </div>
            <div>
              <h1 className="font-heading font-bold text-xl tracking-tight text-organic-900">Dispepsia</h1>
              <p className="text-xs text-organic-400 font-body">Tracker</p>
            </div>
          </div>
          <div className="flex md:flex-col gap-1.5 w-full overflow-x-auto">
            {tabs.map(tab => (
              <NavButton key={tab.id} active={activeTab === tab.id} onClick={() => setActiveTab(tab.id)} icon={tab.icon} label={tab.label} />
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-hidden relative flex flex-col z-10">
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
          <HistoryScreen entries={entries} onDelete={deleteEntry} onUpdate={updateEntry} onAdd={addEntry} columns={settings.columns} />
        )}
        {activeTab === 'export' && (
          <ExportScreen entries={entries} columns={settings.columns} />
        )}
        {activeTab === 'settings' && (
          <SettingsScreen settings={settings} setSettings={setSettings} setEntries={clearAllEntries} />
        )}
      </main>
    </div>
  );
};

export default App;

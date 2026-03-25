import React, { useState, useEffect, useRef } from 'react';
import { Send, Trash2, Plus, X, MessageSquare } from 'lucide-react';
import { API_URL } from '../constants';
import { formatShortDate, buildSystemPrompt } from '../utils';

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

  const callAI = async (userMessages, conv) => {
    setIsTyping(true);
    setError(null);

    if (!settings.apiKey) {
      setError('Configura la API Key en Ajustes');
      setIsTyping(false);
      return;
    }

    const activeConv = conv || activeConversation;
    let attempts = 0;
    const formattedMessages = userMessages.map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }));

    while (attempts < 5) {
      try {
        const systemPrompt = buildSystemPrompt(settings.systemPrompt, settings.customFields);
        const res = await fetch(`${API_URL}/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: settings.model,
            systemPrompt,
            messages: formattedMessages,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${res.status}`);
        }

        const data = await res.json();

        if (data.content) {
          const newMessages = [...userMessages, { role: 'assistant', content: data.content }];
          setMessages(newMessages);

          if (activeConv) {
            onUpdateConversation(activeConv.id, newMessages);
          }

          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const entryData = JSON.parse(jsonMatch[0]);
              onSave(entryData);
              const savedMsg = [...newMessages, { role: 'assistant', content: "Registro guardado correctamente. ¿Deseas anotar algo más?" }];
              setMessages(savedMsg);
              if (activeConv) {
                onUpdateConversation(activeConv.id, savedMsg);
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

  const handleSend = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');

    let conv = activeConversation;
    if (!conv) {
      conv = await onNewConversation();
    }
    if (conv) {
      onUpdateConversation(conv.id, newMessages);
    }

    callAI(newMessages, conv);
  };

  const handleNewConversation = async () => {
    await onNewConversation();
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

export default AssistantScreen;

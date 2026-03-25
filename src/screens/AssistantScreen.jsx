import React, { useState, useEffect, useRef } from 'react';
import { Send, X, MessageSquare } from 'lucide-react';
import { sendChatMessage } from '../services/api';
import { buildSystemPrompt } from '../utils/schema';
import ChatMessage from '../components/ChatMessage';
import ConversationSidebar from '../components/ConversationSidebar';

const AssistantScreen = ({ settings, onSave, conversations, activeConversation, onLoadConversation, onNewConversation, onUpdateConversation, onDeleteConversation }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [showConversations, setShowConversations] = useState(false);
  const scrollRef = useRef(null);

  const welcomeMessage = `¡Hola! Soy ${settings.assistantName}. ¿Cómo te sientes hoy?`;

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages, isTyping]);

  useEffect(() => {
    if (activeConversation?.messages?.length > 0) {
      setMessages(activeConversation.messages);
    } else {
      setMessages([{ role: 'assistant', content: welcomeMessage }]);
    }
  }, [activeConversation?.id]);

  const callAI = async (userMessages, conv) => {
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
        const systemPrompt = buildSystemPrompt(settings.systemPrompt, settings.customFields);
        const data = await sendChatMessage({ model: settings.model, systemPrompt, messages: formattedMessages });

        if (data.content) {
          const newMessages = [...userMessages, { role: 'assistant', content: data.content }];
          setMessages(newMessages);
          if (conv) onUpdateConversation(conv.id, newMessages);

          const jsonMatch = data.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            try {
              const entryData = JSON.parse(jsonMatch[0]);
              onSave(entryData);
              const savedMsg = [...newMessages, { role: 'assistant', content: "Registro guardado correctamente. ¿Deseas anotar algo más?" }];
              setMessages(savedMsg);
              if (conv) onUpdateConversation(conv.id, savedMsg);
            } catch { }
          }
          break;
        }
      } catch (err) {
        console.error('API Error:', err);
        attempts++;
        if (attempts >= 5) setError(err.message || 'Error al conectar con la API');
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
    if (!conv) conv = await onNewConversation();
    if (conv) onUpdateConversation(conv.id, newMessages);
    callAI(newMessages, conv);
  };

  return (
    <div className="flex-1 flex h-full">
      <div className={`${showConversations ? 'block' : 'hidden'} md:block`}>
        <ConversationSidebar
          conversations={conversations}
          activeConversation={activeConversation}
          onLoad={onLoadConversation}
          onNew={onNewConversation}
          onDelete={onDeleteConversation}
        />
      </div>

      <div className="flex-1 flex flex-col h-full max-w-4xl mx-auto w-full p-4 overflow-hidden">
        <div className="md:hidden mb-2">
          <button onClick={() => setShowConversations(!showConversations)} className="text-slate-500 p-2">
            {showConversations ? <X size={20} /> : <MessageSquare size={20} />}
          </button>
        </div>
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
        )}
        <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" ref={scrollRef}>
          {messages.map((m, i) => <ChatMessage key={i} message={m} />)}
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

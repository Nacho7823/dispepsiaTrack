import { useState, useCallback } from 'react';
import { createConversationApi, updateConversationApi, deleteConversationApi } from '../services/api';

export const useConversations = (initialConversations = []) => {
  const [conversations, setConversations] = useState(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState(null);

  const createConversation = useCallback(async (title) => {
    try {
      const data = await createConversationApi({ title, messages: [] });
      if (data.conversation) {
        setConversations(prev => [data.conversation, ...prev]);
        setActiveConversationId(data.conversation.id);
      }
      return data.conversation;
    } catch (err) {
      console.error('Error creating conversation:', err);
    }
  }, []);

  const updateConversation = useCallback(async (id, messages) => {
    try {
      await updateConversationApi(id, messages);
      setConversations(prev => prev.map(c =>
        c.id === id ? { ...c, messages, updatedAt: new Date().toISOString() } : c
      ));
    } catch (err) {
      console.error('Error updating conversation:', err);
    }
  }, []);

  const deleteConversation = useCallback(async (id) => {
    try {
      await deleteConversationApi(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } catch (err) {
      console.error('Error deleting conversation:', err);
    }
  }, [activeConversationId]);

  const startNewConversation = useCallback(async () => {
    const conv = await createConversation(`Conversación ${new Date().toLocaleString('es-ES')}`);
    return conv;
  }, [createConversation]);

  const loadConversation = useCallback((conv) => {
    setActiveConversationId(conv.id);
  }, []);

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return {
    conversations,
    setConversations,
    activeConversation,
    activeConversationId,
    setActiveConversationId,
    createConversation,
    updateConversation,
    deleteConversation,
    startNewConversation,
    loadConversation,
  };
};

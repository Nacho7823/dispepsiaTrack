import { API_URL } from '../constants';

const jsonHeaders = { 'Content-Type': 'application/json' };

const handleResponse = async (res) => {
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export const fetchEntries = () => fetch(`${API_URL}/entries`).then(handleResponse);
export const createEntry = (entry) => fetch(`${API_URL}/entries`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(entry) }).then(handleResponse);
export const updateEntryApi = (id, data) => fetch(`${API_URL}/entries/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify(data) }).then(handleResponse);
export const deleteEntryApi = (id) => fetch(`${API_URL}/entries/${id}`, { method: 'DELETE' });
export const clearAllEntriesApi = () => fetch(`${API_URL}/entries`, { method: 'DELETE' });

export const fetchSettings = () => fetch(`${API_URL}/settings`).then(handleResponse);
export const saveSettingsApi = (settings) => fetch(`${API_URL}/settings`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(settings) }).then(handleResponse);

export const fetchConversations = () => fetch(`${API_URL}/conversations`).then(handleResponse);
export const createConversationApi = (data) => fetch(`${API_URL}/conversations`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(data) }).then(handleResponse);
export const updateConversationApi = (id, messages) => fetch(`${API_URL}/conversations/${id}`, { method: 'PUT', headers: jsonHeaders, body: JSON.stringify({ messages }) });
export const deleteConversationApi = (id) => fetch(`${API_URL}/conversations/${id}`, { method: 'DELETE' });

export const sendChatMessage = (payload) => fetch(`${API_URL}/chat`, { method: 'POST', headers: jsonHeaders, body: JSON.stringify(payload) }).then(handleResponse);
export const fetchModels = () => fetch(`${API_URL}/models`).then(handleResponse);

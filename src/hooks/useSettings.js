import { useState, useCallback } from 'react';
import { saveSettingsApi } from '../services/api';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_API_URL, DEFAULT_MODEL, DEFAULT_COLUMNS } from '../constants';

const defaultSettings = {
  assistantName: 'DigestiveBot',
  systemPrompt: DEFAULT_SYSTEM_PROMPT,
  model: DEFAULT_MODEL,
  apiUrl: DEFAULT_API_URL,
  apiKey: '',
  customFields: [],
  columns: DEFAULT_COLUMNS
};

export const useSettings = (initialSettings) => {
  const [settings, setSettings] = useState(initialSettings || defaultSettings);

  const saveSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    try {
      await saveSettingsApi(newSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, []);

  return { settings, setSettings: saveSettings };
};

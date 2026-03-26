import { useState, useCallback } from 'react';
import { saveSettingsApi } from '../services/api';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_API_URL, DEFAULT_MODEL, DEFAULT_COLUMNS } from '../constants';

const migrateSettings = (settings) => {
  let columns = settings.columns || DEFAULT_COLUMNS;
  const customFields = settings.customFields || [];

  // Remove legacy customFields meta-column
  const hasMetaColumn = columns.some(c => c.key === 'customFields');
  if (hasMetaColumn) {
    columns = columns.filter(c => c.key !== 'customFields');
  }

  // Ensure type field exists on all columns
  columns = columns.map(c => ({ type: 'builtin', ...c }));

  // Ensure dataIndex on custom field columns
  const customCols = columns.filter(c => c.type === 'custom');
  customCols.forEach((col, idx) => {
    if (col.dataIndex === undefined) {
      col.dataIndex = idx;
    }
  });

  // Add individual custom field columns if missing
  if (customFields.length > 0 && customCols.length === 0) {
    customFields.forEach((cf, idx) => {
      columns.push({
        key: `customField${idx}Value`,
        label: cf.name || '',
        visible: true,
        type: 'custom',
        dataIndex: idx
      });
    });
  }

  return { ...settings, columns, customFields };
};

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
  const [settings, setSettings] = useState(migrateSettings(initialSettings || defaultSettings));

  const saveSettings = useCallback(async (newSettings) => {
    const migrated = migrateSettings(newSettings);
    setSettings(migrated);
    try {
      await saveSettingsApi(migrated);
    } catch (err) {
      console.error('Error saving settings:', err);
    }
  }, []);

  return { settings, setSettings: saveSettings };
};

import { useState, useCallback } from 'react';
import { createEntry, updateEntryApi, deleteEntryApi, clearAllEntriesApi } from '../services/api';

export const useEntries = (initialEntries = []) => {
  const [entries, setEntries] = useState(initialEntries);

  const addEntry = useCallback(async (rawEntry) => {
    const validatedEntry = {
      ...rawEntry,
      id: Date.now(),
      fecha: rawEntry.fecha && !isNaN(new Date(rawEntry.fecha).getTime())
        ? rawEntry.fecha
        : new Date().toISOString()
    };
    setEntries(prev => [validatedEntry, ...prev]);
    try {
      await createEntry(validatedEntry);
    } catch (err) {
      console.error('Error saving entry:', err);
    }
  }, []);

  const updateEntry = useCallback(async (id, data) => {
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...data } : e));
    try {
      await updateEntryApi(id, data);
    } catch (err) {
      console.error('Error updating entry:', err);
    }
  }, []);

  const deleteEntry = useCallback(async (id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
    try {
      await deleteEntryApi(id);
    } catch (err) {
      console.error('Error deleting entry:', err);
    }
  }, []);

  const clearAllEntries = useCallback(async () => {
    setEntries([]);
    try {
      await clearAllEntriesApi();
    } catch (err) {
      console.error('Error clearing entries:', err);
    }
  }, []);

  return { entries, setEntries, addEntry, updateEntry, deleteEntry, clearAllEntries };
};

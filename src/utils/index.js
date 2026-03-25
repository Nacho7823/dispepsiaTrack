export { formatDate, formatShortDate } from './date';
export { generateMarkdown } from './markdown';
export { buildSystemPrompt } from './schema';
export { copyToClipboard } from './clipboard';

export const getActiveCustomFields = (customFields) => {
  return (customFields || []).filter(f => f && f.name && f.name.trim());
};

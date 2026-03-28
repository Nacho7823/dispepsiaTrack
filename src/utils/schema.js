const buildEntrySchema = (customFields) => {
  const fields = customFields || [];
  const customEntries = fields
    .filter(f => f.name && f.name.trim())
    .map(f => `  "${f.name.trim()}": "texto"`)
    .join(',\n');

  return `{
  "sintoma_tipo": ["tipo"],
  "intensidad": 5,
  "ubicacion": "texto",
  "comida": "descripción",
  "estres": 5,
  "sueno_horas": 8,
  "medicacion": "texto",
  "notas": "texto"${customEntries ? ',\n' + customEntries : ''}
}`;
};

export const buildSystemPrompt = (basePrompt, customFields) => {
  const schema = buildEntrySchema(customFields);
  return `${basePrompt}

Estructura JSON del registro:
${schema}`;
};

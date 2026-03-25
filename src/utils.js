export const getActiveCustomFields = (customFields) => {
  return (customFields || []).filter(f => f && f.name && f.name.trim());
};

export const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Fecha no válida";
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch (e) {
    return "Error fecha";
  }
};

export const formatShortDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch (e) {
    return "-";
  }
};

export const generateMarkdown = (entries, customFields) => {
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  let md = "# Reporte de Seguimiento - Dispepsia\n\n";
  let header = "| Fecha | Síntoma | Int. | Comida | Estrés | Sueño |";
  let separator = "| :--- | :--- | :--- | :--- | :--- | :--- |";

  customFields.forEach(() => {
    header += " | :--- |";
  });
  header += " Notas\n" + separator + "\n";

  sorted.forEach(e => {
    let row = `| ${formatDate(e.fecha)} | ${e.sintoma_tipo?.join(', ') || '-'} | ${e.intensidad}/10 | ${e.comida || '-'} | ${e.estres}/10 | ${e.sueno_horas}h |`;
    customFields.forEach((cf, i) => {
      row += ` ${e[`customField${i}Value`] || '-'} |`;
    });
    row += ` ${e.notas || '-'}\n`;
    md += row;
  });

  return md;
};

export const buildEntrySchema = (customFields) => {
  const fields = customFields || [];
  const customEntries = fields
    .filter(f => f.name && f.name.trim())
    .map(f => `  "${f.name.trim()}": "texto"`)
    .join(',\n');

  return `{
  "fecha": "2024-01-01T12:00:00.000Z",
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

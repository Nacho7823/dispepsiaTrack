import { formatDate } from './date';

const getExportValue = (entry, col) => {
  if (col.type !== 'custom') {
    if (col.key === 'fecha') return formatDate(entry.fecha);
    if (col.key === 'sintoma_tipo') return entry.sintoma_tipo?.join(', ') || '-';
    if (col.key === 'intensidad') return `${entry.intensidad}/10`;
    if (col.key === 'ubicacion') return entry.ubicacion || '-';
    if (col.key === 'comida') return entry.comida || '-';
    if (col.key === 'estres') return `${entry.estres}/10`;
    if (col.key === 'sueno_horas') return `${entry.sueno_horas}h`;
    if (col.key === 'medicacion') return entry.medicacion || '-';
    if (col.key === 'notas') return entry.notas || '-';
    return entry[col.key] || '-';
  }
  return entry[`customField${col.dataIndex}Value`] || '-';
};

const getExportColumns = (columns) => {
  const builtin = (columns || []).filter(c => c.type === 'builtin');
  const custom = (columns || []).filter(c => c.type === 'custom');
  return [...builtin, ...custom];
};

export const generateMarkdown = (entries, columns) => {
  const cols = getExportColumns(columns);
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  let md = "# Reporte de Seguimiento - Dispepsia\n\n";
  let header = "|";
  let separator = "|";

  cols.forEach(col => {
    const label = col.type === 'custom'
      ? (col.label || `Campo ${col.dataIndex + 1}`)
      : col.label;
    header += ` ${label} |`;
    separator += ` :--- |`;
  });

  md += header + "\n" + separator + "\n";

  sorted.forEach(entry => {
    let row = "|";
    cols.forEach(col => {
      row += ` ${getExportValue(entry, col)} |`;
    });
    md += row + "\n";
  });

  return md;
};

export const generateJson = (entries, columns) => {
  const cols = getExportColumns(columns);
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

  const data = sorted.map(entry => {
    const obj = {};
    cols.forEach(col => {
      const label = col.type === 'custom'
        ? (col.label || `Campo ${col.dataIndex + 1}`)
        : col.key;
      if (col.type === 'builtin' && col.key === 'sintoma_tipo') {
        obj[label] = entry.sintoma_tipo || [];
      } else if (col.type === 'builtin' && (col.key === 'intensidad' || col.key === 'estres' || col.key === 'sueno_horas')) {
        obj[label] = entry[col.key] ?? 0;
      } else if (col.type === 'custom') {
        const raw = entry[`customField${col.dataIndex}Value`];
        obj[label] = raw != null && raw !== '' ? raw : null;
      } else {
        obj[label] = entry[col.key] || null;
      }
    });
    return obj;
  });

  return JSON.stringify(data, null, 2);
};

export const generateConversationMarkdown = (conversations) => {
  const sorted = [...conversations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  let md = "# Conversaciones - DigestiveBot\n\n";

  sorted.forEach(conv => {
    md += `## ${conv.title}\n`;
    md += `**Creada:** ${formatDate(conv.createdAt)} | **Actualizada:** ${formatDate(conv.updatedAt)}\n\n`;

    if (conv.messages.length === 0) {
      md += "_Sin mensajes_\n\n";
    } else {
      conv.messages.forEach(msg => {
        const role = msg.role === 'assistant' ? '**Bot**' : '**Usuario**';
        md += `${role}: ${msg.content}\n\n`;
      });
    }
    md += "---\n\n";
  });

  return md;
};

export const generateConversationJson = (conversations) => {
  const sorted = [...conversations].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const data = sorted.map(conv => ({
    titulo: conv.title,
    creada: conv.createdAt,
    actualizada: conv.updatedAt,
    mensajes: conv.messages.map(msg => ({
      rol: msg.role === 'assistant' ? 'asistente' : 'usuario',
      contenido: msg.content
    }))
  }));
  return JSON.stringify(data, null, 2);
};

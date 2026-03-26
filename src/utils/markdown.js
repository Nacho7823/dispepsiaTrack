import { formatDate } from './date';

export const generateMarkdown = (entries, columns) => {
  const customFieldCols = (columns || []).filter(c => c.type === 'custom');
  const sorted = [...entries].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
  let md = "# Reporte de Seguimiento - Dispepsia\n\n";
  let header = "| Fecha | Síntoma | Int. | Comida | Estrés | Sueño |";
  let separator = "| :--- | :--- | :--- | :--- | :--- | :--- |";

  customFieldCols.forEach(col => {
    header += ` ${col.label || `Campo ${col.dataIndex + 1}`} |`;
  });
  header += " Notas\n" + separator + "\n";

  sorted.forEach(e => {
    let row = `| ${formatDate(e.fecha)} | ${e.sintoma_tipo?.join(', ') || '-'} | ${e.intensidad}/10 | ${e.comida || '-'} | ${e.estres}/10 | ${e.sueno_horas}h |`;
    customFieldCols.forEach(col => {
      row += ` ${e[`customField${col.dataIndex}Value`] || '-'} |`;
    });
    row += ` ${e.notas || '-'}\n`;
    md += row;
  });

  return md;
};

import { formatDate } from './date';

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

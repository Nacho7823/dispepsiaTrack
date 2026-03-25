export const formatDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Fecha no válida";
    return d.toLocaleDateString('es-ES', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return "Error fecha";
  }
};

export const formatShortDate = (dateStr) => {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  } catch {
    return "-";
  }
};

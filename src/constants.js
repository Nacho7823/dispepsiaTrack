export const API_URL = 'http://localhost:5001/api';

export const DEFAULT_API_URL = "https://api.openai.com/v1/chat/completions";
export const DEFAULT_MODEL = "gpt-3.5-turbo";

export const DEFAULT_SYSTEM_PROMPT = `Eres un médico asistente especializado en dispepsia funcional.
Tu objetivo es ayudar al usuario a registrar sus síntomas, alimentación, medicación y estilo de vida.
Tono: empático, breve y conversacional.
PASOS PARA REGISTRAR:
1. Primero pregunta la fecha y hora del síntoma (puedes usar la actual si no especifica)
2. Luego pregunta el tipo de síntoma
3. Pregunta la intensidad del 1 al 10
4. Pregunta otros detalles (ubicación, comida, estrés, sueño, medicación)
5. Al FINALIZAR, genera un bloque de código JSON con los datos recopilados.`;

export const DEFAULT_COLUMNS = [
  { key: 'fecha', label: 'Fecha', visible: true },
  { key: 'sintoma_tipo', label: 'Síntoma', visible: true },
  { key: 'intensidad', label: 'Intensidad', visible: true },
  { key: 'ubicacion', label: 'Ubicación', visible: true },
  { key: 'comida', label: 'Comida', visible: true },
  { key: 'estres', label: 'Estrés', visible: true },
  { key: 'sueno_horas', label: 'Sueño', visible: true },
  { key: 'medicacion', label: 'Medicación', visible: false },
  { key: 'notas', label: 'Notas', visible: false },
  { key: 'customFields', label: 'Campos Personalizados', visible: true }
];

export const COLORS = ['#4f46e5', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

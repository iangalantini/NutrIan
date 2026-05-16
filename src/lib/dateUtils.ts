/**
 * Utilitários de data para garantir o fuso horário de São Paulo (UTC-3)
 */

const TIMEZONE = 'America/Sao_Paulo';

/**
 * Converte uma string YYYY-MM-DD em DD/MM/YYYY sem deslocamento de fuso.
 */
export const formatDateBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '--/--/----';
  
  // Se for apenas data (YYYY-MM-DD), dividimos para evitar problemas de fuso
  if (dateStr.length === 10) {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }
  
  return new Date(dateStr).toLocaleDateString('pt-BR', { timeZone: TIMEZONE });
};

/**
 * Converte um timestamp em DD/MM/YYYY HH:mm no fuso de SP.
 */
export const formatDateTimeBR = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '--/--/---- --:--';
  
  return new Date(dateStr).toLocaleString('pt-BR', { 
    timeZone: TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Retorna a data atual no formato YYYY-MM-DD corrigida para o fuso de SP.
 */
export const getTodayBR = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', { // en-CA retorna YYYY-MM-DD
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(now);
};

/**
 * Calcula a idade com precisão considerando o fuso de SP.
 */
export const calculateAgeBR = (birthDateStr: string): number | null => {
  if (!birthDateStr) return null;
  
  const today = new Date(new Intl.DateTimeFormat('en-US', { timeZone: TIMEZONE }).format(new Date()));
  const birthDate = new Date(birthDateStr + 'T00:00:00'); // Garante local
  
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

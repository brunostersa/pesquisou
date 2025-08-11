// Função para aplicar máscara de telefone brasileiro
export function applyPhoneMask(value: string): string {
  // Remove tudo que não é dígito
  const numbers = value.replace(/\D/g, '');
  
  // Aplica a máscara baseada no número de dígitos
  if (numbers.length === 0) {
    return '';
  } else if (numbers.length <= 2) {
    return `(${numbers}`;
  } else if (numbers.length <= 6) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
  } else if (numbers.length <= 10) {
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
  } else {
    // Para números com 11 dígitos (celular)
    return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
  }
}

// Função para remover máscara e retornar apenas números
export function removePhoneMask(value: string): string {
  return value.replace(/\D/g, '');
}

// Função para validar telefone brasileiro
export function validatePhone(phone: string): boolean {
  const numbers = removePhoneMask(phone);
  // Telefone brasileiro deve ter 10 ou 11 dígitos (com DDD)
  return numbers.length >= 10 && numbers.length <= 11;
} 
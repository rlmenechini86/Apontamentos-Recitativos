export interface PasswordValidationResult {
  isValid: boolean;
  hasMinLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
  score: number;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const pwd = password || '';
  const hasMinLength = pwd.length >= 8;
  const hasUppercase = /[A-Z]/.test(pwd);
  const hasLowercase = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`^]/.test(pwd);

  const errors: string[] = [];
  if (!hasMinLength) errors.push('No mínimo 8 dígitos');
  if (!hasUppercase) errors.push('Pelo menos uma letra maiúscula');
  if (!hasLowercase) errors.push('Pelo menos uma letra minúscula');
  if (!hasNumber) errors.push('Pelo menos um número');
  if (!hasSpecialChar) errors.push('Pelo menos um caractere especial (!@#$%...)');

  const score = [hasMinLength, hasUppercase, hasLowercase, hasNumber, hasSpecialChar].filter(Boolean).length;
  const isValid = score === 5;

  return {
    isValid,
    hasMinLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecialChar,
    score,
    errors,
  };
}

export const MIN_PASSWORD_LENGTH = 12;

const COMMON_PASSWORDS = new Set([
  '123',
  '123456',
  '12345678',
  'password',
  'password123',
  'qwerty123',
  'durmstrang',
  'durmstrang123'
]);

export function validatePassword(password) {
  if (typeof password !== 'string' || password.length === 0) {
    return { valid: false, error: 'Podaj hasło.' };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Hasło musi mieć co najmniej ${MIN_PASSWORD_LENGTH} znaków.`
    };
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase()) || /^(.)\1+$/.test(password)) {
    return { valid: false, error: 'To hasło jest zbyt łatwe do odgadnięcia.' };
  }

  if (!/[A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(password) || !/[^A-Za-zĄĆĘŁŃÓŚŹŻąćęłńóśźż]/.test(password)) {
    return { valid: false, error: 'Hasło musi zawierać litery oraz co najmniej jedną cyfrę lub znak specjalny.' };
  }

  return { valid: true, error: null };
}


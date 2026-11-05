/**
 * Password validation utility for frontend
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter (A-Z)
 * - At least one lowercase letter (a-z)
 * - At least one number (0-9)
 * - At least one special character (!@#$%^&*...)
 */
export const checkPasswordStrength = (password = '') => {
  const isLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const rules = [
    { label: 'At least 8 characters', met: isLength },
    { label: 'One uppercase letter (A-Z)', met: hasUpper },
    { label: 'One lowercase letter (a-z)', met: hasLower },
    { label: 'One numeric digit (0-9)', met: hasNumber },
    { label: 'One special character (!@#$%^&*)', met: hasSpecial }
  ];

  const passedCount = rules.filter(r => r.met).length;
  const isValid = passedCount === rules.length;

  return {
    rules,
    isLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    passedCount,
    isValid
  };
};


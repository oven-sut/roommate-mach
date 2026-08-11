/**
 * Password strength scoring used by the sign-up form.
 */
export type PasswordStrength = {
  score: number;
  label: string;
  color: string;
  hint: string;
};

export function getPasswordStrength(
  value: string,
  t: (key: string) => string,
): PasswordStrength {
  const password = value.trim();
  if (!password) {
    return {
      score: 0,
      label: t("weak"),
      color: "#C93A32",
      hint: t("pwdEmpty"),
    };
  }

  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const simplePattern =
    /(.)\1{2,}|1234|2345|3456|4567|5678|6789|password|qwerty|admin|sut/i;
  if (simplePattern.test(password)) score = Math.max(0, score - 1);

  if (score >= 5) {
    return {
      score,
      label: t("strong"),
      color: "#2F9142",
      hint: t("pwdStrong"),
    };
  }
  if (score >= 4) {
    return {
      score,
      label: t("good"),
      color: "#4AAF55",
      hint: t("pwdGood"),
    };
  }
  if (score >= 2) {
    return {
      score,
      label: t("fair"),
      color: "#D98916",
      hint: t("pwdFair"),
    };
  }
  return {
    score,
    label: t("weak"),
    color: "#C93A32",
    hint: t("pwdWeak"),
  };
}


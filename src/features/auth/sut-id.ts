/** Domain SUT issues student mailboxes on. */
const SUT_STUDENT_DOMAIN = "g.sut.ac.th";

/**
 * Expands a student ID into the address the API authenticates on.
 *
 * The redesign asks for "SUT ID" (B67xxxxx) rather than an email, but the
 * backend still keys accounts by address. Anything already containing `@` is
 * treated as a full address and passed through, which keeps staff and admin
 * logins on other domains working.
 */
export function sutIdToEmail(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (value.includes("@")) return value.toLowerCase();
  return `${value.toLowerCase()}@${SUT_STUDENT_DOMAIN}`;
}

/** Inverse of `sutIdToEmail`, for displaying the ID a session belongs to. */
export function emailToSutId(email?: string): string {
  if (!email) return "";
  const [local, domain] = email.split("@");
  return domain === SUT_STUDENT_DOMAIN ? local.toUpperCase() : email;
}

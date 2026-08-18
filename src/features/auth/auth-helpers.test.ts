import { getPasswordStrength } from "./password-strength";
import { emailToSutId, sutIdToEmail } from "./sut-id";

/** The strength meter takes a translator; the key is enough for a test. */
const t = (key: string) => key;

describe("getPasswordStrength", () => {
  it("reports an empty password as weak, with its own hint", () => {
    const result = getPasswordStrength("", t);
    expect(result.score).toBe(0);
    expect(result.label).toBe("weak");
    expect(result.hint).toBe("pwdEmpty");
  });

  it("rates a long, mixed password as strong", () => {
    const result = getPasswordStrength("Correct-Horse-42!", t);
    expect(result.score).toBeGreaterThanOrEqual(5);
    expect(result.label).toBe("strong");
  });

  it("rates a short, single-case password as weak", () => {
    expect(getPasswordStrength("abcdef", t).label).toBe("weak");
  });

  it("scores a longer password above a shorter one of the same shape", () => {
    const short = getPasswordStrength("Abcd123!", t).score;
    const long = getPasswordStrength("Abcd123!Efgh", t).score;
    expect(long).toBeGreaterThan(short);
  });

  it("penalises an obvious pattern", () => {
    const patterned = getPasswordStrength("Password1234!", t).score;
    const unpatterned = getPasswordStrength("Melon-Quartz9!", t).score;
    expect(patterned).toBeLessThan(unpatterned);
  });

  it("penalises a repeated run", () => {
    expect(getPasswordStrength("Aaaa1111!", t).score).toBeLessThan(
      getPasswordStrength("Ab7c2d9!", t).score,
    );
  });

  it("never returns a negative score", () => {
    expect(getPasswordStrength("sut", t).score).toBeGreaterThanOrEqual(0);
  });

  it("ignores surrounding whitespace", () => {
    expect(getPasswordStrength("  Correct-Horse-42!  ", t).label).toBe(
      getPasswordStrength("Correct-Horse-42!", t).label,
    );
  });
});

describe("sutIdToEmail", () => {
  it("expands a student ID into the SUT student address", () => {
    expect(sutIdToEmail("B6627416")).toBe("b6627416@g.sut.ac.th");
  });

  it("trims what the student typed", () => {
    expect(sutIdToEmail("  b6627416 ")).toBe("b6627416@g.sut.ac.th");
  });

  it("passes a full address through, so staff logins still work", () => {
    expect(sutIdToEmail("Admin@sut.ac.th")).toBe("admin@sut.ac.th");
  });

  it("returns an empty string for empty input", () => {
    expect(sutIdToEmail("")).toBe("");
    expect(sutIdToEmail("   ")).toBe("");
  });
});

describe("emailToSutId", () => {
  it("recovers the student ID from a student address", () => {
    expect(emailToSutId("b6627416@g.sut.ac.th")).toBe("B6627416");
  });

  it("shows the address itself for anything off the student domain", () => {
    expect(emailToSutId("admin@sut.ac.th")).toBe("admin@sut.ac.th");
  });

  it("handles a missing address", () => {
    expect(emailToSutId(undefined)).toBe("");
  });

  it("round-trips with sutIdToEmail", () => {
    expect(emailToSutId(sutIdToEmail("B6627416"))).toBe("B6627416");
  });
});

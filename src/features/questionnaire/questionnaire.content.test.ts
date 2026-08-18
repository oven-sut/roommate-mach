import {
  CLEAN_MAX,
  DEFAULT_ANSWERS,
  QUIET_MAX,
  chronotype,
  currentAnswers,
  fromApiAnswers,
  lifestyleTags,
  sleepRangeLabel,
  toApiAnswers,
  wakeRangeLabel,
  type Answers,
} from "./questionnaire.content";

const filled: Answers = {
  ...DEFAULT_ANSWERS,
  sleepFrom: 6, // 23:00
  sleepTo: 8, // 00:00
  wakeFrom: 4, // 07:00
  wakeTo: 6, // 08:00
  cleanHabits: ["Spotless", "Dishes same day"],
  cleanScore: 4,
  overnight: "sometime",
  guestFrequency: 2, // Weekly
  guestTimes: 6,
  guestTypes: ["Close friends"],
  acTiming: 2, // Anytime
  acTemp: 24,
  quiet: 5,
  studyPlace: "Library",
};

describe("toApiAnswers", () => {
  it("produces the four categories the API stores", () => {
    expect(Object.keys(toApiAnswers(filled))).toEqual(["q1", "q2", "q3", "q4"]);
  });

  it("keeps group order, which is what the score compares on", () => {
    const payload = toApiAnswers(filled);

    expect(payload.q1).toEqual([["23:00–00:00"], ["07:00–08:00"]]);
    expect(payload.q2).toEqual([["Spotless", "Dishes same day"], ["4/5"]]);
    expect(payload.q3).toEqual([
      ["sometime"],
      ["Weekly"],
      ["6/month"],
      ["Close friends"],
    ]);
    expect(payload.q4).toEqual([["Anytime"], ["24°"], ["5/8"], ["Library"]]);
  });

  it("sends an empty group rather than a null for a skipped single choice", () => {
    const payload = toApiAnswers({ ...filled, overnight: null, studyPlace: null });

    expect(payload.q3[0]).toEqual([]);
    expect(payload.q4[3]).toEqual([]);
  });
});

describe("fromApiAnswers", () => {
  it("round-trips everything the user chose", () => {
    expect(fromApiAnswers(toApiAnswers(filled))).toEqual(filled);
  });

  it("round-trips the defaults too", () => {
    expect(fromApiAnswers(toApiAnswers(DEFAULT_ANSWERS))).toEqual(
      DEFAULT_ANSWERS,
    );
  });

  it("falls back to the defaults when nothing is stored", () => {
    expect(fromApiAnswers(null)).toEqual(DEFAULT_ANSWERS);
    expect(fromApiAnswers(undefined)).toEqual(DEFAULT_ANSWERS);
  });

  it("keeps the defaults for a category the payload is missing", () => {
    const partial = { q1: toApiAnswers(filled).q1 };
    const restored = fromApiAnswers(partial);

    expect(restored.sleepFrom).toBe(filled.sleepFrom);
    expect(restored.cleanScore).toBe(DEFAULT_ANSWERS.cleanScore);
  });

  it("ignores a label it does not recognise instead of throwing", () => {
    const restored = fromApiAnswers({
      q1: [["not a range"], []],
      q3: [[], ["Fortnightly"], [], []],
    });

    expect(restored.sleepFrom).toBe(DEFAULT_ANSWERS.sleepFrom);
    expect(restored.guestFrequency).toBe(DEFAULT_ANSWERS.guestFrequency);
  });
});

describe("chronotype", () => {
  it("calls a 23:00 or later bedtime a night owl", () => {
    expect(chronotype({ ...DEFAULT_ANSWERS, sleepFrom: 6 })).toBe("Night Owl");
    expect(chronotype({ ...DEFAULT_ANSWERS, sleepFrom: 10 })).toBe("Night Owl");
  });

  it("calls anything earlier an early bird", () => {
    expect(chronotype({ ...DEFAULT_ANSWERS, sleepFrom: 5 })).toBe("Early Bird");
    expect(chronotype({ ...DEFAULT_ANSWERS, sleepFrom: 0 })).toBe("Early Bird");
  });
});

describe("range labels", () => {
  it("joins the two ends of the sleep window", () => {
    expect(sleepRangeLabel(filled)).toBe("23:00–00:00");
  });

  it("joins the two ends of the wake window", () => {
    expect(wakeRangeLabel(filled)).toBe("07:00–08:00");
  });
});

describe("lifestyleTags", () => {
  it("produces the five signals shown on a card", () => {
    expect(lifestyleTags(filled)).toEqual([
      "Night Owl 23:00–00:00",
      `Spotless 4/${CLEAN_MAX}`,
      "Guests: sometime",
      `Quiet hours 5/${QUIET_MAX}`,
      "AC 24°",
    ]);
  });

  it("shows a dash rather than a blank when guests were skipped", () => {
    expect(lifestyleTags({ ...filled, overnight: null })[2]).toBe("Guests: —");
  });
});

describe("currentAnswers", () => {
  it("returns a stored draft as-is", () => {
    expect(currentAnswers(filled as unknown as Record<string, unknown>)).toBe(
      filled,
    );
  });

  it("seeds the defaults when there is no draft yet", () => {
    expect(currentAnswers(null)).toEqual(DEFAULT_ANSWERS);
  });

  it("does not mistake an unrelated object for a draft", () => {
    expect(currentAnswers({ something: "else" })).toEqual(DEFAULT_ANSWERS);
  });

  it("hands back a copy, so editing it cannot corrupt the defaults", () => {
    const answers = currentAnswers(null);
    answers.cleanScore = 5;
    expect(DEFAULT_ANSWERS.cleanScore).toBe(0);
  });
});

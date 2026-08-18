import {
  api,
  appState,
  formatImageUri,
  populateProfileDraft,
  resetAppState,
  saveToken,
  setSessionExpiredHandler,
} from "./api";

describe("formatImageUri", () => {
  it("passes data and file URIs through untouched", () => {
    const dataUri = "data:image/png;base64,AAAA";
    expect(formatImageUri(dataUri)).toBe(dataUri);
    expect(formatImageUri("file:///tmp/photo.jpg")).toBe("file:///tmp/photo.jpg");
  });

  it("returns an empty string for anything missing", () => {
    expect(formatImageUri(undefined)).toBe("");
    expect(formatImageUri("")).toBe("");
    expect(formatImageUri("   ")).toBe("");
  });

  it("swaps localhost for the API host so a phone can reach the image", () => {
    // Object storage builds URLs from its own endpoint, which is `localhost`
    // in development - and on a phone `localhost` is the phone. The port is
    // kept, because storage (19000) and the API (18888) sit on different ones.
    expect(formatImageUri("http://localhost:19000/bucket/a.jpg")).toBe(
      "http://192.168.1.50:19000/bucket/a.jpg",
    );
  });

  it("rewrites the loopback address too", () => {
    expect(formatImageUri("http://127.0.0.1:19000/bucket/a.jpg")).toBe(
      "http://192.168.1.50:19000/bucket/a.jpg",
    );
  });

  it("leaves a real remote host alone", () => {
    expect(formatImageUri("https://cdn.example.com/a.jpg")).toBe(
      "https://cdn.example.com/a.jpg",
    );
  });

  it("does not rewrite a host that merely starts with localhost", () => {
    expect(formatImageUri("http://localhost.evil.com/a.jpg")).toBe(
      "http://localhost.evil.com/a.jpg",
    );
  });
});

describe("populateProfileDraft", () => {
  beforeEach(() => resetAppState());

  it("copies the server's profile into the draft", () => {
    populateProfileDraft({
      displayName: "Ploy S",
      profile: {
        age: 21,
        major: "Nursing",
        bio: "Early riser",
        year: 3,
        budgetMin: 3500,
        budgetMax: 6000,
        photos: ["http://example.com/a.jpg"],
        completed: true,
      },
    });

    expect(appState.profileDraft).toMatchObject({
      displayName: "Ploy S",
      age: "21",
      major: "Nursing",
      bio: "Early riser",
      year: 3,
      budgetMin: 3500,
      budgetMax: 6000,
      completed: true,
    });
  });

  it("keeps the defaults for anything the server has not filled in", () => {
    populateProfileDraft({ displayName: "New Student", profile: null });

    expect(appState.profileDraft.roomType).toBe("Single");
    expect(appState.profileDraft.zone).toBe("Gate 1");
    expect(appState.profileDraft.completed).toBe(false);
  });

  it("ignores a missing payload rather than wiping the draft", () => {
    appState.profileDraft.displayName = "Kept";
    populateProfileDraft(null);
    expect(appState.profileDraft.displayName).toBe("Kept");
  });
});

describe("resetAppState", () => {
  it("clears everything one account could leak to the next", () => {
    appState.currentUserId = "user-1";
    appState.activeConversationId = "conversation-1";
    appState.activeConversationName = "Ploy";
    appState.activeProfile = { id: "other", displayName: "Ploy" };
    appState.questionnaireDraft = { sleepFrom: 8 };
    appState.profileDraft.displayName = "Ploy S";
    appState.profileDraft.bio = "Early riser";
    appState.feedFilters.major = "Nursing";

    resetAppState();

    expect(appState.currentUserId).toBeNull();
    expect(appState.activeConversationId).toBeNull();
    expect(appState.activeConversationName).toBe("Chat");
    expect(appState.activeProfile).toBeNull();
    expect(appState.questionnaireDraft).toBeNull();
    expect(appState.profileDraft.displayName).toBe("");
    expect(appState.profileDraft.bio).toBe("");
    expect(appState.feedFilters.major).toBe("");
  });
});

describe("api", () => {
  const originalFetch = global.fetch;

  const respond = (status: number, body: unknown) =>
    jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    });

  afterEach(() => {
    global.fetch = originalFetch;
    setSessionExpiredHandler(null);
    saveToken(null);
    jest.clearAllMocks();
  });

  it("sends the bearer token once one is stored", async () => {
    const fetchMock = respond(200, { ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
    saveToken("token-123");

    await api("/api/me");

    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe("Bearer token-123");
  });

  it("omits the header entirely when signed out", async () => {
    const fetchMock = respond(200, {});
    global.fetch = fetchMock as unknown as typeof fetch;

    await api("/auth/login", { method: "POST" });

    expect(fetchMock.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("rejects with the server's message so screens can show it", async () => {
    global.fetch = respond(400, {
      message: "Password must be at least 8 characters",
    }) as unknown as typeof fetch;

    await expect(api("/api/password")).rejects.toThrow(
      "Password must be at least 8 characters",
    );
  });

  it("unwraps the first message when validation returns a list", async () => {
    global.fetch = respond(400, {
      message: ["age must be at least 16", "bio is too long"],
    }) as unknown as typeof fetch;

    await expect(api("/api/profile")).rejects.toThrow("age must be at least 16");
  });

  it("signs the user out once when the token has expired", async () => {
    global.fetch = respond(401, { message: "Invalid or expired token" })
      .mockResolvedValue({
        ok: false,
        status: 401,
        json: () => Promise.resolve({ message: "Invalid or expired token" }),
      }) as unknown as typeof fetch;

    const onExpired = jest.fn();
    setSessionExpiredHandler(onExpired);
    saveToken("stale-token");

    // Screens poll, so the same 401 arrives repeatedly.
    await expect(api("/api/me")).rejects.toThrow();
    await expect(api("/api/conversations")).rejects.toThrow();

    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(appState.currentUserId).toBeNull();
  });

  it("does not treat a failed sign-in as an expired session", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ message: "Invalid email or password" }),
    }) as unknown as typeof fetch;

    const onExpired = jest.fn();
    setSessionExpiredHandler(onExpired);

    await expect(api("/auth/login", { method: "POST" })).rejects.toThrow(
      "Invalid email or password",
    );
    expect(onExpired).not.toHaveBeenCalled();
  });

  it("reports a timeout in words a screen can show", async () => {
    global.fetch = jest.fn().mockRejectedValue(
      Object.assign(new Error("Aborted"), { name: "AbortError" }),
    ) as unknown as typeof fetch;

    await expect(api("/api/me")).rejects.toThrow(
      "The server took too long to respond",
    );
  });

  it("reports an unreachable server", async () => {
    global.fetch = jest
      .fn()
      .mockRejectedValue(new TypeError("Network request failed")) as unknown as typeof fetch;

    await expect(api("/api/me")).rejects.toThrow("Unable to reach the server");
  });

  it("survives a response body that is not JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    }) as unknown as typeof fetch;

    await expect(api("/api/me")).rejects.toThrow("Request failed");
  });
});

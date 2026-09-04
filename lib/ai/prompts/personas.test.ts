import { describe, expect, it } from "vitest";
import { getPersona, PERSONAS } from "./personas";

describe("getPersona", () => {
  it("returns null when given null or undefined", () => {
    expect(getPersona(null)).toBeNull();
    expect(getPersona(undefined)).toBeNull();
  });

  it("returns null when given an empty string", () => {
    expect(getPersona("")).toBeNull();
  });

  it("returns null for an id that doesn't match any persona", () => {
    expect(getPersona("not_a_real_persona")).toBeNull();
  });

  it("returns the matching persona for a known id", () => {
    const persona = getPersona("arnold");
    expect(persona?.id).toBe("arnold");
    expect(persona?.displayName).toBe("Arnold Schwarzenegger");
  });

  it("has all four personas with non-empty voice descriptors and sample lines", () => {
    expect(PERSONAS).toHaveLength(4);

    for (const persona of PERSONAS) {
      expect(persona.voiceDescriptor.length).toBeGreaterThan(0);
      expect(persona.guardrailNote.length).toBeGreaterThan(0);

      for (const lines of Object.values(persona.sampleLines)) {
        expect(lines.length).toBeGreaterThan(0);
      }
    }
  });
});

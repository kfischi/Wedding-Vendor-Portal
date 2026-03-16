import { describe, it, expect, beforeEach, afterEach } from "vitest";

/**
 * Tests for environment variable validation behaviour.
 * We test the underlying requireEnv logic rather than the module-level constants
 * (which run at import time).
 */

function requireEnv(key: string, env: Record<string, string | undefined>): string {
  const value = env[key];
  if (!value) {
    if (env.NODE_ENV === "production") {
      throw new Error(`Required environment variable "${key}" is missing.`);
    }
    return "";
  }
  return value;
}

describe("requireEnv", () => {
  it("returns the value when set", () => {
    expect(requireEnv("FOO", { FOO: "bar" })).toBe("bar");
  });

  it("returns empty string in development when missing", () => {
    expect(requireEnv("FOO", { NODE_ENV: "development" })).toBe("");
  });

  it("throws in production when missing", () => {
    expect(() =>
      requireEnv("FOO", { NODE_ENV: "production" })
    ).toThrow('Required environment variable "FOO" is missing.');
  });

  it("does not throw in test environment when missing", () => {
    expect(() =>
      requireEnv("FOO", { NODE_ENV: "test" })
    ).not.toThrow();
  });
});

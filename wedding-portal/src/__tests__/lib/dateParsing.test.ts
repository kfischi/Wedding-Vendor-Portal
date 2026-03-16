import { describe, it, expect } from "vitest";

/**
 * Tests for the date parsing logic used in the leads API.
 * We extract and test the pure parsing logic independently.
 */

function parseDateString(dateStr: string): Date | null {
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(dateStr);
  if (ddmmyyyy) {
    const day = Number(ddmmyyyy[1]);
    const month = Number(ddmmyyyy[2]);
    const year = Number(ddmmyyyy[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    const d = new Date(year, month - 1, day);
    if (
      d.getFullYear() !== year ||
      d.getMonth() !== month - 1 ||
      d.getDate() !== day
    ) {
      return null;
    }
    return d;
  }
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

describe("parseDateString", () => {
  it("parses a valid DD/MM/YYYY date", () => {
    const d = parseDateString("15/06/2025");
    expect(d).not.toBeNull();
    expect(d!.getFullYear()).toBe(2025);
    expect(d!.getMonth()).toBe(5); // June = 0-indexed 5
    expect(d!.getDate()).toBe(15);
  });

  it("parses a single-digit day and month", () => {
    const d = parseDateString("1/1/2026");
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(1);
    expect(d!.getMonth()).toBe(0);
    expect(d!.getFullYear()).toBe(2026);
  });

  it("rejects Feb 30 (overflow date)", () => {
    expect(parseDateString("30/02/2025")).toBeNull();
  });

  it("rejects Feb 31 (overflow date)", () => {
    expect(parseDateString("31/02/2025")).toBeNull();
  });

  it("rejects month 13", () => {
    expect(parseDateString("01/13/2025")).toBeNull();
  });

  it("rejects month 0", () => {
    expect(parseDateString("01/00/2025")).toBeNull();
  });

  it("rejects day 0", () => {
    expect(parseDateString("00/01/2025")).toBeNull();
  });

  it("rejects day 32", () => {
    expect(parseDateString("32/01/2025")).toBeNull();
  });

  it("falls back to ISO format", () => {
    const d = parseDateString("2025-06-15");
    expect(d).not.toBeNull();
  });

  it("returns null for garbage input", () => {
    expect(parseDateString("not-a-date")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseDateString("")).toBeNull();
  });

  it("handles Dec 31 correctly", () => {
    const d = parseDateString("31/12/2025");
    expect(d).not.toBeNull();
    expect(d!.getDate()).toBe(31);
    expect(d!.getMonth()).toBe(11);
  });
});

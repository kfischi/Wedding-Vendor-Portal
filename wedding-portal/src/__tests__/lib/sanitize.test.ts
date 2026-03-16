import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  escapeHtmlMultiline,
  stripHtml,
} from "@/lib/security/sanitize";

describe("escapeHtml", () => {
  it("escapes ampersands", () => {
    expect(escapeHtml("Foo & Bar")).toBe("Foo &amp; Bar");
  });

  it("escapes angle brackets", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;/script&gt;"
    );
  });

  it("escapes double quotes", () => {
    expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;");
  });

  it("escapes single quotes", () => {
    expect(escapeHtml("It's fine")).toBe("It&#x27;s fine");
  });

  it("escapes backticks", () => {
    expect(escapeHtml("template `literal`")).toBe(
      "template &#x60;literal&#x60;"
    );
  });

  it("leaves safe characters unchanged", () => {
    expect(escapeHtml("Hello, World! 123")).toBe("Hello, World! 123");
  });

  it("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("handles Hebrew text unchanged", () => {
    const hebrew = "שלום עולם";
    expect(escapeHtml(hebrew)).toBe(hebrew);
  });

  it("prevents XSS via img tag — escapes angle brackets and quotes", () => {
    const xss = '<img src=x onerror="alert(1)">';
    const escaped = escapeHtml(xss);
    // The raw angle brackets must not appear — they are neutralised
    expect(escaped).not.toContain("<img");
    expect(escaped).not.toContain(">");
    // Quotes are escaped so the attribute value cannot be injected
    expect(escaped).not.toContain('"alert');
    // Confirm the escaped version starts with &lt;
    expect(escaped).toContain("&lt;img");
  });
});

describe("escapeHtmlMultiline", () => {
  it("converts newlines to <br> after escaping", () => {
    expect(escapeHtmlMultiline("line1\nline2")).toBe("line1<br>line2");
  });

  it("still escapes HTML before converting newlines", () => {
    expect(escapeHtmlMultiline("<b>bold</b>\nnext")).toBe(
      "&lt;b&gt;bold&lt;/b&gt;<br>next"
    );
  });
});

describe("stripHtml", () => {
  it("removes all HTML tags", () => {
    expect(stripHtml("<p>Hello <b>World</b></p>")).toBe("Hello World");
  });

  it("handles self-closing tags", () => {
    expect(stripHtml("Line 1<br/>Line 2")).toBe("Line 1Line 2");
  });

  it("returns plain text unchanged", () => {
    expect(stripHtml("plain text")).toBe("plain text");
  });
});

import { describe, expect, it } from "vitest";
import { escapeHtml, passwordChangedEmail, passwordResetEmail } from "./templates";

describe("escapeHtml", () => {
  it("neutralises markup", () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe(
      "&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;",
    );
  });
});

describe("passwordResetEmail", () => {
  const link = "https://brabuscars.be/fr/reinitialiser-mot-de-passe?token=abc";

  it("carries the link in both text and HTML, in the requested language", () => {
    const mail = passwordResetEmail({
      to: "a@b.fr",
      firstName: "Ana",
      locale: "fr",
      company: "BrabusCars",
      link,
      ttlMinutes: 30,
    });
    expect(mail.to).toBe("a@b.fr");
    expect(mail.subject).toContain("Réinitialisation");
    expect(mail.text).toContain(link);
    expect(mail.text).toContain("30 minutes");
    expect(mail.html).toContain(`href="${link}"`);
  });

  it("escapes the first name in the HTML body", () => {
    const mail = passwordResetEmail({
      to: "a@b.fr",
      firstName: "<script>x</script>",
      locale: "en",
      company: "BrabusCars",
      link,
      ttlMinutes: 30,
    });
    expect(mail.html).not.toContain("<script>");
    expect(mail.html).toContain("&lt;script&gt;");
  });
});

describe("passwordChangedEmail", () => {
  it("has no link and mentions the contact address", () => {
    const mail = passwordChangedEmail({
      to: "a@b.fr",
      firstName: "Jan",
      locale: "nl",
      company: "BrabusCars",
      contact: "contact@brabuscars.be",
    });
    expect(mail.subject).toContain("gewijzigd");
    expect(mail.text).toContain("contact@brabuscars.be");
    expect(mail.html).not.toContain("<a ");
  });
});

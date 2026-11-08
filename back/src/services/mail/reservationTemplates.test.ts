import { describe, expect, it } from "vitest";
import {
  reservationDecisionEmail,
  reservationReceivedEmail,
} from "./reservationTemplates";

const base = {
  to: "alice@example.com",
  firstName: "Alice",
  company: "BrabusCars",
  listingTitle: 'Golf <GTI> "R"',
};

describe("reservation e-mails", () => {
  it("escapes the listing title in the HTML part", () => {
    const mail = reservationReceivedEmail({ ...base, locale: "fr", type: "hold", visitAt: null });
    expect(mail.subject).toContain("Demande bien reçue");
    expect(mail.html).toContain("Golf &lt;GTI&gt; &quot;R&quot;");
    expect(mail.html).not.toContain("<GTI>");
  });

  it("states a confirmed visit slot in the customer's language and Paris time", () => {
    const mail = reservationDecisionEmail({
      ...base,
      locale: "en",
      type: "visit",
      status: "confirmed",
      visitAt: new Date("2026-11-13T14:00:00Z"),
      holdUntil: null,
      note: "Bring your licence.",
      contact: "02 000 00 00",
    });
    expect(mail.subject).toContain("Booking confirmed");
    expect(mail.text).toContain("13 November 2026");
    expect(mail.text).toContain("15:00");
    expect(mail.text).toContain("Message from the dealership: Bring your licence.");
  });
});

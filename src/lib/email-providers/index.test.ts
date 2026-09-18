import { describe, expect, it } from "vitest";
import { getEmailProvider, isEmailConfigured } from "./index";

describe("getEmailProvider", () => {
  it("never reports an email as sent — no provider is configured yet", async () => {
    const result = await getEmailProvider().sendEmail({
      to: "traveller@example.com",
      subject: "Test",
      text: "Test message",
    });

    expect(result.sent).toBe(false);
    expect(result.provider).toBe("none");
  });

  it("reports email sending as not configured", () => {
    expect(isEmailConfigured()).toBe(false);
  });
});

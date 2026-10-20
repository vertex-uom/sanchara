import { expect, newGuest, registerViaApi, test } from "./support";

test.describe("traveller sign up and sign in", () => {
  test("register returns to where the traveller came from, then sign out from the header", async ({ page }) => {
    const guest = newGuest();
    await page.goto("/sign-up?returnTo=%2Faccount");

    await page.getByLabel("Full name").fill(guest.fullName);
    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Mobile number").fill("+94 77 123 4567");
    await page.getByLabel("Password", { exact: true }).fill(guest.password);
    await expect(page.getByText("Password strength:")).toBeAttached();
    await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(guest.fullName)).toBeVisible();
    await expect(page.getByText("+94771234567")).toBeVisible();

    await page.goto("/");
    await page.getByRole("button", { name: /account menu/ }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page.getByRole("link", { name: /Login \/ Sign in/ })).toBeVisible();

    // Session is gone on the server too: the account page sends us to sign in.
    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Faccount$/);
  });

  test("wrong password shows a generic error and keeps the email", async ({ page, request, ip }) => {
    const guest = newGuest();
    await registerViaApi(request, guest, ip);
    await page.goto("/sign-in");

    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Password", { exact: true }).fill("not the password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();

    // Next's route announcer is also role=alert, so match on the text.
    const alert = page.getByRole("alert").filter({ hasText: "Email or password is incorrect." });
    await expect(alert).toBeVisible();
    await expect(alert).toBeFocused();
    await expect(page.getByLabel("Email address")).toHaveValue(guest.email);
  });

  test("an unknown email gets the same message as a wrong password", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email address").fill(newGuest().email);
    await page.getByLabel("Password", { exact: true }).fill("whatever password");
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Email or password is incorrect." })).toBeVisible();
  });

  test("protected page → sign in → back to that page; signed-in visitors skip sign-in", async ({ page, request, ip }) => {
    const guest = newGuest();
    await registerViaApi(request, guest, ip);

    await page.goto("/account");
    await expect(page).toHaveURL(/\/sign-in\?returnTo=%2Faccount$/);
    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Password", { exact: true }).fill(guest.password);
    await page.getByLabel("Remember me").check();
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/\/account$/);
    await expect(page.getByText(guest.email)).toBeVisible();

    // The session cookie is HttpOnly, host-only, Secure and SameSite=Lax.
    const cookie = (await page.context().cookies()).find((item) => item.name === "__Host-sanchara_guest");
    expect(cookie).toMatchObject({ httpOnly: true, secure: true, sameSite: "Lax", path: "/" });
    expect(cookie?.expires).toBeGreaterThan(Date.now() / 1000 + 29 * 24 * 60 * 60);

    await page.goto("/sign-in?returnTo=%2Faccount");
    await expect(page).toHaveURL(/\/account$/);
  });

  test("ignores off-site return targets", async ({ page, request, ip }) => {
    const guest = newGuest();
    await registerViaApi(request, guest, ip);

    await page.goto("/sign-in?returnTo=%2F%2Fevil.example%2Fsteal");
    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Password", { exact: true }).fill(guest.password);
    await page.getByRole("button", { name: "Sign in", exact: true }).click();
    await expect(page).toHaveURL(/localhost:3000\/$/);
    await expect(page.getByRole("button", { name: /account menu/ })).toBeVisible();
  });

  test("client-side checks block an empty sign-up and focus the first error", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Create account" }).click();

    const name = page.getByLabel("Full name");
    await expect(name).toHaveAttribute("aria-invalid", "true");
    await expect(name).toBeFocused();
    await expect(page.getByText("Enter your full name.")).toBeVisible();
    await expect(page.getByText("Please accept the Terms and Privacy Policy.")).toBeVisible();
  });

  test("an email that is already registered is flagged on the email field", async ({ page, request, ip }) => {
    const guest = newGuest();
    await registerViaApi(request, guest, ip);
    await page.goto("/sign-up");

    await page.getByLabel("Full name").fill("Someone Else");
    await page.getByLabel("Email address").fill(guest.email);
    await page.getByLabel("Password", { exact: true }).fill("another long password");
    await page.getByRole("checkbox", { name: /I agree to the Terms/ }).check();
    await page.getByRole("button", { name: "Create account" }).click();

    await expect(page.getByText(/An account with this email already exists/)).toBeVisible();
    await expect(page.getByLabel("Email address")).toBeFocused();
  });

  test("forgot password gives the same confirmation for any email", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByRole("link", { name: "Forgot password?" }).click();
    await expect(page.getByRole("heading", { name: "Forgot password", level: 1 })).toBeVisible();
    // Next keeps the previous page mounted but hidden; getByRole skips hidden fields.
    await page.getByRole("textbox", { name: "Email address" }).fill(newGuest().email);
    await page.getByRole("button", { name: "Send reset link" }).click();
    await expect(page.getByRole("status")).toContainText("If an account exists for");
  });

  test("an invalid reset link says so and offers a new one", async ({ page }) => {
    await page.goto(`/reset-password?token=${"A".repeat(43)}`);
    await page.getByLabel("New password", { exact: true }).fill("a brand new password");
    await page.getByRole("button", { name: "Save new password" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "invalid or has expired" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Request a new link" })).toBeVisible();
  });

  test("the password eye toggles visibility and the meter labels strength", async ({ page }) => {
    await page.goto("/sign-up");
    const password = page.getByLabel("Password", { exact: true });
    await password.fill("short");
    await expect(page.locator("#signup-password-strength")).toContainText("Too short");
    await password.fill("correct horse battery staple");
    await expect(page.locator("#signup-password-strength")).toContainText("Strong");

    await page.getByRole("button", { name: "Show password" }).click();
    await expect(password).toHaveAttribute("type", "text");
    await page.getByRole("button", { name: "Hide password" }).click();
    await expect(password).toHaveAttribute("type", "password");
  });
});

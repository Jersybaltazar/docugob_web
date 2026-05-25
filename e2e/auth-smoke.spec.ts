/**
 * DocuGob — Auth smoke (Sprint E).
 *
 * Validates the full critical path that Sprints A-D rebuilt:
 *
 *   register  → /api/auth/register sets HttpOnly cookies
 *             → RSC layout reads cookies via getCurrentUserServer
 *             → dashboard renders with greeting in the initial HTML
 *
 *   logout    → /api/auth/logout clears cookies
 *             → middleware bounces back to /sign-in on the next visit
 *
 * If this test breaks, an actual user-facing flow is broken — it's
 * the one test worth keeping green on every commit.
 *
 * Pre-requisites:
 *   - FastAPI backend reachable at BACKEND_API_URL with a clean DB
 *     (or one that tolerates fresh registrations).
 *   - Each run uses a unique email + tenant so re-runs don't collide.
 */

import { test, expect } from "@playwright/test";

// Strong-enough password to satisfy the schema we wrote in
// `src/schemas/auth.schema.ts` (upper + lower + digit + symbol, 8+).
const PASSWORD = "SmokeTest1!";

test.describe("Auth smoke", () => {
  test("register → dashboard → logout", async ({ page }) => {
    // Unique identity per run so we never collide with a previous
    // smoke run that left rows in the DB. Use `@example.com` instead
    // of `@docugob.test` — the `.test` TLD is RFC-reserved and some
    // pydantic / email-validator configs reject it outright.
    const stamp = Date.now();
    const email = `smoke-${stamp}@example.com`;
    const fullName = `Smoke Test ${stamp}`;
    const tenantName = `Smoke Tenant ${stamp}`;

    // Surface any 4xx / 5xx response body coming from our /api/* proxy
    // — without this you get an opaque assertion failure when FastAPI
    // rejects the payload (the typical 422 validation error).
    page.on("response", async (response) => {
      const url = response.url();
      if (!url.includes("/api/") || response.status() < 400) return;
      let body = "";
      try {
        body = await response.text();
      } catch {
        body = "<no body>";
      }
      // eslint-disable-next-line no-console
      console.error(
        `[api error] ${response.status()} ${url}\n${body.slice(0, 800)}`
      );
    });

    // ---- Sign-up ---------------------------------------------------------
    await page.goto("/sign-up");

    await page.getByLabel("Nombre completo").fill(fullName);
    await page.getByLabel("Nombre de la entidad").fill(tenantName);
    await page.getByLabel("Correo electrónico").fill(email);
    await page.getByLabel("Contraseña").fill(PASSWORD);

    await page
      .getByRole("button", { name: /Crear cuenta gratuita/i })
      .click();

    // ---- Dashboard (RSC) -------------------------------------------------
    // The register handler sets HttpOnly cookies and the hook pushes
    // us to /dashboard. The RSC layout then renders the greeting from
    // `getCurrentUserServer()` — that must appear in the initial HTML.
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(
      page.getByRole("heading", { level: 1, name: /Hola, Smoke/i })
    ).toBeVisible();

    // Cookies should be present + HttpOnly. Playwright reports them
    // through the same API regardless of HttpOnly, but they MUST be
    // there for the auth state to be real.
    const cookies = await page.context().cookies();
    const access = cookies.find((c) => c.name === "docugob_access");
    const refresh = cookies.find((c) => c.name === "docugob_refresh");
    expect(access?.httpOnly).toBe(true);
    expect(refresh?.httpOnly).toBe(true);

    // ---- Logout ----------------------------------------------------------
    await page.getByRole("button", { name: "Menú de usuario" }).click();
    await page.getByRole("menuitem", { name: /Cerrar sesión/i }).click();

    await page.waitForURL("**/sign-in*", { timeout: 5_000 });

    // The middleware should now refuse to let us back into /dashboard
    // since the cookies are gone — it should bounce us right back to
    // sign-in with `?redirect=/dashboard`.
    await page.goto("/dashboard");
    await page.waitForURL(/\/sign-in/, { timeout: 5_000 });
    expect(page.url()).toMatch(/redirect=/);
  });
});

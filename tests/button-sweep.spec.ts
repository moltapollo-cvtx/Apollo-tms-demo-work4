import { expect, test, type Locator, type Page } from "@playwright/test";

type Role = "admin" | "dispatcher";
type Severity = "error" | "warn";

interface SweepIssue {
  severity: Severity;
  role: Role;
  route: string;
  action: string;
  detail: string;
}

interface SweepMetrics {
  routesVisited: number;
  routesAllowed: number;
  routesBlocked: number;
  visibleControls: number;
  singleClicks: number;
  doubleClicks: number;
  rapidClicks: number;
  slow3GClicks: number;
  offlineClicks: number;
  modalOpenCloseCycles: number;
  submitAttempts: number;
  doubleSubmitAttempts: number;
  deleteCancelChecks: number;
  deleteConfirmChecks: number;
}

interface DynamicIds {
  orderId: string | null;
  driverId: string | null;
  invoiceId: string | null;
}

interface RouteVisitResult {
  expectedAllowed: boolean;
  blocked: boolean;
}

interface RouteDefinition {
  id: string;
  route: string;
  dynamicIdKey?: keyof DynamicIds;
}

const PASSWORD = process.env.E2E_PASSWORD ?? "demo-password";
const USERS: Record<Role, string> = {
  admin: "admin@apollotms.com",
  dispatcher: "dispatcher@apollotms.com",
};

const REQUIRED_STATIC_ROUTES = [
  "/",
  "/ai",
  "/dispatch",
  "/orders",
  "/drivers",
  "/equipment",
  "/customers",
  "/billing",
  "/documents",
  "/analytics",
  "/safety",
  "/integrations",
  "/reports",
  "/settings",
  "/settings/notifications",
  "/fleet-map",
  "/fuel-energy",
  "/idling",
  "/ifta",
  "/portal-preview",
  "/workflows",
] as const;

const DISPATCHER_ALLOWED_ROUTES = [
  "/",
  "/ai",
  "/dispatch",
  "/orders",
  "/drivers",
  "/equipment",
  "/customers",
  "/documents",
  "/analytics",
  "/fleet-map",
  "/fuel-energy",
  "/idling",
  "/ifta",
  "/integrations",
  "/reports",
] as const;

const BUTTON_SELECTOR = [
  "button:not(#next-logo):not([data-nextjs-dev-tools-button]):not([data-nextjs-dialog-error-next]):not([data-nextjs-dialog-error-previous])",
  "[role='button']:not([data-nextjs-dev-tools-button]):not([data-nextjs-dialog-error-next]):not([data-nextjs-dialog-error-previous])",
  "a[role='button']",
  "a[class*='btn']",
  "a[class*='Button']",
].join(", ");

const CLOSE_CONTROL_SELECTOR = [
  "button[aria-label*='close' i]",
  "button[aria-label*='dismiss' i]",
  "button:has-text('Close')",
  "button:has-text('Cancel')",
  "button:has-text('No')",
].join(", ");

const MODAL_OPENER_TEXT = /(add|new|create|edit|filter|details|schedule|preferences|notification|settings)/i;
const DELETE_TRIGGER_TEXT = /(delete|remove)/i;
const DELETE_CANCEL_TEXT = /(cancel|no|keep|back)/i;
const DELETE_CONFIRM_TEXT = /(confirm|delete|yes|remove)/i;

const MAX_ISSUES = 350;
const parsePositiveInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};
const parseBatchFilter = (value: string | undefined): Set<number> => {
  const requested = (value ?? "")
    .split(",")
    .map((entry) => Number.parseInt(entry.trim(), 10))
    .filter((entry) => Number.isFinite(entry) && entry > 0)
    .map((entry) => entry - 1);
  return new Set(requested);
};

const chunkArray = <T>(values: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += chunkSize) {
    chunks.push(values.slice(index, index + chunkSize));
  }
  return chunks;
};

const MAX_CONTROLS_PER_ROUTE = parsePositiveInt(
  process.env.BUTTON_SWEEP_MAX_CONTROLS_PER_ROUTE,
  40,
);
const RAPID_CLICK_COUNT = parsePositiveInt(process.env.BUTTON_SWEEP_RAPID_CLICK_COUNT, 10);
const ROUTE_BATCH_SIZE = parsePositiveInt(process.env.BUTTON_SWEEP_ROUTE_BATCH_SIZE, 4);
const ROUTE_BATCH_FILTER = parseBatchFilter(process.env.BUTTON_SWEEP_ROUTE_BATCHES);
const REQUESTED_ROLES = (process.env.BUTTON_SWEEP_ROLES ?? "admin,dispatcher")
  .split(",")
  .map((value) => value.trim())
  .filter(Boolean);
const ACTIVE_ROLES = REQUESTED_ROLES.filter(
  (role): role is Role => role === "admin" || role === "dispatcher",
);
const ROUTE_DEFINITIONS: RouteDefinition[] = [
  ...REQUIRED_STATIC_ROUTES.map((route) => ({ id: route, route })),
  { id: "orders-id", route: "/orders/:id", dynamicIdKey: "orderId" },
  { id: "drivers-id", route: "/drivers/:id", dynamicIdKey: "driverId" },
  { id: "invoice-id", route: "/billing/invoices/:id", dynamicIdKey: "invoiceId" },
];
const ALL_ROUTE_BATCHES = chunkArray(ROUTE_DEFINITIONS, ROUTE_BATCH_SIZE);
const ACTIVE_ROUTE_BATCHES = ALL_ROUTE_BATCHES
  .map((definitions, batchIndex) => ({ batchIndex, definitions }))
  .filter(({ batchIndex }) => ROUTE_BATCH_FILTER.size === 0 || ROUTE_BATCH_FILTER.has(batchIndex));

const newMetrics = (): SweepMetrics => ({
  routesVisited: 0,
  routesAllowed: 0,
  routesBlocked: 0,
  visibleControls: 0,
  singleClicks: 0,
  doubleClicks: 0,
  rapidClicks: 0,
  slow3GClicks: 0,
  offlineClicks: 0,
  modalOpenCloseCycles: 0,
  submitAttempts: 0,
  doubleSubmitAttempts: 0,
  deleteCancelChecks: 0,
  deleteConfirmChecks: 0,
});

const pushIssue = (
  issues: SweepIssue[],
  issue: SweepIssue,
) => {
  if (issues.length < MAX_ISSUES) {
    issues.push(issue);
  }
};

const pathOf = (url: string): string => {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
};

const isAllowedForRole = (role: Role, route: string): boolean => {
  if (role === "admin") {
    return true;
  }

  const pathname = pathOf(route);
  if (DISPATCHER_ALLOWED_ROUTES.includes(pathname as (typeof DISPATCHER_ALLOWED_ROUTES)[number])) {
    return true;
  }

  return DISPATCHER_ALLOWED_ROUTES.some((allowed) => {
    if (allowed === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(`${allowed}/`);
  });
};

const login = async (page: Page, role: Role) => {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  const emailInput = page.getByLabel("Email address");
  const passwordInput = page.getByLabel("Password");
  await expect(emailInput).toBeVisible();
  await expect(passwordInput).toBeVisible();

  await emailInput.fill("");
  await passwordInput.fill("");
  await emailInput.type(USERS[role], { delay: 15 });
  await passwordInput.type(PASSWORD, { delay: 15 });
  await expect(emailInput).toHaveValue(USERS[role]);
  await expect(passwordInput).toHaveValue(PASSWORD);

  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 20000 }).catch(() => undefined);
  if (pathOf(page.url()) === "/login") {
    throw new Error("Login remained on /login after submit.");
  }

  await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => undefined);
};

const extractFirstId = (payload: unknown): string | null => {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const withData = payload as { data?: unknown };
  const source = Array.isArray(withData.data) ? withData.data : payload;
  if (!Array.isArray(source) || source.length === 0) {
    return null;
  }

  const first = source[0];
  if (!first || typeof first !== "object" || !("id" in first)) {
    return null;
  }

  const rawId = (first as { id: unknown }).id;
  if (rawId === null || rawId === undefined) {
    return null;
  }
  return String(rawId);
};

const fetchFirstId = async (
  page: Page,
  endpoint: string,
  role: Role,
  issues: SweepIssue[],
): Promise<string | null> => {
  try {
    const response = await page.request.get(endpoint);
    if (!response.ok()) {
      pushIssue(issues, {
        severity: "warn",
        role,
        route: endpoint,
        action: "fetch-id",
        detail: `Endpoint returned ${response.status()}`,
      });
      return null;
    }

    const payload = await response.json();
    return extractFirstId(payload);
  } catch (error) {
    pushIssue(issues, {
      severity: "warn",
      role,
      route: endpoint,
      action: "fetch-id",
      detail: `Failed to fetch dynamic id: ${String(error)}`,
    });
    return null;
  }
};

const resolveDynamicIds = async (
  page: Page,
  role: Role,
  issues: SweepIssue[],
): Promise<DynamicIds> => {
  const [orderId, driverId, invoiceId] = await Promise.all([
    fetchFirstId(page, "/api/orders?pageSize=1", role, issues),
    fetchFirstId(page, "/api/drivers?pageSize=1", role, issues),
    fetchFirstId(page, "/api/billing/invoices?pageSize=1", role, issues),
  ]);

  return { orderId, driverId, invoiceId };
};

const resolveRoutesForBatch = (
  role: Role,
  definitions: RouteDefinition[],
  ids: DynamicIds,
  issues: SweepIssue[],
): string[] => {
  const routes: string[] = [];

  for (const definition of definitions) {
    if (!definition.dynamicIdKey) {
      routes.push(definition.route);
      continue;
    }

    const dynamicId = ids[definition.dynamicIdKey];
    if (!dynamicId) {
      pushIssue(issues, {
        severity: "warn",
        role,
        route: definition.route,
        action: "resolve-dynamic-route",
        detail: `Missing ${definition.dynamicIdKey} for route ${definition.id}.`,
      });
      continue;
    }

    routes.push(definition.route.replace(":id", dynamicId));
  }

  return Array.from(new Set(routes));
};

const describeControl = async (locator: Locator, index: number): Promise<string> => {
  const text = (await locator.innerText().catch(() => "")).trim().replace(/\s+/g, " ");
  const tag = await locator.evaluate((el) => el.tagName.toLowerCase()).catch(() => "unknown");
  return `${tag}#${index}:${text.slice(0, 80) || "(no-label)"}`;
};

const ensureRoute = async (page: Page, route: string) => {
  const currentPath = pathOf(page.url());
  if (currentPath === route || currentPath === "/unauthorized") {
    return;
  }
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => undefined);
};

const clickWithRecording = async (
  locator: Locator,
  role: Role,
  route: string,
  action: string,
  issues: SweepIssue[],
  options?: Parameters<Locator["click"]>[0],
): Promise<boolean> => {
  try {
    await locator.scrollIntoViewIfNeeded();
    await locator.click({
      timeout: 1500,
      ...options,
    });
    return true;
  } catch (error) {
    pushIssue(issues, {
      severity: "warn",
      role,
      route,
      action,
      detail: String(error),
    });
    return false;
  }
};

const applySlow3G = async (page: Page): Promise<(() => Promise<void>) | null> => {
  try {
    const session = await page.context().newCDPSession(page);
    await session.send("Network.enable");
    await session.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 400,
      downloadThroughput: 50 * 1024,
      uploadThroughput: 20 * 1024,
      connectionType: "cellular3g",
    });

    return async () => {
      await session.send("Network.emulateNetworkConditions", {
        offline: false,
        latency: 0,
        downloadThroughput: -1,
        uploadThroughput: -1,
        connectionType: "none",
      });
      await session.detach().catch(() => undefined);
    };
  } catch {
    return null;
  }
};

const stressControlsOnRoute = async (
  page: Page,
  role: Role,
  route: string,
  metrics: SweepMetrics,
  issues: SweepIssue[],
) => {
  let firstControlDone = false;

  const initialCount = Math.min(
    await page.locator(BUTTON_SELECTOR).count(),
    MAX_CONTROLS_PER_ROUTE,
  );
  for (let index = 0; index < initialCount; index += 1) {
    const controls = page.locator(BUTTON_SELECTOR);
    if (index >= await controls.count()) {
      break;
    }

    const control = controls.nth(index);
    const visible = await control.isVisible().catch(() => false);
    const enabled = await control.isEnabled().catch(() => false);
    if (!visible || !enabled) {
      continue;
    }

    metrics.visibleControls += 1;
    const label = await describeControl(control, index);

    if (await clickWithRecording(control, role, route, `single:${label}`, issues)) {
      metrics.singleClicks += 1;
    }

    const controlsAfterSingle = page.locator(BUTTON_SELECTOR);
    if (index < await controlsAfterSingle.count()) {
      const sameControl = controlsAfterSingle.nth(index);
      if (await clickWithRecording(
        sameControl,
        role,
        route,
        `double:${label}`,
        issues,
        { clickCount: 2 },
      )) {
        metrics.doubleClicks += 1;
      }

      let rapidClickCount = 0;
      for (let burst = 0; burst < RAPID_CLICK_COUNT; burst += 1) {
        const burstControls = page.locator(BUTTON_SELECTOR);
        if (index >= await burstControls.count()) {
          break;
        }
        const burstTarget = burstControls.nth(index);
        if (!await clickWithRecording(
          burstTarget,
          role,
          route,
          `rapid:${label}:${burst + 1}`,
          issues,
        )) {
          break;
        }
        rapidClickCount += 1;
      }
      metrics.rapidClicks += rapidClickCount;
    }

    if (!firstControlDone) {
      const slowReset = await applySlow3G(page);
      const slowControls = page.locator(BUTTON_SELECTOR);
      if (slowReset && index < await slowControls.count()) {
        await clickWithRecording(slowControls.nth(index), role, route, `slow3g:${label}`, issues);
        metrics.slow3GClicks += 1;
        await slowReset();
      }

      await page.context().setOffline(true);
      const offlineControls = page.locator(BUTTON_SELECTOR);
      if (index < await offlineControls.count()) {
        await clickWithRecording(offlineControls.nth(index), role, route, `offline:${label}`, issues);
        metrics.offlineClicks += 1;
      }
      await page.context().setOffline(false);

      firstControlDone = true;
    }

    await ensureRoute(page, route);
  }
};

const findModalOpener = async (page: Page): Promise<Locator | null> => {
  const candidates = page.locator("button, [role='button']");
  const count = Math.min(await candidates.count(), 60);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (!visible || !enabled) {
      continue;
    }

    const label = (await candidate.innerText().catch(() => "")).trim();
    if (!label) {
      continue;
    }
    if (DELETE_TRIGGER_TEXT.test(label)) {
      continue;
    }
    if (MODAL_OPENER_TEXT.test(label)) {
      return candidate;
    }
  }

  return null;
};

const runModalCycles = async (
  page: Page,
  role: Role,
  route: string,
  metrics: SweepMetrics,
  issues: SweepIssue[],
) => {
  const opener = await findModalOpener(page);
  if (!opener) {
    return;
  }

  for (let cycle = 0; cycle < 10; cycle += 1) {
    await clickWithRecording(opener, role, route, `modal-open:${cycle + 1}`, issues);
    await page.waitForTimeout(120);

    const closeControl = page.locator(CLOSE_CONTROL_SELECTOR).first();
    if (await closeControl.isVisible().catch(() => false)) {
      await clickWithRecording(closeControl, role, route, `modal-close:${cycle + 1}`, issues);
    } else {
      await page.keyboard.press("Escape").catch(() => undefined);
    }

    metrics.modalOpenCloseCycles += 1;
    await ensureRoute(page, route);
  }
};

const runSubmitChecks = async (
  page: Page,
  role: Role,
  route: string,
  metrics: SweepMetrics,
  issues: SweepIssue[],
) => {
  const submitButtons = page.locator("form button[type='submit']");
  if (await submitButtons.count() === 0) {
    return;
  }

  const submit = submitButtons.first();
  if (!await submit.isVisible().catch(() => false)) {
    return;
  }

  await clickWithRecording(submit, role, route, "submit-invalid", issues);
  metrics.submitAttempts += 1;

  await Promise.allSettled([
    submit.click({ timeout: 1200 }),
    submit.click({ timeout: 1200 }),
  ]);
  metrics.doubleSubmitAttempts += 1;

  await ensureRoute(page, route);
};

const findDeleteControl = async (page: Page): Promise<Locator | null> => {
  const candidates = page.locator("button, [role='button']");
  const count = Math.min(await candidates.count(), 120);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    const visible = await candidate.isVisible().catch(() => false);
    const enabled = await candidate.isEnabled().catch(() => false);
    if (!visible || !enabled) {
      continue;
    }

    const label = (await candidate.innerText().catch(() => "")).trim();
    if (DELETE_TRIGGER_TEXT.test(label)) {
      return candidate;
    }
  }

  return null;
};

const findActionButtonByText = async (
  page: Page,
  matcher: RegExp,
): Promise<Locator | null> => {
  const candidates = page.locator("button, [role='button']");
  const count = Math.min(await candidates.count(), 120);

  for (let index = 0; index < count; index += 1) {
    const candidate = candidates.nth(index);
    if (!await candidate.isVisible().catch(() => false)) {
      continue;
    }
    const label = (await candidate.innerText().catch(() => "")).trim();
    if (matcher.test(label)) {
      return candidate;
    }
  }

  return null;
};

const runDeleteChecks = async (
  page: Page,
  role: Role,
  route: string,
  metrics: SweepMetrics,
  issues: SweepIssue[],
  setDialogMode: (mode: "dismiss" | "accept") => void,
) => {
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);

  const deleteControl = await findDeleteControl(page);
  if (!deleteControl) {
    pushIssue(issues, {
      severity: "warn",
      role,
      route,
      action: "delete-check",
      detail: "No visible delete/remove control found.",
    });
    return;
  }

  setDialogMode("dismiss");
  const beforeCancelPath = pathOf(page.url());
  await clickWithRecording(deleteControl, role, route, "delete-open-cancel-path", issues);
  await page.waitForTimeout(180);
  const cancelButton = await findActionButtonByText(page, DELETE_CANCEL_TEXT);
  if (cancelButton) {
    await clickWithRecording(cancelButton, role, route, "delete-cancel", issues);
  } else {
    await page.keyboard.press("Escape").catch(() => undefined);
  }

  const afterCancelPath = pathOf(page.url());
  if (beforeCancelPath !== afterCancelPath && afterCancelPath !== route) {
    pushIssue(issues, {
      severity: "error",
      role,
      route,
      action: "delete-cancel",
      detail: "Cancel path navigated away unexpectedly.",
    });
  }
  metrics.deleteCancelChecks += 1;

  setDialogMode("accept");
  await clickWithRecording(deleteControl, role, route, "delete-open-confirm-path", issues);
  await page.waitForTimeout(200);
  const confirmButton = await findActionButtonByText(page, DELETE_CONFIRM_TEXT);
  if (confirmButton) {
    await clickWithRecording(confirmButton, role, route, "delete-confirm", issues);
  }
  setDialogMode("dismiss");
  metrics.deleteConfirmChecks += 1;

  await page.waitForTimeout(250);
  const currentPath = pathOf(page.url());
  if (currentPath === "/login") {
    pushIssue(issues, {
      severity: "error",
      role,
      route,
      action: "delete-confirm",
      detail: "Delete confirm flow sent session back to /login unexpectedly.",
    });
  }
};

const visitRoute = async (
  page: Page,
  role: Role,
  route: string,
  issues: SweepIssue[],
): Promise<RouteVisitResult> => {
  const expectedAllowed = isAllowedForRole(role, route);
  await page.goto(route, { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 8000 }).catch(() => undefined);

  const currentPath = pathOf(page.url());
  const blocked = currentPath === "/unauthorized";

  if (expectedAllowed && blocked) {
    pushIssue(issues, {
      severity: "error",
      role,
      route,
      action: "route-access",
      detail: "Route should be allowed but redirected to /unauthorized.",
    });
  }

  if (!expectedAllowed && !blocked) {
    pushIssue(issues, {
      severity: "error",
      role,
      route,
      action: "route-access",
      detail: "Route should be blocked but did not redirect to /unauthorized.",
    });
  }

  if (currentPath === "/login") {
    pushIssue(issues, {
      severity: "error",
      role,
      route,
      action: "route-access",
      detail: "Unexpected redirect to /login while authenticated.",
    });
  }

  return { expectedAllowed, blocked };
};

const registerIssueCollectors = (
  page: Page,
  role: Role,
  issues: SweepIssue[],
) => {
  const serverErrors: string[] = [];
  const uncaughtErrors: string[] = [];
  const consoleErrors: string[] = [];
  let dialogMode: "dismiss" | "accept" = "dismiss";

  page.on("dialog", async (dialog) => {
    if (dialogMode === "accept") {
      await dialog.accept().catch(() => undefined);
    } else {
      await dialog.dismiss().catch(() => undefined);
    }
  });

  page.on("pageerror", (error) => {
    const detail = error.message;
    uncaughtErrors.push(detail);
    pushIssue(issues, {
      severity: "error",
      role,
      route: pathOf(page.url()),
      action: "uncaught-exception",
      detail,
    });
  });

  page.on("console", (message) => {
    if (message.type() !== "error") {
      return;
    }
    const detail = message.text();
    consoleErrors.push(detail);
    pushIssue(issues, {
      severity: "warn",
      role,
      route: pathOf(page.url()),
      action: "console-error",
      detail,
    });
  });

  page.on("response", (response) => {
    if (response.status() < 500) {
      return;
    }
    const detail = `${response.status()} ${response.url()}`;
    serverErrors.push(detail);
    pushIssue(issues, {
      severity: "error",
      role,
      route: pathOf(page.url()),
      action: "server-5xx",
      detail,
    });
  });

  return {
    serverErrors,
    uncaughtErrors,
    consoleErrors,
    setDialogMode: (mode: "dismiss" | "accept") => {
      dialogMode = mode;
    },
  };
};

for (const role of ACTIVE_ROLES) {
  for (const { batchIndex, definitions } of ACTIVE_ROUTE_BATCHES) {
    const batchNumber = batchIndex + 1;

    test(`button sweep (${role}) routes batch ${batchNumber}/${ALL_ROUTE_BATCHES.length}`, async ({ page }) => {
      const metrics = newMetrics();
      const issues: SweepIssue[] = [];
      const { serverErrors, uncaughtErrors, consoleErrors } = registerIssueCollectors(page, role, issues);

      await login(page, role);
      const ids = await resolveDynamicIds(page, role, issues);
      const routes = resolveRoutesForBatch(role, definitions, ids, issues);

      for (const route of routes) {
        const result = await visitRoute(page, role, route, issues);
        metrics.routesVisited += 1;
        if (result.blocked) {
          metrics.routesBlocked += 1;
          continue;
        }

        metrics.routesAllowed += 1;
        await stressControlsOnRoute(page, role, route, metrics, issues);
        await runModalCycles(page, role, route, metrics, issues);
        await runSubmitChecks(page, role, route, metrics, issues);
      }

      const fatalIssues = issues.filter((issue) => issue.severity === "error");
      const summary = {
        role,
        testType: "routes-batch",
        batchNumber,
        batchCount: ALL_ROUTE_BATCHES.length,
        batchSize: ROUTE_BATCH_SIZE,
        requestedBatches: Array.from(ROUTE_BATCH_FILTER)
          .sort((left, right) => left - right)
          .map((value) => value + 1),
        batchRouteIds: definitions.map((definition) => definition.id),
        routesVisited: metrics.routesVisited,
        routesAllowed: metrics.routesAllowed,
        routesBlocked: metrics.routesBlocked,
        visibleControls: metrics.visibleControls,
        singleClicks: metrics.singleClicks,
        doubleClicks: metrics.doubleClicks,
        rapidClicks: metrics.rapidClicks,
        slow3GClicks: metrics.slow3GClicks,
        offlineClicks: metrics.offlineClicks,
        modalOpenCloseCycles: metrics.modalOpenCloseCycles,
        submitAttempts: metrics.submitAttempts,
        doubleSubmitAttempts: metrics.doubleSubmitAttempts,
        deleteCancelChecks: metrics.deleteCancelChecks,
        deleteConfirmChecks: metrics.deleteConfirmChecks,
        maxControlsPerRoute: MAX_CONTROLS_PER_ROUTE,
        rapidClickCountPerControl: RAPID_CLICK_COUNT,
        server5xxCount: serverErrors.length,
        uncaughtExceptionCount: uncaughtErrors.length,
        consoleErrorCount: consoleErrors.length,
        issueCount: issues.length,
        fatalIssueCount: fatalIssues.length,
        firstFatalIssue: fatalIssues[0] ?? null,
      };

      console.log(`BUTTON_SWEEP_SUMMARY_${role.toUpperCase()}_BATCH_${batchNumber}=${JSON.stringify(summary)}`);
      expect(
        fatalIssues,
        `Fatal issues for ${role} batch ${batchNumber}: ${JSON.stringify(fatalIssues.slice(0, 10))}`,
      ).toEqual([]);
    });
  }

  test(`button sweep (${role}) delete flows`, async ({ page }) => {
    const metrics = newMetrics();
    const issues: SweepIssue[] = [];
    const { serverErrors, uncaughtErrors, consoleErrors, setDialogMode } = registerIssueCollectors(page, role, issues);

    await login(page, role);
    const ids = await resolveDynamicIds(page, role, issues);

    if (ids.orderId && isAllowedForRole(role, `/orders/${ids.orderId}`)) {
      await runDeleteChecks(page, role, `/orders/${ids.orderId}`, metrics, issues, setDialogMode);
    }

    if (ids.driverId && isAllowedForRole(role, `/drivers/${ids.driverId}`)) {
      await runDeleteChecks(page, role, `/drivers/${ids.driverId}`, metrics, issues, setDialogMode);
    }

    const fatalIssues = issues.filter((issue) => issue.severity === "error");
    const summary = {
      role,
      testType: "delete-flows",
      routesVisited: metrics.routesVisited,
      routesAllowed: metrics.routesAllowed,
      routesBlocked: metrics.routesBlocked,
      visibleControls: metrics.visibleControls,
      singleClicks: metrics.singleClicks,
      doubleClicks: metrics.doubleClicks,
      rapidClicks: metrics.rapidClicks,
      slow3GClicks: metrics.slow3GClicks,
      offlineClicks: metrics.offlineClicks,
      modalOpenCloseCycles: metrics.modalOpenCloseCycles,
      submitAttempts: metrics.submitAttempts,
      doubleSubmitAttempts: metrics.doubleSubmitAttempts,
      deleteCancelChecks: metrics.deleteCancelChecks,
      deleteConfirmChecks: metrics.deleteConfirmChecks,
      maxControlsPerRoute: MAX_CONTROLS_PER_ROUTE,
      rapidClickCountPerControl: RAPID_CLICK_COUNT,
      server5xxCount: serverErrors.length,
      uncaughtExceptionCount: uncaughtErrors.length,
      consoleErrorCount: consoleErrors.length,
      issueCount: issues.length,
      fatalIssueCount: fatalIssues.length,
      firstFatalIssue: fatalIssues[0] ?? null,
    };

    console.log(`BUTTON_SWEEP_SUMMARY_${role.toUpperCase()}_DELETE=${JSON.stringify(summary)}`);
    expect(fatalIssues, `Fatal issues for ${role} delete flows: ${JSON.stringify(fatalIssues.slice(0, 10))}`).toEqual([]);
  });
}

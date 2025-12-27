import { test, expect, type Page } from "@playwright/test";

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const SCREENSHOT_DIR = "./e2e/screenshots/grid-creator";

// Helper to create a grid with specified dimensions
async function createGrid(page: Page, width = 10, height = 10) {
    await page.locator("#width").fill(String(width));
    await page.locator("#height").fill(String(height));
    await page.getByRole("button", { name: "Create Grid" }).click();
    await page.locator("canvas").waitFor({ state: "visible" });
}

// Helper to click center of canvas
async function clickCanvasCenter(page: Page) {
    const canvas = page.locator("canvas");
    const box = await canvas.boundingBox();
    if (!box) throw new Error("Canvas bounding box not found");
    await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
}

test.describe("Grid Creator", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/grid-creator`);
    });

    test("should create a grid", async ({ page }) => {
        // Fill in grid dimensions
        await page.locator("#width").fill("10");
        await page.locator("#height").fill("10");

        // Click create button
        await page.getByRole("button", { name: "Create Grid" }).click();

        // Verify canvas appears
        const canvas = page.locator("canvas");
        await expect(canvas).toBeVisible();

        // Take screenshot
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/grid-created.png`,
            fullPage: true,
        });
    });

    test("should paint on grid with color", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Paint tool is selected by default with black color
        // Click center of canvas to paint
        await clickCanvasCenter(page);

        // Take screenshot to verify paint
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/after-paint.png`,
            fullPage: true,
        });
    });

    test("should paint on grid with symbol view", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Switch to Symbol view mode
        await page.getByRole("radio", { name: "Symbol" }).click();

        // Paint on canvas
        await clickCanvasCenter(page);

        // Take screenshot to verify symbol
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/symbol-painted.png`,
            fullPage: true,
        });
    });

    test("should erase a grid element", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Paint a cell first
        await clickCanvasCenter(page);

        // Switch to Erase tool
        await page.getByRole("radio", { name: "Erase" }).click();

        // Erase the same cell
        await clickCanvasCenter(page);

        // Take screenshot to verify erase
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/after-erase.png`,
            fullPage: true,
        });
    });

    test("should zoom in and paint", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Click zoom in button
        await page.getByRole("button", { name: "Zoom in" }).click();

        // Verify zoom level changed to 110%
        await expect(page.getByLabel(/Zoom level: 110%/)).toBeVisible();

        // Paint on canvas while zoomed
        await clickCanvasCenter(page);

        // Take screenshot
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/zoomed-paint.png`,
            fullPage: true,
        });
    });

    test("should zoom out", async ({ page }) => {
        await createGrid(page, 10, 10);

        // First zoom in
        await page.getByRole("button", { name: "Zoom in" }).click();
        await expect(page.getByLabel(/Zoom level: 110%/)).toBeVisible();

        // Then zoom out
        await page.getByRole("button", { name: "Zoom out" }).click();

        // Verify zoom level returned to 100%
        await expect(page.getByLabel(/Zoom level: 100%/)).toBeVisible();

        // Take screenshot
        await page.screenshot({
            path: `${SCREENSHOT_DIR}/zoomed-out.png`,
            fullPage: true,
        });
    });

    test("should reset zoom", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Zoom in multiple times
        const zoomInButton = page.getByRole("button", { name: "Zoom in" });
        await zoomInButton.click();
        await zoomInButton.click();
        await zoomInButton.click();

        // Verify zoomed in (130%)
        await expect(page.getByLabel(/Zoom level: 130%/)).toBeVisible();

        // Reset zoom
        await page.getByRole("button", { name: "Reset view to default zoom" }).click();

        // Verify zoom returned to 100%
        await expect(page.getByLabel(/Zoom level: 100%/)).toBeVisible();
    });

    test("should clear grid with New Grid button", async ({ page }) => {
        await createGrid(page, 10, 10);

        // Paint some cells
        await clickCanvasCenter(page);

        // Verify canvas is visible
        await expect(page.locator("canvas")).toBeVisible();

        // Click New Grid button
        await page.getByRole("button", { name: /New Grid/ }).click();

        // Verify we're back to config phase - config form should be visible
        await expect(page.locator("#width")).toBeVisible();
        await expect(page.locator("#height")).toBeVisible();

        // Canvas should no longer be visible
        await expect(page.locator("canvas")).not.toBeVisible();
    });

    test.describe("View Mode Selection", () => {
        test("should show Color view as active when selected", async ({ page }) => {
            await createGrid(page, 10, 10);

            // Click Color view mode
            const colorButton = page.getByRole("radio", { name: "Color" });
            await colorButton.click();

            // Verify it has the active state (aria-checked=true)
            await expect(colorButton).toHaveAttribute("aria-checked", "true");

            // Verify other buttons are not active
            await expect(page.getByRole("radio", { name: "Symbol" })).toHaveAttribute("aria-checked", "false");
            await expect(page.getByRole("radio", { name: "Both" })).toHaveAttribute("aria-checked", "false");

            // Take screenshot to verify visual state
            await page.screenshot({
                path: `${SCREENSHOT_DIR}/view-mode-color-active.png`,
                fullPage: true,
            });
        });

        test("should show Symbol view as active when selected", async ({ page }) => {
            await createGrid(page, 10, 10);

            // Click Symbol view mode
            const symbolButton = page.getByRole("radio", { name: "Symbol" });
            await symbolButton.click();

            // Verify it has the active state (aria-checked=true)
            await expect(symbolButton).toHaveAttribute("aria-checked", "true");

            // Verify other buttons are not active
            await expect(page.getByRole("radio", { name: "Color" })).toHaveAttribute("aria-checked", "false");
            await expect(page.getByRole("radio", { name: "Both" })).toHaveAttribute("aria-checked", "false");

            // Take screenshot to verify visual state
            await page.screenshot({
                path: `${SCREENSHOT_DIR}/view-mode-symbol-active.png`,
                fullPage: true,
            });
        });

        test("should show Both view as active by default", async ({ page }) => {
            await createGrid(page, 10, 10);

            // Both view should be active by default
            const bothButton = page.getByRole("radio", { name: "Both" });
            await expect(bothButton).toHaveAttribute("aria-checked", "true");

            // Verify other buttons are not active
            await expect(page.getByRole("radio", { name: "Color" })).toHaveAttribute("aria-checked", "false");
            await expect(page.getByRole("radio", { name: "Symbol" })).toHaveAttribute("aria-checked", "false");

            // Take screenshot to verify visual state
            await page.screenshot({
                path: `${SCREENSHOT_DIR}/view-mode-both-active.png`,
                fullPage: true,
            });
        });

        test("should switch between all view modes", async ({ page }) => {
            await createGrid(page, 10, 10);

            // Paint a cell first to have content to display
            await clickCanvasCenter(page);

            const colorButton = page.getByRole("radio", { name: "Color" });
            const symbolButton = page.getByRole("radio", { name: "Symbol" });
            const bothButton = page.getByRole("radio", { name: "Both" });

            // Start with Both (default)
            await expect(bothButton).toHaveAttribute("aria-checked", "true");

            // Switch to Color
            await colorButton.click();
            await expect(colorButton).toHaveAttribute("aria-checked", "true");
            await expect(symbolButton).toHaveAttribute("aria-checked", "false");
            await expect(bothButton).toHaveAttribute("aria-checked", "false");

            // Switch to Symbol
            await symbolButton.click();
            await expect(symbolButton).toHaveAttribute("aria-checked", "true");
            await expect(colorButton).toHaveAttribute("aria-checked", "false");
            await expect(bothButton).toHaveAttribute("aria-checked", "false");

            // Switch back to Both
            await bothButton.click();
            await expect(bothButton).toHaveAttribute("aria-checked", "true");
            await expect(colorButton).toHaveAttribute("aria-checked", "false");
            await expect(symbolButton).toHaveAttribute("aria-checked", "false");
        });
    });
});

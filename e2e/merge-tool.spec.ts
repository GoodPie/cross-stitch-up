import { test, expect, type Page } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

// Test data matching the known working configuration
const TEST_CONFIG = {
    dimensions: { width: 105, height: 102 },
    pdfPath: path.resolve(__dirname, "fixtures/example.pdf"),
    // Grid arrangement: 2x2 grid with pages 2,3,4,5
    gridArrangement: [
        { pageNumber: 2, row: 0, col: 0 }, // top-left
        { pageNumber: 3, row: 0, col: 1 }, // top-right
        { pageNumber: 4, row: 1, col: 0 }, // bottom-left
        { pageNumber: 5, row: 1, col: 1 }, // bottom-right
    ],
};

// Helper: Enter dimensions in config form
async function enterDimensions(page: Page, width: number, height: number) {
    const widthInput = page.getByLabel("Width (stitches)");
    const heightInput = page.getByLabel("Height (stitches)");

    // Use click + clear + type for reliable cross-browser input
    // (fill() can be unreliable on number inputs in WebKit)
    await widthInput.click();
    await widthInput.clear();
    await widthInput.pressSequentially(String(width));
    await expect(widthInput).toHaveValue(String(width));

    await heightInput.click();
    await heightInput.clear();
    await heightInput.pressSequentially(String(height));
    await expect(heightInput).toHaveValue(String(height));

    // Wait for button to be enabled before clicking
    const continueButton = page.getByRole("button", { name: /Continue to Upload/i });
    await expect(continueButton).toBeEnabled({ timeout: 5000 });
    await continueButton.click();
}

// Helper: Upload PDF file
async function uploadPdf(page: Page, filePath: string) {
    const fileInput = page.locator('input[type="file"][accept=".pdf"]');
    await fileInput.setInputFiles(filePath);
}

// Helper: Wait for page thumbnails to load
async function waitForPdfProcessing(page: Page) {
    // Wait for the "selecting" state - page selector should be visible
    await page.getByText("Arrange Pattern Pages").waitFor({
        state: "visible",
        timeout: 60000,
    });
}

// Helper: Drag page to grid cell using low-level mouse events
// @dnd-kit requires proper pointer events with 5px activation distance
async function dragPageToCell(page: Page, pageNumber: number, row: number, col: number) {
    // Find the page thumbnail by its page number badge
    const pageThumbnails = page.locator(".group.relative").filter({
        has: page.locator(`text="Page ${pageNumber}"`),
    });
    const source = pageThumbnails.first();

    // Find the droppable cell by aria-label
    const target = page.locator(`[aria-label="Drop zone row ${row + 1} column ${col + 1}"]`);

    // Get bounding boxes
    const sourceBox = await source.boundingBox();
    const targetBox = await target.boundingBox();

    if (!sourceBox || !targetBox) {
        throw new Error(`Could not find bounding boxes for page ${pageNumber} or cell ${row},${col}`);
    }

    // Calculate centers
    const sourceCenter = {
        x: sourceBox.x + sourceBox.width / 2,
        y: sourceBox.y + sourceBox.height / 2,
    };
    const targetCenter = {
        x: targetBox.x + targetBox.width / 2,
        y: targetBox.y + targetBox.height / 2,
    };

    // Perform drag with explicit mouse movements
    // @dnd-kit MouseSensor needs 5px movement to activate
    await page.mouse.move(sourceCenter.x, sourceCenter.y);
    await page.waitForTimeout(50); // Small delay for event registration
    await page.mouse.down();
    await page.waitForTimeout(50);

    // Move at least 5px to trigger @dnd-kit activation (larger movement for WebKit)
    await page.mouse.move(sourceCenter.x + 15, sourceCenter.y + 15, {
        steps: 10,
    });
    await page.waitForTimeout(50);

    // Move to target with more steps for smoother movement
    await page.mouse.move(targetCenter.x, targetCenter.y, { steps: 20 });
    await page.waitForTimeout(50);

    // Release
    await page.mouse.up();

    // Wait for the cell to be populated
    await expect(target).not.toContainText("Drop here", { timeout: 10000 });
}

// Helper: Wait for merge processing
async function waitForMergeComplete(page: Page) {
    // Wait for success state
    await page.getByText("Pattern merged successfully!").waitFor({
        state: "visible",
        timeout: 120000, // 2 minutes for large PDF processing
    });
}

test.describe("PDF Merge Tool", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_URL}/merge`);
    });

    test("should merge pattern pages and produce consistent output", async ({ page }) => {
        // Step 1: Enter dimensions
        await enterDimensions(page, TEST_CONFIG.dimensions.width, TEST_CONFIG.dimensions.height);

        // Verify we're in upload state
        await expect(page.getByText("Drop your pattern PDF here")).toBeVisible();

        // Step 2: Upload PDF
        await uploadPdf(page, TEST_CONFIG.pdfPath);

        // Step 3: Wait for PDF processing
        await waitForPdfProcessing(page);

        // Verify page count is visible
        await expect(page.getByText(/\d+ pages/)).toBeVisible();

        // Step 4: Arrange pages in 2x2 grid
        for (const cell of TEST_CONFIG.gridArrangement) {
            await dragPageToCell(page, cell.pageNumber, cell.row, cell.col);
            // Small delay between drags for stability
            await page.waitForTimeout(300);
        }

        // Verify all 4 slots are filled
        await expect(page.getByText("4 of 4 slots filled")).toBeVisible();

        // Step 5: Click merge
        await page.getByRole("button", { name: /Merge Pattern/i }).click();

        // Step 6: Wait for processing
        await waitForMergeComplete(page);

        // Step 7: Verify success state content
        await expect(page.getByText("Pattern merged successfully!")).toBeVisible();
        // Verify pixel dimensions are shown (format: "width × height pixels")
        // The dimensions shown are pixel dimensions of the merged image, not stitch count
        await expect(page.getByText(/\d+ × \d+ pixels/).first()).toBeVisible();

        // Step 8: Capture and compare merged result
        const resultImage = page.locator('img[alt="Merged cross stitch pattern"]');
        await expect(resultImage).toBeVisible();

        // Visual regression test - compare against baseline
        await expect(resultImage).toHaveScreenshot("baseline-merged-result.png", {
            maxDiffPixelRatio: 0.02,
            threshold: 0.2,
        });
    });

    test("should handle flow state transitions correctly", async ({ page }) => {
        // This test verifies the state machine without full visual comparison

        // Config -> Upload
        await enterDimensions(page, 100, 100);
        await expect(page.getByText("Drop your pattern PDF here")).toBeVisible();

        // Upload -> Selecting
        await uploadPdf(page, TEST_CONFIG.pdfPath);
        await waitForPdfProcessing(page);
        await expect(page.getByText("Arrange Pattern Pages")).toBeVisible();

        // Back navigation test
        await page.getByRole("button", { name: "Back" }).click();
        await expect(page.getByText("Drop your pattern PDF here")).toBeVisible();
    });
});

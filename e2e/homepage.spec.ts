import {test, expect} from "@playwright/test";

const BASE_URL = process.env.BETTER_AUTH_URL || "http://localhost:3000";

test("homepage screenshot test", async ({page}) => {
    await page.goto(BASE_URL);
    await page.screenshot({path: './e2e/screenshots/homepage.png', fullPage: true});
})

test("has title", async ({page}) => {
    await page.goto(BASE_URL);
    await expect(page).toHaveTitle(/Cross Stitch-up/);
});

test("pattern marge tool card visible", async ({page}) => {
    await page.goto(BASE_URL);
    await expect(page.getByRole('link', {name: 'Pattern Merge Combine multi-'})).toBeVisible();
    await expect(page.getByRole('link', {name: 'Pattern Merge Combine multi-'})).toHaveAttribute('href', '/merge');
});

const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  // We don't know the exact URL, let's try the dashboard and see if there are global errors
  console.log("Navigating to http://localhost:3000/");
  try {
    await page.goto('http://localhost:3000/');
    await page.waitForTimeout(5000); // Wait for hydration
  } catch (e) {
    console.error("Navigation failed:", e.message);
  }
  
  await browser.close();
})();

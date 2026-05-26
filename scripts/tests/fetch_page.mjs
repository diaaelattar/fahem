import puppeteer from 'puppeteer';
import fs from 'fs';

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();
    await page.goto('https://app.istabaq.com/register', { waitUntil: 'networkidle2' });
    const content = await page.evaluate(() => document.body.innerText);
    fs.writeFileSync('istabaq_register.txt', content);
    console.log('Saved to istabaq_register.txt');
    await browser.close();
  } catch (err) {
    console.error('Error with puppeteer. Trying fetch...', err.message);
  }
})();

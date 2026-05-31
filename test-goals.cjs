const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });

  try {
    await page.goto('http://localhost:5173/goals', { waitUntil: 'networkidle' });
    console.log('Goals page loaded.');
    await page.waitForTimeout(1000);
  } catch (e) {
    console.error('Navigation error:', e);
  }

  await browser.close();
})();

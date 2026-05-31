const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
  
  const todos = await page.evaluate(() => {
    return localStorage.getItem('lifeos-todos');
  });
  
  const habits = await page.evaluate(() => {
    return localStorage.getItem('lifeos-habits');
  });

  console.log("=== TODOS ===");
  console.log(todos);
  console.log("=== HABITS ===");
  console.log(habits);

  await browser.close();
})();

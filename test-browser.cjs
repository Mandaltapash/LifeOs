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
    await page.goto('http://localhost:5173/notes', { waitUntil: 'networkidle' });
    const notesContent = await page.content();
    console.log('Notes Content length:', notesContent.length);
    console.log('Notes root innerHTML:', await page.locator('#root').innerHTML());

    await page.goto('http://localhost:5173/habits', { waitUntil: 'networkidle' });
    const habitsContent = await page.content();
    console.log('Habits Content length:', habitsContent.length);
    console.log('Habits root innerHTML:', await page.locator('#root').innerHTML());

  } catch (e) {
    console.error('Navigation error:', e);
  }

  await browser.close();
})();

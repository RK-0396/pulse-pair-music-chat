const puppeteer = require('puppeteer');
const wait = (ms) => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  page.on('pageerror', err => {
    console.error('CRITICAL PAGE ERROR:', err.message);
    console.error('STACK:', err.stack);
  });

  await page.goto('http://localhost:3000');
  await wait(2000);
  
  await page.type('#room-id-input', 'test');
  await page.click('#join-room-btn');
  await wait(5000);
  
  await browser.close();
})();

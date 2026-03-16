const puppeteer = require('puppeteer');
(async () => {
    try {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
        page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
        page.on('pageerror', error => console.log('Uncaught Exception:', error.message));
        page.on('requestfailed', request => console.log('Request Failed:', request.url(), request.failure().errorText));
        
        await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle0' });
        await new Promise(r => setTimeout(r, 2000));
        await browser.close();
    } catch (err) {
        console.error('PUPPETEER ERROR:', err);
        process.exit(1);
    }
})();

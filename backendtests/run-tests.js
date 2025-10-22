const puppeteer = require('puppeteer');

const BASE_URL = 'http://168.75.97.45:3000/gmp-portal';
const TEST_PAGES = [
  'minimal-test.html',
  'security-test.html',
  'database-test.html',
  'integration-test.html',
  'performance-test.html',
  'test-dashboard.html',
  'auto-test.html',
  'test-summary.html'
];

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox'
    ]
  });

  const page = await browser.newPage();

  for (const testPage of TEST_PAGES) {
    const url = `${BASE_URL}/${testPage}`;
    console.log(`\n=== Abrindo ${url} ===`);

    page.on('console', msg => {
      console.log(`[${testPage}] ${msg.text()}`);
    });

    try {
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log(`✔ Página ${testPage} carregada com sucesso`);
    } catch (err) {
      console.error(`✘ Erro ao carregar ${testPage}:`, err.message);
    }
  }

  await browser.close();
})();

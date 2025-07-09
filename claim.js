const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const puppeteer = require('puppeteer');

dotenv.config();

const CAPTCHA_KEY = process.env.CAPTCHA_API_KEY;
const PROXY = process.env.PROXY || null;

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function claimFaucet(address, index) {
  const browser = await puppeteer.launch({
    headless: true,
    args: PROXY ? [`--proxy-server=${PROXY}`] : []
  });

  const page = await browser.newPage();

  try {
    await page.goto('https://faucet.zigchain.com/', { waitUntil: 'networkidle2', timeout: 60000 });

    await page.waitForSelector('input[type="text"], select');
    await page.evaluate((addr) => {
      const input = document.querySelector('input[type="text"], select');
      input.value = addr;
    }, address);

    // Tunggu tombol captcha muncul
    await page.waitForSelector('.h-captcha iframe', { timeout: 15000 });

    console.log(`[${index}] 🧩 Bypass captcha untuk ${address}...`);

    // Simulasikan click CAPTCHA pakai eksternal solver (manual atau 2captcha)
    // NOTE: Harus integrasi langsung dengan 2captcha API jika ingin full auto
    // Saat ini klik manual jika CAPTCHA muncul

    // Tunggu tombol aktif
    await page.waitForFunction(() => {
      const btn = document.querySelector('button');
      return btn && !btn.disabled;
    }, { timeout: 30000 });

    await page.click('button');
    console.log(`[${index}] ✅ Token diklaim untuk ${address}`);

  } catch (e) {
    console.error(`[${index}] ❌ Gagal klaim ${address}:`, e.message);
  } finally {
    await browser.close();
    await delay(10000); // Delay 10 detik
  }
}

async function main() {
  const addressList = fs.readFileSync(path.join(__dirname, 'address.txt'), 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  console.log(`🔁 Mulai klaim untuk ${addressList.length} wallet...\n`);

  for (let i = 0; i < addressList.length; i++) {
    await claimFaucet(addressList[i], i + 1);
  }

  console.log(`\n✅ Selesai semua wallet.`);
}

main();

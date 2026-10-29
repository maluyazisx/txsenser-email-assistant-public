// One browser pass over this exported component; no historical suites or live services.
const {chromium} = require('playwright');
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const {pathToFileURL} = require('url');

(async () => {
  const root = path.resolve(__dirname, '..');
  const output = path.join(root, 'test-results');
  fs.mkdirSync(output, {recursive: true});
  const browser = await chromium.launch({
    executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome',
    chromiumSandbox: true,
    headless: true
  });
  const errors = [], requests = [];
  try {
    for (const [label, width, height] of [['desktop',1400,900],['narrow',390,844]]) {
      const page = await browser.newPage({viewport: {width,height}});
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if(message.type()==='error')errors.push(message.text()); });
      page.on('request', request => { if(!request.url().startsWith('file:'))requests.push(request.url()); });
      await page.goto(pathToFileURL(path.join(root,'preview/index.html')).href);
      await page.locator('#source-mail-chinese').waitFor();
      assert.ok((await page.locator('#source-mail-chinese').innerText()).endsWith('长文结束：27 件。'));
      assert.equal(await page.locator('#source-mail-original').isVisible(),false);
      const visible=await page.locator('#reader').innerText();
      assert.ok(visible.includes('邮件正文（中文）'));
      assert.ok(!visible.includes('来源版本：'));
      assert.ok(!visible.includes('synthetic:mail:'));
      assert.ok(!/[a-f0-9]{64}/.test(visible));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.locator('.source-mail-original-toggle').click();
      assert.ok((await page.locator('#source-mail-original').innerText()).includes('Long body end: 27 pieces.'));
      await page.locator('#source-mail-history summary').click();
      await page.locator('.source-mail-select').click();
      assert.equal(await page.locator('#source-mail-chinese').innerText(),'示例A：\n\n请仅阅读这一封较早的邮件。\n\n示例B 敬上');
      assert.equal(await page.locator('#source-mail-original').isVisible(),false);
      await page.locator('[data-example="1"]').click();
      assert.equal(await page.locator('#source-mail-chinese').count(),0);
      assert.ok((await page.locator('#reader').innerText()).includes('这件事尚未提供可阅读的邮件正文'));
      await page.locator('[data-example="0"]').click();
      await page.evaluate(()=>scrollTo(0,0));
      await page.screenshot({path:path.join(output,label+'.png')});
      await page.close();
    }
    assert.deepEqual(requests,[]);
    assert.deepEqual(errors,[]);
    console.log(JSON.stringify({status:'SYNTHETIC_BROWSER_PASS',viewports:['1400x900','390x844'],network_requests:[],limit:'Exported source reader only; no native or real-mail acceptance'}));
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});

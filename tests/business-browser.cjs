// Targeted business-flow browser check; synthetic-only and no external requests.
const {chromium}=require('playwright');
const assert=require('assert/strict'), fs=require('fs'),path=require('path'),http=require('http');
(async()=>{
  const root=path.resolve(__dirname,'..'), output=path.join(root,'test-results');
  fs.mkdirSync(output,{recursive:true});
  const allowed={'/preview/business.html':'text/html','/source/source-mail.js':'application/javascript','/source/source-mail.css':'text/css','/source/business-case.js':'application/javascript','/source/business-flow.js':'application/javascript','/source/business.css':'text/css'};
  const server=http.createServer((req,res)=>{
    if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}
    const kind=allowed[req.url];
    if(!kind||req.method!=='GET'){res.writeHead(404);res.end();return;}
    res.writeHead(200,{'Content-Type':kind+'; charset=utf-8','Cache-Control':'no-store'});
    fs.createReadStream(path.join(root,req.url)).pipe(res);
  });
  await new Promise((ok,bad)=>{server.once('error',bad);server.listen(0,'127.0.0.1',ok);});
  const origin='http://127.0.0.1:'+server.address().port;
  let browser;
  try{
    browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/usr/bin/google-chrome',chromiumSandbox:true,headless:true});
    for(const [label,width,height] of [['business-desktop',1400,900],['business-narrow',390,844]]){
      const page=await browser.newPage({viewport:{width,height}}),bad=[],errors=[],visited=[];
      page.on('pageerror',e=>errors.push(e.message));
      page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
      await page.addInitScript(()=>{Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async t=>{window.__copied=t;}}});});
      await page.route('**/*',route=>{
        const url=route.request().url();
        if(!url.startsWith(origin+'/')){bad.push(url);return route.abort();}
        visited.push(new URL(url).pathname);return route.continue();
      });
      await page.goto(origin+'/preview/business.html');
      await page.locator('#source-mail-chinese').waitFor();
      assert.ok((await page.locator('#source-mail-chinese').innerText()).includes('12 台气体检测设备'));
      assert.equal(await page.locator('#source-mail-original').isVisible(),false);
      const mailText=await page.locator('#source-mail-reader').innerText();
      assert.ok(mailText.includes('邮件正文（中文）'));
      assert.ok(!mailText.includes('来源版本：'));
      assert.ok(!mailText.includes('synthetic:mail:'));
      assert.ok(!/[a-f0-9]{64}/.test(mailText));
      assert.ok((await page.locator('.demo-label').innerText()).includes('虚构'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.locator('nav.steps [data-step-button="decide"]').click();
      const factsText=await page.locator('#known-facts').innerText();
      assert.ok(factsText.includes('12 台设备'));
      assert.ok(!factsText.includes('synthetic:mail:'));
      assert.ok(!factsText.includes('〔来源：'));
      assert.ok(!/[a-f0-9]{64}/.test(factsText));
      assert.ok((await page.locator('#unknown-facts').innerText()).includes('有效报价'));
      await page.locator('#ceo-note').fill('虚构想法：先核实配置。');
      assert.ok((await page.locator('#note-state').innerText()).includes('未发给 AI'));
      await page.locator('[data-strategy="clarify"]').click();
      const draft=await page.locator('#reply-en').inputValue(),zh=await page.locator('#reply-zh').innerText();
      assert.ok(draft.includes('measuring range'));assert.ok(zh.includes('测量范围'));
      assert.equal(await page.locator('#reply-sync').getAttribute('data-state'),'matched');
      await page.locator('#reply-en').fill(draft+'\nAdditional fictional question.');
      assert.equal(await page.locator('#reply-sync').getAttribute('data-state'),'stale');
      assert.equal(await page.locator('#reply-zh').innerText(),zh);
      await page.locator('#copy-reply').click();
      await page.waitForFunction(()=>typeof window.__copied==='string');
      assert.equal(await page.evaluate(()=>window.__copied),draft+'\nAdditional fictional question.');
      assert.ok((await page.locator('#copy-result').innerText()).includes('没有发送'));
      await page.locator('#restore-reply').click();
      assert.equal(await page.locator('#reply-sync').getAttribute('data-state'),'matched');
      await page.locator('nav.steps [data-step-button="decide"]').click();
      await page.locator('[data-strategy="acknowledge"]').click();
      assert.ok((await page.locator('#reply-en').inputValue()).includes('We will review the suitable configuration'));
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      await page.screenshot({path:path.join(output,label+'.png'),fullPage:true});
      assert.deepEqual(bad,[]);assert.deepEqual(errors,[]);
      for(const p of Object.keys(allowed))assert.ok(visited.includes(p),'missing public synthetic asset '+p);
      await page.close();
    }
    console.log(JSON.stringify({status:'BUSINESS_FLOW_BROWSER_PASS',viewports:['1400x900','390x844'],verified:['source','basis','2_decisions','english_edit','chinese_stale','copy','restore'],external_requests:0,limits:'fictional static prototype; no AI, real mail, saved state, or sent acceptance'}));
  }finally{if(browser)await browser.close();await new Promise(ok=>server.close(ok));}
})().catch(e=>{console.error(e);process.exitCode=1;});
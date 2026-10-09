import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from '@playwright/test';
const root=path.resolve('dist');
const server=http.createServer((req,res)=>{
  let file=path.resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(!file.startsWith(root+path.sep)){file=path.join(root,'index.html');}
  if(!fs.existsSync(file)||fs.statSync(file).isDirectory())file=path.join(root,'index.html');
  res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json'})[path.extname(file)]||'application/octet-stream');
  res.end(fs.readFileSync(file));
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
const browser=await chromium.launch({headless:true,...(process.platform==='win32'?{channel:'chrome'}:{})});
const results=[];
try{
  const ctx=await browser.newContext();
  await ctx.route('**/*',r=>r.request().url().startsWith(origin)?r.continue():r.fulfill({status:404,body:''}));
  const p=await ctx.newPage();await p.goto(origin+'/forge.html');
  const result=await p.evaluate(async()=>{
    const attack='"><img src="/missing.png" onerror="window.__injected=true">';
    const fields=['name','player','age','height','weight','eyes','hair','skin','ideals','bonds','flaws','bg_story','portrait_url'];
    for(const field of fields)C[field]=attack;
    C.traits=[attack];renderIdentity();
    await new Promise(resolve=>setTimeout(resolve,150));
    const identitySafe=!window.__injected && document.getElementById('fn').value===attack;
    setPortraitPreview(attack);
    showCapTooltip({clientX:20,clientY:20},attack,attack);
    await new Promise(resolve=>setTimeout(resolve,100));
    const tooltipText=document.getElementById('re-slot-tooltip').textContent.includes(attack);
    C.race=RACES[0];C.cls=CLASSES[0];C.background=BACKGROUNDS[0];
    _sumTab='notes';renderSummary();
    _reChar={...C,bag:[{id:'test',n:attack,qty:1,w:0}]};renderReBag();
    await new Promise(resolve=>setTimeout(resolve,100));
    return {identitySafe,executed:!!window.__injected,tooltipText};
  });
  assert.equal(result.identitySafe,true);assert.equal(result.executed,false);assert.equal(result.tooltipText,true);
  results.push({test:'Forge identity, portrait and tooltip injection',...result});
  await ctx.close();
  for(const width of [390,1440]){
    const context=await browser.newContext({viewport:{width,height:900}});
    const requests=[];
    const updates=[];
    const user={id:'00000000-0000-0000-0000-000000000001',email:'admin@example.test',aud:'authenticated',role:'authenticated',app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
    const token=Buffer.from(JSON.stringify({alg:'HS256',typ:'JWT'})).toString('base64url')+'.'+Buffer.from(JSON.stringify({sub:user.id,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url')+'.dGVzdHNpZ25hdHVyZQ';
    await context.route('**/*',async r=>{
      const url=new URL(r.request().url());
      if(url.pathname.startsWith('/_vercel/'))return r.fulfill({status:200,contentType:'text/javascript',body:''});
      if(url.pathname.startsWith('/auth/v1/'))return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(url.pathname.endsWith('/user')?user:{access_token:token,refresh_token:'test-refresh',expires_in:3600,token_type:'bearer',user})});
      if(url.pathname.startsWith('/storage/v1/object/') && r.request().method()==='POST')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({Key:url.pathname.split('/object/')[1]})});
      if(url.pathname==='/api/pdf'){requests.push(r.request().postDataJSON());return r.fulfill({status:503,contentType:'application/json',body:JSON.stringify({error:'Test: retry available'})});}
      if(url.pathname==='/api/verify-payment')return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({paid:false,status:'unpaid',items:[]})});
      if(url.pathname.includes('/rest/v1/')){
        let data=[];
        if(url.pathname.endsWith('/admin_users'))data=[{id:1}];
        if(url.pathname.endsWith('/campaigns'))data=[{id:13,name:'Test campaign',theme_id:'medieval',price:6.99,is_free:false,pdf_files:{},scenarios:[{id:10,title:'Chapter I',display_name:'Chapter I ready',description:'Available PDF',author:'Test author',duration:'4 heures',price:0,is_free:true,pdf_files:{fr:'fr.pdf',en:'en.pdf'},tags:[],ratings:{},position:1},{id:11,title:'Chapter II',display_name:'Chapter II coming soon',description:'Not finished',price:3,is_free:false,pdf_files:{},tags:[],ratings:{},position:2}]}];
        if(url.pathname.endsWith('/site_settings'))data={site_name:'Le Codex',logo_url:'',tagline:'Test'};
        if(r.request().method()==='PATCH'){const body=r.request().postDataJSON();updates.push(body);data=body;}
        return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
      }
      if(url.origin===origin)return r.continue();
      return r.fulfill({status:404,body:''});
    });
    const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
    await page.goto(origin+'/?campaign=13&chapter=10');
    const dialog=page.getByRole('dialog',{name:'Chapter I ready'});
    const select=dialog.getByRole('combobox',{name:'Langue du PDF'});await select.selectOption('en');
    await dialog.getByRole('button',{name:'Télécharger le PDF',exact:true}).click();
    await page.getByText('Test: retry available').waitFor();
    assert.equal(requests.at(-1).language,'en');assert.equal(requests.at(-1).id,10);
    assert.equal(await dialog.getByRole('button',{name:'Télécharger le PDF',exact:true}).isEnabled(),true);
    assert.equal(await page.getByText('PDF à venir',{exact:true}).count()>0,true);
    assert.equal(await page.getByRole('button',{name:/Ajouter au panier/}).count(),0);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    await page.goto(origin+'/login');await page.getByRole('link',{name:'Mot de passe oublié ?'}).click();await page.getByRole('heading',{name:'Mot de passe oublié'}).waitFor();
    await page.goto(origin+'/payment/success?session_id=cs_test_abcdefghijklmnopqrstuvwxyz');
    await page.waitForTimeout(500);assert.equal(await page.getByText('Paiement confirmé.',{exact:false}).count(),0);
    if(width===1440){
      page.on('dialog',d=>d.accept());
      await page.goto(origin+'/login');
      await page.getByRole('textbox',{name:'Adresse e-mail'}).fill(user.email);
      await page.getByLabel('Mot de passe',{exact:true}).fill('local-test-password');
      await page.getByRole('button',{name:'Entrer dans le Codex'}).click();
      await page.getByRole('button',{name:'📖 Scénarios',exact:true}).click();
      await page.locator('select').first().selectOption('13');
      await page.getByRole('button',{name:'Modifier',exact:true}).first().click();
      const group=page.getByRole('group',{name:'PDF disponibles par langue'});
      await group.getByLabel('Importer un PDF (English)',{exact:true}).setInputFiles({name:'english.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.7\n%%EOF')});
      await page.waitForFunction(()=>Array.from(document.querySelectorAll('input[type="text"]')).some(i=>/^editions\/.*\/en.pdf$/.test(i.value)));
      await page.getByRole('button',{name:'Enregistrer',exact:false}).click();
      await page.waitForTimeout(300);
      assert.match(updates.at(-1).pdf_files.en,/^editions\/.*\/en.pdf$/);
      assert.equal(updates.at(-1).pdf_files.fr,'fr.pdf');
      results.push({test:'Administrator uploads English PDF and retains French edition',passed:true});
    }
    assert.deepEqual(errors,[]);
    results.push({test:'PDF languages, unavailable items, retry, recovery, unpaid receipt',width,passed:true});
    await context.close();
  }
}finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
fs.mkdirSync('docs/audit-halloween-2026',{recursive:true});
fs.writeFileSync('docs/audit-halloween-2026/corrections-browser.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Readable } = require('node:stream');
const c = require('../server/commerce.cjs');
const checkout = require('../api/create-checkout-session');
const pdf = require('../api/pdf');
const webhook = require('../api/webhook');
const sessionId = 'cs_test_abcdefghijklmnopqrstuvwxyz';
function fakeDb(rows) {
  return {
    from(table) { let id; return { select() { return this; }, eq(_, value) { id = value; return this; }, async maybeSingle() { return { data: rows.find(r => String(r.id) === String(id) && (table === 'campaigns') === (r.type === 'saga')) || null }; } }; },
    storage: { from(bucket) { assert.equal(bucket,'pdfs'); return { async createSignedUrl(path) { return path.includes('missing') ? {error:{}} : {data:{signedUrl:'https://files.example.test/'+path}}; } }; } }
  };
}
function response() { return { code:200, headers:{}, setHeader(k,v){this.headers[k]=v;},status(n){this.code=n;return this;},json(data){this.data=data;return this;} }; }
const row = { id:10, type:'scenario', display_name:'Chapter I', price:6.99, is_free:false, pdf_files:{fr:'chapter-fr.pdf',en:'chapter-en.pdf'} };
function fakeStripe(patch={}) {
  return { checkout:{ sessions:{ retrieve:async()=>({metadata:{codex_version:'2'},status:'complete',payment_status:'paid',payment_intent:{latest_charge:{refunded:false,amount_refunded:0,disputed:false}},...patch}),listLineItems:async()=>({has_more:false,data:[{description:'Chapter I',price:{product:{metadata:{codex_version:'2',type:'scenario',itemId:'10'}}}}]}) } } };
}
test('server price wins, no PDF/free/missing/duplicate/overlapping products cannot be charged',async()=>{
  const db=fakeDb([row,{...row,id:11,pdf_files:{}},{...row,id:12,is_free:true},{...row,id:13,pdf_files:{fr:'missing.pdf'}},{...row,id:20,type:'saga'},{...row,id:21,campaign_id:20}]);
  const lines=await c.checkoutLines(db,[{type:'scenario',item:{id:10,price:0.01,name:'Tampered'}}]);
  assert.equal(lines[0].price_data.unit_amount,699);assert.equal(lines[0].price_data.product_data.name,'Chapter I');
  for(const id of [11,12,13])await assert.rejects(c.checkoutLines(db,[{type:'scenario',id}]),e=>e.status===409);
  await assert.rejects(c.checkoutLines(db,[{type:'scenario',id:10},{type:'scenario',id:10}]),e=>e.status===400);
  await assert.rejects(c.checkoutLines(db,[{type:'saga',id:20},{type:'scenario',id:21}]),e=>e.status===409);
});
test('only paid, completed, non-refunded and non-disputed receipts grant access',async()=>{
  assert.equal((await c.receipt(fakeStripe(),sessionId)).paid,true);
  assert.equal((await c.receipt(fakeStripe({payment_status:'unpaid'}),sessionId)).paid,false);
  assert.equal((await c.receipt(fakeStripe({status:'open'}),sessionId)).paid,false);
  for(const change of [{refunded:true},{amount_refunded:1},{disputed:true}])await assert.rejects(c.receipt(fakeStripe({payment_intent:{latest_charge:change}}),sessionId),e=>e.status===403);
  await assert.rejects(c.receipt(fakeStripe(),'bad'),e=>e.status===400);
});
test('external origins are rejected before Stripe is called',async()=>{
  const res=response();await checkout({method:'POST',headers:{origin:'https://attacker.example'},body:{cartItems:[{id:10,type:'scenario'}]}},res);
  assert.equal(res.code,403);assert.equal(res.headers['Cache-Control'],'no-store');
});
test('paid PDF cannot be requested with a free item id or a different receipt',async()=>{
  const oldClients=c.clients, oldDb=c.database;
  try{
    c.database=()=>fakeDb([row,{...row,id:11}]);c.clients=()=>({stripe:fakeStripe()});
    let res=response();await pdf({method:'POST',body:{type:'scenario',id:11,language:'fr',sessionId}},res);assert.equal(res.code,403);
    res=response();await pdf({method:'POST',body:{type:'scenario',id:10,language:'de',sessionId}},res);assert.equal(res.code,409);
    res=response();await pdf({method:'POST',body:{type:'scenario',id:10,language:'en',sessionId}},res);assert.equal(res.code,200);assert.match(res.data.downloadUrl,/chapter-en.pdf$/);
  }finally{c.clients=oldClients;c.database=oldDb;}
});
test('webhook verifies raw bytes and retries failed delivery, without trusting parsed JSON',async()=>{
  const realStripe=require('stripe')('sk_test_dummy');const secret='whsec_test';
  const oldClients=c.clients,oldReceipt=c.receipt,oldSend=c.sendReceipt,oldSecret=process.env.STRIPE_WEBHOOK_SECRET;
  const raw=' { "type": "checkout.session.completed", "data": {"object":{"id":"'+sessionId+'","metadata":{"codex_version":"2"}}}} ';
  const sig=realStripe.webhooks.generateTestHeaderString({payload:raw,secret});
  try{
    process.env.STRIPE_WEBHOOK_SECRET=secret;c.clients=()=>({stripe:realStripe});c.receipt=async()=>({paid:true,email:'test@example.test'});
    let sent=0;c.sendReceipt=async()=>{sent++;};
    const req=Readable.from([Buffer.from(raw)]);req.method='POST';req.headers={'stripe-signature':sig};Object.defineProperty(req,'body',{get(){throw Error('Parsed body must never be read');}});
    const res=response();await webhook(req,res);assert.equal(res.code,200);assert.equal(sent,1);
    const forged=Readable.from([Buffer.from(raw+' ')]);forged.method='POST';forged.headers={'stripe-signature':sig};const bad=response();await webhook(forged,bad);assert.equal(bad.code,400);assert.equal(sent,1);
    c.sendReceipt=async()=>{throw c.fail(503,'Delivery unavailable');};const retry=Readable.from([Buffer.from(raw)]);retry.method='POST';retry.headers={'stripe-signature':sig};const failed=response();await webhook(retry,failed);assert.equal(failed.code,503);
  }finally{c.clients=oldClients;c.receipt=oldReceipt;c.sendReceipt=oldSend;if(oldSecret===undefined)delete process.env.STRIPE_WEBHOOK_SECRET;else process.env.STRIPE_WEBHOOK_SECRET=oldSecret;}
});

const https = require('https');
const API = process.env.API_BASE || 'https://<APP>.fly.dev'; // troque <APP> ao rodar

function post(path, body){
  return new Promise((resolve,reject)=>{
    const data = JSON.stringify(body);
    const url = new URL(path, API);
    const req = https.request(url, {
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Content-Length': Buffer.byteLength(data),
        'X-Idempotency-Key': 'gdo-e2e-' + Date.now()
      }
    }, res=>{
      let chunks=''; res.on('data',d=>chunks+=d); res.on('end',()=>resolve({status:res.statusCode,body:chunks}));
    });
    req.on('error',reject); req.write(data); req.end();
  });
}

(async ()=>{
  try{
    const res = await post('/payments/create', { amount: 1, description:'E2E v1.1.1' });
    if (res.status !== 200) throw new Error(`Create FAIL: ${res.status} ${res.body}`);
    console.log('[MP] create OK:', res.body.slice(0,160)+'...');
  }catch(e){ console.error(e); process.exit(1); }
})();
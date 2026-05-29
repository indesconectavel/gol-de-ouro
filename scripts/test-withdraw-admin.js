const BASE_URL = process.env.BASE_URL || 'https://goldeouro-backend-v2.fly.dev';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const SAQUE_ID = process.env.SAQUE_ID;
const MOTIVO = process.env.MOTIVO || 'teste_cursor';

if (!ADMIN_TOKEN) {
  throw new Error('ADMIN_TOKEN não definido no ambiente.');
}

if (!SAQUE_ID) {
  throw new Error('SAQUE_ID não definido no ambiente.');
}

async function postJson(path, body) {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${ADMIN_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  let data;
  try {
    data = await response.json();
  } catch (error) {
    data = { error: 'Resposta não é JSON válido.' };
  }

  return { status: response.status, data };
}

async function run() {
  if (String(process.env.APPROVE_AND_SEND || '').toLowerCase() === 'true') {
    const sendResult = await postJson('/api/admin/withdraw/approve-and-send', {
      saqueId: SAQUE_ID
    });
    console.log('APPROVE_AND_SEND - HTTP Status:', sendResult.status);
    console.log('APPROVE_AND_SEND - Response JSON:', JSON.stringify(sendResult.data, null, 2));
    return;
  }

  const approveResult = await postJson('/api/admin/withdraw/approve', {
    saqueId: SAQUE_ID
  });

  console.log('APPROVE - HTTP Status:', approveResult.status);
  console.log('APPROVE - Response JSON:', JSON.stringify(approveResult.data, null, 2));

  const cancelResult = await postJson('/api/admin/withdraw/cancel', {
    saqueId: SAQUE_ID,
    motivo: MOTIVO
  });

  console.log('CANCEL - HTTP Status:', cancelResult.status);
  console.log('CANCEL - Response JSON:', JSON.stringify(cancelResult.data, null, 2));
}

run().catch((error) => {
  console.error('Erro ao executar testes:', error.message);
  process.exit(1);
});

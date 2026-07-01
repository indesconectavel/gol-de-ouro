import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

function test(name, fn) {
  try {
    fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

async function runAsync(name, fn) {
  try {
    await fn();
    console.log(`OK ${name}`);
  } catch (err) {
    console.error(`FAIL ${name}:`, err.message);
    process.exitCode = 1;
  }
}

delete require.cache[require.resolve('../src/finance/factory/FinanceProviderFactory.js')];
delete require.cache[require.resolve('../src/finance/providers/celcoin/CelcoinProvider.js')];

process.env.CELCOIN_ENABLED = 'false';
delete process.env.PAYOUT_PROVIDER;

const factory = require('../src/finance/factory/FinanceProviderFactory');
factory.assertBootConfig();
test('default provider is mercadopago', () => {
  const provider = factory.resolvePayoutProvider();
  if (provider.name !== 'mercadopago') {
    throw new Error(`expected mercadopago, got ${provider.name}`);
  }
});

delete require.cache[require.resolve('../src/finance/factory/FinanceProviderFactory.js')];
process.env.CELCOIN_ENABLED = 'false';
process.env.PAYOUT_PROVIDER = 'celcoin';

test('celcoin blocked when disabled', () => {
  const f2 = require('../src/finance/factory/FinanceProviderFactory');
  let threw = false;
  try {
    f2.assertBootConfig();
  } catch (err) {
    threw = true;
    if (!/CELCOIN_ENABLED=true/.test(err.message)) {
      throw new Error(`unexpected error: ${err.message}`);
    }
  }
  if (!threw) throw new Error('expected assertBootConfig to throw');
});

const CelcoinProvider = require('../src/finance/providers/celcoin/CelcoinProvider');
process.env.CELCOIN_ENABLED = 'true';
process.env.CELCOIN_BASE_URL = 'https://sandbox.example';
process.env.CELCOIN_CLIENT_ID = 'id';
process.env.CELCOIN_CLIENT_SECRET = 'secret';

await runAsync('celcoin stub when enabled', async () => {
  const result = await CelcoinProvider.createPixWithdraw({ netAmount: 10, saqueId: 'x' });
  if (result.error !== 'CELCOIN_STUB_NOT_IMPLEMENTED') {
    throw new Error(`expected CELCOIN_STUB_NOT_IMPLEMENTED, got ${result.error}`);
  }
});

process.env.CELCOIN_HTTP_ENABLED = 'false';
await runAsync('authenticate stub when http disabled', async () => {
  const result = await CelcoinProvider.authenticate();
  if (result.error !== 'CELCOIN_STUB_NOT_IMPLEMENTED') {
    throw new Error(`expected CELCOIN_STUB_NOT_IMPLEMENTED, got ${result.error}`);
  }
});

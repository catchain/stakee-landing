import type { APIRoute } from 'astro';

const APY_COMMISSION_MULTIPLIER = 1.19;
const POOL_ADDRESS = 'EQD2_4d91M4TVbEBVyBF8J1UwpMJc361LKVCz6bBlffMW05o';
const FALLBACK_APY = 21;
const FALLBACK_TON_USD = 2;
const FALLBACK_TVL_TON = 14_471_673;
const FALLBACK_STAKERS = 14_000;

export const GET: APIRoute = async () => {
  let apy = FALLBACK_APY;
  let tonUsd = FALLBACK_TON_USD;
  let tvlTon = FALLBACK_TVL_TON;
  let totalStakers = FALLBACK_STAKERS;

  try {
    const [stakeeRes, priceRes, poolRes] = await Promise.all([
      fetch('https://api.mytonwallet.org/staking/stakee'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'),
      fetch(`https://tonapi.io/v2/staking/pool/${encodeURIComponent(POOL_ADDRESS)}`),
    ]);

    if (stakeeRes.ok) {
      const data = await stakeeRes.json();
      if (typeof data.apy === 'number' && Number.isFinite(data.apy)) {
        apy = Math.round(data.apy * APY_COMMISSION_MULTIPLIER * 100) / 100;
      }
    }

    if (priceRes.ok) {
      const data = await priceRes.json();
      const price = data['the-open-network']?.usd;
      if (typeof price === 'number' && Number.isFinite(price)) {
        tonUsd = price;
      }
    }

    if (poolRes.ok) {
      const data = await poolRes.json();
      const pool = data.pool;
      if (typeof pool?.total_amount === 'number' && Number.isFinite(pool.total_amount)) {
        tvlTon = pool.total_amount / 1e9;
      }
      if (typeof pool?.current_nominators === 'number' && Number.isFinite(pool.current_nominators)) {
        totalStakers = pool.current_nominators;
      }
    }
  } catch {
    // Use fallback values defined above.
  }

  return new Response(JSON.stringify({ apy, tonUsd, tvlTon, totalStakers }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

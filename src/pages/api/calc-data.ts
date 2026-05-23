import type { APIRoute } from 'astro';

const APY_COMMISSION_MULTIPLIER = 1.19;
const FALLBACK_APY = 21;
const FALLBACK_TON_USD = 2;

export const GET: APIRoute = async () => {
  let apy = FALLBACK_APY;
  let tonUsd = FALLBACK_TON_USD;

  try {
    const [stakeeRes, priceRes] = await Promise.all([
      fetch('https://api.mytonwallet.org/staking/stakee'),
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=usd'),
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
  } catch {
    // Use fallback values defined above.
  }

  return new Response(JSON.stringify({ apy, tonUsd }), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=300',
    },
  });
};

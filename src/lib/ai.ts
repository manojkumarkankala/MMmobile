import type { ProductWithRefs, Review } from '../types';

/**
 * MMMobiles AI Engine
 * Rule-based intelligence layer. In production this would proxy OpenAI/Gemini via an
 * edge function; here we implement a deterministic, transparent engine that works
 * offline with no external API dependency.
 */

// ---------- AI Recommendations ----------
type Intent = 'camera' | 'battery' | 'gaming' | 'performance' | 'budget' | 'latest' | 'value' | 'premium';
export type { Intent };

interface RecoRequest {
  intent?: Intent;
  budget?: number;
  brand?: string;
}

export function aiRecommend(products: ProductWithRefs[], req: RecoRequest): ProductWithRefs[] {
  let pool = [...products];
  if (req.brand) pool = pool.filter(p => p.brands?.slug === req.brand || p.brands?.name?.toLowerCase() === req.brand!.toLowerCase());
  if (req.budget) pool = pool.filter(p => p.price <= req.budget!);

  const scoreFor = (p: ProductWithRefs): number => {
    const specs = p.specs || {};
    const battery = parseInt((specs.battery || '').match(/\d+/)?.[0] || '0', 10);
    const chargingW = parseInt((specs.charging || '').match(/\d+/)?.[0] || '0', 10);
    const ramGB = parseInt((specs.ram || '').match(/\d+/)?.[0] || '0', 10);
    const rearMP = parseInt((specs.rear_camera || '').match(/\d+/)?.[0] || '0', 10);
    const refreshHz = parseInt((specs.display || '').match(/(\d+)\s*Hz/i)?.[1] || '0', 10);
    const isFlagshipChip = /snapdragon 8|a17|tensor g3|dimensity 8300|dimensity 8200/i.test(specs.processor || '');
    const discount = p.mrp > p.price ? (p.mrp - p.price) / p.mrp : 0;

    let s = p.rating * 2;
    switch (req.intent) {
      case 'camera':
        s += rearMP / 12 + (p.name.includes('Pro') ? 3 : 0) + (rearMP >= 100 ? 4 : 0);
        break;
      case 'battery':
        s += battery / 200 + (battery >= 5000 ? 4 : 0) + chargingW / 30;
        break;
      case 'gaming':
        s += (refreshHz >= 120 ? 4 : 0) + (isFlagshipChip ? 6 : 0) + ramGB * 0.4;
        break;
      case 'performance':
        s += (isFlagshipChip ? 6 : 0) + ramGB * 0.5 + (refreshHz >= 120 ? 3 : 0);
        break;
      case 'budget':
        s += (p.price < 20000 ? 5 : 0) + discount * 8 + (p.rating >= 4.3 ? 3 : 0);
        break;
      case 'value':
        s += discount * 10 + (p.rating >= 4.4 ? 3 : 0) - p.price / 12000;
        break;
      case 'premium':
        s += (p.price > 60000 ? 6 : 0) + (p.is_featured ? 2 : 0) + p.rating;
        break;
      case 'latest':
        s += (p.is_new ? 5 : 0) + (p.created_at && Date.now() - new Date(p.created_at).getTime() < 1000 * 60 * 60 * 24 * 120 ? 3 : 0);
        break;
      default:
        s += p.rating + discount * 5;
    }
    return s;
  };

  return pool.sort((a, b) => scoreFor(b) - scoreFor(a)).slice(0, 8);
}

// ---------- AI Voice / Text Search Parser ----------
export interface ParsedQuery { budget?: number; brand?: string; intent?: Intent; keywords: string[]; }

export function parseSearchQuery(query: string): ParsedQuery {
  const q = query.toLowerCase().trim();
  const result: ParsedQuery = { keywords: [] };

  const brands = ['apple','samsung','vivo','oppo','redmi','realme','motorola','oneplus','nothing','poco','iqoo','google pixel','pixel'];
  for (const b of brands) {
    if (q.includes(b)) { result.brand = b === 'pixel' ? 'google-pixel' : b; break; }
  }

  const budgetMatch = q.match(/(?:under|below|less than|within)\s*₹?\s*([\d,]+)/);
  if (budgetMatch) result.budget = parseInt(budgetMatch[1].replace(/,/g, ''), 10);

  const intents: [Intent, RegExp[]][] = [
    ['camera', [/camera/i, /photography/i, /photo/i]],
    ['battery', [/battery/i, /long lasting/i]],
    ['gaming', [/gaming/i, /game/i, /pubg/i, /bgmi/i]],
    ['performance', [/performance/i, /fast/i, /speed/i, /flagship/i]],
    ['budget', [/budget/i, /cheap/i, /affordable/i, /low cost/i]],
    ['value', [/value for money/i, /best value/i, /worth/i]],
    ['premium', [/premium/i, /flagship/i, /high end/i]],
    ['latest', [/latest/i, /new/i, /recent/i]],
  ];
  for (const [intent, patterns] of intents) {
    if (patterns.some(p => p.test(q))) { result.intent = intent; break; }
  }

  result.keywords = q.split(/\s+/).filter(w => w.length > 2 && !['under','below','within','show','mobiles','phones','phone','for','the'].includes(w));
  return result;
}

// ---------- AI Comparison Summary ----------
export interface CompareVerdict {
  winnerId: string;
  winnerLabel: string;
  scores: Record<string, number>;
  analysis: { dimension: string; winnerId: string; reason: string }[];
}

export function aiCompare(products: ProductWithRefs[]): CompareVerdict | null {
  if (products.length < 2) return null;
  const dims = ['Display', 'Processor', 'RAM', 'Battery', 'Charging', 'Rear Camera', 'Front Camera', 'Value'];
  const getVal = (p: ProductWithRefs, dim: string): number => {
    const s = p.specs || {};
    switch (dim) {
      case 'Display': return parseInt((s.display || '').match(/(\d+)\s*Hz/i)?.[1] || '0', 10) + parseFloat((s.display || '').match(/([\d.]+)\s*inch/i)?.[1] || '0') * 10;
      case 'Processor': return /snapdragon 8 gen 3|a17 pro|tensor g3/i.test(s.processor || '') ? 100 : /snapdragon 8 gen 2|dimensity 8300|dimensity 8200/i.test(s.processor || '') ? 85 : /snapdragon 7|dimensity 7200/i.test(s.processor || '') ? 60 : 40;
      case 'RAM': return parseInt((s.ram || '').match(/\d+/)?.[0] || '0', 10) * 10;
      case 'Battery': return parseInt((s.battery || '').match(/\d+/)?.[0] || '0', 10);
      case 'Charging': return parseInt((s.charging || '').match(/\d+/)?.[0] || '0', 10);
      case 'Rear Camera': return parseInt((s.rear_camera || '').match(/\d+/)?.[0] || '0', 10);
      case 'Front Camera': return parseInt((s.front_camera || '').match(/\d+/)?.[0] || '0', 10);
      case 'Value': {
        const disc = p.mrp > 0 ? (p.mrp - p.price) / p.mrp : 0;
        return (p.rating * 20) + disc * 100 - (p.price / 1500);
      }
    }
    return 0;
  };

  const scores: Record<string, number> = {};
  const analysis: CompareVerdict['analysis'] = [];

  for (const dim of dims) {
    let best = products[0];
    let bestVal = -Infinity;
    for (const p of products) {
      const v = getVal(p, dim);
      if (v > bestVal) { bestVal = v; best = p; }
    }
    analysis.push({ dimension: dim, winnerId: best.id, reason: reasonFor(dim, best, bestVal) });
    scores[best.id] = (scores[best.id] || 0) + 1;
  }

  const winnerId = Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0];
  const winner = products.find(p => p.id === winnerId)!;
  return {
    winnerId,
    winnerLabel: `${winner.name} wins on ${scores[winnerId]} of ${dims.length} dimensions`,
    scores,
    analysis,
  };
}

function reasonFor(dim: string, p: ProductWithRefs, _val: number): string {
  const s = p.specs || {};
  switch (dim) {
    case 'Display': return `${s.display || 'Better'} — higher refresh rate & size`;
    case 'Processor': return `${s.processor || 'Faster'} chip delivers more power`;
    case 'RAM': return `${s.ram} RAM handles multitasking better`;
    case 'Battery': return `${s.battery} capacity lasts longer`;
    case 'Charging': return `${s.charging} refills fastest`;
    case 'Rear Camera': return `${s.rear_camera} captures more detail`;
    case 'Front Camera': return `${s.front_camera} selfie camera is sharper`;
    case 'Value': return `Best rating-to-price ratio at ₹${Math.round(p.price).toLocaleString('en-IN')}`;
  }
  return '';
}

// ---------- AI Review Summary ----------
export interface ReviewSummary {
  overall: number;
  sentiment: 'Excellent' | 'Very Good' | 'Good' | 'Mixed';
  pros: { text: string; count: number }[];
  cons: { text: string; count: number }[];
  summary: string;
  recommendation: string;
}

export function aiReviewSummary(product: ProductWithRefs, reviews: Review[]): ReviewSummary {
  const overall = reviews.length > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : product.rating;

  const sentiment: ReviewSummary['sentiment'] =
    overall >= 4.5 ? 'Excellent' : overall >= 4 ? 'Very Good' : overall >= 3.5 ? 'Good' : 'Mixed';

  const prosCount: Record<string, number> = {};
  const consCount: Record<string, number> = {};
  for (const r of reviews) {
    for (const p of r.pros) prosCount[p] = (prosCount[p] || 0) + 1;
    for (const c of r.cons) consCount[c] = (consCount[c] || 0) + 1;
  }

  // Seed with highlights if few reviews
  if (reviews.length < 3) {
    for (const h of product.highlights.slice(0, 3)) prosCount[h] = (prosCount[h] || 0) + 2;
  }

  const pros = Object.entries(prosCount).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 5);
  const cons = Object.entries(consCount).map(([text, count]) => ({ text, count })).sort((a, b) => b.count - a.count).slice(0, 3);

  const topPro = pros[0]?.text ?? 'overall quality';
  const summary = `${product.name} earns a ${overall.toFixed(1)}/5 from ${reviews.length || product.review_count} reviewers. Buyers consistently praise ${topPro}. ${cons.length > 0 ? `The most common concern is ${cons[0].text}.` : 'No significant drawbacks reported.'}`;

  const recommendation = overall >= 4.3
    ? `Highly recommended — this device offers strong value in the ${product.brands?.name ?? 'its'} segment.`
    : overall >= 3.8
    ? `A solid choice if ${topPro.toLowerCase()} is your priority.`
    : `Consider alternatives in this price range before deciding.`;

  return { overall, sentiment, pros, cons, summary, recommendation };
}

// ---------- AI Chatbot ----------
export function aiChatReply(message: string, ctx?: { productCount: number; brandCount: number }): string {
  const q = message.toLowerCase().trim();

  if (/hi|hello|hey|good (morning|evening|afternoon)/.test(q)) {
    return "Hello! I'm the MMMobiles AI assistant. I can help you find phones, compare models, check warranty, delivery, and returns. What are you looking for today?";
  }
  if (/warranty/.test(q)) {
    return "All phones at MMMobiles come with a 1-year manufacturer warranty. Accessories carry 6 months. You can claim warranty at any authorized brand service center with your invoice.";
  }
  if (/return|refund|replacement/.test(q)) {
    return "We offer a 7-day return policy for manufacturing defects. Replacement or full refund is issued after verification. Initiate returns from your Orders dashboard.";
  }
  if (/delivery|shipping|how long|when/.test(q)) {
    return "Delivery to Choutuppal and nearby areas is typically same-day or next-day. We use our own delivery partners with live GPS tracking and OTP verification. Delivery charges start at ₹30 for under 3km.";
  }
  if (/emi|installment|no cost emi/.test(q)) {
    return "Yes! No-cost EMI is available on most phones above ₹3,000 from HDFC, ICICI, SBI, Axis, Bajaj Finserv, and major cards. EMI options appear at checkout.";
  }
  if (/offer|discount|coupon|deal/.test(q)) {
    return "Current coupons: MM10 (10% off above ₹9,999), MM20 (20% off above ₹49,999), and WELCOME15 (15% off above ₹14,999 for new customers). Apply at checkout!";
  }
  if (/store|address|location|where/.test(q)) {
    return "MMMobiles is located at Lakkaram, Choutuppal, Telangana 508252. You can find us on Google Maps — the link is in the footer and store info section. Call or WhatsApp us anytime!";
  }
  if (/compare/.test(q)) {
    return "To compare phones, open any product and click 'Add to Compare'. You can compare up to 4 phones side-by-side with AI-powered verdicts on camera, battery, performance, and value.";
  }
  if (/track/.test(q)) {
    return "Once your order is shipped, you'll see a live tracking map in your Orders dashboard. We share real-time GPS location and ETA of the delivery partner, plus an OTP for handover.";
  }

  // Try to parse as a product search
  const parsed = parseSearchQuery(q);
  if (parsed.budget || parsed.brand || parsed.intent) {
    const parts: string[] = [];
    if (parsed.brand) parts.push(parsed.brand);
    if (parsed.intent) parts.push(`great for ${parsed.intent}`);
    if (parsed.budget) parts.push(`under ₹${parsed.budget.toLocaleString('en-IN')}`);
    return `Great choice! Based on your query, I'd suggest checking phones ${parts.join(', ')}. Head to the Products page and use the filters, or try the AI Recommendations section on the homepage. ${ctx ? `We have ${ctx.productCount} phones across ${ctx.brandCount} brands.` : ''}`;
  }

  return "I can help with product recommendations, comparisons, warranty, returns, delivery, EMI, offers, and store info. Try asking 'Show Samsung phones under ₹20,000' or 'What's your return policy?'";
}

// ---------- AI Image Search (mock identification) ----------
export function aiImageSearch(allProducts: ProductWithRefs[]): ProductWithRefs[] {
  // Simulated: return a weighted random sampling biased toward featured/high-rated
  const sorted = [...allProducts].sort((a, b) => b.rating - a.rating);
  return sorted.slice(0, 6);
}

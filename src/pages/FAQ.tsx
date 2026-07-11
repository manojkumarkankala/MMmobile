import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { cn } from '../lib/utils';

const FAQS = [
  { q: 'What is your return policy?', a: 'We offer a 7-day return policy for manufacturing defects. The product must be in original condition with all accessories. Replacement or full refund is issued after verification. Initiate returns from your Orders dashboard.' },
  { q: 'Do you offer warranty on products?', a: 'Yes, all phones come with a 1-year manufacturer warranty. Accessories carry 6 months. You can claim warranty at any authorized brand service center with your MMMobiles invoice.' },
  { q: 'How long does delivery take?', a: 'Delivery to Choutuppal and nearby areas is typically same-day or next-day. We use our own delivery partners with live GPS tracking and OTP verification for secure handoff.' },
  { q: 'What are the delivery charges?', a: 'Delivery charges are calculated by distance: 0-3km = ₹30 minimum, 3-5km = ₹9/km, 5-10km = ₹12/km, above 10km = ₹15/km. The exact charge is shown at checkout.' },
  { q: 'Do you offer No-Cost EMI?', a: 'Yes! No-cost EMI is available on most phones above ₹3,000 from HDFC, ICICI, SBI, Axis, Bajaj Finserv, and major credit/debit cards. EMI options appear at checkout.' },
  { q: 'How does AI recommendation work?', a: 'Our AI engine analyzes your preferences (camera, battery, gaming, performance, budget) and matches them against product specifications, ratings, and reviews to recommend the best phones for your needs.' },
  { q: 'Can I compare phones before buying?', a: 'Yes! Add up to 4 phones to compare side-by-side. Our AI provides a verdict on which phone wins across dimensions like camera, battery, performance, and value for money.' },
  { q: 'How does live order tracking work?', a: 'Once your order ships, you\'ll see a live tracking map in your Orders dashboard. The delivery partner shares GPS location in real-time with ETA and remaining distance, plus an OTP for secure delivery.' },
  { q: 'What payment methods do you accept?', a: 'We accept all major payment methods via Razorpay: UPI, credit/debit cards, net banking, wallets, and no-cost EMI. Cash on delivery is coming soon.' },
  { q: 'Are the products genuine?', a: 'Absolutely. All products are 100% genuine and sourced directly from authorized distributors. Every product comes with a valid manufacturer warranty and original invoice.' },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="container-x py-8">
      <div className="text-center mb-10">
        <div className="w-14 h-14 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 grid place-items-center mx-auto mb-3"><HelpCircle className="w-7 h-7" /></div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 dark:text-white">Frequently Asked Questions</h1>
        <p className="text-ink-500 mt-2">Everything you need to know about shopping at MMMobiles</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-3">
        {FAQS.map((f, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setOpen(o => o === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left hover:bg-ink-50 dark:hover:bg-ink-800/50 transition"
            >
              <span className="font-semibold text-sm text-ink-900 dark:text-white">{f.q}</span>
              <ChevronDown className={cn('w-5 h-5 text-ink-400 transition-transform shrink-0', open === i && 'rotate-180')} />
            </button>
            {open === i && <div className="px-4 pb-4 text-sm text-ink-600 dark:text-ink-300 leading-relaxed">{f.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

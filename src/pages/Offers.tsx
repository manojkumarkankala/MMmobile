import { Link } from 'react-router-dom';
import { Tag, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useProducts } from '../hooks/useData';
import { ProductCard } from '../components/ProductCard';
import { discountPercent } from '../lib/utils';

export default function Offers() {
  const { data: all } = useProducts({});
  const discounted = all.filter(p => p.mrp > p.price).sort((a, b) => discountPercent(b.mrp, b.price) - discountPercent(a.mrp, a.price));

  const coupons = [
    { code: 'MM10', desc: '10% off on orders above ₹9,999', max: 'Max ₹3,000 off', color: 'from-brand-600 to-brand-800' },
    { code: 'MM20', desc: '20% off on orders above ₹49,999', max: 'Max ₹10,000 off', color: 'from-accent-500 to-accent-700' },
    { code: 'WELCOME15', desc: '15% off for new customers (min ₹14,999)', max: 'Max ₹5,000 off', color: 'from-success-600 to-success-800' },
  ];

  return (
    <div className="container-x py-6">
      <div className="text-center mb-10">
        <span className="chip bg-accent-100 text-accent-700 dark:bg-accent-900 dark:text-accent-300 mb-3"><Sparkles className="w-3.5 h-3.5" /> Limited Time</span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 dark:text-white">Latest Offers</h1>
        <p className="text-ink-500 mt-2">Save big on phones, accessories & more</p>
      </div>

      {/* Coupons */}
      <div className="grid md:grid-cols-3 gap-4 mb-10">
        {coupons.map((c, i) => (
          <motion.div key={c.code} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
            <div className={`relative bg-gradient-to-br ${c.color} text-white rounded-2xl p-6 overflow-hidden`}>
              <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-4 border-dashed border-white/20" />
              <Tag className="w-6 h-6 mb-2 opacity-80" />
              <p className="font-display text-3xl font-extrabold">{c.code}</p>
              <p className="text-sm opacity-90 mt-1">{c.desc}</p>
              <p className="text-xs opacity-70 mt-2">{c.max}</p>
              <Link to="/cart" className="btn bg-white/20 hover:bg-white/30 text-white text-sm mt-4 backdrop-blur">Apply Now <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Discounted products */}
      <h2 className="font-display text-2xl font-bold mb-5">Top Deals</h2>
      {discounted.length === 0 ? (
        <p className="text-ink-500">No active deals right now.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {discounted.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      )}
    </div>
  );
}

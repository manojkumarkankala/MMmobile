import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useBrands } from '../hooks/useData';
import { useProducts } from '../hooks/useData';

export default function Brands() {
  const brands = useBrands();
  const { data: all } = useProducts({});

  const countFor = (brandId: string) => all.filter(p => p.brand_id === brandId).length;

  return (
    <div className="container-x py-6">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 dark:text-white">Shop by Brand</h1>
        <p className="text-ink-500 mt-2">{brands.length} leading mobile brands available at MMMobiles</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {brands.map((b, i) => (
          <motion.div key={b.id} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
            <Link
              to={`/products?brand=${b.id}`}
              className="card p-6 text-center hover:shadow-card hover:-translate-y-1 transition-all group"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-display font-extrabold text-3xl mb-3 group-hover:scale-110 transition-transform">
                {b.name[0]}
              </div>
              <p className="font-semibold text-lg text-ink-900 dark:text-white">{b.name}</p>
              <p className="text-xs text-ink-500 mt-0.5">{b.country}</p>
              <p className="text-xs text-brand-600 dark:text-brand-400 font-semibold mt-2">{countFor(b.id)} products</p>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

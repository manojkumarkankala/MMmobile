import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone, Tablet, Headphones, Watch, Ear, Plug, BatteryCharging,
  Sparkles, ArrowRight, Zap, Shield, Truck, Quote, MapPin, Phone, MessageCircle,
  ChevronRight, Star,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useProducts, useCategories, useBrands } from '../hooks/useData';
import { ProductCard } from '../components/ProductCard';
import { aiRecommend, parseSearchQuery } from '../lib/ai';
import { inr } from '../lib/utils';
import type { } from '../types';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { Mic } from 'lucide-react';

const CATEGORY_ICONS: Record<string, any> = {
  Smartphone: Smartphone, Tablet: Tablet, Accessories: Headphones,
  Watch: Watch, Ear: Ear, Plug: Plug, BatteryCharging: BatteryCharging,
};

export default function Home() {
  const { data: featured } = useProducts({ featured: true, sort: 'rating' });
  const { data: newArrivals } = useProducts({ isNew: true, sort: 'newest' });
  const { data: all } = useProducts({});
  const categories = useCategories();
  const brands = useBrands();
  const [listening, setListening] = useState(false);
  const [voiceQuery, setVoiceQuery] = useState('');
  const nav = useNavigate();

  useEffect(() => {
    if (all.length) {
      aiRecommend(all, { intent: 'camera' });
    }
  }, [all]);

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert('Voice search needs Chrome. Try typing instead.'); return; }
    const rec = new SR();
    rec.lang = 'en-IN'; rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceQuery(text);
      const parsed = parseSearchQuery(text);
      void parsed;
      const params = new URLSearchParams();
      if (text) params.set('search', text);
      nav(`/products?${params.toString()}`);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-ink-950 text-white">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500 blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-24 w-96 h-96 rounded-full bg-accent-500 blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
        <div className="container-x relative py-16 md:py-24 grid lg:grid-cols-2 gap-10 items-center">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
            <span className="chip bg-white/10 text-brand-200 backdrop-blur mb-4">
              <Sparkles className="w-3.5 h-3.5" /> AI-Powered Mobile Shopping
            </span>
            <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-balance">
              Welcome to <span className="text-gradient">MMMobiles</span>
            </h1>
            <p className="mt-4 text-lg text-brand-100/90 max-w-lg leading-relaxed">
              Premium mobile shopping experience with AI recommendations, voice & image search, smart comparisons, and lightning-fast delivery.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/products" className="btn bg-white text-brand-700 hover:bg-brand-50 px-6 py-3 text-base font-bold shadow-float group">
                Shop Now <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
              </Link>
              <Link to="/ai-recommend" className="btn bg-white/10 text-white border border-white/20 hover:bg-white/20 backdrop-blur px-6 py-3 text-base font-bold">
                <Sparkles className="w-5 h-5" /> Explore Latest Mobiles
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: Truck, label: 'Same-day Delivery' },
                { icon: Shield, label: '1-Yr Warranty' },
                { icon: Zap, label: 'No-Cost EMI' },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <s.icon className="w-6 h-6 mx-auto text-brand-300 mb-1" />
                  <p className="text-xs text-brand-100/80">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Hero phone collage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block h-[440px]"
          >
            <div className="absolute top-0 right-12 w-48 h-64 rounded-3xl bg-gradient-to-br from-ink-700 to-ink-900 shadow-2xl rotate-6 overflow-hidden border border-white/10 animate-float">
              <img src="https://images.pexels.com/photos/1772123/pexels-photo-1772123.jpeg?auto=compress&cs=tinysrgb&w=600" alt="iPhone" className="w-full h-full object-cover" />
            </div>
            <div className="absolute top-20 left-8 w-48 h-64 rounded-3xl bg-gradient-to-br from-ink-700 to-ink-900 shadow-2xl -rotate-6 overflow-hidden border border-white/10 animate-float" style={{ animationDelay: '1.5s' }}>
              <img src="https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=600" alt="Samsung" className="w-full h-full object-cover" />
            </div>
            <div className="absolute bottom-0 right-32 w-52 h-72 rounded-3xl bg-gradient-to-br from-ink-700 to-ink-900 shadow-2xl rotate-3 overflow-hidden border border-white/10 animate-float" style={{ animationDelay: '0.8s' }}>
              <img src="https://images.pexels.com/photos/47261/pexels-photo-47261.jpeg?auto=compress&cs=tinysrgb&w=600" alt="OnePlus" className="w-full h-full object-cover" />
            </div>
            {/* Floating AI badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}
              className="absolute bottom-12 left-0 bg-white/95 text-ink-900 rounded-2xl shadow-xl p-3 backdrop-blur w-52"
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded-lg bg-brand-600 text-white grid place-items-center"><Sparkles className="w-4 h-4" /></div>
                <p className="text-xs font-bold">AI Match</p>
              </div>
              <p className="text-xs text-ink-600">Based on your budget & needs, we recommend the OnePlus 12R.</p>
            </motion.div>
          </motion.div>
        </div>

        {/* AI search bar */}
        <div className="container-x relative pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-white/10 backdrop-blur-xl border border-white/15 rounded-2xl p-2 max-w-3xl mx-auto flex items-center gap-2"
          >
            <input
              value={voiceQuery}
              onChange={(e) => setVoiceQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && voiceQuery.trim()) nav(`/products?search=${encodeURIComponent(voiceQuery.trim())}`); }}
              placeholder="Ask AI: 'Show Samsung mobiles under ₹20,000'…"
              className="flex-1 bg-transparent text-white placeholder-white/60 px-3 py-2.5 focus:outline-none"
            />
            <button
              onClick={startVoice}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition ${listening ? 'bg-error-500 text-white animate-pulse' : 'bg-white/10 hover:bg-white/20 text-white'}`}
              title="Voice search"
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              onClick={() => voiceQuery.trim() && nav(`/products?search=${encodeURIComponent(voiceQuery.trim())}`)}
              className="btn bg-white text-brand-700 px-5 py-2.5 text-sm font-bold hover:bg-brand-50"
            >
              <Sparkles className="w-4 h-4" /> AI Search
            </button>
          </motion.div>
        </div>
      </section>

      {/* ===== CATEGORIES ===== */}
      <section className="container-x py-12">
        <SectionHeading title="Shop by Category" subtitle="Find exactly what you need" />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-8">
          {categories.map((c, i) => {
            const Icon = CATEGORY_ICONS[c.icon] || Smartphone;
            return (
              <motion.div key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Link
                  to={`/products?category=${c.id}`}
                  className="card p-4 flex flex-col items-center text-center hover:shadow-card hover:-translate-y-1 transition-all group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 grid place-items-center mb-2 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                    <Icon className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold text-ink-800 dark:text-ink-100">{c.name}</p>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ===== BRANDS ===== */}
      <section className="container-x py-8">
        <SectionHeading title="Shop by Brand" subtitle="12 leading mobile brands" />
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 mt-8">
          {brands.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.03 }}>
              <Link
                to={`/products?brand=${b.id}`}
                className="card p-5 text-center hover:shadow-card hover:border-brand-300 dark:hover:border-brand-700 transition-all group"
              >
                <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-display font-extrabold text-xl mb-2 group-hover:scale-110 transition-transform">
                  {b.name[0]}
                </div>
                <p className="font-semibold text-sm text-ink-800 dark:text-white">{b.name}</p>
                <p className="text-[10px] text-ink-500">{b.country}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ===== FEATURED ===== */}
      <section className="container-x py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading title="Featured Products" subtitle="Hand-picked best sellers" noMargin />
          <Link to="/products" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {featured.slice(0, 8).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ===== AI RECOMMENDATION ===== */}
      <section className="bg-gradient-to-br from-brand-50 to-accent-50 dark:from-ink-900 dark:to-ink-950 py-12 border-y border-ink-200 dark:border-ink-800">
        <div className="container-x">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-600 to-accent-500 text-white grid place-items-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold text-ink-900 dark:text-white">AI Recommendations</h2>
              <p className="text-sm text-ink-600 dark:text-ink-300">Smart picks based on camera, battery, gaming, performance & budget</p>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {(['camera','gaming','battery','budget'] as const).map(intent => {
              const list = aiRecommend(all, { intent }).slice(0, 1);
              const p = list[0];
              if (!p) return null;
              const labels: Record<string, string> = { camera: 'Best Camera', gaming: 'Best for Gaming', battery: 'Best Battery', budget: 'Best Budget' };
              return (
                <Link key={intent} to={`/product/${p.slug}`} className="card p-4 hover:shadow-card transition group bg-white dark:bg-ink-900">
                  <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 mb-2">{labels[intent]}</span>
                  <div className="aspect-square rounded-xl overflow-hidden bg-ink-50 dark:bg-ink-800 mb-3">
                    <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
                  </div>
                  <p className="font-semibold text-sm text-ink-900 dark:text-white line-clamp-1">{p.name}</p>
                  <p className="text-lg font-extrabold text-brand-600 dark:text-brand-400 mt-1">{inr(p.price)}</p>
                </Link>
              );
            })}
          </div>
          <Link to="/ai-recommend" className="btn-primary">
            <Sparkles className="w-4 h-4" /> Get Personalized Recommendations
          </Link>
        </div>
      </section>

      {/* ===== NEW ARRIVALS ===== */}
      <section className="container-x py-12">
        <div className="flex items-end justify-between mb-8">
          <SectionHeading title="New Arrivals" subtitle="Latest launches in store" noMargin />
          <Link to="/new-arrivals" className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            View all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
      </section>

      {/* ===== OFFERS BANNER ===== */}
      <section className="container-x py-8">
        <div className="grid md:grid-cols-3 gap-4">
          {[
            { code: 'MM10', desc: '10% off above ₹9,999', color: 'from-brand-600 to-brand-800' },
            { code: 'MM20', desc: '20% off above ₹49,999', color: 'from-accent-500 to-accent-700' },
            { code: 'WELCOME15', desc: '15% off for new customers', color: 'from-success-600 to-success-800' },
          ].map(o => (
            <div key={o.code} className={`bg-gradient-to-r ${o.color} text-white rounded-2xl p-5 flex items-center justify-between overflow-hidden relative`}>
              <div>
                <p className="text-xs uppercase tracking-wider opacity-80">Coupon Code</p>
                <p className="font-display text-2xl font-extrabold">{o.code}</p>
                <p className="text-sm opacity-90">{o.desc}</p>
              </div>
              <Link to="/offers" className="btn bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-sm backdrop-blur shrink-0">
                Grab Offer
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ===== REVIEWS ===== */}
      <CustomerReviews />

      {/* ===== STORE INFO ===== */}
      <StoreInfo />
    </div>
  );
}

function SectionHeading({ title, subtitle, noMargin }: { title: string; subtitle: string; noMargin?: boolean }) {
  return (
    <div className={noMargin ? '' : 'mb-8'}>
      <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white">{title}</h2>
      <p className="text-sm text-ink-500 dark:text-ink-400 mt-1">{subtitle}</p>
    </div>
  );
}

function CustomerReviews() {
  useEffect(() => {
    (async () => {
      await supabase
        .from('products')
        .select('name, slug, images, rating, review_count')
        .order('rating', { ascending: false })
        .limit(3);
    })();
  }, []);

  const testimonials = [
    { name: 'Rajesh Kumar', city: 'Choutuppal', text: 'Bought an iPhone 15 Pro Max — same-day delivery and genuine product. The AI comparison helped me choose!', rating: 5 },
    { name: 'Priya Sharma', city: 'Hyderabad', text: 'Best mobile store in the area. Staff is knowledgeable and the EMI options made my purchase easy.', rating: 5 },
    { name: 'Mohammed Ali', city: 'Bhongir', text: 'The voice search feature is amazing. Found my Samsung S24 Ultra in seconds. Highly recommend MMMobiles.', rating: 4.5 },
  ];

  return (
    <section className="container-x py-12">
      <SectionHeading title="What Customers Say" subtitle="Real reviews from our community" />
      <div className="grid md:grid-cols-3 gap-5 mt-8">
        {testimonials.map((t, i) => (
          <motion.div key={t.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-6">
            <Quote className="w-8 h-8 text-brand-200 dark:text-brand-800 mb-3" />
            <div className="flex gap-0.5 mb-3">
              {[1,2,3,4,5].map(s => <Star key={s} className={`w-4 h-4 ${s <= Math.round(t.rating) ? 'fill-accent-400 text-accent-400' : 'text-ink-300'}`} />)}
            </div>
            <p className="text-sm text-ink-700 dark:text-ink-200 leading-relaxed mb-4">"{t.text}"</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 text-white grid place-items-center font-bold text-sm">
                {t.name[0]}
              </div>
              <div>
                <p className="font-semibold text-sm text-ink-900 dark:text-white">{t.name}</p>
                <p className="text-xs text-ink-500">{t.city}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function StoreInfo() {
  return (
    <section className="container-x py-12">
      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-8 md:p-10">
            <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 mb-3">
              <MapPin className="w-3.5 h-3.5" /> Visit Our Store
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-ink-900 dark:text-white mb-2">MMMobiles</h2>
            <p className="text-ink-600 dark:text-ink-300 mb-1">Lakkaram, Choutuppal</p>
            <p className="text-ink-600 dark:text-ink-300 mb-6">Telangana 508252, India</p>
            <div className="flex flex-wrap gap-3">
              <a href="https://maps.app.goo.gl/MRg2vJMNbMJmWoBq8" target="_blank" rel="noopener noreferrer" className="btn-primary">
                <MapPin className="w-4 h-4" /> Google Maps
              </a>
              <a href="tel:+919000000000" className="btn-outline">
                <Phone className="w-4 h-4" /> Call Us
              </a>
              <a href="https://wa.me/919000000000" target="_blank" rel="noopener noreferrer" className="btn bg-success-600 hover:bg-success-700 text-white px-5 py-2.5">
                <MessageCircle className="w-4 h-4" /> WhatsApp
              </a>
            </div>
            <div className="mt-8 grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="font-display text-2xl font-extrabold text-brand-600 dark:text-brand-400">16+</p>
                <p className="text-xs text-ink-500">Products</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-brand-600 dark:text-brand-400">12</p>
                <p className="text-xs text-ink-500">Brands</p>
              </div>
              <div>
                <p className="font-display text-2xl font-extrabold text-brand-600 dark:text-brand-400">4.7★</p>
                <p className="text-xs text-ink-500">Rating</p>
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-100 to-accent-100 dark:from-ink-800 dark:to-ink-900 min-h-[280px] grid place-items-center p-8 relative overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #1c80f5 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
            </div>
            <div className="relative text-center">
              <div className="w-20 h-20 rounded-full bg-brand-600 text-white grid place-items-center mx-auto mb-4 animate-pulse-ring">
                <MapPin className="w-10 h-10" />
              </div>
              <p className="font-semibold text-ink-800 dark:text-white">Find us on Google Maps</p>
              <p className="text-sm text-ink-600 dark:text-ink-300 mt-1">Choutuppal, Telangana</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { MapPin, Phone, MessageCircle, Mail, Clock, Sparkles, Shield, Truck } from 'lucide-react';

export default function About() {
  return (
    <div className="container-x py-8">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 mb-3"><Sparkles className="w-3.5 h-3.5" /> Our Story</span>
        <h1 className="font-display text-3xl md:text-5xl font-bold text-ink-900 dark:text-white mb-4">About MMMobiles</h1>
        <p className="text-lg text-ink-600 dark:text-ink-300 max-w-2xl mx-auto">Your trusted AI-powered mobile store in Choutuppal, Telangana — bringing the latest smartphones, accessories, and smart devices with same-day delivery.</p>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {[
          { icon: Sparkles, title: 'AI-Powered', desc: 'Smart recommendations, voice & image search, and AI comparison to help you choose the perfect device.' },
          { icon: Truck, title: 'Fast Delivery', desc: 'Same-day delivery in Choutuppal with live GPS tracking and OTP-verified handoff.' },
          { icon: Shield, title: 'Genuine Products', desc: '100% authentic products with manufacturer warranty. No fakes, no compromises.' },
        ].map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="card p-6">
            <div className="w-12 h-12 rounded-2xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 grid place-items-center mb-4"><f.icon className="w-6 h-6" /></div>
            <h3 className="font-display text-lg font-bold mb-2">{f.title}</h3>
            <p className="text-sm text-ink-600 dark:text-ink-300">{f.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="card p-8 md:p-12 mb-12 bg-gradient-to-br from-brand-50 to-accent-50 dark:from-ink-900 dark:to-ink-950">
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-ink-700 dark:text-ink-200 leading-relaxed mb-4">At MMMobiles, we believe buying a phone should be effortless and intelligent. We combine a curated catalog of 12+ leading brands with AI-driven recommendations to match every customer with the right device — whether it's for photography, gaming, battery life, or budget.</p>
            <p className="text-ink-700 dark:text-ink-200 leading-relaxed">Serving Lakkaram, Choutuppal, and surrounding areas, we deliver genuine products with lightning speed and unmatched after-sales support.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { num: '16+', label: 'Products' },
              { num: '12', label: 'Brands' },
              { num: '4.7★', label: 'Rating' },
              { num: '500+', label: 'Happy Customers' },
            ].map(s => (
              <div key={s.label} className="bg-white dark:bg-ink-900 rounded-2xl p-5 text-center">
                <p className="font-display text-3xl font-extrabold text-brand-600 dark:text-brand-400">{s.num}</p>
                <p className="text-sm text-ink-500 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="grid md:grid-cols-2">
          <div className="p-8">
            <h2 className="font-display text-xl font-bold mb-4">Visit Our Store</h2>
            <div className="space-y-3 text-sm">
              <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" /> Lakkaram, Choutuppal, Telangana 508252</p>
              <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-brand-600" /> +91 90000 00000</p>
              <p className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-600" /> hello@mmmobiles.in</p>
              <p className="flex items-center gap-2"><Clock className="w-4 h-4 text-brand-600" /> Mon-Sun: 9 AM - 9 PM</p>
            </div>
            <div className="flex gap-2 mt-5">
              <a href="https://maps.app.goo.gl/MRg2vJMNbMJmWoBq8" target="_blank" rel="noopener noreferrer" className="btn-primary">Google Maps</a>
              <a href="https://wa.me/919000000000" target="_blank" rel="noopener noreferrer" className="btn bg-success-600 hover:bg-success-700 text-white"><MessageCircle className="w-4 h-4" /> WhatsApp</a>
            </div>
          </div>
          <div className="bg-gradient-to-br from-brand-100 to-accent-100 dark:from-ink-800 dark:to-ink-900 min-h-[240px] grid place-items-center">
            <MapPin className="w-16 h-16 text-brand-600 animate-pulse-ring rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

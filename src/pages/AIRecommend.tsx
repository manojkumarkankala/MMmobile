import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Camera, Battery, Gamepad2, Gauge, Wallet, Gem, Clock, ArrowRight, Check, Mic, Upload, ImageIcon } from 'lucide-react';
import { useProducts } from '../hooks/useData';
import { aiRecommend, parseSearchQuery, aiImageSearch } from '../lib/ai';
import { ProductCard } from '../components/ProductCard';
import { inr } from '../lib/utils';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

const INTENTS: { id: string; label: string; icon: any; desc: string }[] = [
  { id: 'camera', label: 'Camera', icon: Camera, desc: 'Best photography' },
  { id: 'battery', label: 'Battery', icon: Battery, desc: 'Long lasting' },
  { id: 'gaming', label: 'Gaming', icon: Gamepad2, desc: 'High FPS' },
  { id: 'performance', label: 'Performance', icon: Gauge, desc: 'Raw power' },
  { id: 'budget', label: 'Budget', icon: Wallet, desc: 'Value picks' },
  { id: 'value', label: 'Value', icon: Gem, desc: 'Bang for buck' },
  { id: 'premium', label: 'Premium', icon: Gem, desc: 'Flagship tier' },
  { id: 'latest', label: 'Latest', icon: Clock, desc: 'New releases' },
];

const BUDGETS = [10000, 15000, 20000, 30000, 50000, 80000, 150000];

export default function AIRecommend() {
  const { data: all } = useProducts({});
  const [intent, setIntent] = useState<string>('camera');
  const [budget, setBudget] = useState<number | undefined>(20000);
  const [voiceText, setVoiceText] = useState('');
  const [listening, setListening] = useState(false);
  const [imageResults, setImageResults] = useState<typeof all | null>(null);
  const nav = useNavigate();

  const results = aiRecommend(all, { intent: intent as any, budget });

  const startVoice = () => {
    const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) { alert('Voice search needs Chrome.'); return; }
    const rec = new SR(); rec.lang = 'en-IN'; rec.interimResults = false;
    setListening(true);
    rec.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setVoiceText(text);
      const parsed = parseSearchQuery(text);
      if (parsed.intent) setIntent(parsed.intent);
      if (parsed.budget) setBudget(parsed.budget);
      setListening(false);
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simulated AI image search — identifies from catalog
    setImageResults(aiImageSearch(all));
  };

  return (
    <div className="container-x py-6">
      <div className="text-center mb-10">
        <span className="chip bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 mb-3">
          <Sparkles className="w-3.5 h-3.5" /> AI Powered
        </span>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 dark:text-white">AI Recommendation Engine</h1>
        <p className="text-ink-500 mt-2 max-w-xl mx-auto">Tell us what you need — by preference, voice, or image — and our AI finds the perfect phone.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Preference picker */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4">What matters most?</h2>
          <div className="grid grid-cols-2 gap-2 mb-5">
            {INTENTS.map(it => (
              <button
                key={it.id}
                onClick={() => setIntent(it.id)}
                className={cn('flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition text-left', intent === it.id ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-ink-200 dark:border-ink-700 hover:border-brand-300')}
              >
                <it.icon className={cn('w-5 h-5', intent === it.id ? 'text-brand-600' : 'text-ink-500')} />
                <p className="text-sm font-semibold">{it.label}</p>
                <p className="text-[11px] text-ink-500">{it.desc}</p>
              </button>
            ))}
          </div>

          <h3 className="label">Budget</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            <button onClick={() => setBudget(undefined)} className={cn('chip', !budget ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300')}>Any</button>
            {BUDGETS.map(b => (
              <button key={b} onClick={() => setBudget(b)} className={cn('chip', budget === b ? 'bg-brand-600 text-white' : 'bg-ink-100 dark:bg-ink-800 text-ink-600 dark:text-ink-300')}>
                Under {inr(b)}
              </button>
            ))}
          </div>
        </div>

        {/* Voice search */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><Mic className="w-5 h-5 text-brand-600" /> AI Voice Search</h2>
          <p className="text-sm text-ink-500 mb-4">Say something like "Show Samsung phones under ₹20,000 for gaming"</p>
          <button
            onClick={startVoice}
            className={cn('w-full aspect-video rounded-2xl grid place-items-center transition border-2 border-dashed', listening ? 'border-error-500 bg-error-50 dark:bg-error-950 animate-pulse' : 'border-ink-300 dark:border-ink-700 hover:border-brand-500')}
          >
            <div className="text-center">
              <Mic className={cn('w-12 h-12 mx-auto mb-2', listening ? 'text-error-500' : 'text-brand-600')} />
              <p className="text-sm font-semibold">{listening ? 'Listening…' : 'Tap to speak'}</p>
            </div>
          </button>
          {voiceText && (
            <div className="mt-3 p-3 rounded-xl bg-brand-50 dark:bg-brand-950 text-sm">
              <p className="text-xs text-ink-500 mb-1">You said:</p>
              <p className="font-medium text-ink-800 dark:text-ink-100">"{voiceText}"</p>
              <button onClick={() => nav(`/products?search=${encodeURIComponent(voiceText)}`)} className="btn-primary mt-2 !py-1.5 text-xs">View results <ArrowRight className="w-3 h-3" /></button>
            </div>
          )}
        </div>

        {/* Image search */}
        <div className="card p-5">
          <h2 className="font-semibold mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-brand-600" /> AI Image Search</h2>
          <p className="text-sm text-ink-500 mb-4">Upload a photo of a phone to find similar products</p>
          <label className="w-full aspect-video rounded-2xl border-2 border-dashed border-ink-300 dark:border-ink-700 hover:border-brand-500 grid place-items-center cursor-pointer transition">
            <div className="text-center">
              <Upload className="w-12 h-12 mx-auto mb-2 text-brand-600" />
              <p className="text-sm font-semibold">Upload image</p>
              <p className="text-xs text-ink-500">PNG, JPG up to 5MB</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </label>
          {imageResults && (
            <div className="mt-3 p-3 rounded-xl bg-success-50 dark:bg-success-950 text-sm">
              <p className="flex items-center gap-1.5 font-medium text-success-700 dark:text-success-400"><Check className="w-4 h-4" /> Identified! Showing matches below.</p>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-600" />
            AI Picks for {intent} {budget ? `under ${inr(budget)}` : ''}
          </h2>
          <span className="text-sm text-ink-500">{results.length} matches</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={`${intent}-${budget}`}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
          >
            {results.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Image search results */}
      {imageResults && (
        <div className="mt-10">
          <h2 className="font-display text-xl font-bold mb-5">Image Search Matches</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {imageResults.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      )}
    </div>
  );
}

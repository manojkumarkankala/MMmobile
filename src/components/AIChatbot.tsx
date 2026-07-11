import { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Sparkles, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { aiChatReply } from '../lib/ai';
import { supabase } from '../lib/supabase';
import { cn } from '../lib/utils';

interface Msg { role: 'bot' | 'user'; text: string; }

const SUGGESTIONS = [
  'Show Samsung phones under ₹20,000',
  'What is your return policy?',
  'Do you offer EMI?',
  'Where is your store located?',
];

export function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'bot', text: "Hi! I'm the MMMobiles AI assistant. Ask me about phones, comparisons, warranty, delivery, or offers!" },
  ]);
  const [input, setInput] = useState('');
  const [ctx, setCtx] = useState<{ productCount: number; brandCount: number }>({ productCount: 16, brandCount: 12 });
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const [{ count: p }, { count: b }] = await Promise.all([
        supabase.from('products').select('*', { count: 'exact', head: true }),
        supabase.from('brands').select('*', { count: 'exact', head: true }),
      ]);
      if (p != null || b != null) setCtx({ productCount: p ?? 16, brandCount: b ?? 12 });
    })();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const send = (text?: string) => {
    const msg = (text ?? input).trim();
    if (!msg) return;
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const reply = aiChatReply(msg, ctx);
      setMessages(prev => [...prev, { role: 'bot', text: reply }]);
      setTyping(false);
    }, 700 + Math.random() * 500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full bg-brand-600 text-white shadow-float hover:scale-105 transition flex items-center justify-center group"
        aria-label="AI Chatbot"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X className="w-6 h-6" />
            </motion.span>
          ) : (
            <motion.span key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare className="w-6 h-6" />
            </motion.span>
          )}
        </AnimatePresence>
        {!open && <span className="absolute inset-0 rounded-full bg-brand-400 animate-ping opacity-30" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 left-5 z-50 w-[calc(100vw-2.5rem)] max-w-sm card overflow-hidden flex flex-col"
            style={{ height: 'min(560px, 70vh)' }}
          >
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 text-white p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 grid place-items-center">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-bold flex items-center gap-1.5">AI Assistant <Sparkles className="w-3.5 h-3.5 text-accent-300" /></p>
                <p className="text-xs text-brand-100 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-success-300" /> Online now</p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-3 bg-ink-50 dark:bg-ink-950">
              {messages.map((m, i) => (
                <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm',
                    m.role === 'user' ? 'bg-brand-600 text-white rounded-br-sm' : 'bg-white dark:bg-ink-900 text-ink-800 dark:text-ink-100 rounded-bl-sm shadow-sm'
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-ink-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-ink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              {messages.length <= 2 && !typing && (
                <div className="space-y-1.5 pt-2">
                  <p className="text-xs text-ink-400 px-1">Try asking:</p>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} className="block w-full text-left text-xs px-3 py-2 rounded-lg bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900 transition">
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <form onSubmit={(e) => { e.preventDefault(); send(); }} className="p-3 border-t border-ink-200 dark:border-ink-800 flex gap-2 bg-white dark:bg-ink-900">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message…"
                className="flex-1 bg-ink-100 dark:bg-ink-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40"
              />
              <button type="submit" className="btn-primary !px-3 !py-2" disabled={!input.trim()}>
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

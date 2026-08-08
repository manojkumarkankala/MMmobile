import { useState } from 'react';
import { MapPin, Phone, MessageCircle, Mail, Clock, Send, Sparkles } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function Contact() {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast('Message sent! We\'ll get back to you soon.');
    setForm({ name: '', email: '', message: '' });
  };

  return (
    <div className="container-x py-8 page-fill">
      <div className="text-center mb-10">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-ink-900 dark:text-white">Get in Touch</h1>
        <p className="text-ink-500 mt-2">We're here to help. Reach out any time.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        {[
          { icon: Phone, title: 'Call Us', value: '+91 90000 00000', href: 'tel:+918341827908', color: 'text-success-600' },
          { icon: MessageCircle, title: 'WhatsApp', value: 'Chat with us', href: 'https://wa.me/918341827908', color: 'text-success-600' },
          { icon: Mail, title: 'Email', value: 'hello@mmmobiles.in', href: 'mailto:hello@mmmobiles.in', color: 'text-brand-600' },
        ].map(c => (
          <a key={c.title} href={c.href} target={c.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer" className="card p-6 text-center hover:shadow-card transition group">
            <div className="w-12 h-12 rounded-2xl bg-ink-100 dark:bg-ink-800 grid place-items-center mx-auto mb-3 group-hover:scale-110 transition"><c.icon className={`w-6 h-6 ${c.color}`} /></div>
            <p className="font-semibold text-sm text-ink-500">{c.title}</p>
            <p className="font-bold text-ink-900 dark:text-white">{c.value}</p>
          </a>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <form onSubmit={submit} className="card p-6 space-y-4">
          <h2 className="font-display text-xl font-bold flex items-center gap-2"><Sparkles className="w-5 h-5 text-brand-600" /> Send a Message</h2>
          <div><label className="label">Your Name</label><input required className="input" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">Email</label><input type="email" required className="input" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
          <div><label className="label">Message</label><textarea required rows={4} className="input" value={form.message} onChange={(e) => setForm(f => ({ ...f, message: e.target.value }))} /></div>
          <button type="submit" className="btn-primary w-full"><Send className="w-4 h-4" /> Send Message</button>
        </form>

        <div className="space-y-4">
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><MapPin className="w-5 h-5 text-brand-600" /> Store Location</h3>
            <p className="text-sm text-ink-600 dark:text-ink-300">Lakkaram, Choutuppal,<br />Telangana 508252, India</p>
            <a href="https://maps.app.goo.gl/MRg2vJMNbMJmWoBq8" target="_blank" rel="noopener noreferrer" className="btn-outline mt-3 text-sm !py-2">View on Google Maps</a>
          </div>
          <div className="card p-6">
            <h3 className="font-semibold mb-3 flex items-center gap-2"><Clock className="w-5 h-5 text-brand-600" /> Business Hours</h3>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-ink-500">Monday - Friday</span><span className="font-semibold">9 AM - 9 PM</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Saturday</span><span className="font-semibold">9 AM - 9 PM</span></div>
              <div className="flex justify-between"><span className="text-ink-500">Sunday</span><span className="font-semibold">10 AM - 6 PM</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

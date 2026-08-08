import { Shield, CheckCircle2, Clock, Phone } from 'lucide-react';

export default function Warranty() {
  return (
    <div className="container-x py-8 max-w-3xl page-fill">
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-success-50 dark:bg-success-950 text-success-600 grid place-items-center mx-auto mb-3"><Shield className="w-7 h-7" /></div>
        <h1 className="font-display text-3xl font-bold text-ink-900 dark:text-white">Warranty Policy</h1>
      </div>

      <div className="card p-6 space-y-5">
        <div>
          <h2 className="font-semibold text-lg mb-2">Manufacturer Warranty</h2>
          <ul className="space-y-2 text-sm text-ink-700 dark:text-ink-200">
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" /> All mobile phones come with a 1-year manufacturer warranty from the date of purchase.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" /> Accessories (chargers, earbuds, power banks) carry a 6-month warranty.</li>
            <li className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-success-500 mt-0.5 shrink-0" /> Warranty covers manufacturing defects only — not physical or water damage.</li>
          </ul>
        </div>

        <div>
          <h2 className="font-semibold text-lg mb-2">How to Claim</h2>
          <ol className="space-y-2 text-sm text-ink-700 dark:text-ink-200 list-decimal list-inside">
            <li>Visit any authorized brand service center with your MMMobiles invoice.</li>
            <li>The service center will verify the defect and process the repair/replacement.</li>
            <li>For assistance, call us at +91 90000 00000 or WhatsApp.</li>
          </ol>
        </div>

        <div className="p-4 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center gap-3">
          <Clock className="w-5 h-5 text-brand-600" />
          <p className="text-sm text-ink-700 dark:text-ink-200">Warranty claims are typically processed within 7-14 business days depending on the brand.</p>
        </div>

        <div className="p-4 rounded-xl bg-error-50 dark:bg-error-950">
          <h3 className="font-semibold text-sm text-error-700 dark:text-error-400 mb-2">Not Covered Under Warranty</h3>
          <ul className="space-y-1 text-sm text-ink-700 dark:text-ink-200">
            <li>• Physical damage, scratches, or broken screens</li>
            <li>• Water or liquid damage</li>
            <li>• Software issues due to unauthorized modifications</li>
            <li>• Accessories worn through normal use</li>
          </ul>
        </div>

        <div className="flex items-center gap-2 text-sm text-ink-600 dark:text-ink-300">
          <Phone className="w-4 h-4 text-brand-600" /> Need help? Call +91 90000 00000
        </div>
      </div>
    </div>
  );
}

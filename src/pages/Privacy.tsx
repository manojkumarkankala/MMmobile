export default function Privacy() {
  return (
    <div className="container-x py-8 max-w-3xl page-fill">
      <h1 className="font-display text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="card p-6 space-y-4 text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
        <p>At MMMobiles, we take your privacy seriously. This policy explains how we collect, use, and protect your personal information.</p>
        <Section title="Information We Collect">
          We collect your name, email, phone number, delivery address, and payment information when you place an order or create an account. We also collect browsing data to improve our AI recommendations.
        </Section>
        <Section title="How We Use Your Information">
          Your information is used to process orders, provide delivery tracking, send order notifications, improve product recommendations, and provide customer support. We do not sell your data to third parties.
        </Section>
        <Section title="Data Security">
          All payment information is processed securely via Razorpay with 256-bit encryption. Passwords are hashed using bcrypt. We use JWT-based authentication with refresh tokens. Your data is stored in encrypted databases with row-level security.
        </Section>
        <Section title="Cookies">
          We use cookies to maintain your session, remember preferences (like dark mode), and personalize your shopping experience. You can disable cookies in your browser settings.
        </Section>
        <Section title="Your Rights">
          You have the right to access, correct, or delete your personal data. You can manage your profile from your account dashboard or contact us to request data deletion.
        </Section>
        <Section title="Contact">
          For privacy concerns, email us at hello@mmmobiles.in or call +91 90000 00000. MMMobiles, Lakkaram, Choutuppal, Telangana 508252.
        </Section>
        <p className="text-xs text-ink-400 pt-4">Last updated: {new Date().getFullYear()}</p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-semibold text-base text-ink-900 dark:text-white mb-1">{title}</h2>
      <p>{children}</p>
    </div>
  );
}

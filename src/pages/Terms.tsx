export default function Terms() {
  return (
    <div className="container-x py-8 max-w-3xl page-fill">
      <h1 className="font-display text-3xl font-bold mb-6">Terms & Conditions</h1>
      <div className="card p-6 space-y-4 text-sm text-ink-700 dark:text-ink-200 leading-relaxed">
        <p>Welcome to MMMobiles. By using our website and services, you agree to these terms and conditions.</p>
        <Section title="Eligibility">You must be 18 years or older to make purchases. By placing an order, you confirm that the information provided is accurate and complete.</Section>
        <Section title="Orders & Pricing">All prices are in Indian Rupees (₹) and inclusive of applicable taxes. We reserve the right to cancel orders due to pricing errors, stock unavailability, or suspected fraudulent activity. Order confirmation is subject to payment verification.</Section>
        <Section title="Delivery">Delivery charges are calculated based on distance from our store in Choutuppal. Estimated delivery times are indicative; we are not liable for delays beyond our control. OTP verification is required for delivery confirmation.</Section>
        <Section title="Returns & Refunds">Manufacturing defects are eligible for return within 7 days. Refunds are processed to the original payment method within 5-7 business days. Products must be returned in original condition with all accessories and packaging.</Section>
        <Section title="Warranty">Products carry manufacturer warranty as specified. Warranty claims are handled by authorized service centers. MMMobiles facilitates but does not guarantee warranty outcomes.</Section>
        <Section title="AI Features">Our AI recommendations, comparisons, and review summaries are advisory in nature and based on available data. We do not guarantee the accuracy of AI-generated content. Final purchasing decisions are yours.</Section>
        <Section title="Limitation of Liability">MMMobiles is not liable for indirect, incidental, or consequential damages. Our liability is limited to the order value.</Section>
        <Section title="Governing Law">These terms are governed by the laws of India. Disputes are subject to the jurisdiction of courts in Telangana.</Section>
        <Section title="Contact">Questions? Email hello@mmmobiles.in or call +91 90000 00000. MMMobiles, Lakkaram, Choutuppal, Telangana 508252.</Section>
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

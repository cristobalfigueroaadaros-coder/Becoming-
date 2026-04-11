import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" /> Back
        </button>

        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 11, 2025</p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Who we are</h2>
            <p>
              Bcoming ("we", "us", "our") is a personal growth application that helps users discover their strengths,
              build meaningful projects, and develop through guided AI-powered mentorship. We are the data controller
              for all personal data processed through the app.
            </p>
            <p className="mt-2">
              If you have questions about this policy, contact us at: <a href="mailto:privacy@bcoming.app" className="text-primary hover:underline">privacy@bcoming.app</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. What data we collect</h2>
            <p className="mb-3">We collect the following categories of personal data:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Account data:</strong> Email address, display name, password (hashed, never stored in plain text).</li>
              <li><strong className="text-foreground">Profile data:</strong> Birth name, date of birth, birth location, birth time — used to generate numerological and astrological insights within the app.</li>
              <li><strong className="text-foreground">Usage data:</strong> Pages visited, features used, tasks completed, daily goal activity, and engagement patterns within the app.</li>
              <li><strong className="text-foreground">Content data:</strong> Your responses to council conversations, mentor chats, journal entries, saved insights, and project descriptions you create inside the app.</li>
              <li><strong className="text-foreground">Payment data:</strong> Billing information is processed by Stripe. We do not store your card details — we only receive a subscription status and customer ID from Stripe.</li>
              <li><strong className="text-foreground">Device data:</strong> Browser type, operating system, and IP address collected automatically for security and analytics purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. How we use your data</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>To provide and personalize the Bcoming experience (AI mentorship, project creation, Atlas map, daily challenges).</li>
              <li>To generate numerological, astrological, and human design insights based on your birth data.</li>
              <li>To process payments and manage your subscription via Stripe.</li>
              <li>To send product updates, mentor notifications, and re-engagement messages (you can opt out at any time).</li>
              <li>To improve the product through anonymized usage analytics.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. AI and your data</h2>
            <p>
              Bcoming uses large language models (LLMs) to power mentor conversations, council sessions, and insight generation.
              Your conversation content is sent to AI model providers (including Anthropic and Google) solely to generate responses.
              We do not permit these providers to use your data to train their models. Conversation data is not sold or shared with
              third parties for marketing purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Data sharing</h2>
            <p className="mb-3">We do not sell your personal data. We share data only with:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-foreground">Supabase</strong> — database and authentication infrastructure.</li>
              <li><strong className="text-foreground">Stripe</strong> — payment processing.</li>
              <li><strong className="text-foreground">AI model providers</strong> — for generating mentor and council responses (Anthropic, Google).</li>
              <li><strong className="text-foreground">Analytics providers</strong> — anonymized, aggregated usage data only.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Data retention</h2>
            <p>
              We retain your personal data for as long as your account is active. If you delete your account, we will delete or
              anonymize your personal data within 30 days, except where we are required to retain it for legal or financial compliance.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Your rights</h2>
            <p className="mb-3">Depending on your location, you may have the right to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate data.</li>
              <li>Request deletion of your data ("right to be forgotten").</li>
              <li>Export your data in a portable format.</li>
              <li>Object to or restrict certain processing.</li>
              <li>Withdraw consent at any time (where processing is based on consent).</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, email us at <a href="mailto:privacy@bcoming.app" className="text-primary hover:underline">privacy@bcoming.app</a>.
              We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Cookies</h2>
            <p>
              We use essential cookies required for authentication and session management. We do not use third-party advertising
              cookies. Analytics cookies, if any, are used in anonymized form only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Children</h2>
            <p>
              Bcoming is not intended for users under 16 years of age. We do not knowingly collect personal data from children.
              If you believe a child has provided us with personal data, contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Changes to this policy</h2>
            <p>
              We may update this Privacy Policy from time to time. When we do, we will update the "last updated" date at the top
              of this page and, for material changes, notify you by email or in-app notification.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

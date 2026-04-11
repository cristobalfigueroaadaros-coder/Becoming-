import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TermsOfService = () => {
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

        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 11, 2025</p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Agreement to these terms</h2>
            <p>
              By creating an account or using Bcoming ("the app", "the service"), you agree to these Terms of Service.
              If you do not agree, do not use the service. These terms form a legal agreement between you and Bcoming.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. What Bcoming is</h2>
            <p>
              Bcoming is a personal development application that uses AI-powered mentorship, project management, and
              self-reflection tools to help users grow and build meaningful work. The insights, mentor conversations,
              and guidance provided by the app are for personal development purposes only and do not constitute
              professional advice — psychological, financial, medical, or otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. Eligibility</h2>
            <p>
              You must be at least 16 years old to use Bcoming. By using the service, you confirm you meet this requirement.
              If you are under 18, you confirm you have parental or guardian consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. Your account</h2>
            <p>
              You are responsible for keeping your account credentials secure. You must not share your account with others
              or use another person's account. You are responsible for all activity that occurs under your account.
              Notify us immediately at <a href="mailto:support@bcoming.app" className="text-primary hover:underline">support@bcoming.app</a> if
              you suspect unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Subscriptions and payments</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Bcoming offers free and paid subscription tiers. Paid features are clearly labeled within the app.</li>
              <li>Subscriptions are billed in advance on a monthly or annual basis. Prices are displayed at checkout.</li>
              <li>Payments are processed by Stripe. By subscribing, you agree to Stripe's terms of service.</li>
              <li>You may cancel your subscription at any time. Cancellation takes effect at the end of your current billing period — you retain access until then.</li>
              <li>We do not offer refunds for partial billing periods except where required by applicable law.</li>
              <li>We reserve the right to change pricing with 30 days' notice to existing subscribers.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Use the service for any unlawful purpose or in violation of any regulations.</li>
              <li>Attempt to reverse-engineer, scrape, or extract data from the service.</li>
              <li>Use the service to generate content that is harmful, hateful, or violates the rights of others.</li>
              <li>Share, resell, or redistribute access to the service.</li>
              <li>Attempt to bypass any subscription gates or access controls.</li>
              <li>Impersonate another person or entity.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Your content</h2>
            <p>
              You retain ownership of the content you create inside Bcoming — your project descriptions, journal entries,
              insights, and responses. By using the service, you grant us a limited license to process and store this
              content solely to provide the service to you. We do not claim ownership of your content and do not use it
              for advertising.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. AI-generated content</h2>
            <p>
              Mentor conversations, council insights, and other AI-generated content are produced by large language models
              and may not always be accurate, complete, or appropriate for your specific situation. AI-generated content
              is provided for reflection and inspiration — not as professional advice. Always apply your own judgment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Intellectual property</h2>
            <p>
              The Bcoming brand, app design, underlying systems, and all original content created by us are our intellectual
              property. You may not copy, reproduce, or distribute them without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Service availability</h2>
            <p>
              We aim for high availability but do not guarantee uninterrupted access to the service. We may perform
              maintenance, updates, or temporarily suspend the service without notice. We are not liable for any loss
              resulting from downtime.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Limitation of liability</h2>
            <p>
              To the maximum extent permitted by law, Bcoming is not liable for any indirect, incidental, special,
              or consequential damages arising from your use of the service. Our total liability to you for any claim
              shall not exceed the amount you paid to us in the 12 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">12. Termination</h2>
            <p>
              We reserve the right to suspend or terminate your account if you violate these terms, with or without notice.
              You may delete your account at any time from your profile settings. Upon termination, your access to the
              service ends immediately.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">13. Changes to these terms</h2>
            <p>
              We may update these Terms of Service. We will notify you of material changes by email or in-app notification
              at least 14 days before they take effect. Continued use of the service after that date constitutes acceptance
              of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">14. Contact</h2>
            <p>
              For questions about these terms, contact us at <a href="mailto:legal@bcoming.app" className="text-primary hover:underline">legal@bcoming.app</a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

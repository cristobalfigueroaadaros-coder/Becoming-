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

        <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
        <p className="text-sm text-muted-foreground mb-10">Last updated: April 22, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-muted-foreground">

          <section>
            <p>
              These Terms and Conditions ("Terms") govern your access to and use of the Bcoming application, website, and
              services (collectively, the "Service"), operated by Bcoming ("Company," "we," "us," or "our").
            </p>
            <p className="mt-3">
              By accessing or using the Service, you agree to these Terms. If you do not agree, you must not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">1. Nature of the Service</h2>
            <p className="mb-3">Bcoming is a digital platform designed to support users in:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>exploring personal insights</li>
              <li>developing ideas</li>
              <li>creating projects and businesses</li>
              <li>interacting with AI-powered systems and tools</li>
            </ul>
            <p>
              Bcoming is not a provider of professional advice, coaching, therapy, or guaranteed outcomes. All outputs,
              suggestions, and experiences within the Service are intended for educational, creative, and self-development
              purposes only.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">2. Eligibility</h2>
            <p className="mb-3">You must be at least 12 years old to use the Service.</p>
            <p className="mb-3">If you are under 18:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>You must have permission from a parent or legal guardian</li>
              <li>They agree to these Terms on your behalf</li>
            </ul>
            <p>We do not knowingly allow children under 12 to use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">3. User Responsibility</h2>
            <p className="mb-3">You are fully responsible for:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>your decisions</li>
              <li>your actions</li>
              <li>any outcomes resulting from using the Service</li>
            </ul>
            <p className="mb-3">You agree that:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Bcoming does not control your behavior</li>
              <li>Bcoming does not guarantee results</li>
              <li>Any success, failure, or outcome is your responsibility</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">4. AI and Guidance Disclaimer</h2>
            <p className="mb-3">Bcoming includes AI-generated systems, mentors, and interactions.</p>
            <p className="mb-3">You acknowledge that:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>AI responses may be incomplete, inaccurate, or subjective</li>
              <li>AI is not a human professional</li>
              <li>AI outputs are not instructions or directives</li>
            </ul>
            <p className="mb-3">You agree not to rely on the Service as:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>legal advice</li>
              <li>financial advice</li>
              <li>medical or psychological guidance</li>
              <li>business guarantees</li>
            </ul>
            <p>Use of the Service is at your own risk.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">5. Business and Project Disclaimer</h2>
            <p className="mb-3">Bcoming may support you in creating:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>projects</li>
              <li>ideas</li>
              <li>businesses</li>
            </ul>
            <p className="mb-3">You acknowledge that:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>We do not guarantee business success</li>
              <li>We do not validate or verify your ideas</li>
              <li>We are not responsible for any financial or business decisions</li>
            </ul>
            <p className="mb-3">You assume all risks related to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>starting a business</li>
              <li>investing time or money</li>
              <li>acting on ideas generated through the platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">6. User Accounts</h2>
            <p className="mb-3">You agree to:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>provide accurate information</li>
              <li>keep your account secure</li>
              <li>be responsible for all activity under your account</li>
            </ul>
            <p>We may suspend or terminate accounts that violate these Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">7. Creator Space and User Content</h2>
            <h3 className="text-sm font-medium text-foreground/90 mb-2">7.1 Ownership</h3>
            <p className="mb-4">You retain ownership of your content.</p>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">7.2 License to Bcoming</h3>
            <p className="mb-4">
              By posting content, you grant us a worldwide, non-exclusive, royalty-free license to use, display, and
              distribute your content within the Service.
            </p>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">7.3 Public Content Risk</h3>
            <p className="mb-3">You understand that:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>Content shared publicly is visible to others</li>
              <li>Ideas may be seen, used, or adapted by other users</li>
              <li>Bcoming does not guarantee confidentiality of public content</li>
            </ul>
            <p className="mb-4">You are responsible for what you choose to share.</p>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">7.4 Content Rules</h3>
            <p className="mb-3">You agree not to post:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>illegal, harmful, or abusive content</li>
              <li>misleading or fraudulent information</li>
              <li>content that violates intellectual property rights</li>
            </ul>
            <p>We may remove content at our discretion.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">8. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>misuse the platform</li>
              <li>attempt to exploit or reverse engineer the system</li>
              <li>interfere with other users</li>
              <li>use the Service for unlawful purposes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">9. Payments, Subscriptions, and Access</h2>
            <h3 className="text-sm font-medium text-foreground/90 mb-2">9.1 Paid Features</h3>
            <p className="mb-3">The Service may include:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>subscriptions</li>
              <li>one-time payments</li>
              <li>feature unlocks</li>
            </ul>
            <p className="mb-4">All pricing is displayed before purchase.</p>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">9.2 Subscriptions</h3>
            <p className="mb-3">Subscriptions:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>renew automatically</li>
              <li>continue until canceled</li>
            </ul>
            <p className="mb-4">You may cancel at any time. Access continues until the end of the billing period.</p>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">9.3 Feature Unlocks and Validation Payments</h3>
            <p className="mb-3">Certain payments may:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>unlock access to features</li>
              <li>validate access to specific parts of the platform</li>
            </ul>
            <p className="mb-3">These payments:</p>
            <ul className="space-y-1 list-disc list-inside mb-4">
              <li>do not guarantee results</li>
              <li>are not tied to performance or outcomes</li>
            </ul>

            <h3 className="text-sm font-medium text-foreground/90 mb-2">9.4 Refund Policy</h3>
            <p className="mb-3">To the fullest extent permitted by law:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>All payments are non-refundable</li>
              <li>No refunds for partial use or unused time</li>
            </ul>
            <p>We may offer refunds at our discretion.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">10. Intellectual Property</h2>
            <p className="mb-3">All platform content (excluding user content) is owned by Bcoming.</p>
            <p className="mb-3">You are granted a limited license to use the Service for personal purposes.</p>
            <p className="mb-3">You may not:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>copy, resell, or distribute the platform</li>
              <li>use branding without permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">11. Data Privacy</h2>
            <p className="mb-3">Your data is processed according to our Privacy Policy.</p>
            <p className="mb-3">We aim to comply with:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>GDPR</li>
              <li>CCPA</li>
              <li>other applicable laws</li>
            </ul>
            <p className="mb-3">We use data to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>operate the platform</li>
              <li>improve the experience</li>
              <li>personalize interactions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">12. Termination</h2>
            <p className="mb-3">We may suspend or terminate your account if:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>you violate these Terms</li>
              <li>required by law</li>
              <li>necessary to protect the platform or users</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">13. Disclaimer of Warranties</h2>
            <p className="mb-3">The Service is provided "as is" and "as available."</p>
            <p className="mb-3">We do not guarantee:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>accuracy of outputs</li>
              <li>uninterrupted access</li>
              <li>specific outcomes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">14. Limitation of Liability</h2>
            <p className="mb-3">To the maximum extent permitted by law:</p>
            <p className="mb-3">Bcoming is not liable for:</p>
            <ul className="space-y-1 list-disc list-inside mb-3">
              <li>indirect or consequential damages</li>
              <li>loss of profits, data, or opportunities</li>
            </ul>
            <p className="mb-3">Total liability is limited to:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>the amount you paid in the last 12 months</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">15. Indemnification</h2>
            <p className="mb-3">You agree to indemnify Bcoming against claims arising from:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>your use of the Service</li>
              <li>your content</li>
              <li>your actions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">16. Governing Law</h2>
            <p>These Terms are governed by a jurisdiction selected by the Company.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">17. Dispute Resolution</h2>
            <p className="mb-3">Before legal action:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>You agree to attempt informal resolution</li>
              <li>Disputes will be resolved through binding arbitration</li>
              <li>No class actions</li>
              <li>Individual disputes only</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">18. Changes to Terms</h2>
            <p className="mb-3">We may update these Terms at any time.</p>
            <p>Continued use means acceptance of changes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-foreground mb-3">19. Contact</h2>
            <p>
              Bcoming<br />
              Email: <a href="mailto:legal@bcoming.app" className="text-primary hover:underline">legal@bcoming.app</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

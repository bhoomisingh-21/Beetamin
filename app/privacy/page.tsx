import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — TheBeetamin',
  description: 'TheBeetamin Privacy Policy — how we collect, use, and protect your personal data.',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#010d06] text-white px-4 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <span className="inline-block bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Legal
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-4">Privacy Policy</h1>
          <p className="text-gray-500 text-sm">Last updated: June 2026</p>
        </div>

        <div className="prose prose-invert max-w-none space-y-8 text-gray-300 text-sm leading-relaxed">

          <section>
            <h2 className="text-white text-xl font-bold mb-3">1. Who We Are</h2>
            <p>
              TheBeetamin (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a personalised nutrition and deficiency recovery platform operated from India. Our website is{' '}
              <a href="https://www.thebeetamin.com" className="text-emerald-400 hover:underline">
                www.thebeetamin.com
              </a>
              . For privacy-related queries, contact us at{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">2. Data We Collect</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong className="text-white">Account information:</strong> name, email address, phone number collected at sign-up.</li>
              <li><strong className="text-white">Health assessment data:</strong> answers you provide in the free assessment questionnaire (age, diet, lifestyle, symptoms).</li>
              <li><strong className="text-white">Payment information:</strong> payment is processed securely via PayU. We do not store your card or bank details.</li>
              <li><strong className="text-white">Session data:</strong> notes, goals, and progress data shared during nutritionist consultations.</li>
              <li><strong className="text-white">Usage data:</strong> pages visited, device type, browser, IP address — collected via analytics tools for service improvement.</li>
              <li><strong className="text-white">Communications:</strong> emails and messages you send us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To create and manage your account.</li>
              <li>To deliver your personalised nutrition plan and connect you with a nutritionist.</li>
              <li>To process payments and send receipts.</li>
              <li>To send service updates, session reminders, and relevant health content (you can unsubscribe at any time).</li>
              <li>To improve our platform through aggregate, anonymised analytics.</li>
              <li>To comply with legal obligations.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">4. Third-Party Sharing</h2>
            <p>We do not sell your personal data. We share data only with:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li><strong className="text-white">PayU</strong> — payment processing.</li>
              <li><strong className="text-white">Clerk</strong> — user authentication.</li>
              <li><strong className="text-white">Supabase</strong> — secure database hosting.</li>
              <li><strong className="text-white">Google Analytics &amp; Microsoft Clarity</strong> — anonymised usage analytics.</li>
              <li>Your assigned nutritionist, who is bound by a confidentiality agreement.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">5. Data Retention</h2>
            <p>
              We retain your account and health data for the duration of your engagement with us, plus a further 2 years for legal and audit purposes. You may request deletion at any time by emailing{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">6. Your Rights</h2>
            <p>Under the Digital Personal Data Protection Act, 2023 (DPDP Act) and applicable Indian law, you have the right to:</p>
            <ul className="list-disc pl-5 space-y-2 mt-2">
              <li>Access the personal data we hold about you.</li>
              <li>Correct inaccurate or incomplete data.</li>
              <li>Request erasure of your data (subject to legal retention requirements).</li>
              <li>Withdraw consent for data processing where processing is consent-based.</li>
              <li>Nominate a person to exercise these rights on your behalf.</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, email{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">7. Cookies</h2>
            <p>
              We use essential cookies for authentication and session management, and analytics cookies to understand how users interact with our platform. You can control cookie settings in your browser. See our{' '}
              <Link href="/cookies" className="text-emerald-400 hover:underline">Cookie Policy</Link>{' '}
              for more detail.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">8. DPDP Act Compliance Notice</h2>
            <p>
              TheBeetamin processes personal data in accordance with the Digital Personal Data Protection Act, 2023 (India). We collect only the minimum data necessary to deliver our services, obtain explicit consent before processing sensitive health data, and provide mechanisms for data principals to exercise their rights as described in Section 6 above.
            </p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold mb-3">9. Contact</h2>
            <p>
              For any privacy-related queries or concerns, contact our Data Protection contact at{' '}
              <a href="mailto:hi@thebeetamin.com" className="text-emerald-400 hover:underline">
                hi@thebeetamin.com
              </a>.
            </p>
          </section>
        </div>

        <div className="text-center mt-12">
          <Link
            href="/"
            className="inline-flex items-center gap-2 bg-[#00E676] text-black font-bold rounded-full px-6 py-3 hover:bg-[#00c864] transition-all"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  )
}

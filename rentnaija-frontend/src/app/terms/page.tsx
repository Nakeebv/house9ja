import Link from 'next/link'
import Image from 'next/image'

export const metadata = {
  title: 'Terms & Conditions — House9ja',
  description: 'Read the Terms and Conditions governing the use of the House9ja real estate platform.',
}

const EFFECTIVE_DATE = 'April 17, 2025'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="relative h-8 w-32 block">
            <Image src="/logo-full.png" alt="House9ja" fill className="object-contain object-left" sizes="128px" />
          </Link>
          <Link href="/register" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition">
            Create Account
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-blue-700 mb-4">
            Legal
          </span>
          <h1 className="text-3xl font-bold text-slate-950 sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-slate-500">Effective Date: {EFFECTIVE_DATE} &nbsp;·&nbsp; Platform: House9ja</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-amber-50 px-8 py-4">
            <p className="text-sm text-amber-800 font-medium">
              Please read these Terms carefully. By creating an account you confirm you have read, understood, and agreed to be bound by these Terms.
            </p>
          </div>

          <div className="prose prose-slate max-w-none px-8 py-10 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-8 [&_h2]:mb-3 [&_p]:text-slate-600 [&_p]:leading-relaxed [&_ul]:text-slate-600 [&_ul]:leading-relaxed [&_li]:mb-1">

            <Section number="1" title="Introduction">
              <p>
                Welcome to <strong>House9ja</strong>, a Nigerian real estate marketplace operated by House9ja Technology Ltd
                (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;). House9ja connects property seekers (&ldquo;Tenants&rdquo;), property owners
                (&ldquo;Landlords&rdquo;), and real estate professionals (&ldquo;Agents&rdquo;) on a single platform for the purpose of
                discovering, listing, and arranging rental accommodation across Nigeria.
              </p>
              <p>
                These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the House9ja website, mobile application,
                and all associated services (collectively, the &ldquo;Platform&rdquo;). By registering an account or using the Platform in any
                way, you agree to be legally bound by these Terms. If you do not agree, do not use the Platform.
              </p>
            </Section>

            <Section number="2" title="Eligibility">
              <p>To use House9ja you must:</p>
              <ul>
                <li>Be at least <strong>18 years of age</strong>.</li>
                <li>Have the legal capacity to enter into binding contracts under Nigerian law.</li>
                <li>Provide accurate, truthful, and complete information during registration and throughout your use of the Platform.</li>
                <li>Not be barred from using the Platform under any applicable law or previous violation of these Terms.</li>
              </ul>
              <p>
                By creating an account you represent and warrant that all of the above requirements are met. We reserve the right
                to terminate accounts we believe were created by ineligible users.
              </p>
            </Section>

            <Section number="3" title="User Responsibilities">
              <p>You are solely responsible for:</p>
              <ul>
                <li>Maintaining the confidentiality of your account credentials and all activity that occurs under your account.</li>
                <li>Ensuring that any information you submit — including contact details, property descriptions, pricing, and photos — is accurate and up to date.</li>
                <li>Complying with all applicable Nigerian laws and regulations in connection with your use of the Platform.</li>
                <li>Conducting your own due diligence before entering into any transaction, agreement, or visit arranged through House9ja.</li>
                <li>Notifying us immediately at <a href="mailto:support@house9ja.com" className="text-blue-600 hover:underline">support@house9ja.com</a> if you become aware of any unauthorised access to your account.</li>
              </ul>
            </Section>

            <Section number="4" title="Listings &amp; Content Rules">
              <p>When posting listings or any other content on House9ja, you agree that:</p>
              <ul>
                <li>All listings must represent real, legally available properties. Fictitious or duplicate listings are strictly prohibited.</li>
                <li>Photos, descriptions, and pricing must be accurate and not misleading. Photos must be of the actual property being listed.</li>
                <li>You must have the legal right or authority to list the property (as owner or duly authorised agent).</li>
                <li>Listings must not contain offensive, discriminatory, or unlawful language.</li>
                <li>You must promptly remove or update listings that are no longer available.</li>
                <li>We reserve the right to remove any listing that violates these rules without notice.</li>
              </ul>
            </Section>

            <Section number="5" title="Payments &amp; Transactions Disclaimer">
              <p>
                House9ja is a <strong>listings and connection platform only</strong>. We do not process rental payments, hold deposits, or act
                as a party to any rental agreement between users. All financial transactions are conducted directly between the
                Tenant and the Landlord or Agent.
              </p>
              <p>
                <strong>We are not liable</strong> for any payment disputes, loss of money, failed transactions, or fraud arising from deals
                arranged through the Platform. You are strongly advised to verify property ownership and inspect a property in
                person before making any payment. Never pay rent or deposits into unverified accounts.
              </p>
            </Section>

            <Section number="6" title="Verification Disclaimer">
              <p>
                House9ja offers optional identity and landlord verification features. While we make reasonable efforts to verify
                submitted documents, a verified badge <strong>does not constitute a guarantee</strong> of a user&rsquo;s identity,
                ownership of a property, or the accuracy of any listing.
              </p>
              <p>
                Users should not rely solely on a verification badge when making rental decisions. Always conduct independent checks
                and exercise personal judgement before committing to a rental agreement.
              </p>
            </Section>

            <Section number="7" title="Prohibited Activities">
              <p>You must not, under any circumstances:</p>
              <ul>
                <li><strong>Fraud &amp; Scams:</strong> Impersonate another person, create fake identities, or misrepresent your ownership of or authority over a property.</li>
                <li><strong>Fake Listings:</strong> Post listings for properties you do not own or are not authorised to list, or properties that do not exist.</li>
                <li><strong>Harassment:</strong> Harass, threaten, abuse, or intimidate any other user, whether through the messaging system or any other means.</li>
                <li><strong>Spam:</strong> Send unsolicited or repetitive messages to other users, or use the Platform to advertise third-party services without our consent.</li>
                <li><strong>Data Scraping:</strong> Scrape, crawl, or collect data from the Platform using automated means.</li>
                <li><strong>Illegal Content:</strong> Post content that is defamatory, obscene, discriminatory, or otherwise unlawful under Nigerian law.</li>
                <li><strong>Platform Abuse:</strong> Attempt to disrupt, hack, or interfere with the Platform&rsquo;s security, infrastructure, or other users&rsquo; access.</li>
                <li><strong>Money Laundering:</strong> Use House9ja in connection with any unlawful financial activity.</li>
              </ul>
              <p>Violation of any of the above may result in immediate account termination and, where appropriate, reporting to law enforcement.</p>
            </Section>

            <Section number="8" title="Account Suspension &amp; Termination">
              <p>We reserve the right, at our sole discretion, to:</p>
              <ul>
                <li>Suspend or permanently delete your account if you breach these Terms or engage in any prohibited activity.</li>
                <li>Remove any content that violates these Terms without prior notice.</li>
                <li>Take legal action where necessary to protect the Platform and its users.</li>
              </ul>
              <p>
                If your account is suspended or deleted as a result of a Terms violation, you will be notified by email.
                You may contact <a href="mailto:support@house9ja.com" className="text-blue-600 hover:underline">support@house9ja.com</a> to
                appeal the decision. You also have the right to request deletion of your own account at any time.
              </p>
            </Section>

            <Section number="9" title="User-Generated Content">
              <p>
                By submitting content to House9ja — including property listings, photos, messages, and reviews — you grant us a
                non-exclusive, royalty-free, worldwide licence to display and distribute that content on the Platform for the
                purpose of providing our services.
              </p>
              <p>
                You retain ownership of your content. You represent that you have all necessary rights to submit the content and
                that it does not infringe any third-party intellectual property rights.
              </p>
              <p>
                We do not endorse user-generated content and are not responsible for its accuracy or legality.
              </p>
            </Section>

            <Section number="10" title="Privacy">
              <p>
                Your use of House9ja is also governed by our Privacy Policy, which explains how we collect, use, and protect your
                personal data. By using the Platform you consent to the practices described in the Privacy Policy.
              </p>
            </Section>

            <Section number="11" title="Limitation of Liability">
              <p>
                To the fullest extent permitted by applicable Nigerian law, House9ja and its officers, employees, and affiliates
                shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in
                connection with:
              </p>
              <ul>
                <li>Your use of or inability to use the Platform.</li>
                <li>Any transaction, agreement, or dispute between users.</li>
                <li>Loss of data, revenue, or property resulting from reliance on Platform content.</li>
                <li>Unauthorised access to your account by a third party.</li>
              </ul>
              <p>
                Our total liability to you for any claim arising from these Terms shall not exceed the amount (if any) you paid
                to use the Platform in the three months preceding the claim.
              </p>
            </Section>

            <Section number="12" title="Changes to Terms">
              <p>
                We may update these Terms from time to time to reflect changes in our services, technology, or legal requirements.
                When we make material changes we will notify registered users by email and update the Effective Date at the top
                of this page.
              </p>
              <p>
                Continued use of the Platform after updated Terms are published constitutes your acceptance of the revised Terms.
                If you do not agree with the changes, you must stop using the Platform and may request account deletion.
              </p>
            </Section>

            <Section number="13" title="Governing Law">
              <p>
                These Terms are governed by and construed in accordance with the laws of the Federal Republic of Nigeria.
                Any disputes arising from these Terms shall be subject to the exclusive jurisdiction of the courts of Nigeria.
              </p>
            </Section>

            <div className="mt-10 rounded-xl border border-slate-200 bg-slate-50 px-6 py-5">
              <p className="text-sm font-semibold text-slate-800 mb-1">Contact Us</p>
              <p className="text-sm text-slate-600">
                If you have questions about these Terms, please contact us at{' '}
                <a href="mailto:support@house9ja.com" className="text-blue-600 hover:underline font-medium">support@house9ja.com</a>.
              </p>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} House9ja Technology Ltd. All rights reserved.
        </p>
      </main>
    </div>
  )
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2>
        <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">{number}</span>
        {title}
      </h2>
      {children}
    </div>
  )
}

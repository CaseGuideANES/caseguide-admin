export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Privacy Policy for CaseGuide</h1>
        <p className="mt-1 text-sm italic text-slate-500">Last updated: May 5, 2026</p>

        <div className="mt-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">1. Introduction</h2>
            <p>CaseGuide (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Edward Punzalan. This privacy policy explains how we collect, use, and protect your information when you use our mobile application.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">2. Information We Collect</h2>
            <p>We collect the following personal information when you register and use CaseGuide: name, email address, and professional credentials. We also collect content you create within the app, including anesthesia guides, notes, uploaded photos, and references.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">3. How We Use Your Information</h2>
            <p>We use your information to provide and maintain the app, authenticate your account, track AI feature usage limits, and improve our services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">4. Third-Party Services</h2>
            <p><span className="font-semibold">Supabase:</span> We use Supabase to store and manage your account data and app content securely in the cloud.</p>
            <p className="mt-2"><span className="font-semibold">OpenAI:</span> When you use the AI guide generation feature, the notes you enter are sent to OpenAI&apos;s API (GPT-4o-mini) to generate structured anesthesia guides. You are not required to include any personal information in these notes. OpenAI may retain submitted data per their own privacy policy, available at openai.com/privacy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">5. Data Storage and Security</h2>
            <p>Your data is stored securely using Supabase cloud infrastructure. We implement reasonable security measures to protect your information.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">6. Data Retention</h2>
            <p>We retain your data for as long as your account is active. You may request deletion of your account and data by contacting us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">7. Contact Us</h2>
            <p>For privacy-related questions, contact us at: <a href="mailto:caseguideapp@gmail.com" className="text-blue-600 hover:underline">caseguideapp@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}

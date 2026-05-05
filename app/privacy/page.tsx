export default function PrivacyPolicy() {
  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px", fontFamily: "Arial, sans-serif", lineHeight: 1.7 }}>
      <h1>Privacy Policy for CaseGuide</h1>
      <p><em>Last updated: May 5, 2026</em></p>

      <h2>1. Introduction</h2>
      <p>CaseGuide (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is operated by Edward Punzalan. This privacy policy explains how we collect, use, and protect your information when you use our mobile application.</p>

      <h2>2. Information We Collect</h2>
      <p>We collect the following personal information when you register and use CaseGuide: name, email address, and professional credentials. We also collect content you create within the app, including anesthesia guides, notes, uploaded photos, and references.</p>

      <h2>3. How We Use Your Information</h2>
      <p>We use your information to provide and maintain the app, authenticate your account, track AI feature usage limits, and improve our services.</p>

      <h2>4. Third-Party Services</h2>
      <p><strong>Supabase:</strong> We use Supabase to store and manage your account data and app content securely in the cloud.</p>
      <p><strong>OpenAI:</strong> When you use the AI guide generation feature, the notes you enter are sent to OpenAI&apos;s API (GPT-4o-mini) to generate structured anesthesia guides. You are not required to include any personal information in these notes. OpenAI may retain submitted data per their own privacy policy, available at openai.com/privacy.</p>

      <h2>5. Data Storage and Security</h2>
      <p>Your data is stored securely using Supabase cloud infrastructure. We implement reasonable security measures to protect your information.</p>

      <h2>6. Data Retention</h2>
      <p>We retain your data for as long as your account is active. You may request deletion of your account and data by contacting us.</p>

      <h2>7. Contact Us</h2>
      <p>For privacy-related questions, contact us at: punzzled@yahoo.com</p>
    </main>
  );
}

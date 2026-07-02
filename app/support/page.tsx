export default function Support() {
  return (
    <div className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-2xl rounded-3xl border border-slate-200 bg-white p-10 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">CaseGuide Support</h1>
        <p className="mt-1 text-sm italic text-slate-500">We&apos;re here to help.</p>

        <div className="mt-8 space-y-6 text-sm text-slate-700 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Contact Us</h2>
            <p>
              For any questions, issues, or feedback, please reach out to us at:{' '}
              <a href="mailto:caseguideapp@gmail.com" className="text-blue-600 hover:underline">
                caseguideapp@gmail.com
              </a>
            </p>
            <p className="mt-2">We typically respond within 1–2 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-slate-900 mb-2">Common Questions</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-slate-800">How do I join a group?</p>
                <p className="mt-1">You need an invite code from your group administrator. Enter it on the &quot;Enter Invite Code&quot; screen after signing in.</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">How do I reset my password?</p>
                <p className="mt-1">On the sign-in screen, tap &quot;Forgot Password&quot; and enter your email address. You will receive a link to reset your password.</p>
              </div>
              <div>
                <p className="font-medium text-slate-800">How do I request deletion of my account?</p>
                <p className="mt-1">
                  Email us at{' '}
                  <a href="mailto:caseguideapp@gmail.com" className="text-blue-600 hover:underline">
                    caseguideapp@gmail.com
                  </a>{' '}
                  with your request and we will delete your account and data promptly.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function Marketing() {
  const videoUrl =
    'https://khmwerrrjfgcjxyglida.supabase.co/storage/v1/object/public/marketing/promo.mp4';

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-6 pt-20 pb-12 text-center">
        <h1 className="text-5xl font-extrabold tracking-tight">CaseGuide</h1>
        <p className="mt-4 max-w-xl text-lg text-slate-300">
          Anesthesia case preparation, streamlined. Build and share guides with your team — fast.
        </p>

        <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
          <a
            href="https://apps.apple.com/app/id6762662640"
            className="rounded-2xl bg-white px-8 py-3 text-base font-semibold text-black shadow hover:bg-slate-100 transition"
          >
            Download on the App Store
          </a>
          <a
            href="https://play.google.com/store/apps/details?id=com.epunzalan.anesthesiaapp"
            className="rounded-2xl border border-white px-8 py-3 text-base font-semibold text-white hover:bg-white hover:text-black transition"
          >
            Get it on Google Play
          </a>
        </div>
      </div>

      {/* Video */}
      <div className="flex justify-center px-6 pb-20">
        <video
          src={videoUrl}
          controls
          playsInline
          className="w-full max-w-2xl rounded-3xl shadow-2xl"
        />
      </div>

      {/* Features */}
      <div className="border-t border-slate-800 px-6 py-16">
        <div className="mx-auto grid max-w-4xl gap-10 sm:grid-cols-3">
          <div className="text-center">
            <div className="text-3xl mb-3">📋</div>
            <h3 className="text-lg font-semibold">AI-Generated Guides</h3>
            <p className="mt-2 text-sm text-slate-400">
              Enter your case notes and get a structured anesthesia guide in seconds.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold">Team Collaboration</h3>
            <p className="mt-2 text-sm text-slate-400">
              Share guides across your group and keep everyone on the same page.
            </p>
          </div>
          <div className="text-center">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-lg font-semibold">Mobile First</h3>
            <p className="mt-2 text-sm text-slate-400">
              Access your guides anywhere — in the OR, on rounds, or on the go.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-800 px-6 py-8 text-center text-sm text-slate-500">
        <div className="flex justify-center gap-6">
          <a href="/privacy" className="hover:text-white transition">Privacy Policy</a>
          <a href="/support" className="hover:text-white transition">Support</a>
        </div>
        <p className="mt-4">&copy; {new Date().getFullYear()} CaseGuide. All rights reserved.</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          CaseGuide Admin
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
          Dashboard
        </h1>
        <p className="mt-2 max-w-2xl text-slate-600">
          Manage hospital-specific case guides, invite teammates, and control
          user roles from one secure admin console.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="premium-card p-6">
          <p className="text-sm font-semibold text-slate-500">Guides</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Manage</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Create, edit, and review anesthesia workflow guides for your group.
          </p>
        </div>

        <div className="premium-card p-6">
          <p className="text-sm font-semibold text-slate-500">Users</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Roles</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Control access levels for admins, editors, and viewers.
          </p>
        </div>

        <div className="premium-card p-6">
          <p className="text-sm font-semibold text-slate-500">Invites</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-950">Codes</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            Generate invite codes for trusted members of your team.
          </p>
        </div>
      </div>

      <div className="premium-card p-6">
        <h2 className="text-xl font-bold text-slate-950">
          Admin workspace is live
        </h2>
        <p className="mt-2 text-slate-600">
          Your mobile app and web interface are connected to the same Supabase
          backend, so changes made here can support your production workflow.
        </p>
      </div>
    </div>
  );
}
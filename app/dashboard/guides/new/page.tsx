'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { supabase } from '../../../../src/lib/supabase/client';

export default function NewGuidePage() {
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [hospital, setHospital] = useState('');
  const [authorName, setAuthorName] = useState('');
  const [authorTitle, setAuthorTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [induction, setInduction] = useState('');
  const [maintenance, setMaintenance] = useState('');
  const [medications, setMedications] = useState('');
  const [equipment, setEquipment] = useState('');
  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  async function createGuide() {
    setMessage('');

    if (!title.trim()) {
      setMessage('Error: Guide title is required.');
      return;
    }

    if (!hospital.trim()) {
      setMessage('Error: Hospital is required.');
      return;
    }

    setSaving(true);

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setMessage('Error: You must be signed in.');
      setSaving(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('group_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.group_id) {
      setMessage('Error: Your account is not assigned to a group.');
      setSaving(false);
      return;
    }

    const referenceLinks =
      referenceTitle || referenceUrl
        ? [{ title: referenceTitle || '', url: referenceUrl || '' }]
        : [];

    const { error } = await supabase.from('guides').insert({
      title: title.trim(),
      hospital: hospital.trim(),
      author_name: authorName || '',
      author_title: authorTitle || '',
      summary: summary || '',
      induction: induction || '',
      maintenance: maintenance || '',
      medications: medications || '',
      equipment: equipment || '',
      reference_links: referenceLinks,
      note_images: [],
      group_id: profile.group_id,
      created_by: user.id,
    });

    setSaving(false);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setMessage('Guide created successfully');

    setTimeout(() => {
      router.push('/dashboard/guides');
    }, 1000);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold">Add Guide</h1>

      {message && (
        <div
          className={`mb-4 rounded p-3 ${
            message.startsWith('Error')
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}
        >
          {message}
        </div>
      )}

      <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Guide Title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Hospital" value={hospital} onChange={(e) => setHospital(e.target.value)} />

      <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Author Name" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
      <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Author Title" value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} />

      <textarea className="mb-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} />
      <textarea className="mb-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Induction" value={induction} onChange={(e) => setInduction(e.target.value)} />
      <textarea className="mb-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Maintenance" value={maintenance} onChange={(e) => setMaintenance(e.target.value)} />
      <textarea className="mb-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Medications" value={medications} onChange={(e) => setMedications(e.target.value)} />
      <textarea className="mb-3 min-h-24 w-full rounded border px-3 py-2" placeholder="Equipment" value={equipment} onChange={(e) => setEquipment(e.target.value)} />

      <input className="mb-3 w-full rounded border px-3 py-2" placeholder="Reference Title optional" value={referenceTitle} onChange={(e) => setReferenceTitle(e.target.value)} />
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="Reference URL optional" value={referenceUrl} onChange={(e) => setReferenceUrl(e.target.value)} />

      <button
        onClick={createGuide}
        disabled={saving}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-60"
      >
        {saving ? 'Saving...' : 'Save Guide'}
      </button>
    </div>
  );
}
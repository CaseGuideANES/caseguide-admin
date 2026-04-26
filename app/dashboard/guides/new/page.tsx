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

  async function createGuide() {
    setMessage('');

    const referenceLinks =
      referenceTitle || referenceUrl
        ? [{ title: referenceTitle || '', url: referenceUrl || '' }]
        : [];

    const { error } = await supabase
      .from('guides')
      .insert({
        title: title || '',
        hospital: hospital || '',
        author_name: authorName || '',
        author_title: authorTitle || '',
        author: authorName || '',
        summary: summary || '',
        induction: induction || '',
        maintenance: maintenance || '',
        medications: medications || '',
        equipment: equipment || '',
        reference_links: referenceLinks,
        note_images: [],
      });

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
        <div className="mb-4 rounded bg-green-100 p-3 text-green-700">
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

      <button onClick={createGuide} className="rounded bg-black px-4 py-2 text-white">
        Save Guide
      </button>
    </div>
  );
}
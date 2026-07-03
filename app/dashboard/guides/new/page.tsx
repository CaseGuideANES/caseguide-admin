'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BulletTextarea from '../../../../src/components/BulletTextarea';
import HospitalInput from '../../../../src/components/HospitalInput';
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
  const [notes, setNotes] = useState('');
  const [aiNotes, setAiNotes] = useState('');
  const [referenceLinks, setReferenceLinks] = useState<{ title: string; url: string }[]>([]);
  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [aiUsage, setAiUsage] = useState<{ count: number; limit: number } | null>(null);
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data.user?.id;
      if (!userId) return;
      supabase
        .from('profiles')
        .select('full_name, title')
        .eq('id', userId)
        .single()
        .then(({ data: profile }) => {
          if (profile?.full_name) setAuthorName(profile.full_name);
          if (profile?.title) setAuthorTitle(profile.title);
        });
    });
  }, []);

  function addReference() {
    const cleanTitle = referenceTitle.trim();
    const cleanUrl = referenceUrl.trim();
    if (!cleanTitle || !cleanUrl) {
      setMessage('Error: Enter both a reference title and URL.');
      return;
    }
    setReferenceLinks((current) => [...current, { title: cleanTitle, url: cleanUrl }]);
    setReferenceTitle('');
    setReferenceUrl('');
    setMessage('');
  }

  function removeReference(index: number) {
    setReferenceLinks((current) => current.filter((_, i) => i !== index));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    const newPending = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPendingImages((prev) => [...prev, ...newPending]);

    // Reset input so the same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePendingImage(index: number) {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  function resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        const maxSize = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) { height = Math.round((height * maxSize) / width); width = maxSize; }
        } else {
          if (height > maxSize) { width = Math.round((width * maxSize) / height); height = maxSize; }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) { reject(new Error('Could not get canvas context')); return; }
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error('Could not convert image')); return; }
            resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.75
        );
      };

      img.onerror = () => reject(new Error('Invalid image file'));
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });
  }

  async function generateWithAI() {
    if (!aiNotes.trim()) {
      setMessage('Error: Enter some notes for the AI to generate from.');
      return;
    }

    setGenerating(true);
    setMessage('');

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        setMessage('Error: You must be signed in.');
        return;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-guide`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ title, hospital, notes: aiNotes }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        setMessage(`Error: ${data.error ?? 'AI generation failed.'}`);
        return;
      }

      setSummary(data.summary ?? '');
      setInduction(data.induction ?? '');
      setMaintenance(data.maintenance ?? '');
      setMedications(data.medications ?? '');
      setEquipment(data.equipment ?? '');
      setNotes(data.notes ?? '');

      if (Array.isArray(data.references) && data.references.length > 0) {
        setReferenceLinks(data.references.map((r: any) => ({ title: r.title ?? '', url: r.url ?? '' })));
      }

      setAiUsage({ count: data.ai_usage_count, limit: data.ai_usage_limit });
      setMessage('Guide generated successfully.');
    } catch {
      setMessage('Error: Could not reach AI service.');
    } finally {
      setGenerating(false);
    }
  }

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
      .select('group_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.group_id) {
      setMessage('Error: Your account is not assigned to a group.');
      setSaving(false);
      return;
    }

    if (profile.role !== 'editor' && profile.role !== 'admin' && profile.role !== 'super_admin') {
      setMessage('Error: Only editors and admins can create guides.');
      setSaving(false);
      return;
    }

    // Insert guide and return the new ID
    const { data: newGuide, error: insertError } = await supabase
      .from('guides')
      .insert({
        title: title.trim(),
        hospital: hospital.trim(),
        author_name: authorName || '',
        author_title: authorTitle || '',
        summary: summary || '',
        induction: induction || '',
        maintenance: maintenance || '',
        medications: medications || '',
        equipment: equipment || '',
        notes: notes || '',
        reference_links: referenceLinks,
        note_images: [],
        group_id: profile.group_id,
        created_by: user.id,
      })
      .select('id')
      .single();

    if (insertError || !newGuide) {
      setMessage(`Error: ${insertError?.message ?? 'Could not create guide.'}`);
      setSaving(false);
      return;
    }

    const guideId = newGuide.id;

    // Upload any pending images
    if (pendingImages.length > 0) {
      const uploadedImages: { path: string; caption: string }[] = [];

      for (const pending of pendingImages) {
        try {
          const resized = await resizeImage(pending.file);
          const filePath = `guides/${guideId}/${Date.now()}-${resized.name}`;

          const { error: uploadError } = await supabase.storage
            .from('guide-images')
            .upload(filePath, resized, { contentType: 'image/jpeg', upsert: false });

          if (uploadError) {
            setMessage(`Error: Image upload failed: ${uploadError.message}`);
            setSaving(false);
            return;
          }

          uploadedImages.push({ path: filePath, caption: '' });
        } catch (err: any) {
          setMessage(`Error: Image resize failed: ${err.message}`);
          setSaving(false);
          return;
        }
      }

      // Patch the guide with image paths
      const { error: patchError } = await supabase
        .from('guides')
        .update({ note_images: uploadedImages })
        .eq('id', guideId);

      if (patchError) {
        setMessage(`Error: Could not save images: ${patchError.message}`);
        setSaving(false);
        return;
      }
    }

    setSaving(false);
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

      <label className="mb-1 block text-sm font-semibold text-gray-700">Guide Title</label>
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="Example: Pediatric MRI" value={title} onChange={(e) => setTitle(e.target.value)} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Hospital</label>
      <div className="mb-4">
        <HospitalInput
          className="w-full rounded border px-3 py-2"
          placeholder="Example: Joe DiMaggio Children's Hospital"
          value={hospital}
          onChange={setHospital}
        />
      </div>

      <label className="mb-1 block text-sm font-semibold text-gray-700">Author Name</label>
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="Example: John Smith" value={authorName} onChange={(e) => setAuthorName(e.target.value)} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Author Title</label>
      <input className="mb-4 w-full rounded border px-3 py-2" placeholder="Example: CRNA, MD, Anesthesiologist" value={authorTitle} onChange={(e) => setAuthorTitle(e.target.value)} />

      {/* AI Generation */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="mb-2 text-sm font-semibold text-blue-800">Generate with AI</p>
        <p className="mb-3 text-xs text-blue-600">Enter notes about the case and click Generate. Fields below will be filled in automatically.</p>
        <BulletTextarea
          className="mb-3 min-h-28 w-full rounded border px-3 py-2 text-sm"
          placeholder="Paste rough notes, pearls, workflow reminders, medications, setup details, etc."
          value={aiNotes}
          onChange={setAiNotes}
        />
        <button
          onClick={generateWithAI}
          disabled={generating}
          className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {generating ? 'Generating...' : '✨ Generate with AI'}
        </button>
        {aiUsage && (
          <p className={`mt-2 text-xs ${aiUsage.count / aiUsage.limit > 0.8 ? 'text-red-600' : 'text-blue-600'}`}>
            {aiUsage.count}/{aiUsage.limit} AI uses this month
          </p>
        )}
      </div>

      <label className="mb-1 block text-sm font-semibold text-gray-700">Summary</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="Short overview of what this guide covers" value={summary} onChange={setSummary} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Induction</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="How you typically induce this case" value={induction} onChange={setInduction} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Maintenance</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="Typical maintenance plan" value={maintenance} onChange={setMaintenance} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Medications</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="Common meds and reminders" value={medications} onChange={setMedications} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Equipment</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="Special setup or equipment notes" value={equipment} onChange={setEquipment} />

      <label className="mb-1 block text-sm font-semibold text-gray-700">Notes</label>
      <BulletTextarea className="mb-4 min-h-24 w-full rounded border px-3 py-2" placeholder="Final notes that will be saved with this guide" value={notes} onChange={setNotes} />

      {/* References */}
      <div className="mb-6">
        <p className="mb-2 text-sm font-medium text-gray-700">References</p>
        {referenceLinks.map((ref, index) => (
          <div key={index} className="mb-2 flex items-start gap-2 rounded border bg-gray-50 p-3">
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">{ref.title}</p>
              <p className="text-xs text-gray-500 break-all">{ref.url}</p>
            </div>
            <button onClick={() => removeReference(index)} className="shrink-0 text-sm text-red-600 hover:text-red-800">
              Remove
            </button>
          </div>
        ))}
        <input
          className="mb-2 w-full rounded border px-3 py-2 text-sm"
          placeholder="Reference Title"
          value={referenceTitle}
          onChange={(e) => setReferenceTitle(e.target.value)}
        />
        <input
          className="mb-2 w-full rounded border px-3 py-2 text-sm"
          placeholder="Reference URL"
          value={referenceUrl}
          onChange={(e) => setReferenceUrl(e.target.value)}
        />
        <button
          onClick={addReference}
          className="rounded border px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100"
        >
          + Add Reference
        </button>
      </div>

      {/* Images */}
      <div className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Note Images</h2>

        {pendingImages.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {pendingImages.map((img, index) => (
              <div key={index} className="rounded border p-2">
                <img src={img.previewUrl} alt={`Preview ${index + 1}`} className="mb-2 h-40 w-full rounded object-cover" />
                <button
                  type="button"
                  onClick={() => removePendingImage(index)}
                  className="rounded bg-red-600 px-3 py-1 text-sm text-white"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="block"
        />
        <p className="mt-1 text-xs text-gray-400">Images are resized and uploaded when the guide is saved.</p>
      </div>

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

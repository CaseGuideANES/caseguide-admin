'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import BulletTextarea from '../../../../../src/components/BulletTextarea';
import HospitalInput from '../../../../../src/components/HospitalInput';
import { supabase } from '../../../../../src/lib/supabase/client';

export default function EditGuidePage() {
  const router = useRouter();
  const params = useParams();
  const guideId = params.id as string;

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
  const [noteImages, setNoteImages] = useState<{ path: string; caption: string; displayUrl: string }[]>([]);
  const [pendingImages, setPendingImages] = useState<{ file: File; previewUrl: string }[]>([]);
  const [message, setMessage] = useState('');
  const [generating, setGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchGuide();
  }, []);

  async function fetchGuide() {
    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) {
      setMessage(`Error loading guide: ${error.message}`);
      return;
    }

    setTitle(data.title || '');
    setHospital(data.hospital || '');
    setAuthorName(data.author_name || data.author || '');
    setAuthorTitle(data.author_title || '');
    setSummary(data.summary || '');
    setInduction(data.induction || '');
    setMaintenance(data.maintenance || '');
    setMedications(data.medications || '');
    setEquipment(data.equipment || '');
    setNotes(data.notes || '');

    const rawImages = Array.isArray(data.note_images) ? data.note_images : [];

    const images = await Promise.all(
      rawImages.map(async (img: any) => {
        if (typeof img === 'string') {
          return { path: '', caption: '', displayUrl: img };
        }

        if (img?.path) {
          const { data: signedData, error: signedError } = await supabase.storage
            .from('guide-images')
            .createSignedUrl(img.path, 60 * 60);

          if (signedError) {
            console.error('Signed URL error:', signedError.message);
            return null;
          }

          return { path: img.path, caption: img.caption ?? '', displayUrl: signedData.signedUrl };
        }

        return null;
      })
    );

    setNoteImages(images.filter(Boolean) as { path: string; caption: string; displayUrl: string }[]);

    const rawRefs = Array.isArray(data.reference_links) ? data.reference_links : [];
    setReferenceLinks(rawRefs.map((r: any) => ({ title: r.title ?? '', url: r.url ?? '' })));
  }

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

  function resizeImage(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (event) => {
        img.src = event.target?.result as string;
      };

      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 1200;

        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not resize image'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Could not convert image'));
              return;
            }

            const resizedFile = new File(
              [blob],
              file.name.replace(/\.[^/.]+$/, '.jpg'),
              {
                type: 'image/jpeg',
              }
            );

            resolve(resizedFile);
          },
          'image/jpeg',
          0.75
        );
      };

      img.onerror = () => reject(new Error('Invalid image file'));
      reader.onerror = () => reject(new Error('Could not read image'));

      reader.readAsDataURL(file);
    });
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newPending = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setPendingImages((prev) => [...prev, ...newPending]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function removePendingImage(index: number) {
    setPendingImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function updateGuide() {
    setMessage('');

    // Upload any pending images
    const newImages: { path: string; caption: string; displayUrl: string }[] = [];

    for (const pending of pendingImages) {
      try {
        const resized = await resizeImage(pending.file);
        const filePath = `guides/${guideId}/${Date.now()}-${resized.name}`;

        const { error: uploadError } = await supabase.storage
          .from('guide-images')
          .upload(filePath, resized, { contentType: 'image/jpeg', upsert: false });

        if (uploadError) {
          setMessage(`Error: Upload error: ${uploadError.message}`);
          return;
        }

        const { data: signedData, error: signedError } = await supabase.storage
          .from('guide-images')
          .createSignedUrl(filePath, 60 * 60);

        if (signedError) {
          setMessage(`Error: Signed URL error: ${signedError.message}`);
          return;
        }

        newImages.push({ path: filePath, caption: '', displayUrl: signedData.signedUrl });
      } catch (err: any) {
        setMessage(`Error: Image resize error: ${err.message}`);
        return;
      }
    }

    const updatedImages = [...noteImages, ...newImages];

    // Save only { path, caption } to DB — mobile app expects this format
    const dbImages = updatedImages.map(({ path, caption }) => ({ path, caption }));

    const { error } = await supabase
      .from('guides')
      .update({
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
        notes: notes || '',
        reference_links: referenceLinks,
        note_images: dbImages,
      })
      .eq('id', guideId);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setNoteImages(updatedImages);
    setPendingImages([]);
    setMessage('Guide updated successfully');

    setTimeout(() => {
      router.push('/dashboard/guides');
    }, 1000);
  }

  async function deleteGuide() {
    const confirmed = confirm('Are you sure you want to delete this guide?');

    if (!confirmed) return;

    const { error } = await supabase
      .from('guides')
      .delete()
      .eq('id', guideId);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    router.push('/dashboard/guides');
  }

  function removeImage(indexToRemove: number) {
    setNoteImages(noteImages.filter((_, index) => index !== indexToRemove));
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Edit Guide</h1>

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
        <p className="mb-3 text-xs text-blue-600">Enter notes and click Generate to overwrite the fields below.</p>
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

      <div className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Note Images</h2>

        {(noteImages.length > 0 || pendingImages.length > 0) ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {noteImages.map((image, index) => (
              <div key={`saved-${index}`} className="rounded border p-2">
                <img src={image.displayUrl} alt={`Guide image ${index + 1}`} className="mb-2 h-40 w-full rounded object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                  Remove
                </button>
              </div>
            ))}
            {pendingImages.map((img, index) => (
              <div key={`pending-${index}`} className="rounded border border-dashed border-blue-300 p-2">
                <img src={img.previewUrl} alt={`New image ${index + 1}`} className="mb-2 h-40 w-full rounded object-cover opacity-80" />
                <p className="mb-1 text-xs text-blue-500">Pending upload</p>
                <button type="button" onClick={() => removePendingImage(index)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-500">No images yet.</p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageSelect}
          className="block"
        />
        <p className="mt-1 text-xs text-gray-400">Images are resized and uploaded when you save changes.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={updateGuide} className="rounded bg-slate-800 px-4 py-2 text-white">
          Save Changes
        </button>

        <button onClick={deleteGuide} className="rounded bg-red-600 px-4 py-2 text-white">
          Delete Guide
        </button>
      </div>
    </div>
  );
}

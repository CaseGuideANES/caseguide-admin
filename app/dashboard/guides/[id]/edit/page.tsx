'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
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
  const [referenceTitle, setReferenceTitle] = useState('');
  const [referenceUrl, setReferenceUrl] = useState('');
  const [noteImages, setNoteImages] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [message, setMessage] = useState('');

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
    setNoteImages(data.note_images || []);

    const firstReference = data.reference_links?.[0];
    setReferenceTitle(firstReference?.title || '');
    setReferenceUrl(firstReference?.url || '');
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

  async function uploadImage(): Promise<string | null> {
    if (!imageFile) return null;

    try {
      const resizedFile = await resizeImage(imageFile);

      const filePath = `guides/${guideId}/${Date.now()}-${resizedFile.name}`;

      const { error } = await supabase.storage
        .from('guide-images')
        .upload(filePath, resizedFile, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (error) {
        setMessage(`Upload error: ${error.message}`);
        return null;
      }

      const { data } = supabase.storage
        .from('guide-images')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (err: any) {
      setMessage(`Image resize error: ${err.message}`);
      return null;
    }
  }

  async function updateGuide() {
    setMessage('');

    let imageUrl: string | null = null;

    if (imageFile) {
      imageUrl = await uploadImage();

      if (!imageUrl) return;
    }

    const referenceLinks =
      referenceTitle || referenceUrl
        ? [{ title: referenceTitle || '', url: referenceUrl || '' }]
        : [];

    const updatedImages = imageUrl ? [...noteImages, imageUrl] : noteImages;

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
        reference_links: referenceLinks,
        note_images: updatedImages,
      })
      .eq('id', guideId);

    if (error) {
      setMessage(`Error: ${error.message}`);
      return;
    }

    setNoteImages(updatedImages);
    setImageFile(null);
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
    const updated = noteImages.filter((_, index) => index !== indexToRemove);
    setNoteImages(updated);
  }

  return (
    <div className="max-w-3xl">
      <h1 className="mb-6 text-2xl font-semibold text-slate-800">Edit Guide</h1>

      {message && (
        <div className="mb-4 rounded bg-emerald-100 p-3 text-emerald-800">
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

      <div className="mb-6 rounded border bg-white p-4">
        <h2 className="mb-3 font-semibold text-slate-800">Note Images</h2>

        {noteImages.length > 0 ? (
          <div className="mb-4 grid grid-cols-2 gap-3">
            {noteImages.map((imageUrl, index) => (
              <div key={index} className="rounded border p-2">
                <img src={imageUrl} alt={`Guide image ${index + 1}`} className="mb-2 h-40 w-full rounded object-cover" />
                <button type="button" onClick={() => removeImage(index)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 text-sm text-gray-500">No images yet.</p>
        )}

        <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] || null)} className="block" />

        {imageFile && (
          <p className="mt-2 text-sm text-gray-600">
            Selected: {imageFile.name}
          </p>
        )}
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
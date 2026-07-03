'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '../../../../src/lib/supabase/client';

type ReferenceLink = { title: string; url: string };
type NoteImage = { path: string; caption: string; displayUrl: string };

type Guide = {
  id: string;
  title: string;
  hospital: string;
  author_name: string | null;
  author_title: string | null;
  summary: string | null;
  induction: string | null;
  maintenance: string | null;
  medications: string | null;
  equipment: string | null;
  notes: string | null;
  reference_links: ReferenceLink[];
  note_images: NoteImage[];
  created_at: string | null;
};

function Section({ title, content }: { title: string; content: string | null }) {
  return (
    <div className="premium-card p-6">
      <h2 className="mb-2 font-semibold text-slate-900">{title}</h2>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-600">
        {content?.trim() ? content : 'No details added yet.'}
      </p>
    </div>
  );
}

export default function GuideViewPage() {
  const router = useRouter();
  const params = useParams();
  const guideId = params.id as string;

  const [guide, setGuide] = useState<Guide | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    checkAdmin();
    fetchGuide();
  }, []);

  async function checkAdmin() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    setIsAdmin(data?.role === 'admin' || data?.role === 'super_admin');
  }

  async function fetchGuide() {
    setLoading(true);

    const { data, error } = await supabase
      .from('guides')
      .select('*')
      .eq('id', guideId)
      .single();

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

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

          if (signedError) return null;

          return { path: img.path, caption: img.caption ?? '', displayUrl: signedData.signedUrl };
        }

        return null;
      })
    );

    setGuide({
      ...data,
      reference_links: Array.isArray(data.reference_links) ? data.reference_links : [],
      note_images: images.filter(Boolean) as NoteImage[],
    });

    setLoading(false);
  }

  async function confirmDelete() {
    if (!guide) return;

    setDeleting(true);

    const { error } = await supabase.from('guides').delete().eq('id', guide.id);

    setDeleting(false);

    if (error) {
      alert(error.message);
      return;
    }

    router.push('/dashboard/guides');
  }

  if (loading) {
    return <p className="text-sm text-slate-500">Loading guide...</p>;
  }

  if (error || !guide) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
        {error || 'Guide not found.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link href="/dashboard/guides" className="text-sm font-medium text-blue-600 hover:underline">
            &larr; Back to Guides
          </Link>

          <h1 className="mt-2 text-3xl font-bold text-slate-950">{guide.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
              {guide.hospital}
            </span>

            {guide.author_name && (
              <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                {guide.author_name}
                {guide.author_title ? `, ${guide.author_title}` : ''}
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <Link href={`/dashboard/guides/${guide.id}/edit`} className="soft-button text-sm">
            Edit
          </Link>

          {isAdmin && (
            <button onClick={() => setConfirmingDelete(true)} className="danger-button text-sm">
              Delete
            </button>
          )}
        </div>
      </div>

      <Section title="Summary" content={guide.summary} />
      <Section title="Induction" content={guide.induction} />
      <Section title="Maintenance" content={guide.maintenance} />
      <Section title="Medications" content={guide.medications} />
      <Section title="Equipment" content={guide.equipment} />
      <Section title="Notes" content={guide.notes} />

      <div className="premium-card p-6">
        <h2 className="mb-3 font-semibold text-slate-900">References</h2>

        {guide.reference_links.length > 0 ? (
          <div className="space-y-2">
            {guide.reference_links.map((ref, index) => (
              <a
                key={index}
                href={ref.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-xl border border-slate-200 bg-slate-50 p-3 hover:bg-slate-100"
              >
                <p className="text-sm font-semibold text-slate-900">{ref.title}</p>
                <p className="break-all text-xs text-blue-600">{ref.url}</p>
              </a>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No references added yet.</p>
        )}
      </div>

      <div className="premium-card p-6">
        <h2 className="mb-3 font-semibold text-slate-900">Note Images</h2>

        {guide.note_images.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {guide.note_images.map((image, index) => (
              <div key={index} className="rounded-xl border border-slate-200 p-2">
                <img
                  src={image.displayUrl}
                  alt={`Guide image ${index + 1}`}
                  className="mb-2 h-32 w-full rounded-lg object-cover"
                />
                {image.caption && <p className="text-xs text-slate-500">{image.caption}</p>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No images added yet.</p>
        )}
      </div>

      {confirmingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-lg font-bold text-red-600">
              !
            </div>

            <h2 className="text-xl font-bold text-slate-900">Delete guide?</h2>

            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900">{guide.title}</span>? This action
              cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setConfirmingDelete(false)}
                disabled={deleting}
                className="soft-button text-sm"
              >
                Cancel
              </button>

              <button onClick={confirmDelete} disabled={deleting} className="danger-button text-sm">
                {deleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

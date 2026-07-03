'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase/client';

function formatHospitalName(name: string) {
  const cleaned = name
    .trim()
    .replace(/[.,]+$/g, '')
    .replace(/[^\p{L}\p{N}\s''&-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned
    .split(' ')
    .map((word) => (word.length > 0 ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

type Props = {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
};

export default function HospitalInput({ value, onChange, className, placeholder }: Props) {
  const [existingHospitals, setExistingHospitals] = useState<string[]>([]);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    async function loadHospitals() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', user.id)
        .single();

      if (!profile?.group_id) return;

      const { data } = await supabase
        .from('guides')
        .select('hospital')
        .eq('group_id', profile.group_id);

      const names = (data ?? []).map((g) => g.hospital).filter(Boolean) as string[];
      setExistingHospitals([...new Set(names)].sort());
    }

    loadHospitals();
  }, []);

  const suggestions = useMemo(() => {
    const query = value.trim().toLowerCase();
    if (!query || !focused) return [];
    return existingHospitals.filter(
      (h) => h.toLowerCase().includes(query) && h.toLowerCase() !== query
    );
  }, [value, focused, existingHospitals]);

  return (
    <div className="relative">
      <input
        className={className}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => {
          // Delay so a suggestion click registers before blur hides the list
          setTimeout(() => {
            setFocused(false);
            onChange(formatHospitalName(value));
          }, 150);
        }}
      />

      {suggestions.length > 0 && (
        <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          {suggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange(suggestion);
                setFocused(false);
              }}
              className={`block w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 ${
                index !== 0 ? 'border-t border-slate-100' : ''
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

'use client';

import { useRef } from 'react';
import { applyAutoBullet } from '../lib/autoBullet';

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export default function BulletTextarea({ value, onChange, placeholder, className }: Props) {
  const prevRef = useRef(value);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const next = e.target.value;
    const result = applyAutoBullet(prevRef.current, next);
    prevRef.current = result;
    onChange(result);
  }

  // Keep prevRef in sync when value is set externally (e.g. AI generation)
  if (prevRef.current !== value && !value.endsWith('• ')) {
    prevRef.current = value;
  }

  return (
    <textarea
      className={className}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
    />
  );
}

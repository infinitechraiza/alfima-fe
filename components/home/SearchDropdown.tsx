'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';

interface SearchDropdownProps {
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: string[];
  isLast?: boolean;
}

export function SearchDropdown({ label, icon, placeholder, options, isLast = false }: SearchDropdownProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState('');
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        const portal = document.getElementById('search-dropdown-portal');
        if (portal && portal.contains(e.target as Node)) return;
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    if (!open && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropPos({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX,
        width: Math.max(rect.width, 200),
      });
    }
    setOpen((o) => !o);
  };

  const dropdownEl = open ? (
    <div
      id="search-dropdown-portal"
      style={{
        position: 'absolute',
        top: dropPos.top,
        left: dropPos.left,
        minWidth: dropPos.width,
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #e5e7eb',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        zIndex: 99999,
        overflow: 'hidden',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        style={{
          padding: '11px 16px', fontSize: 13, cursor: 'pointer',
          borderBottom: '1px solid #f3f4f6', fontFamily: "'DM Sans', sans-serif",
          background: !selected ? '#fff5f5' : 'transparent',
          fontWeight: !selected ? 700 : 400,
          color: !selected ? '#c0392b' : '#9ca3af',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
        onMouseEnter={(e) => { if (selected) e.currentTarget.style.background = '#f9fafb'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = !selected ? '#fff5f5' : 'transparent'; }}
        onClick={() => { setSelected(''); setOpen(false); }}
      >
        {placeholder}
        {!selected && <span style={{ fontSize: 14 }}>✓</span>}
      </div>
      {options.map((opt) => (
        <div
          key={opt}
          style={{
            padding: '11px 16px', fontSize: 13, cursor: 'pointer',
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: selected === opt ? 700 : 400,
            color: selected === opt ? '#c0392b' : '#111827',
            background: selected === opt ? '#fff5f5' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            transition: 'background 0.1s',
          }}
          onMouseEnter={(e) => { if (selected !== opt) e.currentTarget.style.background = '#f9fafb'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = selected === opt ? '#fff5f5' : 'transparent'; }}
          onClick={() => { setSelected(opt); setOpen(false); }}
        >
          {opt}
          {selected === opt && <span style={{ fontSize: 14 }}>✓</span>}
        </div>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div
        ref={triggerRef}
        style={{
          flex: 1, padding: '10px 16px',
          borderRight: isLast ? 'none' : '1px solid #e5e7eb',
          position: 'relative', cursor: 'pointer', userSelect: 'none',
        }}
        onClick={handleOpen}
      >
        <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 3 }}>
          {label}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {icon}
            <span style={{ fontSize: 14, fontWeight: selected ? 600 : 400, color: selected ? '#111827' : '#9ca3af', fontFamily: "'DM Sans', sans-serif" }}>
              {selected || placeholder}
            </span>
          </div>
          <ChevronDown size={14} color="#9ca3af" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
        </div>
      </div>
      {typeof window !== 'undefined' && dropdownEl && createPortal(dropdownEl, document.body)}
    </>
  );
}
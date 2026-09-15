'use client'

import Link from 'next/link'
import { HelpCircle, ShieldCheck, FileText, LockKeyhole, MessageCircle, X } from 'lucide-react'
import { useState } from 'react'
import type { LucideIcon } from 'lucide-react'

type HelpLink = { href: string; label: string; icon: LucideIcon }

const links: HelpLink[] = [
  { href: '/help', label: 'Help Centre', icon: HelpCircle },
  { href: '/safety', label: 'Safety Centre', icon: ShieldCheck },
  { href: '/privacy', label: 'Privacy Policy', icon: LockKeyhole },
  { href: '/terms', label: 'Terms of Use', icon: FileText },
  { href: '/contact', label: 'Contact Support', icon: MessageCircle },
]

export default function HelpMenu() {
  const [open, setOpen] = useState(false)

  return (
    <div style={{ position: 'fixed', left: 18, bottom: 18, zIndex: 1001 }}>
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? 'Close help menu' : 'Open help menu'}
        style={{ height: 48, border: '1px solid var(--line)', borderRadius: 14, padding: '0 15px', background: '#fff', color: '#171513', boxShadow: '0 12px 32px rgba(0,0,0,.14)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 700 }}
      >
        {open ? <X size={18} /> : <HelpCircle size={18} />} Help
      </button>

      {open && (
        <div style={{ position: 'absolute', left: 0, bottom: 58, width: 230, padding: 10, border: '1px solid var(--line)', borderRadius: 16, background: '#fff', boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 10, textDecoration: 'none', color: 'inherit', fontSize: 13 }}
            >
              <Icon size={16} />
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

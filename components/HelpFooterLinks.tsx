'use client';

import Link from 'next/link';

const links = [
  ['/help', 'Help Centre'],
  ['/safety', 'Safety Centre'],
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms of Use'],
  ['/contact', 'Contact Support'],
] as const;

export default function HelpFooterLinks() {
  return (
    <div className="help-footer-links" aria-label="Support and legal links">
      <div className="help-footer-inner">
        {links.map(([href, label], index) => (
          <span key={href} className="help-footer-item">
            {index > 0 && <span className="help-footer-separator" aria-hidden="true">·</span>}
            <Link href={href}>{label}</Link>
          </span>
        ))}
      </div>
    </div>
  );
}

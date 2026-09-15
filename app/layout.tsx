import type { Metadata } from 'next';
import './globals.css';
import SupportChatbot from '@/components/SupportChatbot';

export const metadata: Metadata = {
  title: 'Habesha Market — Buy & sell across Ethiopia',
  description: 'A modern Ethiopian classifieds marketplace for cars, homes, electronics, jobs, services and more.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="am"><body>{children}<SupportChatbot /></body></html>;
}

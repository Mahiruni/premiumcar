'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Bot, ChevronDown, MessageCircle, Send, X } from 'lucide-react';

type Message = { role: 'bot' | 'user'; text: string };

const quickReplies = ['How do I sell a car?', 'How do I stay safe?', 'How does privacy work?', 'I need help'];

function answer(input: string) {
  const q = input.toLowerCase();
  if (q.includes('sell') || q.includes('post') || q.includes('listing')) return 'To sell, sign in, choose “Sell”, add the vehicle details and photos, then publish. You can manage your listings from your dashboard.';
  if (q.includes('safe') || q.includes('scam') || q.includes('fraud') || q.includes('meet')) return 'For safety, inspect the vehicle before paying, meet in a public place, verify ownership and documents, and never share passwords or one-time codes. Read our Safety Centre for the full checklist.';
  if (q.includes('privacy') || q.includes('data') || q.includes('personal')) return 'We only use account and listing information to operate the marketplace and provide its features. See the Privacy page for the full policy.';
  if (q.includes('account') || q.includes('login') || q.includes('sign in')) return 'Use Sign in to access your account. Your dashboard lets you manage listings, saved ads and marketplace activity.';
  if (q.includes('message') || q.includes('seller') || q.includes('buyer')) return 'Open a listing and use “Message seller” to start a conversation. Keep sensitive payment and identity information private.';
  if (q.includes('contact') || q.includes('support') || q.includes('help')) return 'You can browse the Help Centre for buying, selling, safety and privacy guidance, or use Contact us to send a support request.';
  return 'I can help with buying, selling, safety, accounts, messages and privacy. Try one of the quick questions below, or open the Help Centre.';
}

export default function SupportChatbot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'bot', text: 'Hi 👋 I’m the Habesha Market assistant. What can I help you with?' },
  ]);

  function send(text = input) {
    const value = text.trim();
    if (!value) return;
    setMessages((current) => [...current, { role: 'user', text: value }, { role: 'bot', text: answer(value) }]);
    setInput('');
  }

  return (
    <>
      {open && (
        <div style={{ position: 'fixed', right: 18, bottom: 84, width: 'min(390px, calc(100vw - 28px))', zIndex: 1000, border: '1px solid var(--line)', borderRadius: 18, background: '#fff', boxShadow: '0 24px 70px rgba(25,20,15,.2)', overflow: 'hidden' }}>
          <div style={{ padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#171513', color: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ width: 36, height: 36, borderRadius: 11, display: 'grid', placeItems: 'center', background: 'var(--accent)', color: '#171513' }}><Bot size={19}/></span><div><strong>Habesha Assistant</strong><div style={{ fontSize: 11, opacity: .65 }}>Instant marketplace help</div></div></div>
            <button onClick={() => setOpen(false)} aria-label="Close assistant" style={{ border: 0, background: 'transparent', color: '#fff', cursor: 'pointer' }}><X size={18}/></button>
          </div>
          <div style={{ height: 330, overflowY: 'auto', padding: 14, background: '#faf8f5' }}>
            {messages.map((m, i) => <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom: 9 }}><div style={{ maxWidth: '84%', padding: '10px 12px', borderRadius: 13, fontSize: 13, lineHeight: 1.5, background: m.role === 'user' ? '#171513' : '#fff', color: m.role === 'user' ? '#fff' : '#292522', border: m.role === 'bot' ? '1px solid var(--line)' : '0' }}>{m.text}</div></div>)}
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 8 }}>{quickReplies.map((q) => <button key={q} onClick={() => send(q)} style={{ border: '1px solid var(--line)', background: '#fff', borderRadius: 999, padding: '7px 10px', fontSize: 11, cursor: 'pointer' }}>{q}</button>)}</div>
            <div style={{ marginTop: 12 }}><Link href="/help" onClick={() => setOpen(false)} style={{ fontSize: 12, color: 'var(--accent)' }}>Open the Help Centre →</Link></div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); send(); }} style={{ display: 'flex', gap: 8, padding: 10, borderTop: '1px solid var(--line)', background: '#fff' }}>
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask a question…" aria-label="Ask the assistant" style={{ minWidth: 0, flex: 1, border: '1px solid var(--line)', borderRadius: 10, padding: '10px 11px', outline: 'none' }}/>
            <button type="submit" aria-label="Send" style={{ width: 42, border: 0, borderRadius: 10, background: 'var(--accent)', cursor: 'pointer', display: 'grid', placeItems: 'center' }}><Send size={16}/></button>
          </form>
        </div>
      )}
      <button onClick={() => setOpen((v) => !v)} aria-label={open ? 'Close chat assistant' : 'Open chat assistant'} style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 1001, width: 54, height: 54, borderRadius: 17, border: '1px solid rgba(0,0,0,.08)', background: '#171513', color: '#fff', cursor: 'pointer', boxShadow: '0 14px 35px rgba(0,0,0,.2)', display: 'grid', placeItems: 'center' }}>
        {open ? <ChevronDown size={22}/> : <MessageCircle size={22}/>} 
      </button>
    </>
  );
}

import Link from 'next/link';
import { ChevronRight, ShieldCheck, UserRound, MessageCircle, FileText, LockKeyhole } from 'lucide-react';
import { Header, Footer } from '@/components/Marketplace';

const topics = [
  ['Buying safely', 'How to inspect a vehicle, meet sellers and avoid scams.', '/safety', ShieldCheck],
  ['Selling on Habesha Market', 'Create a listing, add photos and manage your ads.', '/sell', FileText],
  ['Your account', 'Sign in, save listings, message sellers and use your dashboard.', '/dashboard', UserRound],
  ['Privacy', 'Understand what information we collect and how it is used.', '/privacy', LockKeyhole],
  ['Terms of use', 'The rules that apply when using the marketplace.', '/terms', FileText],
  ['Contact support', 'Send us a question when you need help with the marketplace.', '/contact', MessageCircle],
] as const;

export default function HelpPage() {
  return <><Header/><main className="page"><div className="container" style={{maxWidth:980}}><div className="small">HELP CENTRE</div><h1 style={{fontSize:48,letterSpacing:'-2px',margin:'8px 0 12px'}}>How can we help?</h1><p className="small" style={{fontSize:15,maxWidth:680,lineHeight:1.8}}>Straightforward guidance for buying, selling and using Habesha Market across Ethiopia. You can also open the assistant from the chat button at the bottom of the screen.</p><div className="grid" style={{marginTop:30}}>{topics.map(([title,text,href,Icon])=><Link key={href} href={href} className="panel" style={{display:'block',textDecoration:'none'}}><Icon size={21} style={{color:'var(--accent)',marginBottom:18}}/><h2 style={{fontSize:20,margin:'0 0 8px'}}>{title}</h2><p className="small" style={{margin:0,lineHeight:1.65}}>{text}</p><div className="small" style={{marginTop:18,color:'var(--accent)',display:'flex',alignItems:'center',gap:4}}>Learn more <ChevronRight size={14}/></div></Link>)}</div></div></main><Footer/></>;
}

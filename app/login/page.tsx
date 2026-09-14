'use client';
import type {FormEvent} from 'react';
import {useState} from 'react';
import Link from 'next/link';
import {Header,Footer} from '@/components/Marketplace';
import {supabase} from '@/lib/supabase';

export default function Login(){
 const [mode,setMode]=useState<'login'|'signup'>('login');
 const [name,setName]=useState(''); const [email,setEmail]=useState(''); const [password,setPassword]=useState('');
 const [busy,setBusy]=useState(false); const [error,setError]=useState(''); const [message,setMessage]=useState('');
 const isLogin=mode==='login';
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); setError(''); setMessage('');
  if(!supabase){setError('Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in Vercel.');return;}
  setBusy(true);
  try{
   if(isLogin){
    const {error}=await supabase.auth.signInWithPassword({email,password}); if(error) throw error;
    window.location.href='/dashboard';
   }else{
    const {data,error}=await supabase.auth.signUp({email,password,options:{data:{full_name:name}}});
    if(error) throw error;
    if(data.session) window.location.href='/dashboard'; else setMessage('Account created. Check your email to confirm your account, then sign in.');
   }
  }catch(err){setError(err instanceof Error?err.message:'Authentication failed. Please try again.');}finally{setBusy(false);}
 }
 return <><Header/><main className="page"><div className="container" style={{maxWidth:520}}><div className="panel"><div className="small">{isLogin?'WELCOME BACK':'JOIN THE MARKETPLACE'}</div><h1 style={{fontSize:36,letterSpacing:'-1.5px'}}>{isLogin?'Sign in':'Create your account'}</h1><form className="form" onSubmit={submit}>{!isLogin&&<label>Name<input required value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></label>}<label>Email<input required type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"/></label><label>Password<input required minLength={6} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" autoComplete={isLogin?'current-password':'new-password'}/></label>{error&&<div className="notice">{error}</div>}{message&&<div className="notice" style={{background:'#e9f5ef',color:'#14634f'}}>{message}</div>}<button className="primary" type="submit" disabled={busy}>{busy?'Please wait…':isLogin?'Sign in':'Create account'}</button></form><p className="small" style={{marginTop:18}}>{isLogin?'New here?':'Already have an account?'} <button type="button" onClick={()=>{setMode(isLogin?'signup':'login');setError('');setMessage('')}} style={{border:0,background:'none',color:'var(--accent)',fontWeight:800,cursor:'pointer'}}>{isLogin?'Create account':'Sign in'}</button></p><Link href="/" className="small" style={{display:'block',marginTop:18}}>← Back home</Link></div></div></main><Footer/></>}

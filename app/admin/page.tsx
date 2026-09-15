'use client'

import {useEffect,useState} from 'react'
import Link from 'next/link'
import {Check,Clock3,Flag,ShieldAlert,X} from 'lucide-react'
import {Header,Footer} from '@/components/Marketplace'
import {money} from '@/lib/data'
import {supabase} from '@/lib/supabase'

type Listing = {
  id:string
  title:string
  price:number
  city:string
  condition:string
  status:string
  created_at:string
  description:string|null
  categories?:{name:string}[]|null
}

type ListingRow = Omit<Listing,'categories'> & {
  categories:{name:string}[]|null
}

export default function Admin(){
  const [session,setSession]=useState<any>(null)
  const [pending,setPending]=useState<Listing[]>([])
  const [counts,setCounts]=useState({pending:0,active:0,reports:0,users:0})
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState<string|null>(null)
  const [error,setError]=useState('')
  const [notice,setNotice]=useState('')

  async function load(){
    if(!supabase)return
    setLoading(true)
    setError('')
    const {data:{session}}=await supabase.auth.getSession()
    setSession(session)
    if(!session){setLoading(false);return}

    const [pendingRes,activeRes,reportsRes,usersRes]=await Promise.all([
      supabase.from('listings').select('id,title,price,city,condition,status,created_at,description,categories(name)').eq('status','pending').order('created_at',{ascending:false}),
      supabase.from('listings').select('id',{count:'exact',head:true}).eq('status','active'),
      supabase.from('reports').select('id',{count:'exact',head:true}),
      supabase.from('profiles').select('id',{count:'exact',head:true}),
    ])
    if(pendingRes.error)setError(pendingRes.error.message)
    const rows = (pendingRes.data ?? []) as unknown as ListingRow[]
    setPending(rows.map(({categories,...item})=>({...item,categories:categories ?? null})))
    setCounts({pending:rows.length,active:activeRes.count||0,reports:reportsRes.count||0,users:usersRes.count||0})
    setLoading(false)
  }

  useEffect(()=>{load()},[])

  async function moderate(id:string,status:'active'|'rejected'){
    if(!supabase)return
    setBusy(id);setError('');setNotice('')
    const {error}=await supabase.from('listings').update({status}).eq('id',id).eq('status','pending')
    if(error){setError(error.message);setBusy(null);return}
    setPending(current=>current.filter(x=>x.id!==id))
    setCounts(current=>({...current,pending:Math.max(0,current.pending-1),active:status==='active'?current.active+1:current.active}))
    setNotice(status==='active'?'Listing approved and published.':'Listing rejected and kept out of the marketplace.')
    setBusy(null)
  }

  if(!session)return <><Header/><main className="page"><div className="container" style={{maxWidth:720}}><div className="panel"><div className="small">ADMINISTRATION</div><h1 style={{fontSize:42,letterSpacing:'-2px'}}>Restricted area</h1><p className="small">Sign in with an authorized administrator account to access moderation.</p><Link className="primary" href="/login">Sign in</Link></div></div></main><Footer/></>

  return <><Header/><main className="page"><div className="container">
    <div className="sectionhead"><div><div className="small">ADMINISTRATION</div><h1 style={{fontSize:42,letterSpacing:'-2px',margin:'8px 0'}}>Moderation centre</h1><p className="small">Review new listings before they reach buyers.</p></div><Link className="ghost" href="/dashboard">Back to dashboard</Link></div>
    <div className="grid" style={{gridTemplateColumns:'repeat(4,1fr)',marginBottom:24}}>
      {[['PENDING',counts.pending,Clock3],['ACTIVE ADS',counts.active,Check],['REPORTS',counts.reports,Flag],['USERS',counts.users,ShieldAlert]].map(([label,value,Icon]:any)=><div className="panel" key={label as string}><div className="small">{label as string}</div><div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginTop:6}}><b style={{fontSize:30}}>{value as number}</b><Icon size={18}/></div></div>)}
    </div>
    {error&&<div className="notice" style={{marginBottom:16}}>{error}</div>}
    {notice&&<div className="notice" style={{marginBottom:16}}>{notice}</div>}
    <div className="panel">
      <div className="sectionhead"><h2>Pending listings</h2><span className="small">{loading?'Loading…':`${pending.length} awaiting review`}</span></div>
      {loading?<div className="small">Loading moderation queue…</div>:pending.length===0?<div style={{padding:'42px 10px',textAlign:'center'}}><Check size={28}/><h3>Queue is clear</h3><p className="small">There are no pending listings right now.</p></div>:pending.map(item=><article key={item.id} className="statrow" style={{alignItems:'flex-start',gap:18}}>
        <div style={{minWidth:0,flex:1}}><b>{item.title}</b><div className="small" style={{marginTop:5}}>{item.categories?.[0]?.name||'Marketplace'} · {item.city} · {item.condition} · {money(item.price)}</div>{item.description&&<p className="small" style={{margin:'8px 0 0',maxWidth:760}}>{item.description.slice(0,180)}{item.description.length>180?'…':''}</p>}</div>
        <div style={{display:'flex',gap:8,flexShrink:0}}><button className="ghost" disabled={busy===item.id} onClick={()=>moderate(item.id,'rejected')}><X size={15}/> Reject</button><button className="primary" disabled={busy===item.id} onClick={()=>moderate(item.id,'active')}><Check size={15}/> {busy===item.id?'Saving…':'Approve'}</button></div>
      </article>)}
    </div>
    <div className="notice" style={{marginTop:16}}>Moderation writes are enforced by Supabase RLS. If your administrator role is not authorized by the database policy, approval will be rejected rather than bypassing security.</div>
  </div></main><Footer/></>
}

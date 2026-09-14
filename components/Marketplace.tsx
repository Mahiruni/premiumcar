'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import {Search,Heart,Plus,MapPin,ShieldCheck,ChevronRight,Menu,X,MessageCircle,SlidersHorizontal,UserRound,LayoutDashboard} from 'lucide-react';
import {categories,cities,listings,money} from '@/lib/data';

export function Header(){
  const [open,setOpen]=useState(false);

  useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape')setOpen(false)};
    window.addEventListener('keydown',onKey);
    document.body.style.overflow=open?'hidden':'';
    return()=>{window.removeEventListener('keydown',onKey);document.body.style.overflow=''};
  },[open]);

  const close=()=>setOpen(false);

  return <>
    <div className="top"><div className="container topin"><span>🇪🇹 Ethiopia's local marketplace</span><span className="topnote">Safe buying starts with meeting in public places.</span></div></div>
    <header className="nav">
      <div className="container navin">
        <Link href="/" className="brand" onClick={close}><span className="mark">H</span><span>Habesha Market</span></Link>
        <nav className="navlinks" aria-label="Primary navigation">
          <Link href="/search">Browse</Link><Link href="/search?category=Cars">Cars</Link><Link href="/search?category=Real%20estate">Real estate</Link><Link href="/search?category=Electronics">Electronics</Link><Link href="/search?category=Jobs">Jobs</Link>
        </nav>
        <div className="actions">
          <Link href="/dashboard" className="ghost accountlink"><UserRound size={15}/> My account</Link>
          <Link href="/sell" className="primary selltop"><Plus size={16}/> Sell</Link>
          <button className={`mobilemenu ${open?'is-open':''}`} onClick={()=>setOpen(!open)} aria-label={open?'Close navigation':'Open navigation'} aria-expanded={open} aria-controls="mobile-navigation">
            <span className="hamburger-lines"><span/><span/><span/></span>
          </button>
        </div>
      </div>
    </header>
    {open&&<>
      <button className="menuoverlay" aria-label="Close menu" onClick={close}/>
      <div id="mobile-navigation" className="mobilepanel" role="dialog" aria-label="Marketplace navigation">
        <div className="mobilepanel-inner">
          <div className="mobile-account">
            <div className="user-avatar"><UserRound size={21}/></div>
            <div><strong>Your marketplace</strong><span>Sign in to save ads and message sellers</span></div>
          </div>
          <Link className="mobile-account-cta" href="/login" onClick={close}><UserRound size={17}/> Sign in / Create account <ChevronRight size={16}/></Link>
          <div className="mobile-search">
            <Search size={17}/><Link href="/search" onClick={close}>Search cars, homes, phones & more</Link>
          </div>
          <div className="mobile-menu-section">
            <div className="mobile-label">YOUR MARKETPLACE</div>
            <Link href="/dashboard" onClick={close}><LayoutDashboard size={18}/> My dashboard <ChevronRight size={16}/></Link>
            <Link href="/search" onClick={close}><Heart size={18}/> Saved listings <ChevronRight size={16}/></Link>
            <Link href="/dashboard" onClick={close}><MessageCircle size={18}/> Messages <ChevronRight size={16}/></Link>
          </div>
          <div className="mobile-menu-section">
            <div className="mobile-label">BROWSE</div>
            <Link href="/search?category=Cars" onClick={close}>🚗 Cars <ChevronRight size={16}/></Link>
            <Link href="/search?category=Real%20estate" onClick={close}>🏠 Real estate <ChevronRight size={16}/></Link>
            <Link href="/search?category=Electronics" onClick={close}>📱 Electronics <ChevronRight size={16}/></Link>
            <Link href="/search?category=Jobs" onClick={close}>💼 Jobs <ChevronRight size={16}/></Link>
          </div>
          <Link className="mobile-sell" href="/sell" onClick={close}><Plus size={18}/> Post an ad</Link>
          <p className="mobile-safety">🇪🇹 Built for Ethiopia · Buy locally, meet safely.</p>
        </div>
      </div>
    </>}
  </>
}

export function ListingCard({item}:{item:any}){const [fav,setFav]=useState(false);return <Link href={`/listing/${item.id}`} className="card"><div className="photo"><img src={item.image} alt={item.title}/>{item.verified&&<span className="badge">VERIFIED</span>}<button className="heart" onClick={e=>{e.preventDefault();setFav(!fav)}} aria-label={fav?'Remove from favorites':'Save listing'}>{fav?'♥':'♡'}</button></div><div className="cardbody"><div className="price">{money(item.price)}</div><div className="title">{item.title}</div><div className="meta"><MapPin size={12}/>{item.city} · {item.time}</div>{item.verified&&<div className="trust"><ShieldCheck size={12} style={{verticalAlign:'-2px'}}/> Verified seller</div>}</div></Link>}

export function Footer(){return <footer className="footer"><div className="container footergrid"><div><div className="brand"><span className="mark">H</span> Habesha Market</div><p>Buy locally. Sell confidently. Built for Ethiopia.</p></div><div><h4>Marketplace</h4><p>Cars<br/>Homes<br/>Electronics<br/>Jobs</p></div><div><h4>For sellers</h4><p>Post an ad<br/>Seller guide<br/>Safety centre</p></div><div><h4>Help</h4><p>Contact us<br/>Terms<br/>Privacy</p></div></div></footer>}

export function Home(){return <><Header/><main><section className="hero"><div className="container"><div className="small">ADDIS ABABA · ETHIOPIA</div><h1>Find your next thing.<br/><em style={{fontStyle:'normal',color:'var(--accent)'}}>Right here.</em></h1><p>Cars, homes, phones, furniture, jobs and everything in between — from people and businesses across Ethiopia.</p><form className="searchbox" action="/search"><Search size={20} style={{margin:'15px 2px 0 12px'}}/><input name="q" placeholder="What are you looking for?"/><select className="select" name="city"><option>All Ethiopia</option>{cities.map(c=><option key={c}>{c}</option>)}</select><button className="searchbtn">Search</button></form></div></section><section className="section"><div className="container"><div className="sectionhead"><h2>Browse categories</h2><Link className="small" href="/search">See all <ChevronRight size={13} style={{verticalAlign:'-2px'}}/></Link></div><div className="categories">{categories.map((c,i)=><Link className="cat" href={`/search?category=${encodeURIComponent(c[3])}`} key={i}><span className="emoji">{c[0]}</span><span>{c[2]}</span></Link>)}</div></div></section><section className="section" style={{paddingTop:0}}><div className="container"><div className="sectionhead"><div><h2>Fresh listings</h2><div className="small">Newly posted across Ethiopia</div></div><Link className="small" href="/search">View all</Link></div><div className="grid">{listings.map(x=><ListingCard item={x} key={x.id}/>)}</div></div></section><section className="section"><div className="container panel" style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,background:'#f1e7df'}}><div><div className="small">SELL SOMETHING TODAY</div><h2 style={{margin:'6px 0'}}>Turn unused into useful.</h2><div className="small">Post your first ad in a few minutes.</div></div><Link className="primary" href="/sell"><Plus size={16}/> Post an ad</Link></div></section></main><Footer/></>}

export function SearchPage(){const [q,setQ]=useState('');const [city,setCity]=useState('All Ethiopia');const [cat,setCat]=useState('All categories');const [max,setMax]=useState('');const filtered=useMemo(()=>listings.filter(x=>(!q||x.title.toLowerCase().includes(q.toLowerCase()))&&(city==='All Ethiopia'||x.city===city)&&(cat==='All categories'||x.category===cat)&&(!max||x.price<=Number(max))),[q,city,cat,max]);return <><Header/><main className="page"><div className="container"><div className="small">MARKETPLACE</div><h1 style={{fontSize:42,letterSpacing:'-2px',margin:'8px 0'}}>All listings</h1><div className="toolbar"><div style={{flex:'1 1 300px',display:'flex',border:'1px solid var(--line)',borderRadius:12,background:'#fff',padding:'0 12px'}}><Search size={17} style={{marginTop:13}}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search listings" style={{border:0,outline:0,padding:12,background:'transparent',width:'100%'}}/></div><select className="pill" value={cat} onChange={e=>setCat(e.target.value)}><option>All categories</option>{[...new Set(listings.map(x=>x.category))].map(x=><option key={x}>{x}</option>)}</select><select className="pill" value={city} onChange={e=>setCity(e.target.value)}><option>All Ethiopia</option>{cities.map(x=><option key={x}>{x}</option>)}</select><input className="pill" value={max} onChange={e=>setMax(e.target.value)} placeholder="Max price" type="number"/></div><div className="small" style={{marginBottom:16}}>{filtered.length} results · <SlidersHorizontal size={13} style={{verticalAlign:'-2px'}}/> Filters update instantly</div><div className="grid">{filtered.map(x=><ListingCard item={x} key={x.id}/>)}</div>{!filtered.length&&<div className="panel" style={{textAlign:'center',padding:60}}>No listings match those filters.</div>}</div></main><Footer/></>}

export function SellPage(){return <><Header/><main className="page"><div className="container" style={{maxWidth:860}}><div className="small">CREATE LISTING</div><h1 style={{fontSize:42,letterSpacing:'-2px'}}>Post an ad</h1><div className="notice">Your listing is saved locally in demo mode. Connect Supabase to enable production accounts, storage and moderation.</div><div className="panel" style={{marginTop:16}}><form className="form" onSubmit={e=>{e.preventDefault();alert('Demo listing created — connect Supabase for production publishing.')}}><label>Title<input required placeholder="e.g. Toyota Corolla 2019"/></label><label>Category<select required><option>Cars</option><option>Real estate</option><option>Electronics</option><option>Furniture</option><option>Jobs</option><option>Services</option><option>Animals</option></select></label><label>Price (ETB)<input required type="number" placeholder="0"/></label><label>City<select required>{cities.map(x=><option key={x}>{x}</option>)}</select></label><label>Description<textarea required placeholder="Tell buyers what makes this listing worth their time..."/></label><label>Photos<input type="file" accept="image/*" multiple/></label><button className="primary" type="submit" style={{justifyContent:'center'}}>Publish listing</button></form></div></div></main><Footer/></>}

export function Dashboard(){return <><Header/><main className="page"><div className="container"><div className="sectionhead"><div><div className="small">ACCOUNT</div><h1 style={{fontSize:42,letterSpacing:'-2px',margin:'6px 0'}}>My dashboard</h1></div><Link href="/sell" className="primary"><Plus size={16}/> New listing</Link></div><div className="grid" style={{gridTemplateColumns:'repeat(3,1fr)'}}><div className="panel"><div className="small">ACTIVE LISTINGS</div><div style={{fontSize:32,fontWeight:800,marginTop:8}}>3</div></div><div className="panel"><div className="small">SAVED ADS</div><div style={{fontSize:32,fontWeight:800,marginTop:8}}>12</div></div><div className="panel"><div className="small">MESSAGES</div><div style={{fontSize:32,fontWeight:800,marginTop:8}}>4</div></div></div><div className="section"><div className="sectionhead"><h2>Your listings</h2><span className="small">Manage · edit · pause</span></div><div className="grid">{listings.slice(0,3).map(x=><ListingCard item={x} key={x.id}/>)}</div></div></div></main><Footer/></>}

export function ListingPage({id}:{id:string}){const item=listings.find(x=>x.id===id)||listings[0];return <><Header/><main className="page"><div className="container"><Link href="/search" className="back">← Back to listings</Link><div className="detail"><div><div className="gallery"><div className="gallerymain"><img src={item.image} alt={item.title}/></div><div className="thumbs"><img src={item.image} alt=""/><img src={item.image} alt=""/></div></div><div className="panel" style={{marginTop:16}}><div className="small">DESCRIPTION</div><p style={{lineHeight:1.8}}>{item.description}</p></div></div><aside className="side"><div className="panel"><div className="small">{item.category.toUpperCase()} · {item.city}</div><h1 style={{fontSize:30,letterSpacing:'-1px',lineHeight:1.1}}>{item.title}</h1><div className="price" style={{fontSize:25}}>{money(item.price)}</div><div className="statrow"><span>Condition</span><b>{item.condition}</b></div><div className="statrow"><span>Location</span><b>{item.city}</b></div><div className="statrow"><span>Posted</span><b>{item.time}</b></div><button className="primary" style={{width:'100%',marginTop:18,display:'flex',alignItems:'center',justifyContent:'center',gap:8}} onClick={()=>alert('Demo message composer — connect Supabase for real chat.')}><MessageCircle size={17}/> Message seller</button><button className="ghost" style={{width:'100%',marginTop:8}}><Heart size={16}/> Save listing</button></div><div className="panel" style={{marginTop:12}}><div className="small">SAFETY</div><p style={{fontSize:12,lineHeight:1.6}}>Never send money before seeing the item. Meet in a public place and verify documents.</p></div></aside></div></div></main><Footer/></>}

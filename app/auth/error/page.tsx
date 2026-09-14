import Link from 'next/link'
export default function ErrorPage(){return <main className="page"><div className="container"><div className="panel"><h1>Authentication error</h1><p>Please try again. If the problem continues, check your Supabase Auth email configuration.</p><Link className="primary" href="/login">Back to sign in</Link></div></div></main>}

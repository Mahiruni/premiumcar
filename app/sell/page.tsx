'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ImagePlus, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { categories as localCategories } from '@/lib/data'

const REQUEST_TIMEOUT = 15000
const IMAGE_TIMEOUT = 12000
const MAX_IMAGE_DIMENSION = 2000
const TARGET_IMAGE_BYTES = 4.5 * 1024 * 1024
const WATERMARK = 'Habesha Market'

// Supabase query builders are thenable objects rather than native Promise instances.
// Convert the query explicitly to a native Promise before passing it to withTimeout.
async function withTimeout<T>(promise: Promise<T>, message: string, ms = REQUEST_TIMEOUT): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try { return await Promise.race([promise, new Promise<T>((_, reject) => { timer = setTimeout(() => reject(new Error(message)), ms) })]) }
  finally { if (timer) clearTimeout(timer) }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file); const image = new Image()
    const cleanup = () => URL.revokeObjectURL(url)
    image.onload = () => { cleanup(); resolve(image) }; image.onerror = () => { cleanup(); reject(new Error(`Could not read ${file.name}.`)) }; image.src = url
  })
}
function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> { return new Promise((resolve, reject) => { canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not process the image.')), 'image/webp', quality) }) }
async function compressAndWatermark(file: File, uploaderName: string): Promise<File> {
  return withTimeout((async () => {
    const image = await loadImage(file); const longestSide = Math.max(image.naturalWidth, image.naturalHeight); const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide)
    const width = Math.max(1, Math.round(image.naturalWidth * scale)); const height = Math.max(1, Math.round(image.naturalHeight * scale)); const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
    const context = canvas.getContext('2d'); if (!context) throw new Error(`Could not process ${file.name}.`)
    context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'; context.drawImage(image, 0, 0, width, height)
    const watermark = `${WATERMARK} • ${(uploaderName.trim() || 'Member').slice(0, 60)}`; const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.025)); const padding = Math.max(14, Math.round(fontSize * 0.65))
    context.font = `600 ${fontSize}px Arial, sans-serif`; context.textAlign = 'right'; context.textBaseline = 'bottom'; const textWidth = context.measureText(watermark).width; const boxWidth = textWidth + padding * 2; const boxHeight = fontSize + padding * 1.45
    context.fillStyle = 'rgba(0,0,0,.52)'; context.beginPath(); context.roundRect(width - boxWidth, height - boxHeight, boxWidth, boxHeight, Math.max(8, fontSize * .35)); context.fill(); context.fillStyle = 'rgba(255,255,255,.94)'; context.fillText(watermark, width - padding, height - padding)
    let quality = .9; let blob = await canvasToBlob(canvas, quality); while (blob.size > TARGET_IMAGE_BYTES && quality > .68) { quality -= .06; blob = await canvasToBlob(canvas, quality) }
    const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'image'; return new File([blob], `${baseName}.webp`, { type: 'image/webp', lastModified: Date.now() })
  })(), `Photo ${file.name} could not be processed. You can publish the ad without that photo.`, IMAGE_TIMEOUT)
}

export default function Page() {
  const [categories, setCategories] = useState<any[]>([]); const [session, setSession] = useState<any>(null); const [loadingCategories, setLoadingCategories] = useState(true); const [publishing, setPublishing] = useState(false); const [message, setMessage] = useState(''); const [messageType, setMessageType] = useState<'success' | 'error'>('error'); const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!supabase) { if (mounted) { setMessage('Marketplace database is not configured.'); setLoadingCategories(false) }; return }
      const fallback = localCategories.map((row) => ({ id: row[3], name: row[3] }))
      try {
        // Calling .then() converts Supabase's PostgrestFilterBuilder into a native Promise.
        // This avoids the Next.js/TypeScript Promise-vs-thenable build error.
        const categoriesPromise = supabase
          .from('categories')
          .select('id,name')
          .order('name')
          .then((result) => result)

        const [{ data: sessionData }, categoryResult] = await Promise.all([
          supabase.auth.getSession(),
          withTimeout(categoriesPromise, 'Categories could not be loaded.')
        ])
        if (!mounted) return
        setSession(sessionData.session)
        setCategories(categoryResult.error || !categoryResult.data?.length ? fallback : categoryResult.data)
        if (categoryResult.error) setMessage('Using the marketplace category list. You can still publish your ad.')
      } catch {
        if (mounted) setCategories(fallback)
      } finally { if (mounted) setLoadingCategories(false) }
    }
    load(); const listener = supabase?.auth.onAuthStateChange((_event, nextSession) => { if (mounted) setSession(nextSession) }); return () => { mounted = false; listener?.data.subscription.unsubscribe() }
  }, [])

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (publishing) return; setMessage(''); setMessageType('error'); if (!supabase) { setMessage('Marketplace database is not configured.'); return }; setPublishing(true)
    try {
      const { data: authData, error: authError } = await withTimeout(supabase.auth.getUser(), 'Authentication is taking too long. Please sign in again.')
      if (authError || !authData.user) { window.location.href = '/login'; return }
      const user = authData.user; const form = new FormData(e.currentTarget); const title = String(form.get('title') || '').trim(); const description = String(form.get('description') || '').trim(); const city = String(form.get('city') || '').trim(); const condition = String(form.get('condition') || 'Used'); const categoryValue = String(form.get('category') || '').trim(); const price = Number(form.get('price'))
      if (!title || !description || !city || !categoryValue || !Number.isFinite(price) || price < 0) throw new Error('Please complete all required listing details.')

      setMessage('Creating your ad…')
      // Support both the newer category_id schema and the original marketplace schema used by this project.
      let listingResult: any = await withTimeout(supabase.from('listings').insert({ seller_id: user.id, category_id: categoryValue, title, description, price, city, condition }).select('id').single(), 'The marketplace database did not respond. Please try again.')
      if (listingResult.error) {
        listingResult = await withTimeout(supabase.from('listings').insert({ seller_id: user.id, category: categoryValue, title, description, price, city, region: city, condition }).select('id').single(), 'The marketplace database did not respond. Please try again.')
      }
      if (listingResult.error || !listingResult.data) throw new Error(listingResult.error?.message || 'The ad could not be created. Please try again.')

      const listingId = listingResult.data.id
      if (!files.length) { setMessageType('success'); setMessage('Your ad was published successfully. You can manage it from your dashboard.'); e.currentTarget.reset(); return }

      const metadata = user.user_metadata || {}; const uploaderName = String(metadata.full_name || metadata.name || metadata.display_name || metadata.username || user.email?.split('@')[0] || 'Member').trim(); setMessageType('success'); setMessage('Ad created. Optimizing and uploading photos…')
      const results = await Promise.all(files.map(async (originalFile, index) => {
        try {
          const processed = await compressAndWatermark(originalFile, uploaderName)
          const path = `${user.id}/${listingId}/${crypto.randomUUID()}-${processed.name}`
          const upload = await withTimeout(supabase.storage.from('listing-images').upload(path, processed, { contentType: processed.type, upsert: false }), `Photo ${index + 1} could not be uploaded.`)
          if (upload.error) throw upload.error
          const imageInsert = await withTimeout(supabase.from('listing_images').insert({ listing_id: listingId, storage_path: path, sort_order: index }), `Photo ${index + 1} could not be saved.`)
          if (imageInsert.error) throw imageInsert.error
          return true
        } catch { return false }
      }))
      const uploadedCount = results.filter(Boolean).length
      setMessage(uploadedCount ? `Your ad is published with ${uploadedCount} photo${uploadedCount === 1 ? '' : 's'}.` : 'Your ad is published. Photos could not be uploaded, but you can add them later.')
      e.currentTarget.reset(); setFiles([])
    } catch (error) {
      setMessageType('error'); setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.')
    } finally { setPublishing(false) }
  }

  return (
    <main className="min-h-screen bg-white pb-24">
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-emerald-700">Sell on Habesha Market</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-950">Create a listing</h1>
            <p className="mt-2 text-sm text-gray-600">Reach buyers across Ethiopia with a clear, trustworthy listing.</p>
          </div>
          <Link href="/" className="rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Back to marketplace</Link>
        </div>

        {!session && !loadingCategories && (
          <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">You need to <Link href="/login" className="font-bold underline">sign in</Link> before publishing an ad.</div>
        )}
        {message && <div className={`mb-6 rounded-2xl border p-4 text-sm ${messageType === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-red-200 bg-red-50 text-red-800'}`}>{message}</div>}

        <form onSubmit={publish} className="space-y-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-gray-800">Title</span><input name="title" required placeholder="What are you selling?" className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
            <label className="block sm:col-span-2"><span className="mb-2 block text-sm font-semibold text-gray-800">Description</span><textarea name="description" required rows={5} placeholder="Describe the item, condition, important details…" className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-800">Category</span><select name="category" required defaultValue="" className="w-full rounded-2xl border border-gray-300 px-4 py-3"><option value="" disabled>{loadingCategories ? 'Loading categories…' : 'Choose a category'}</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-800">Price (ETB)</span><input name="price" type="number" min="0" step="1" required placeholder="0" className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-800">City</span><input name="city" required placeholder="Addis Ababa" className="w-full rounded-2xl border border-gray-300 px-4 py-3 outline-none focus:border-emerald-600" /></label>
            <label className="block"><span className="mb-2 block text-sm font-semibold text-gray-800">Condition</span><select name="condition" defaultValue="Used" className="w-full rounded-2xl border border-gray-300 px-4 py-3"><option>New</option><option>Used</option><option>Refurbished</option></select></label>
          </div>

          <div className="rounded-2xl border border-dashed border-gray-300 p-5">
            <div className="flex items-center gap-3"><ImagePlus className="h-5 w-5 text-emerald-700" /><div><p className="font-semibold text-gray-900">Photos</p><p className="text-sm text-gray-600">Up to 8 photos. Images are optimized and watermarked before upload.</p></div></div>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles(Array.from(e.target.files || []).slice(0, 8))} className="mt-4 block w-full text-sm" />
            {!!files.length && <p className="mt-2 text-sm text-gray-600">{files.length} photo{files.length === 1 ? '' : 's'} selected.</p>}
          </div>

          <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-5 text-sm text-gray-600"><ShieldCheck className="h-5 w-5 text-emerald-700" /> <span>Your listing is protected by marketplace safety controls.</span></div>
          <button type="submit" disabled={publishing || !session} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 py-3.5 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50">{publishing ? <><Loader2 className="h-5 w-5 animate-spin" /> Publishing…</> : <><Plus className="h-5 w-5" /> Publish ad</>}</button>
        </form>
      </section>
      <div className="mx-auto mt-8 flex max-w-4xl items-center justify-center gap-2 px-4 text-xs text-gray-500"><CheckCircle2 className="h-4 w-4" /> Secure marketplace publishing</div>
    </main>
  )
}

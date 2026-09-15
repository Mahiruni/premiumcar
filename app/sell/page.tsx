'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, ImagePlus, Loader2, Plus, ShieldCheck } from 'lucide-react'
import { supabase } from '@/lib/supabase'

const REQUEST_TIMEOUT = 15000
const MAX_IMAGE_DIMENSION = 2000
const TARGET_IMAGE_BYTES = 4.5 * 1024 * 1024
const WATERMARK = 'Habesha Market'

async function withTimeout<T>(promise: Promise<T>, message: string, ms = REQUEST_TIMEOUT): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = setTimeout(() => reject(new Error(message)), ms)
      }),
    ])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error(`Could not read ${file.name}.`))
    }
    image.src = url
  })
}

function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not process the image.'))),
      'image/webp',
      quality,
    )
  })
}

async function compressAndWatermark(file: File, uploaderName: string): Promise<File> {
  const image = await loadImage(file)
  const longestSide = Math.max(image.naturalWidth, image.naturalHeight)
  const scale = Math.min(1, MAX_IMAGE_DIMENSION / longestSide)
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error(`Could not process ${file.name}.`)

  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(image, 0, 0, width, height)

  // A subtle, readable watermark that remains visible on both light and dark photos.
  const compactName = uploaderName.trim().slice(0, 60) || 'Member'
  const watermark = `${WATERMARK} • ${compactName}`
  const fontSize = Math.max(18, Math.round(Math.min(width, height) * 0.025))
  const padding = Math.max(14, Math.round(fontSize * 0.65))
  context.font = `600 ${fontSize}px Arial, sans-serif`
  context.textAlign = 'right'
  context.textBaseline = 'bottom'

  const textWidth = context.measureText(watermark).width
  const boxWidth = textWidth + padding * 2
  const boxHeight = fontSize + padding * 1.45
  const x = width - padding
  const y = height - padding

  context.fillStyle = 'rgba(0, 0, 0, 0.52)'
  context.beginPath()
  context.roundRect(width - boxWidth, height - boxHeight, boxWidth, boxHeight, Math.max(8, fontSize * 0.35))
  context.fill()

  context.fillStyle = 'rgba(255, 255, 255, 0.94)'
  context.fillText(watermark, x, y)

  let quality = 0.9
  let blob = await canvasToBlob(canvas, quality)
  while (blob.size > TARGET_IMAGE_BYTES && quality > 0.68) {
    quality -= 0.06
    blob = await canvasToBlob(canvas, quality)
  }

  const baseName = file.name.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-100) || 'image'
  return new File([blob], `${baseName}.webp`, {
    type: 'image/webp',
    lastModified: Date.now(),
  })
}

export default function Page() {
  const [categories, setCategories] = useState<any[]>([])
  const [session, setSession] = useState<any>(null)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('error')
  const [files, setFiles] = useState<File[]>([])

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!supabase) {
        if (mounted) {
          setMessage('Marketplace database is not configured.')
          setLoadingCategories(false)
        }
        return
      }

      const [{ data: sessionData }, categoriesResult] = await Promise.all([
        supabase.auth.getSession(),
        withTimeout(
          supabase.from('categories').select('id,name').order('name'),
          'Categories could not be loaded. Please refresh and try again.'
        ),
      ])

      if (!mounted) return
      setSession(sessionData.session)

      if (categoriesResult.error) {
        setMessage(categoriesResult.error.message)
      } else {
        setCategories(categoriesResult.data || [])
      }
      setLoadingCategories(false)
    }

    load().catch((error) => {
      if (!mounted) return
      setMessage(error instanceof Error ? error.message : 'Could not load the sell page.')
      setLoadingCategories(false)
    })

    const listener = supabase?.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession)
    })

    return () => {
      mounted = false
      listener?.data.subscription.unsubscribe()
    }
  }, [])

  async function publish(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (publishing) return

    setMessage('')

    if (!supabase) {
      setMessageType('error')
      setMessage('Marketplace database is not configured.')
      return
    }

    setPublishing(true)

    try {
      const { data: authData, error: authError } = await withTimeout(
        supabase.auth.getUser(),
        'Authentication is taking too long. Please sign in again.'
      )

      if (authError || !authData.user) {
        window.location.href = '/login'
        return
      }

      const user = authData.user
      const form = new FormData(e.currentTarget)
      const title = String(form.get('title') || '').trim()
      const description = String(form.get('description') || '').trim()
      const city = String(form.get('city') || '').trim()
      const condition = String(form.get('condition') || 'Used')
      const categoryId = String(form.get('category') || '')
      const price = Number(form.get('price'))

      if (!title || !description || !city || !categoryId || !Number.isFinite(price) || price < 0) {
        throw new Error('Please complete all required listing details.')
      }

      // Prefer the user's profile name when available; fall back to auth metadata/email.
      const metadata = user.user_metadata || {}
      const uploaderName = String(
        metadata.full_name || metadata.name || metadata.display_name || metadata.username || user.email?.split('@')[0] || 'Member'
      ).trim()

      setMessageType('success')
      setMessage(files.length ? 'Optimizing photos and adding your watermark…' : 'Publishing your ad…')

      // Process images before upload: resize, convert to efficient WebP, and burn in the watermark.
      const processedFiles = await Promise.all(
        files.map((file) => compressAndWatermark(file, uploaderName))
      )

      const listingResult = await withTimeout(
        supabase
          .from('listings')
          .insert({
            seller_id: user.id,
            category_id: categoryId,
            title,
            description,
            price,
            city,
            condition,
          })
          .select('id')
          .single(),
        'Publishing is taking too long. The listing was not confirmed. Please try again.'
      )

      if (listingResult.error || !listingResult.data) {
        throw new Error(listingResult.error?.message || 'Could not create the listing.')
      }

      const listingId = listingResult.data.id
      let uploaded = 0
      let failed = 0

      const imageResults = await Promise.all(
        processedFiles.map(async (file, index) => {
          const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-').slice(-120)
          const path = `${user.id}/${listingId}/${crypto.randomUUID()}-${safeName}`

          try {
            const uploadResult = await withTimeout(
              supabase.storage.from('listing-images').upload(path, file, {
                contentType: 'image/webp',
                upsert: false,
              }),
              `Photo ${index + 1} took too long to upload.`
            )

            if (uploadResult.error) return { ok: false }

            const imageRow = await withTimeout(
              supabase.from('listing_images').insert({
                listing_id: listingId,
                storage_path: path,
                sort_order: index,
              }),
              `Photo ${index + 1} could not be attached.`
            )

            return { ok: !imageRow.error }
          } catch {
            return { ok: false }
          }
        })
      )

      imageResults.forEach((result) => {
        if (result.ok) uploaded += 1
        else failed += 1
      })

      setMessageType('success')
      setMessage(
        failed > 0
          ? `Your ad was published successfully. ${uploaded} optimized, watermarked photo(s) uploaded; ${failed} photo(s) could not be uploaded. You can manage the listing from your dashboard.`
          : `Your ad was published successfully${uploaded ? ` with ${uploaded} optimized, watermarked photo(s)` : ''}. It is now available in your dashboard.`
      )
      e.currentTarget.reset()
      setFiles([])
    } catch (error) {
      setMessageType('error')
      setMessage(error instanceof Error ? error.message : 'Could not publish the listing.')
    } finally {
      setPublishing(false)
    }
  }

  if (!session) {
    return (
      <main className="page">
        <div className="container" style={{ maxWidth: 860 }}>
          <div className="panel" style={{ padding: 40, textAlign: 'center' }}>
            <div className="small">SELL ON HABESHA MARKET</div>
            <h1 style={{ fontSize: 42, letterSpacing: '-2px' }}>Post an ad</h1>
            <p className="small" style={{ lineHeight: 1.7 }}>
              Sign in first, then you can publish your vehicle, property, electronics, job, service or other listing.
            </p>
            <Link className="primary" href="/login" style={{ marginTop: 18, justifyContent: 'center' }}>
              Sign in / Create account
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="page">
      <div className="container" style={{ maxWidth: 860 }}>
        <div className="small">CREATE LISTING</div>
        <h1 style={{ fontSize: 42, letterSpacing: '-2px', marginBottom: 8 }}>Post an ad</h1>
        <p className="small" style={{ lineHeight: 1.7 }}>
          Add clear details and real photos. Photos are automatically resized, converted to efficient WebP, and watermarked with Habesha Market and your uploader name before they reach storage.
        </p>

        <div className="panel" style={{ marginTop: 20 }}>
          <form className="form" onSubmit={publish}>
            <label>
              Title
              <input required minLength={5} name="title" placeholder="Give your listing a clear title" />
            </label>

            <label>
              Category
              <select required name="category" disabled={loadingCategories}>
                <option value="">{loadingCategories ? 'Loading categories…' : 'Choose category'}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>

            <label>
              Price (ETB)
              <input required min="0" name="price" type="number" inputMode="decimal" placeholder="0" />
            </label>

            <label>
              City
              <input required name="city" placeholder="Addis Ababa" />
            </label>

            <label>
              Condition
              <select name="condition" defaultValue="Used">
                <option>Used</option>
                <option>New</option>
                <option>Like new</option>
              </select>
            </label>

            <label>
              Description
              <textarea required minLength={10} name="description" placeholder="Describe the item, condition, location and important details…" />
            </label>

            <label>
              Photos
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 8))}
              />
              <span className="small"><ImagePlus size={13} /> {files.length} photo(s) selected · automatically optimized + watermarked · up to 8</span>
            </label>

            {message && (
              <div className="notice" style={{ display: 'flex', gap: 9, alignItems: 'flex-start' }}>
                {messageType === 'success' ? <CheckCircle2 size={18} /> : <ShieldCheck size={18} />}
                <span>{message}</span>
              </div>
            )}

            <button
              className="primary"
              disabled={publishing || loadingCategories || categories.length === 0}
              type="submit"
              style={{ justifyContent: 'center', minHeight: 48 }}
            >
              {publishing ? <><Loader2 size={17} className="spin" /> Publishing…</> : <><Plus size={17} /> Publish listing</>}
            </button>

            {messageType === 'success' && !publishing && (
              <Link className="ghost" href="/dashboard" style={{ justifyContent: 'center' }}>
                Open my dashboard
              </Link>
            )}
          </form>
        </div>
      </div>
    </main>
  )
}

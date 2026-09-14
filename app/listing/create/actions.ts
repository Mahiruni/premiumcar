'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function createListing(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login?error=auth')

  const title = String(formData.get('title') || '').trim()
  const description = String(formData.get('description') || '').trim()
  const price = Number(formData.get('price'))
  const city = String(formData.get('city') || '').trim()
  const categoryName = String(formData.get('category') || '').trim()
  const condition = String(formData.get('condition') || 'Used')

  if (title.length < 5 || description.length < 10 || !Number.isFinite(price) || price < 0 || !city || !categoryName) {
    redirect('/sell?error=validation')
  }

  const { data: category } = await supabase.from('categories').select('id').eq('name', categoryName).single()
  if (!category) redirect('/sell?error=category')

  const { data: listing, error } = await supabase.from('listings').insert({
    seller_id: user.id, category_id: category.id, title, description, price, city, condition, status: 'active'
  }).select('id').single()
  if (error || !listing) redirect('/sell?error=create')

  const files = formData.getAll('photos').filter((value): value is File => value instanceof File && value.size > 0).slice(0, 10)
  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) continue
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const path = `${user.id}/${listing.id}/${crypto.randomUUID()}.${ext}`
    const upload = await supabase.storage.from('listing-images').upload(path, file, { contentType: file.type, upsert: false })
    if (!upload.error) await supabase.from('listing_images').insert({ listing_id: listing.id, storage_path: path, sort_order: i })
  }
  redirect(`/listing/${listing.id}`)
}

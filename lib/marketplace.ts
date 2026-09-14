import { createClient } from '@/lib/supabase/server'

export async function getListings(filters?: { q?: string; city?: string; category?: string; max?: number }) {
  const supabase = await createClient()
  let query = supabase.from('listings').select('*, profiles!listings_seller_id_fkey(full_name, username, avatar_url), categories!listings_category_id_fkey(name, slug, icon), listing_images(storage_path, sort_order)').order('created_at', { ascending: false })
  if (filters?.q) query = query.ilike('title', `%${filters.q}%`)
  if (filters?.city && filters.city !== 'All Ethiopia') query = query.eq('city', filters.city)
  if (filters?.category && filters.category !== 'All categories') query = query.eq('categories.name', filters.category)
  if (filters?.max) query = query.lte('price', filters.max)
  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

export async function getCurrentUser() {
  const supabase = await createClient()
  const { data } = await supabase.auth.getUser()
  return data.user ?? null
}

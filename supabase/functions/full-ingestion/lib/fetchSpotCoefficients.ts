// lib/fetchSpotCoefficients.ts
import { supabase } from './supabaseClient.ts'

export async function fetchSpotCoefficients(spot_slug: string) {
  const { data, error } = await supabase
    .from('spot_coefficients')
    .select('c0, c1, c2')
    .eq('spot_slug', spot_slug)
    .single()

  if (error) {
    console.warn(`⚠️ No coefficients for ${spot_slug}: ${error.message}`)
    return null
  }

  return data // { c0: number, c1: number, c2: number }
}

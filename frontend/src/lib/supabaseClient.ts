import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL ?? '') as string
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '') as string

let supabase: SupabaseClient | any = null

if (supabaseUrl && supabaseAnonKey) {
	supabase = createClient(supabaseUrl, supabaseAnonKey)
} else {
	// Prevent runtime crash when environment variables are missing in production.
	// Export a proxy that throws an informative error when any method is invoked.
	console.error('Supabase not configured: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
	const handler: ProxyHandler<any> = {
		get(_, prop) {
			return () => {
				throw new Error(
					'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your deployment environment.'
				)
			}
		}
	}
	supabase = new Proxy({}, handler) as SupabaseClient
}

export { supabase }
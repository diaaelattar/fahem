import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// ⚠️ هذا العميل يستخدم مفتاح الخدمة - لا تستخدمه أبداً في جانب العميل
// يُستخدم فقط في API Routes و Edge Functions على الخادم
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY غير معرّف في متغيرات البيئة')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

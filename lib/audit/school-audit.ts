/**
 * School Audit Logger
 * يُستخدم في API Routes لتسجيل العمليات الحساسة
 * يتوافق مع: ISO 27001 A.12.4 — Logging and Monitoring
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type AuditAction = 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'INVITE' | 'PUBLISH' | 'UNPUBLISH'
export type AuditEntity = 'class' | 'exam' | 'teacher' | 'student' | 'settings' | 'report' | 'invitation'

interface AuditLogEntry {
  schoolId: string
  actorId?: string
  actorEmail?: string
  actorRole?: string
  action: AuditAction
  entityType: AuditEntity
  entityId?: string
  entityName?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * تسجيل حدث أمني في جدول school_audit_logs
 * يُستدعى بعد نجاح أي عملية حساسة في API Routes
 * 
 * @example
 * await logSchoolAudit({
 *   schoolId: profile.school_id,
 *   actorId: user.id,
 *   actorEmail: user.email,
 *   actorRole: profile.role,
 *   action: 'DELETE',
 *   entityType: 'class',
 *   entityId: classId,
 *   entityName: 'فصل 3أ',
 * })
 */
export async function logSchoolAudit(entry: AuditLogEntry): Promise<void> {
  try {
    const adminClient = createAdminClient()

    await adminClient.from('school_audit_logs').insert({
      school_id:   entry.schoolId,
      actor_id:    entry.actorId    ?? null,
      actor_email: entry.actorEmail ?? null,
      actor_role:  entry.actorRole  ?? null,
      action:      entry.action,
      entity_type: entry.entityType,
      entity_id:   entry.entityId   ?? null,
      entity_name: entry.entityName ?? null,
      metadata:    entry.metadata   ?? {},
      ip_address:  entry.ipAddress  ?? null,
      user_agent:  entry.userAgent  ?? null,
    })
  } catch (error) {
    // الـ audit log لا يجب أن يوقف العملية الأصلية أبداً
    // نكتفي بالتسجيل في console
    console.error('[AuditLog] Failed to write audit entry:', error)
  }
}

/**
 * استخراج عنوان IP من request headers
 * يدعم Vercel + Cloudflare + Direct connections
 */
export function getClientIP(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    headers.get('cf-connecting-ip') ||
    'unknown'
  )
}

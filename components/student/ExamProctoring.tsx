'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface Props {
  attemptId: string
}

export function ExamProctoring({ attemptId }: Props) {
  useEffect(() => {
    const supabase = createClient()

    // 1. Log event helper
    const logEvent = async (type: string, details: any = {}) => {
      try {
        await supabase.from('exam_proctoring_events').insert({
          attempt_id: attemptId,
          event_type: type,
          metadata: details,
        })
      } catch (err) {
        console.error('Error logging proctoring event:', err)
      }
    }

    // 2. Tab switching & Minimize detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast.warning(
          '⚠️ تحذير: تم رصد الخروج من تبويب الاختبار. يرجى عدم تكرار ذلك لتجنب إلغاء الاختبار!',
          {
            duration: 6000,
            position: 'top-center',
          }
        )
        logEvent('tab_switch', { timestamp: new Date().toISOString() })
      }
    }

    // 3. Window blur detection (focus loss)
    const handleBlur = () => {
      toast.warning(
        '⚠️ تحذير: تم رصد فقدان التركيز عن نافذة الاختبار. يرجى التركيز في صفحة الحل!',
        {
          duration: 6000,
          position: 'top-center',
        }
      )
      logEvent('blur', { timestamp: new Date().toISOString() })
    }

    // 4. Prevent right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      toast.error(
        '❌ عذراً: النسخ أو تصوير الشاشة غير مسموح به أثناء الاختبار.',
        {
          position: 'top-center',
        }
      )
      logEvent('right_click', { timestamp: new Date().toISOString() })
    }

    // 5. Prevent copying
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault()
      toast.error('❌ عذراً: لا يمكنك نسخ نصوص أسئلة الاختبار.', {
        position: 'top-center',
      })
      logEvent('copy_attempt', { timestamp: new Date().toISOString() })
    }

    // 6. Block developer tools keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        toast.error('❌ عذراً: غير مسموح بفتح أدوات المطور أثناء الاختبار.', {
          position: 'top-center',
        })
        logEvent('devtools_attempt', { key: 'F12', timestamp: new Date().toISOString() })
      }
      if (
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C' || e.key === 'i' || e.key === 'j' || e.key === 'c')) ||
        (e.ctrlKey && (e.key === 'u' || e.key === 'U'))
      ) {
        e.preventDefault()
        toast.error('❌ عذراً: غير مسموح بفتح أدوات المطور أو عرض المصدر أثناء الاختبار.', {
          position: 'top-center',
        })
        logEvent('devtools_attempt', {
          key: `${e.ctrlKey ? 'Ctrl+' : ''}${e.shiftKey ? 'Shift+' : ''}${e.key}`,
          timestamp: new Date().toISOString(),
        })
      }
    }

    // Attach listeners
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('copy', handleCopy)
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup listeners
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('copy', handleCopy)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [attemptId])

  // This is a behavioral tracker, it does not render visible elements
  return null
}

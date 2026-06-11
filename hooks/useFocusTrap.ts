'use client'

/**
 * useFocusTrap — WCAG 2.1 SC 2.1.2 No Keyboard Trap
 * يُبقي التركيز (focus) داخل المودال طالما كان مفتوحاً
 * يدعم: Tab، Shift+Tab، Escape لإغلاق المودال
 *
 * @example
 * const modalRef = useRef<HTMLDivElement>(null)
 * useFocusTrap(modalRef, isOpen, onClose)
 */

import { useEffect, RefObject } from 'react'

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  'details > summary',
].join(', ')

export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  onEscape?: () => void
) {
  useEffect(() => {
    if (!isActive || !ref.current) return

    const container = ref.current

    // حفظ العنصر الذي كان نشطاً قبل فتح المودال لاستعادته عند الإغلاق
    const previouslyFocused = document.activeElement as HTMLElement | null

    // التركيز على أول عنصر قابل للتفاعل في المودال
    const focusableElements = Array.from(
      container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
    ).filter((el) => !el.closest('[aria-hidden="true"]'))

    if (focusableElements.length > 0) {
      // تأخير بسيط للسماح لـ DOM بالاستقرار
      const timer = setTimeout(() => focusableElements[0].focus(), 50)
      return () => clearTimeout(timer)
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape يغلق المودال
      if (e.key === 'Escape' && onEscape) {
        e.preventDefault()
        onEscape()
        return
      }

      // Tab يدور داخل المودال فقط
      if (e.key !== 'Tab') return

      const focusable = Array.from(
        container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest('[aria-hidden="true"]'))

      if (focusable.length === 0) {
        e.preventDefault()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const current = document.activeElement

      if (e.shiftKey) {
        // Shift+Tab: إذا كنا على أول عنصر، انتقل للأخير
        if (current === first || !container.contains(current)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        // Tab: إذا كنا على آخر عنصر، انتقل للأول
        if (current === last || !container.contains(current)) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      // استعادة التركيز على العنصر الأصلي عند الإغلاق
      if (previouslyFocused && 'focus' in previouslyFocused) {
        previouslyFocused.focus()
      }
    }
  }, [isActive, onEscape, ref])
}

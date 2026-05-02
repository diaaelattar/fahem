'use client'

import React from 'react'
import 'katex/dist/katex.min.css'
// @ts-ignore
import { InlineMath, BlockMath } from 'react-katex'

declare module 'react-katex';

interface MathRendererProps {
  text: string
  className?: string
}

/**
 * MathRenderer component
 * Parses text and renders LaTeX segments using KaTeX.
 * Supports:
 * - \[ ... \] for block math
 * - \( ... \) for inline math
 * - Checks for common LaTeX patterns in case delimiters are missing (fallback)
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '' }) => {
  if (!text) return null

  // Regex لتحديد كل أنواع محددات LaTeX الممكنة في مجموعة التقاط واحدة لتجنب تكرار الأجزاء
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$.*?\$|\\\(.*?\\\)|\(\s*[^\)]*?[\=\>\<:\^\_\\][^\)]*?\)|\(\s*[^\)]*?\.\.\.[^\)]*?\))/g
  const parts = text.split(regex).filter(part => part !== undefined)

  return (
    <div className={`math-container dir-rtl text-right leading-relaxed ${className}`}>
      {/* Fallback to hide MathML if global CSS has conflicts */}
      <style dangerouslySetInnerHTML={{ __html: `.katex-mathml { display: none !important; }` }} />
      {parts.map((part, index) => {
        // التحقق من أن هذا الجزء هو تعبير رياضي وليس نصاً عادياً
        const isMath = regex.test(part)
        // يجب تصفير الـ lastIndex لأننا نستخدم g flag
        regex.lastIndex = 0

        if (isMath) {
          let math = part
          // تنظيف المحددات ومعالجة كل نوع
          if (math.startsWith('$$') && math.endsWith('$$')) {
             return <div key={index} className="my-2 overflow-x-auto" dir="ltr"><BlockMath math={math.slice(2, -2).trim()} /></div>
          }
          if (math.startsWith('\\[') && math.endsWith('\\]')) {
             return <div key={index} className="my-2 overflow-x-auto" dir="ltr"><BlockMath math={math.slice(2, -2).trim()} /></div>
          }
          if (math.startsWith('\\(') && math.endsWith('\\)')) {
             return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={math.slice(2, -2).trim()} /></span>
          }
          if (math.startsWith('$') && math.endsWith('$')) {
             return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={math.slice(1, -1).trim()} /></span>
          }
          if (math.startsWith('(') && math.endsWith(')')) {
             return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={math.slice(1, -1).trim()} /></span>
          }
        }

        // نص عادي
        return <span key={index} className="align-middle">{part}</span>
      })}
    </div>
  )
}

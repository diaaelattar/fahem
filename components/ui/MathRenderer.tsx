'use client'

import React from 'react'
import 'katex/dist/katex.min.css'
// @ts-ignore
import { InlineMath, BlockMath } from 'react-katex'

declare module 'react-katex';

interface MathRendererProps {
  text: string
  className?: string
  dir?: 'rtl' | 'ltr' | 'auto'
}

/**
 * MathRenderer component
 * Parses text and renders LaTeX segments using KaTeX.
 * Supports:
 * - \[ ... \] for block math
 * - \( ... \) for inline math
 * - Checks for common LaTeX patterns in case delimiters are missing (fallback)
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ text, className = '', dir }) => {
  if (!text) return null

  // دالة مساعدة لتقديم النصوص المنسقة (غامق، مائل، تحته خط) بأمان
  const renderFormattedText = (rawText: string) => {
    const formatRegex = /(<u>.*?<\/u>|<b>.*?<\/b>|<i>.*?<\/i>|<strong>.*?<\/strong>)/g;
    const segments = rawText.split(formatRegex).filter(Boolean);
    
    return segments.map((segment, i) => {
      if (segment.startsWith('<u>') && segment.endsWith('</u>')) {
        return <u key={i} className="underline underline-offset-4 decoration-primary decoration-2 font-bold">{segment.slice(3, -4)}</u>;
      }
      if (segment.startsWith('<b>') && segment.endsWith('</b>')) {
        return <strong key={i} className="font-black">{segment.slice(3, -4)}</strong>;
      }
      if (segment.startsWith('<strong>') && segment.endsWith('</strong>')) {
        return <strong key={i} className="font-black">{segment.slice(8, -9)}</strong>;
      }
      if (segment.startsWith('<i>') && segment.endsWith('</i>')) {
        return <i key={i}>{segment.slice(3, -4)}</i>;
      }
      return <React.Fragment key={i}>{segment}</React.Fragment>;
    });
  };

  // Regex لتحديد كل أنواع محددات LaTeX الممكنة في مجموعة التقاط واحدة لتجنب تكرار الأجزاء
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$.*?\$|\\\(.*?\\\)|\(\s*[^\)]*?[\=\>\<:\^\_\\][^\)]*?\)|\(\s*[^\)]*?\.\.\.[^\)]*?\))/g
  const parts = text.split(regex).filter(part => part !== undefined)

  return (
    <div className={`math-container text-start leading-relaxed ${className}`} dir={dir ?? 'auto'}>
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
        return <span key={index} className="align-middle" dir="auto">{renderFormattedText(part)}</span>
      })}
    </div>
  )
}

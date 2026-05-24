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
 * يُصحح محتوى LaTeX بحيث تُلفّ أي أحرف عربية أو غير-ASCII داخل $...$ بأمر \text{}
 * تجنباً لتحذير KaTeX "Unrecognized Unicode character"
 */
function sanitizeLatex(math: string): string {
  // يلتقط أي سلسلة متواصلة من الأحرف غير-ASCII (عربية، أمازيغية، فارسية، إلخ)
  // ويلفّها داخل \text{...} إذا لم تكن مسبوقة بأمر LaTeX بالفعل
  return math.replace(
    /(?<!\\text\{)(?<!\\mathrm\{)([\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\u0080-\u024F]+)/g,
    (match) => `\\text{${match}}`
  )
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
      // معالجة النزول لسطر جديد (Newlines) والتعرف الذكي على الشعر
      if (segment.includes('\n')) {
        const lines = segment.split('\n');
        
        // التحقق الذكي من أن النص هو شعر
        // الشروط: أكثر من سطر، كل السطور طولها مناسب، لا تبدأ بترقيم، ولا تحتوي على إنجليزية
        const nonEmptyLines = lines.filter(l => l.trim().length > 0);
        const isLikelyPoetry = nonEmptyLines.length >= 2 && 
                               nonEmptyLines.every(l => {
                                  const t = l.trim();
                                  // السطر أطول من 5 وأقصر من 80 حرف
                                  return t.length >= 5 && t.length <= 80 && !/^[-*•\d]/.test(t) && !/[a-zA-Z]/.test(t);
                               });

        if (isLikelyPoetry) {
          return (
            <div key={i} className="my-4 space-y-2 text-center w-full">
              {lines.map((line, j) => {
                const trimmedLine = line.trim();
                if (trimmedLine === '') return <div key={j} className="h-2"></div>;
                
                // التنسيق المتقابل إذا كان يحتوي على رمز فاصل بين الشطرين
                const separator = trimmedLine.includes('*') ? '*' : 
                                  trimmedLine.includes('=') ? '=' : 
                                  trimmedLine.includes('...') ? '...' : null;
                
                if (separator) {
                  const parts = trimmedLine.split(separator);
                  if (parts.length === 2) {
                    return (
                      <div key={j} className="flex justify-between md:justify-center md:gap-24 w-full px-2 py-1">
                        <span className="flex-1 text-right md:text-left text-lg font-bold text-slate-800 leading-loose">{parts[0].trim()}</span>
                        <span className="flex-1 text-left md:text-right text-lg font-bold text-slate-800 leading-loose">{parts[1].trim()}</span>
                      </div>
                    );
                  }
                }

                // التوسيط الافتراضي للأبيات
                return (
                  <div key={j} className="text-lg font-bold text-slate-800 leading-loose">
                    {line}
                  </div>
                );
              })}
            </div>
          )
        }

        // الإرجاع العادي للنصوص غير الشعرية
        return (
          <React.Fragment key={i}>
            {lines.map((line, j, arr) => (
              <React.Fragment key={j}>
                {line}
                {j < arr.length - 1 && <br />}
              </React.Fragment>
            ))}
          </React.Fragment>
        )
      }
      return <React.Fragment key={i}>{segment}</React.Fragment>;
    });
  };

  // Regex لتحديد كل أنواع محددات LaTeX الممكنة بالإضافة إلى الأنماط الرياضية غير المحاطة بمحددات
  // 1. $$...$$
  // 2. \[...\]
  // 3. $...$
  // 4. \(...\)
  // 5. (...) تحتوي على رموز رياضية مثل =, >, <, ^, _
  // 6. (...) تحتوي على ...
  // 7. الأقواس بجميع أشكالها (هلالية، مربعة، أو فترات مفتوحة/مغلقة) التي تحتوي على أرقام وحروف إنجليزية وعلامات فقط (مثل الفترات [1, 2[ أو الأزواج (2, 5))
  // 8. الحروف الإنجليزية الفردية المستقلة (مثل X أو Y)
  const regex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$[\s\S]*?\$|\\\([\s\S]*?\\\)|\(\s*[^$\)]*?[\=\>\<:\^\_\\][^$\)]*?\)|\(\s*[^$\)]*?\.\.\.[^$\)]*?\)|[\[\]\(]\s*[-+]?[a-zA-Z0-9\s\.,\+\-\*\/]+\s*[\]\[\)]|\b[a-zA-Z]\b)/g
  
  // تقسيم النص أولاً إلى مقاطع تحتوي على رسوم بيانية SVG ومقاطع نصية عادية
  const svgRegex = /(<svg[\s\S]*?<\/svg>)/g
  const segments = text.split(svgRegex).filter(part => part !== undefined)

  return (
    <div className={`math-container text-start leading-relaxed whitespace-pre-wrap ${className}`} dir={dir ?? 'auto'}>
      {/* Fallback to hide MathML if global CSS has conflicts */}
      <style dangerouslySetInnerHTML={{ __html: `.katex-mathml { display: none !important; }` }} />
      {segments.map((segment, segIdx) => {
        const isSvg = segment.trim().startsWith('<svg') && segment.trim().endsWith('</svg>')
        
        if (isSvg) {
          return (
            <div 
              key={`svg-${segIdx}`} 
              className="my-4 flex justify-center bg-indigo-50/20 border border-indigo-100/50 rounded-2xl p-4 shadow-inner max-w-full overflow-x-auto" 
              dir="ltr"
              dangerouslySetInnerHTML={{ __html: segment }} 
            />
          )
        }

        // إذا لم يكن SVG، نقوم بمعالجته عبر نظام الـ LaTeX العادي
        const parts = segment.split(regex).filter(part => part !== undefined)
        
        return (
          <React.Fragment key={`text-seg-${segIdx}`}>
            {parts.map((part, index) => {
              const isMath = regex.test(part)
              regex.lastIndex = 0

              if (isMath) {
                let math = part
                if (math.startsWith('$$') && math.endsWith('$$')) {
                   const cleaned = sanitizeLatex(math.slice(2, -2).trim())
                   return <div key={index} className="my-2 overflow-x-auto" dir="ltr"><BlockMath math={cleaned} errorColor="#cc0000" /></div>
                }
                else if (math.startsWith('\\[') && math.endsWith('\\]')) {
                   const cleaned = sanitizeLatex(math.slice(2, -2).trim())
                   return <div key={index} className="my-2 overflow-x-auto" dir="ltr"><BlockMath math={cleaned} errorColor="#cc0000" /></div>
                }
                else if (math.startsWith('\\(') && math.endsWith('\\)')) {
                   const cleaned = sanitizeLatex(math.slice(2, -2).trim())
                   return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={cleaned} errorColor="#cc0000" /></span>
                }
                else if (math.startsWith('$') && math.endsWith('$')) {
                   const cleaned = sanitizeLatex(math.slice(1, -1).trim())
                   return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={cleaned} errorColor="#cc0000" /></span>
                }
                else {
                   const cleaned = sanitizeLatex(math.trim())
                   return <span key={index} className="inline-block px-1 align-middle" dir="ltr"><InlineMath math={cleaned} errorColor="#cc0000" /></span>
                }
              }

              return <span key={index} className="align-middle" dir="auto">{renderFormattedText(part)}</span>
            })}
          </React.Fragment>
        )
      })}
    </div>
  )
}

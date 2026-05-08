'use client'

import React from 'react'

interface MathKeyboardProps {
  onInsert: (symbol: string) => void
  className?: string
}

const MATH_SYMBOLS = [
  { label: '+', value: '+' },
  { label: '−', value: '-' },
  { label: '×', value: '\\times ' },
  { label: '÷', value: '\\div ' },
  { label: '=', value: '=' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '(', value: '(' },
  { label: ')', value: ')' },
  { label: 'x²', value: '^2' },
  { label: 'xʸ', value: '^' },
  { label: '√', value: '\\sqrt{}' },
  { label: 'π', value: '\\pi ' },
  { label: 'كسر', value: '\\frac{}{}' },
]

export function MathKeyboard({ onInsert, className = '' }: MathKeyboardProps) {
  return (
    <div className={`bg-slate-50 border border-slate-200 rounded-xl p-2 flex flex-wrap gap-1.5 ${className}`}>
      {MATH_SYMBOLS.map((sym, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onInsert(sym.value)
          }}
          className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition-colors shadow-sm active:scale-95"
          dir="ltr"
        >
          {sym.label}
        </button>
      ))}
    </div>
  )
}

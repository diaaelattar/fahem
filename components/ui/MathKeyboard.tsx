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
    <div
      className={`flex flex-wrap gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-2 ${className}`}
    >
      {MATH_SYMBOLS.map((sym, i) => (
        <button
          key={i}
          type="button"
          onClick={(e) => {
            e.preventDefault()
            onInsert(sym.value)
          }}
          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 shadow-sm transition-colors hover:border-primary hover:bg-primary hover:text-white active:scale-95"
          dir="ltr"
        >
          {sym.label}
        </button>
      ))}
    </div>
  )
}

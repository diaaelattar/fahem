import React from 'react'

export const metadata = {
  title: 'معاينة وطباعة ورقة الاختبار | استباق مصر',
}

export default function PrintIsolatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      dir="rtl"
      className="min-h-screen bg-slate-100 p-0 m-0 font-sans text-slate-900 print:bg-white print:p-0 print:m-0 print:min-h-0"
    >
      {children}
    </div>
  )
}

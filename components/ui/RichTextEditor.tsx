'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
} from 'lucide-react'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'اكتب هنا...',
  minHeight = 'min-h-[150px]',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        defaultAlignment: 'right',
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: `prose prose-sm sm:prose-base max-w-none focus:outline-none w-full p-4 ${minHeight}`,
        dir: 'auto',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) {
    return null
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive('bold') ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive('italic') ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive('strike') ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <Strikethrough className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <AlignRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <AlignCenter className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <AlignLeft className="h-4 w-4" />
        </button>

        <div className="mx-1 h-6 w-px bg-border" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive('bulletList') ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`rounded-lg p-2 transition-colors hover:bg-slate-200 ${editor.isActive('orderedList') ? 'bg-slate-200 text-primary' : 'text-slate-600'}`}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      {/* Editor Content */}
      <div className="cursor-text" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

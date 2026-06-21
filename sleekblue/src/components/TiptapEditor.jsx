import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Link } from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

const PRI = '#7B2FBE'

const BTN = ({ active, onClick, title, children }) => (
  <button
    type="button"
    onMouseDown={e => { e.preventDefault(); onClick() }}
    title={title}
    style={{
      padding: '5px 9px', borderRadius: '6px', border: 'none',
      background: active ? PRI : 'transparent',
      color: active ? '#fff' : '#444',
      cursor: 'pointer', fontSize: '13px', fontWeight: 600,
      lineHeight: 1, minWidth: '28px',
    }}
  >{children}</button>
)

export default function TiptapEditor({ value, onChange, placeholder = 'Start writing your post…', height = 420 }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: false }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'tiptap-link' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange && onChange(editor.getHTML()),
  })

  if (!editor) return null

  function setLink() {
    const url = window.prompt('Enter URL:', editor.getAttributes('link').href || 'https://')
    if (url === null) return
    if (url === '') { editor.chain().focus().unsetLink().run(); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const toolGroups = [
    [
      { label: 'B', title: 'Bold', active: editor.isActive('bold'), fn: () => editor.chain().focus().toggleBold().run() },
      { label: 'I', title: 'Italic', active: editor.isActive('italic'), fn: () => editor.chain().focus().toggleItalic().run() },
      { label: 'S', title: 'Strikethrough', active: editor.isActive('strike'), fn: () => editor.chain().focus().toggleStrike().run() },
      { label: '`', title: 'Code', active: editor.isActive('code'), fn: () => editor.chain().focus().toggleCode().run() },
    ],
    [
      { label: 'H2', title: 'Heading 2', active: editor.isActive('heading', { level: 2 }), fn: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
      { label: 'H3', title: 'Heading 3', active: editor.isActive('heading', { level: 3 }), fn: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
      { label: '¶', title: 'Paragraph', active: editor.isActive('paragraph'), fn: () => editor.chain().focus().setParagraph().run() },
    ],
    [
      { label: '• List', title: 'Bullet List', active: editor.isActive('bulletList'), fn: () => editor.chain().focus().toggleBulletList().run() },
      { label: '1. List', title: 'Ordered List', active: editor.isActive('orderedList'), fn: () => editor.chain().focus().toggleOrderedList().run() },
      { label: '" "', title: 'Blockquote', active: editor.isActive('blockquote'), fn: () => editor.chain().focus().toggleBlockquote().run() },
    ],
    [
      { label: '🔗', title: 'Link', active: editor.isActive('link'), fn: setLink },
      { label: '—', title: 'Divider', active: false, fn: () => editor.chain().focus().setHorizontalRule().run() },
    ],
    [
      { label: '↩', title: 'Undo', active: false, fn: () => editor.chain().focus().undo().run() },
      { label: '↪', title: 'Redo', active: false, fn: () => editor.chain().focus().redo().run() },
    ],
  ]

  return (
    <div style={{ border: '1.5px solid #ddd', borderRadius: '10px', overflow: 'hidden', background: '#fff' }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px', padding: '8px 10px', borderBottom: '1px solid #eee', background: '#f9f5ff', alignItems: 'center' }}>
        {toolGroups.map((group, gi) => (
          <span key={gi} style={{ display: 'flex', gap: '2px', alignItems: 'center' }}>
            {gi > 0 && <span style={{ width: '1px', height: '18px', background: '#ddd', margin: '0 4px' }} />}
            {group.map(t => (
              <BTN key={t.label} active={t.active} onClick={t.fn} title={t.title}>{t.label}</BTN>
            ))}
          </span>
        ))}
      </div>

      {/* Editor area */}
      <style>{`
        .ProseMirror { outline: none; min-height: ${height}px; padding: 16px 18px; font-family: 'HubotSans', sans-serif; font-size: 14px; line-height: 1.7; color: #222; }
        .ProseMirror h2 { font-size: 20px; font-weight: 800; margin: 20px 0 10px; }
        .ProseMirror h3 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; }
        .ProseMirror p { margin: 0 0 12px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 22px; margin-bottom: 12px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote { border-left: 4px solid ${PRI}; padding-left: 14px; color: #666; margin: 12px 0; font-style: italic; }
        .ProseMirror code { background: #f0e8ff; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
        .ProseMirror pre { background: #1a1a2e; color: #e0e0e0; padding: 14px 16px; border-radius: 8px; overflow-x: auto; font-size: 13px; }
        .ProseMirror hr { border: none; border-top: 2px solid #e0d6f5; margin: 20px 0; }
        .tiptap-link { color: ${PRI}; text-decoration: underline; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); float: left; color: #bbb; pointer-events: none; height: 0; }
      `}</style>
      <EditorContent editor={editor} />
    </div>
  )
}

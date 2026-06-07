import { useState, useEffect, useCallback, useRef, useMemo, Component } from 'react';
import React from 'react';
import { useNotesStore } from '../store/useNotesStore';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Plus, Search, Pin, Trash2, Tag, Bold, Italic, Underline as UnderlineIcon, Strikethrough, List, ListOrdered, Quote, Code, Highlighter, AlignLeft, AlignCenter, AlignRight, FileText } from 'lucide-react';

const CATEGORIES = [
  { id: 'all', name: 'All Notes' },
  { id: 'study', name: 'Study Notes' },
  { id: 'project', name: 'Project Ideas' },
  { id: 'business', name: 'Business Ideas' },
  { id: 'journal', name: 'Personal Journal' },
];

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Notes ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl text-red-200 space-y-4">
          <h2 className="text-lg font-bold">Something went wrong in the Notes Editor:</h2>
          <p className="text-sm">Please copy the error message below and report it:</p>
          <pre className="text-xs p-4 bg-black/40 rounded-xl overflow-auto max-w-full font-mono">
            {this.state.error?.stack || this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => {
              if(confirm("This will reset your notes data to fix the crash. Continue?")) {
                localStorage.removeItem('lifeos-notes');
                window.location.reload();
              }
            }}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-sm font-bold transition-all mt-4 block"
          >
            Clear Data & Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function NotesInner() {
  const { notes = [], activeCategory = 'all', setActiveCategory, addNote, updateNote, deleteNote, togglePin, getFilteredNotes } = useNotesStore();

  const safeNotes = Array.isArray(notes) ? notes : [];
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [isEditingTags, setIsEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const saveTimeoutRef = useRef(null);

  let filteredNotes = [];
  try {
    filteredNotes = getFilteredNotes ? getFilteredNotes(searchQuery, activeCategory) : safeNotes;
  } catch(e) {
    filteredNotes = safeNotes;
  }

  const selectedNote = safeNotes.find(n => n?.id === selectedNoteId) || null;

  const extensionsList = useMemo(() => {
    const list = [];
    try {
      if (typeof StarterKit !== 'undefined' && StarterKit.configure) list.push(StarterKit.configure());
      else if (typeof StarterKit !== 'undefined') list.push(StarterKit);
      if (typeof Underline !== 'undefined' && Underline.configure) list.push(Underline.configure());
      if (typeof TextAlign !== 'undefined' && TextAlign.configure) list.push(TextAlign.configure({ types: ['heading', 'paragraph'] }));
      if (typeof Highlight !== 'undefined' && Highlight.configure) list.push(Highlight.configure());
      if (typeof Color !== 'undefined' && Color.configure) list.push(Color.configure());
      if (typeof TextStyle !== 'undefined' && TextStyle.configure) list.push(TextStyle.configure());
      if (typeof Placeholder !== 'undefined' && Placeholder.configure) list.push(Placeholder.configure({ placeholder: 'Start typing your note...' }));
    } catch(e) {
      console.error("Error loading TipTap extensions", e);
    }
    return list;
  }, []);

  const editor = useEditor({
    extensions: extensionsList,
    content: selectedNote?.content || '',
    editorProps: {
      transformPastedHTML(html) {
        // Strip inline styles and classes from pasted content so
        // external fonts/colors don't override the editor's own styling.
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        doc.querySelectorAll('*').forEach(el => {
          el.removeAttribute('style');
          el.removeAttribute('class');
          el.removeAttribute('color');
          el.removeAttribute('face');
          el.removeAttribute('size');
        });
        return doc.body.innerHTML;
      },
    },
    onUpdate: ({ editor }) => {
      if (selectedNoteId) {
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          updateNote(selectedNoteId, { content: editor.getHTML() });
        }, 1000);
      }
    }
  }, [selectedNoteId]);

  useEffect(() => {
    if (editor && !editor.isDestroyed && selectedNote && selectedNote.content !== undefined) {
      try {
        const currentContent = editor.getHTML();
        if (currentContent !== selectedNote.content) {
          editor.commands.setContent(selectedNote.content);
        }
      } catch (e) {
        // TipTap might throw if schema isn't fully ready when calling getHTML
        console.warn("Could not get HTML, forcing content update:", e);
        try {
          editor.commands.setContent(selectedNote.content);
        } catch(err) {}
      }
    }
  }, [selectedNoteId, editor]);

  useEffect(() => {
    if (filteredNotes.length > 0 && !selectedNoteId) {
      if (filteredNotes[0] && filteredNotes[0].id) {
        setSelectedNoteId(filteredNotes[0].id);
      }
    }
  }, [filteredNotes, selectedNoteId]);

  const handleCreateNote = () => {
    const newNote = {
      title: 'New Note',
      content: '<p></p>',
      category: activeCategory === 'all' ? 'study' : activeCategory,
      tags: [],
    };
    addNote(newNote);
    setTimeout(() => {
      const allNotes = useNotesStore.getState().notes;
      if (allNotes && allNotes[0]) setSelectedNoteId(allNotes[0].id);
    }, 50);
  };

  const handleSaveTags = () => {
    if (selectedNote) {
      const tags = tagInput.split(',').map(t => t.trim()).filter(t => t.length > 0);
      updateNote(selectedNote.id, { tags });
      setIsEditingTags(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-6 page-enter">
      <div className="w-80 flex flex-col gap-4 border-r border-surface-border pr-6 flex-shrink-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-fg flex items-center gap-2">
            <FileText size={20} className="text-primary-500" /> Second Brain
          </h2>
          <button onClick={handleCreateNote} className="btn-icon bg-primary-500/10 text-primary-400 hover:bg-primary-500/20">
            <Plus size={18} />
          </button>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-3 text-fg-3" />
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search notes or tags..."
            className="input pl-10 py-2 text-xs"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                if (setActiveCategory) setActiveCategory(cat.id);
                setSelectedNoteId(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                activeCategory === cat.id
                  ? 'bg-primary-500/20 text-primary-400 border border-primary-500/30'
                  : 'bg-surface-secondary text-fg-3 hover:text-fg border border-transparent'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {filteredNotes.length === 0 ? (
            <div className="text-center py-10 text-fg-3 text-xs">
              <p>No notes found. Create one!</p>
            </div>
          ) : (
            filteredNotes.map(note => {
              if (!note) return null;
              
              let dateStr = '';
              try {
                dateStr = format(new Date(note.createdAt || new Date()), 'dd MMM yyyy');
              } catch (e) {
                dateStr = 'Unknown date';
              }

              const safeTags = Array.isArray(note.tags) ? note.tags : [];

              return (
                <div
                  key={note.id || Math.random()}
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative group ${
                    selectedNoteId === note.id
                      ? 'border-primary-500/30 bg-primary-500/5'
                      : 'border-surface bg-surface-secondary/40 hover:bg-surface-secondary'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h4 className="font-bold text-sm text-fg truncate flex-1">{note.title || 'Untitled'}</h4>
                    {note.pinned && <Pin size={12} className="text-yellow-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-fg-3 truncate mb-2" dangerouslySetInnerHTML={{ __html: note.content || 'No content' }} />
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-fg-3">{dateStr}</span>
                    <div className="flex gap-1">
                      {safeTags.slice(0, 2).map((t, idx) => (
                        <span key={idx} className="badge bg-surface-border text-[9px]">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-surface rounded-2xl border border-surface-border overflow-hidden">
        {selectedNote ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div className="p-4 border-b border-surface-border flex flex-col gap-3">
              <div className="flex justify-between items-start">
                <input
                  value={selectedNote.title || ''}
                  onChange={e => updateNote(selectedNote.id, { title: e.target.value })}
                  placeholder="Note Title..."
                  className="bg-transparent text-xl font-bold border-0 outline-none w-full text-fg"
                />
                <div className="flex gap-1">
                  <button
                    onClick={() => togglePin(selectedNote.id)}
                    className={`btn-icon ${selectedNote.pinned ? 'text-yellow-500' : 'text-fg-3 hover:text-fg'}`}
                  >
                    <Pin size={16} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Delete note?')) {
                        deleteNote(selectedNote.id);
                        setSelectedNoteId(null);
                      }
                    }}
                    className="btn-icon text-fg-3 hover:text-red-400"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-fg-2">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg-3">Category:</span>
                  <select
                    value={selectedNote.category || 'study'}
                    onChange={e => updateNote(selectedNote.id, { category: e.target.value })}
                    className="bg-transparent border-0 outline-none font-bold text-primary-400 cursor-pointer"
                  >
                    <option value="study">Study Notes</option>
                    <option value="project">Project Ideas</option>
                    <option value="business">Business Ideas</option>
                    <option value="journal">Personal Journal</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-semibold text-fg-3 flex items-center gap-0.5"><Tag size={12} /> Tags:</span>
                  {isEditingTags ? (
                    <div className="flex items-center gap-1">
                      <input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        placeholder="tag1, tag2..."
                        className="input py-0.5 px-2 text-[10px] w-28"
                        onBlur={handleSaveTags}
                        onKeyDown={e => e.key === 'Enter' && handleSaveTags()}
                        autoFocus
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 flex-wrap cursor-pointer" onClick={() => {
                      setTagInput(Array.isArray(selectedNote.tags) ? selectedNote.tags.join(', ') : '');
                      setIsEditingTags(true);
                    }}>
                      {!selectedNote.tags || selectedNote.tags.length === 0 ? (
                        <span className="text-fg-3 italic">Add tags...</span>
                      ) : (
                        (Array.isArray(selectedNote.tags) ? selectedNote.tags : []).map((t, idx) => (
                          <span key={idx} className="badge badge-primary text-[10px]">{t}</span>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {editor && (
              <div className="flex flex-wrap items-center gap-1 p-2 bg-surface-secondary/40 border-b border-surface-border text-fg-2">
                <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('bold') ? 'bg-surface-border' : ''}`}><Bold size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('italic') ? 'bg-surface-border' : ''}`}><Italic size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('underline') ? 'bg-surface-border' : ''}`}><UnderlineIcon size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleStrike().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('strike') ? 'bg-surface-border' : ''}`}><Strikethrough size={14} /></button>

                <div className="w-px h-4 bg-surface-border mx-1" />

                <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`p-1.5 rounded hover:bg-surface-border font-extrabold ${editor.isActive('heading', { level: 1 }) ? 'bg-surface-border' : ''}`}>H1</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`p-1.5 rounded hover:bg-surface-border font-bold ${editor.isActive('heading', { level: 2 }) ? 'bg-surface-border' : ''}`}>H2</button>
                <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`p-1.5 rounded hover:bg-surface-border font-semibold ${editor.isActive('heading', { level: 3 }) ? 'bg-surface-border' : ''}`}>H3</button>

                <div className="w-px h-4 bg-surface-border mx-1" />

                <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('bulletList') ? 'bg-surface-border' : ''}`}><List size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('orderedList') ? 'bg-surface-border' : ''}`}><ListOrdered size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('blockquote') ? 'bg-surface-border' : ''}`}><Quote size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleCodeBlock().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('codeBlock') ? 'bg-surface-border' : ''}`}><Code size={14} /></button>
                <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive('highlight') ? 'bg-surface-border' : ''}`}><Highlighter size={14} /></button>

                <div className="w-px h-4 bg-surface-border mx-1" />

                <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive({ textAlign: 'left' }) ? 'bg-surface-border' : ''}`}><AlignLeft size={14} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive({ textAlign: 'center' }) ? 'bg-surface-border' : ''}`}><AlignCenter size={14} /></button>
                <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-1.5 rounded hover:bg-surface-border ${editor.isActive({ textAlign: 'right' }) ? 'bg-surface-border' : ''}`}><AlignRight size={14} /></button>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-6">
              <EditorContent editor={editor} />
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col justify-center items-center text-fg-3">
            <FileText size={48} className="stroke-[1.5] mb-2" />
            <p className="text-sm">Create a new note or select one from the side list to begin.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Notes() {
  return (
    <ErrorBoundary>
      <NotesInner />
    </ErrorBoundary>
  );
}

"use client";

import * as React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Plus, Search, Image as ImageIcon, Quote, Minus, List, ListOrdered, Paperclip } from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";

interface DescriptionModalV2Props {
    isOpen: boolean;
    onClose: () => void;
    value: string;
    onChange: (val: string) => void;
    onOpenAI: () => void;
}

export default function DescriptionModalV2({ isOpen, onClose, value, onChange, onOpenAI }: DescriptionModalV2Props) {
    const [localValue, setLocalValue] = useState(value);
    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        // Detect dark mode on every open (and re-check dynamically)
        const check = () => {
            const dark =
                document.documentElement.classList.contains("dark") ||
                document.body.classList.contains("dark") ||
                !!document.querySelector("[data-theme-dark=\"true\"]") ||
                !!document.querySelector("[data-theme-warp=\"true\"]") ||
                document.documentElement.getAttribute("data-theme") === "dark";
            setIsDark(dark);
        };
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
        return () => observer.disconnect();
    }, [isOpen]);

    const editorRef = useRef<HTMLDivElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const [floatingTop, setFloatingTop] = useState(0);
    const [floatingTopModal, setFloatingTopModal] = useState(0);
    const [isFloatingVisible, setIsFloatingVisible] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [openUpwards, setOpenUpwards] = useState(false);

    const isMenuOpenRef = useRef(isMenuOpen);
    useEffect(() => {
        isMenuOpenRef.current = isMenuOpen;
    }, [isMenuOpen]);

    const editor = useEditor({
        extensions: [
            StarterKit,
            ImageExtension,
            Placeholder.configure({
                placeholder: 'Quem deve vir? Do que se trata o evento?',
            }),
        ],
        content: value,
        onUpdate: ({ editor }) => {
            setLocalValue(editor.getHTML());
            setTimeout(updateFloatingButton, 10);
        },
        onSelectionUpdate: () => {
            updateFloatingButton();
        },
        onFocus: () => {
            updateFloatingButton();
        },
        onBlur: () => {
            setTimeout(() => {
                if (isMenuOpenRef.current) return;
                if (!document.activeElement?.closest('.plus-menu-container') &&
                    !document.activeElement?.closest('.notion-dropdown-menu')) {
                    setIsFloatingVisible(false);
                }
            }, 200);
        },
        editorProps: {
            attributes: {
                class: `tiptap prose focus:outline-none min-h-[260px] pl-[44px] pr-4 py-3 text-[1rem] leading-relaxed`,
            },
        },
    }, [isOpen]);

    const updateFloatingButton = useCallback(() => {
        if (!editor || !editorRef.current || !modalRef.current) return;
        try {
            const { selection } = editor.state;
            const coords = editor.view.coordsAtPos(selection.from);
            const editorBounds = editorRef.current.getBoundingClientRect();
            const modalBounds = modalRef.current.getBoundingClientRect();
            const localTop = coords.top - editorBounds.top + editorRef.current.scrollTop;
            const localTopModal = coords.top - modalBounds.top;
            const lineHeight = coords.bottom - coords.top;
            const adjustedTop = localTop + (lineHeight / 2) - 14;
            const adjustedTopModal = localTopModal + (lineHeight / 2) - 14;
            setFloatingTop(adjustedTop);
            setFloatingTopModal(adjustedTopModal);
            setIsFloatingVisible(true);
            const scrollTop = editorRef.current.scrollTop;
            const clientHeight = editorRef.current.clientHeight;
            const spaceBelow = clientHeight - (adjustedTop - scrollTop);
            setOpenUpwards(spaceBelow < 240);
        } catch (e) {
            setIsFloatingVisible(false);
        }
    }, [editor]);

    useEffect(() => {
        const handleScroll = () => { if (isMenuOpenRef.current) updateFloatingButton(); };
        const el = editorRef.current;
        if (el) el.addEventListener('scroll', handleScroll);
        return () => { if (el) el.removeEventListener('scroll', handleScroll); };
    }, [updateFloatingButton]);

    useEffect(() => {
        if (isOpen && editor && editor.getHTML() !== value) {
            editor.commands.setContent(value);
            setLocalValue(value);
        }
    }, [isOpen, value, editor]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isMenuOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMenuOpen]);

    const handleSave = () => {
        if (editor) onChange(editor.getHTML());
        else onChange(localValue);
        onClose();
    };

    const ALL_ITEMS = [
        { id: 'heading',      label: 'Heading',       desc: 'Título principal H1',         icon: 'heading' },
        { id: 'subheading',   label: 'Subheading',    desc: 'Subtítulo H2',                icon: 'subheading' },
        { id: 'image',        label: 'Image',         desc: 'Inserir imagem por URL',       icon: 'image' },
        { id: 'blockquote',   label: 'Blockquote',    desc: 'Texto de citação destacado',   icon: 'quote' },
        { id: 'divider',      label: 'Divider',       desc: 'Linha horizontal divisória',   icon: 'divider' },
        { id: 'list',         label: 'List',          desc: 'Lista de marcadores simples',  icon: 'list' },
        { id: 'numbered_list',label: 'Numbered List', desc: 'Lista ordenada por números',   icon: 'numbered_list' },
        { id: 'attachment',   label: 'Attachment',    desc: 'Inserir um bloco de anexo',    icon: 'attachment' },
    ];

    const filteredItems = ALL_ITEMS.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.desc.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderItemIcon = (iconName: string) => {
        switch (iconName) {
            case 'heading':      return <span className="font-bold text-[13px] font-sans">H1</span>;
            case 'subheading':   return <span className="font-bold text-[11px] font-sans opacity-60">H2</span>;
            case 'image':        return <ImageIcon size={15} />;
            case 'quote':        return <Quote size={15} />;
            case 'divider':      return <Minus size={15} />;
            case 'list':         return <List size={15} />;
            case 'numbered_list':return <ListOrdered size={15} />;
            case 'attachment':   return <Paperclip size={15} />;
            default:             return null;
        }
    };

    const handleSelectItem = (id: string) => {
        if (!editor) return;
        setIsMenuOpen(false);
        switch (id) {
            case 'heading':      editor.chain().focus().toggleHeading({ level: 1 }).run(); break;
            case 'subheading':   editor.chain().focus().toggleHeading({ level: 2 }).run(); break;
            case 'blockquote':   editor.chain().focus().toggleBlockquote().run(); break;
            case 'divider':      editor.chain().focus().setHorizontalRule().run(); break;
            case 'list':         editor.chain().focus().toggleBulletList().run(); break;
            case 'numbered_list':editor.chain().focus().toggleOrderedList().run(); break;
            case 'image': {
                const url = window.prompt('Cole a URL da imagem:');
                if (url) editor.chain().focus().setImage({ src: url }).run();
                break;
            }
            case 'attachment': {
                const fileName = window.prompt('Nome do arquivo anexo:', 'Documento.pdf');
                if (fileName) editor.chain().focus().insertContent(`<p class="attachment-block"><a href="#" onclick="return false;">📎 Anexo: ${fileName}</a></p>`).run();
                break;
            }
        }
    };

    const EditorContentAny: any = EditorContent;

    // ─── Design tokens ───────────────────────────────────────────────────────
    const modalBg      = isDark ? 'rgba(26, 26, 30, 0.97)' : 'rgba(255,255,255,0.96)';
    const headerBg     = isDark ? 'rgba(255,255,255,0.04)' : '#f9f9f9';
    const footerBg     = isDark ? 'rgba(255,255,255,0.04)' : '#f9f9f9';
    const dividerColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
    const editorBg     = isDark ? 'rgba(0,0,0,0.25)' : '#ffffff';
    const titleColor   = isDark ? '#ffffff' : '#111827';
    const closeBtnBg   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
    const closeBtnColor= isDark ? 'rgba(255,255,255,0.75)' : '#6b7280';

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                /* ── Tiptap editor base ── */
                .desc-editor .tiptap {
                    color: ${isDark ? '#e5e7eb' : '#1f2937'};
                    caret-color: ${isDark ? '#ffffff' : '#111827'};
                }
                .desc-editor .tiptap p { margin: 0 0 0.5rem 0; line-height: 1.65; }
                .desc-editor .tiptap h1 {
                    font-size: 1.55rem; font-weight: 700; margin: 1.25rem 0 0.5rem 0;
                    color: ${isDark ? '#ffffff' : '#111827'}; line-height: 1.3;
                }
                .desc-editor .tiptap h2 {
                    font-size: 1.2rem; font-weight: 600; margin: 1rem 0 0.4rem 0;
                    color: ${isDark ? '#e5e7eb' : '#374151'}; line-height: 1.4;
                }
                .desc-editor .tiptap blockquote {
                    border-left: 3px solid ${isDark ? 'rgba(255,255,255,0.25)' : '#d1d5db'};
                    padding-left: 1rem; margin: 1rem 0; font-style: italic;
                    color: ${isDark ? '#9ca3af' : '#6b7280'};
                }
                .desc-editor .tiptap hr {
                    border: none;
                    border-top: 1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'};
                    margin: 1.25rem 0;
                }
                .desc-editor .tiptap ul { list-style-type: disc; padding-left: 1.5rem; margin: 0.5rem 0; }
                .desc-editor .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; margin: 0.5rem 0; }
                .desc-editor .tiptap li { margin-bottom: 0.25rem; }
                .desc-editor .tiptap img {
                    max-width: 100%; height: auto; border-radius: 8px; margin: 1rem 0;
                    border: 1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'};
                }
                /* Placeholder */
                .desc-editor .tiptap p.is-editor-empty:first-child::before {
                    color: ${isDark ? 'rgba(255,255,255,0.28)' : '#9ca3af'};
                    content: attr(data-placeholder);
                    float: left; height: 0; pointer-events: none;
                }
                /* Scrollbar hide */
                .desc-no-scrollbar::-webkit-scrollbar { display: none; }
                .desc-no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />

            <AnimatePresence>
                {isOpen && (
                    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="absolute inset-0 bg-black/60 backdrop-blur-[6px]"
                        />

                        {/* Modal */}
                        <motion.div
                            ref={modalRef}
                            initial={{ opacity: 0, scale: 0.94, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.94, y: 16 }}
                            transition={{ type: 'spring', stiffness: 340, damping: 30 }}
                            className="relative w-full max-w-[520px] rounded-[1.5rem] shadow-2xl overflow-hidden flex flex-col"
                            style={{
                                background: modalBg,
                                backdropFilter: 'blur(40px) saturate(180%)',
                                WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                                border: `1px solid ${dividerColor}`,
                            }}
                        >
                            {/* ── Header ── */}
                            <div
                                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                                style={{
                                    background: headerBg,
                                    borderBottom: `1px solid ${dividerColor}`,
                                }}
                            >
                                <h2 style={{ fontSize: '1.0625rem', fontWeight: 700, color: titleColor, letterSpacing: '-0.01em' }}>
                                    Descrição do Evento
                                </h2>
                                <button
                                    onClick={onClose}
                                    aria-label="Fechar"
                                    style={{
                                        width: 30, height: 30,
                                        borderRadius: '50%',
                                        background: closeBtnBg,
                                        color: closeBtnColor,
                                        border: 'none',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'background 0.15s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = closeBtnBg)}
                                >
                                    <X size={15} strokeWidth={2.2} />
                                </button>
                            </div>

                            {/* ── Body / Editor ── */}
                            <div
                                ref={editorRef}
                                className="flex-1 relative desc-no-scrollbar plus-menu-container overflow-y-auto"
                                style={{
                                    minHeight: 280,
                                    maxHeight: 420,
                                    background: editorBg,
                                }}
                            >
                                {/* Floating + Button */}
                                {isFloatingVisible && (
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setIsMenuOpen(!isMenuOpen);
                                            setSearchQuery('');
                                        }}
                                        style={{
                                            position: 'absolute',
                                            left: 14,
                                            top: `${floatingTop}px`,
                                            width: 28,
                                            height: 28,
                                            borderRadius: '50%',
                                            background: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.10)'}`,
                                            color: isDark ? 'rgba(255,255,255,0.7)' : '#6b7280',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', zIndex: 40,
                                            transition: 'background 0.15s ease',
                                        }}
                                    >
                                        <Plus size={16} strokeWidth={2.5} />
                                    </button>
                                )}

                                {/* Tiptap content */}
                                <div className="desc-editor">
                                    {editor && <EditorContentAny editor={editor} />}
                                </div>

                                {/* Floating Notion-style dropdown */}
                                {isMenuOpen && isFloatingVisible && (
                                    <div
                                        className="notion-dropdown-menu"
                                        style={{
                                            position: 'absolute',
                                            left: 48,
                                            top: openUpwards ? `${floatingTopModal - 8}px` : `${floatingTopModal + 32}px`,
                                            transform: openUpwards ? 'translateY(-100%)' : 'none',
                                            width: 230,
                                            borderRadius: 14,
                                            background: isDark ? 'rgba(30, 30, 36, 0.98)' : '#ffffff',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                                            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
                                            padding: 8,
                                            zIndex: 50,
                                            backdropFilter: 'blur(20px)',
                                        }}
                                        onClick={e => e.stopPropagation()}
                                    >
                                        {/* Search */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: 8,
                                            padding: '6px 10px',
                                            borderRadius: 8,
                                            background: isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6',
                                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                                            marginBottom: 6,
                                        }}>
                                            <Search size={13} style={{ color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af', flexShrink: 0 }} />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Buscar"
                                                style={{
                                                    flex: 1, background: 'transparent', border: 'none', outline: 'none',
                                                    fontSize: 13,
                                                    color: isDark ? '#e5e7eb' : '#374151',
                                                }}
                                                autoFocus
                                            />
                                        </div>

                                        {/* Items */}
                                        <div className="desc-no-scrollbar" style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            {filteredItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => handleSelectItem(item.id)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', gap: 10,
                                                        padding: '7px 8px',
                                                        borderRadius: 8,
                                                        background: 'transparent',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        textAlign: 'left',
                                                        width: '100%',
                                                        transition: 'background 0.12s ease',
                                                    }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#f3f4f6')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                >
                                                    <div style={{
                                                        width: 30, height: 30, borderRadius: 8, flexShrink: 0,
                                                        background: isDark ? 'rgba(255,255,255,0.10)' : '#f3f4f6',
                                                        color: isDark ? 'rgba(255,255,255,0.75)' : '#6b7280',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    }}>
                                                        {renderItemIcon(item.icon)}
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                                                        <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? '#f3f4f6' : '#1f2937', lineHeight: 1.3 }}>
                                                            {item.label}
                                                        </span>
                                                        <span style={{ fontSize: 11, color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {item.desc}
                                                        </span>
                                                    </div>
                                                </button>
                                            ))}
                                            {filteredItems.length === 0 && (
                                                <div style={{ textAlign: 'center', padding: '16px 0', fontSize: 12, color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af' }}>
                                                    Nenhum resultado
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ── Footer / Action Bar ── */}
                            <div
                                className="flex items-center justify-between px-6 py-4 flex-shrink-0"
                                style={{
                                    background: footerBg,
                                    borderTop: `1px solid ${dividerColor}`,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={onOpenAI}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: 7,
                                        padding: '6px 10px',
                                        marginLeft: -8,
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        fontWeight: 500,
                                        color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                                        transition: 'color 0.15s ease',
                                        borderRadius: 8,
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.85)' : '#374151')}
                                    onMouseLeave={e => (e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : '#6b7280')}
                                >
                                    <Sparkles size={15} />
                                    Sugerir com IA
                                </button>

                                <button
                                    onClick={handleSave}
                                    style={{
                                        padding: '10px 22px',
                                        borderRadius: 12,
                                        background: isDark ? '#ffffff' : '#111827',
                                        color: isDark ? '#111827' : '#ffffff',
                                        border: 'none',
                                        fontSize: '0.9375rem',
                                        fontWeight: 600,
                                        cursor: 'pointer',
                                        letterSpacing: '-0.01em',
                                        transition: 'opacity 0.15s ease',
                                    }}
                                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                                >
                                    Concluído
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
}

import * as React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";

export type HowItWorksModuleType = "text" | "image" | "video";
export type HowItWorksModuleData = {
  id: string;
  type: HowItWorksModuleType;
  content: string;
  imageFile?: File | null;
  videoUrl?: string;
};

interface Props {
  module: HowItWorksModuleData;
  onTextChange?: (id: string, html: string) => void;
  onImageUpload?: (id: string, file: File) => void;
  onVideoUrl?: (id: string, url: string) => void;
  onRemove: (id: string) => void;
  dragHandleProps?: any;
}

export const HowItWorksModule: React.FC<Props> = ({
  module,
  onTextChange,
  onImageUpload,
  onVideoUrl,
  onRemove,
  dragHandleProps,
}) => {
  // Only useEditor for text modules
  const editor =
    module.type === "text"
      ? useEditor({
          extensions: [StarterKit, Image],
          content: module.content,
          onUpdate: ({ editor }) => onTextChange && onTextChange(module.id, editor.getHTML()),
          editorProps: {
            attributes: {
              class:
                "w-full min-h-[80px] border-none outline-none px-2 py-2 text-base text-[#091747] bg-white",
            },
          },
        })
      : null;

  return (
    <div className="flex items-stretch mb-2">
      {/* Vertical bar for drag and delete */}
      <div className="flex flex-col items-center justify-start py-4 px-2 gap-4 bg-transparent select-none">
        <div {...dragHandleProps} title="Arraste para reordenar" tabIndex={0} style={{ cursor: 'grab' }}>
          <span className="material-icons text-[#A0AEC0]">drag_indicator</span>
        </div>
        <button
          type="button"
          className="text-[#E53E3E] hover:text-[#C53030]"
          onClick={() => onRemove(module.id)}
          title="Remover módulo"
        >
          <span className="material-icons">delete</span>
        </button>
      </div>
      {/* Module content */}
      <div className="flex-1 bg-white rounded-xl border p-4 shadow-sm flex flex-col">
        {module.type === "text" && editor && (
          <>
            <div className="flex gap-2 mb-2 border-b pb-2">
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleBold().run()} style={{ fontWeight: editor.isActive('bold') ? 'bold' : 'normal' }}>B</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleItalic().run()} style={{ fontStyle: editor.isActive('italic') ? 'italic' : 'normal' }}>I</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleUnderline().run()} style={{ textDecoration: editor.isActive('underline') ? 'underline' : 'none' }}>U</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleBulletList().run()} style={{ fontWeight: editor.isActive('bulletList') ? 'bold' : 'normal' }}>• Lista</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleOrderedList().run()} style={{ fontWeight: editor.isActive('orderedList') ? 'bold' : 'normal' }}>1. Lista</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().toggleBlockquote().run()} style={{ fontStyle: editor.isActive('blockquote') ? 'italic' : 'normal' }}>❝</button>
              <button type="button" className="px-2" onClick={() => {
                const url = window.prompt('URL do link:');
                if (url) editor.chain().focus().setLink({ href: url }).run();
              }}>🔗</button>
              <button type="button" className="px-2" onClick={() => editor.chain().focus().unsetLink().run()}>⨯ link</button>
            </div>
            {/* EditorContent has conflicting React types in some environments; cast to any to avoid TS JSX error */}
            {(() => {
              const EditorContentAny: any = EditorContent;
              return <EditorContentAny editor={editor} />;
            })()}
          </>
        )}
        {module.type === "image" && (
          <div className="flex flex-col gap-2 items-center justify-center min-h-[120px] bg-[#F6F7FB] rounded-xl border border-dashed border-[#E5E7EB]">
            {module.content ? (
              <img src={module.content} alt="Imagem" className="max-w-full rounded-xl" />
            ) : (
              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                <span className="material-icons text-4xl text-[#A0AEC0] mb-2">image</span>
                <span className="text-base text-[#091747] font-bold">Arraste e solte ou clique para adicionar uma imagem.</span>
                <span className="text-xs text-[#6B7280]">JPEG, PNG, não maior que 10 MB.</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => {
                  if (e.target.files && e.target.files[0]) onImageUpload && onImageUpload(module.id, e.target.files[0]);
                }} />
              </label>
            )}
          </div>
        )}
        {module.type === "video" && (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-[#091747] mb-1">Link de vídeo *</label>
            <input
              type="text"
              placeholder="Cole a URL do vídeo (YouTube, Vimeo, etc)"
              value={module.videoUrl || ""}
              onChange={e => onVideoUrl && onVideoUrl(module.id, e.target.value)}
              className="border rounded px-2 py-1 mb-2 border-red-300 focus:border-red-500"
              style={{ borderColor: !module.videoUrl ? '#E53E3E' : '#E5E7EB' }}
            />
            {!module.videoUrl && (
              <div className="flex items-center text-xs text-[#E53E3E] gap-1 mb-2">
                <span className="material-icons text-base">error_outline</span>
                Link obrigatório
              </div>
            )}
            {module.videoUrl && (
              <div className="aspect-video w-full">
                <iframe src={module.videoUrl} title="Vídeo" allowFullScreen className="w-full h-full rounded-xl" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

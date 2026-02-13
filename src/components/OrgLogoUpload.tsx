import React from "react";
import { Upload } from "lucide-react";

const OrgLogoUpload = ({ onSelect, logoUrl }: { onSelect: (file: File) => void; logoUrl?: string }) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [tooltipPos, setTooltipPos] = React.useState<{x: number, y: number}>({x: 0, y: 0});
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        className="flex items-center justify-center w-16 h-16 rounded-full bg-[#F3F4F6] border-2 border-[#E5E7EB] hover:shadow-md transition-all focus:outline-none"
        onClick={() => fileInputRef.current?.click()}
        style={{ position: 'relative', cursor: 'pointer' }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={e => {
          const rect = (e.target as HTMLElement).getBoundingClientRect();
          setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt="Logo da organização" className="w-12 h-12 object-cover rounded-full" />
        ) : (
          <Upload className="w-6 h-6 text-[#2A2AD7]" />
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={e => {
            const file = e.target.files?.[0];
            if (file) {
              console.log('OrgLogoUpload: arquivo selecionado', file);
              onSelect(file);
            } else {
              console.log('OrgLogoUpload: nenhum arquivo selecionado');
            }
          }}
        />
        {showTooltip && (
          <span
            style={{
              position: 'absolute',
              left: tooltipPos.x + 16,
              top: tooltipPos.y - 8,
              background: '#2A2AD7',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: 14,
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 10,
              boxShadow: '0 2px 8px 0 #0001',
              fontWeight: 500
            }}
          >
            Carregar imagem
          </span>
        )}
      </button>
    </div>
  );
};

export default OrgLogoUpload;

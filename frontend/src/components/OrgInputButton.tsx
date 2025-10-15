import { Upload } from "lucide-react";

const OrgInputButton = ({ value, onClick }: { value: string; onClick: () => void }) => (
  <button
    type="button"
    className="flex items-center gap-3 px-6 py-3 rounded-full border border-[#E5E7EB] bg-white shadow-sm hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-200"
    onClick={onClick}
    style={{ minWidth: 240 }}
  >
    {/* Ícone removido, apenas texto e seta */}
    <span className="flex-1 text-base text-[#091747] font-medium text-left opacity-80">{value || "Nome da organização"}</span>
    <span className="ml-2 text-[#2A2AD7] text-xl font-bold">&#8250;</span>
  </button>
);

export default OrgInputButton;

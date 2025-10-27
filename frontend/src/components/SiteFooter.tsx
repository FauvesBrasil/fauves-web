import React from 'react';

const SiteFooter: React.FC = () => {
  return (
    <footer className="w-full bg-white border-t border-zinc-100 mt-8">
      <div className="max-w-[1200px] mx-auto px-6 py-6 flex items-center justify-between text-sm text-slate-600">
        <div>© {new Date().getFullYear()} Fauves Brasil</div>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:underline">Ajuda</a>
          <a href="#" className="hover:underline">Termos</a>
          <a href="#" className="hover:underline">Contato</a>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;

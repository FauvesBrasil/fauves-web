import React from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

interface Follower {
  id: string;
  name?: string | null;
  photoUrl?: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  followers: Follower[];
}

const FollowersModal: React.FC<Props> = ({ open, onClose, followers }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[380px] max-w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-3">Seguidores</h3>
        <div className="grid grid-cols-4 gap-3">
          {followers.length === 0 && <div className="col-span-4 text-sm text-slate-500">Nenhum seguidor encontrado.</div>}
          {followers.map(f => (
            <div key={f.id} className="flex flex-col items-center text-center">
              <Avatar className="w-14 h-14">
                {f.photoUrl ? <AvatarImage src={f.photoUrl} alt={f.name || 'Seguidor'} /> : <AvatarFallback>{(f.name || 'U')[0]}</AvatarFallback>}
              </Avatar>
              <div className="text-xs mt-2 max-w-[70px] truncate">{f.name || 'Usuário'}</div>
            </div>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <button onClick={onClose} className="px-4 py-2 rounded border">Fechar</button>
        </div>
      </div>
    </div>
  );
};

export default FollowersModal;

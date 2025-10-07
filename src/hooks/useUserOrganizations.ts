import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { apiUrl, fetchApi, ensureApiBase } from "@/lib/apiBase";

export function useUserOrganizations(enabled: boolean = true) {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);

  const fetchOrgs = async () => {
    setLoading(true);
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  console.log('[useUserOrganizations] userId usado para buscar organizações:', userId);
    if (!userId) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    let orgList: any[] = [];
    await ensureApiBase();
    const tryFetch = async (url:string) => {
      try { return await fetchApi(url); } catch (e) { console.warn('[useUserOrganizations] network error', e); return null; }
    };
    try {
      let res = await tryFetch(`/api/organization/user/${userId}`);
      // Sem fallback separado: apiUrl já força porta 4000 se necessário
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          orgList = data;
        } else if (data && typeof data === 'object') {
          // Pode ser um objeto único de organização ou um objeto de erro
            if (data.id && !data.error) {
              orgList = [data];
            } else {
              console.warn('[useUserOrganizations] resposta não utilizável', data);
            }
        }
      } else {
        console.warn('[useUserOrganizations] rota /api/organization/user falhou status', res.status);
      }
    } catch (e) {
      console.warn('[useUserOrganizations] erro ao chamar /api/organization/user', e);
    }
    // Fallback: rota alternativa usada pelo server.js antigo
    if (!Array.isArray(orgList) || !orgList.length) {
      try {
  const alt = await fetchApi(`/api/organizations/by-user?userId=${userId}`);
        if (alt.ok) {
          const altList = await alt.json();
          if (Array.isArray(altList) && altList.length) {
            orgList = altList;
            console.log('[useUserOrganizations] usando fallback /api/organizations/by-user');
          }
        }
      } catch (e) {
        console.warn('[useUserOrganizations] fallback falhou', e);
      }
    }
    // Se ainda vazio, faz uma segunda tentativa rápida (pode ser race de subida do backend)
    if ((!orgList || !orgList.length)) {
      try {
        await new Promise(r=>setTimeout(r,600));
        const retry = await tryFetch(`/api/organization/user/${userId}`);
        if (retry && retry.ok) {
          const data2 = await retry.json();
          if (Array.isArray(data2) && data2.length) orgList = data2;
        }
      } catch {}
    }
    // Dedupe por id caso tenhamos vindo de múltiplas fontes (membership + createdBy)
    if (Array.isArray(orgList)) {
      const map: Record<string, any> = {};
      for (const o of orgList) {
        if (o && o.id) map[o.id] = o;
      }
      orgList = Object.values(map);
    }
    setOrgs(Array.isArray(orgList) ? orgList : []);
    setLoading(false);
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchOrgs();
  }, [enabled]);

  return { orgs, loading, refetch: fetchOrgs };
}

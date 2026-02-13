import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { apiUrl, fetchApi, ensureApiBase } from "@/lib/apiBase";

export function useUserOrganizations(enabled: boolean = true) {
  const [orgs, setOrgs] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(enabled);
  const { user } = useAuth();

  const fetchOrgs = async () => {
    setLoading(true);
    const userId = user?.id;
    console.log('[useUserOrganizations] userId usado para buscar organizações:', userId);
    if (!userId) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    await ensureApiBase();
    try {
      const res = await fetchApi(`/api/organization?userId=${userId}`);
      if (res && res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setOrgs(data);
        } else if (data && typeof data === 'object' && data.id && !data.error) {
          setOrgs([data]);
        } else {
          setOrgs([]);
        }
      } else {
        setOrgs([]);
        console.warn('[useUserOrganizations] rota /api/organization falhou status', res?.status);
      }
    } catch (e) {
      setOrgs([]);
      console.warn('[useUserOrganizations] erro ao chamar /api/organization', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    fetchOrgs();
  }, [enabled, user]);

  return { orgs, loading, refetch: fetchOrgs };
}

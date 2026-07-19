/**
 * Lógica para determinar o nível de hype de um evento
 * Baseado em visualizações e interesse
 */

export interface EventMetrics {
  views: number;
  interests: number;
}

export type HypeLevel = 'none' | 'low' | 'medium' | 'high';

export const getEventHypeLevel = (metrics?: EventMetrics): HypeLevel => {
  if (!metrics) return 'none';

  const { views, interests } = metrics;

  // Critérios para "Alta" (High)
  if (interests >= 20 || views >= 500) return 'high';

  // Critérios para "Popular" (Medium)
  if (interests >= 5 || views >= 100) return 'medium';

  // Critérios para inicial (Low)
  if (interests > 0 || views > 20) return 'low';

  return 'none';
};

export const getHypeBadge = (level: HypeLevel) => {
  switch (level) {
    case 'high':
      return { label: 'Em alta', icon: '🔥', color: 'bg-orange-600' };
    case 'medium':
      return { label: 'Popular', icon: '⚡', color: 'bg-blue-600' };
    case 'low':
      return { label: 'Crescendo', icon: '📈', color: 'bg-green-600' };
    default:
      return null;
  }
};

/**
 * Calcula o score de tendência baseado em interesses e views
 * Fórmula: (interesses * 2) + views
 */
export const calculateTrendingScore = (metrics?: EventMetrics): number => {
  if (!metrics) return 0;
  const interests = Number(metrics.interests || 0);
  const views = Number(metrics.views || 0);
  return (interests * 2) + views;
};

/**
 * Ordena eventos pelo score de tendência
 * Caso empate, prioriza o mais próximo da data atual
 */
export const getSortedTrendingEvents = (events: any[]): any[] => {
  return [...events].sort((a, b) => {
    const scoreA = calculateTrendingScore(a.metrics || a); // Suporta r.metrics ou r diretamente (se mapeado)
    const scoreB = calculateTrendingScore(b.metrics || b);
    
    if (scoreB !== scoreA) {
      return scoreB - scoreA;
    }
    
    // Fallback: Proximidade da data
    const dateA = a.startDate ? new Date(a.startDate).getTime() : Infinity;
    const dateB = b.startDate ? new Date(b.startDate).getTime() : Infinity;
    
    return dateA - dateB;
  });
};

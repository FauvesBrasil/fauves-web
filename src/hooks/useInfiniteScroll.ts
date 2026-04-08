import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions<T> {
    fetchPage: (page: number) => Promise<{ items: T[]; hasMore: boolean; total?: number }>;
    pageSize?: number;
    initialPage?: number;
}

interface UseInfiniteScrollReturn<T> {
    items: T[];
    loading: boolean;
    hasMore: boolean;
    loadMore: () => void;
    reset: () => void;
    triggerRef: React.RefObject<HTMLDivElement>;
    page: number;
    total: number | null;
}

export function useInfiniteScroll<T>({
    fetchPage,
    pageSize = 20,
    initialPage = 1,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
    const [items, setItems] = useState<T[]>([]);
    const [page, setPage] = useState(initialPage);
    const [loading, setLoading] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const [total, setTotal] = useState<number | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const observerRef = useRef<IntersectionObserver | null>(null);

    const loadMore = useCallback(async () => {
        if (loading || !hasMore) return;

        setLoading(true);
        try {
            const result = await fetchPage(page);
            setItems(prev => [...prev, ...result.items]);
            setHasMore(result.hasMore);
            if (result.total !== undefined) setTotal(result.total);
            setPage(prev => prev + 1);
        } catch (error) {
            // no-op
        } finally {
            setLoading(false);
        }
    }, [fetchPage, page, loading, hasMore]);

    const reset = useCallback(() => {
        setItems([]);
        setPage(initialPage);
        setHasMore(true);
        setTotal(null);
    }, [initialPage]);

    // IntersectionObserver for automatic loading
    useEffect(() => {
        const currentTrigger = triggerRef.current;
        if (!currentTrigger || !hasMore || loading) return;

        observerRef.current = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting) {
                    loadMore();
                }
            },
            { threshold: 0.1 }
        );

        observerRef.current.observe(currentTrigger);

        return () => {
            if (observerRef.current && currentTrigger) {
                observerRef.current.unobserve(currentTrigger);
            }
        };
    }, [loadMore, hasMore, loading]);

    // Load first page on mount or when fetchPage changes (e.g., UF filter changes)
    useEffect(() => {
        if (items.length === 0 && !loading) {
            loadMore();
        }
    }, [loadMore]); // Reload when loadMore changes (triggered by fetchPage change)

    return {
        items,
        loading,
        hasMore,
        loadMore,
        reset,
        triggerRef,
        page,
        total,
    };
}

export default useInfiniteScroll;

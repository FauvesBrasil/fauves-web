import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface PageLoadingWrapperProps {
    loading: boolean;
    children: React.ReactNode;
    /** Type of skeleton to show - affects layout */
    variant?: "default" | "form" | "table" | "cards";
    /** Optional custom skeleton content */
    skeleton?: React.ReactNode;
    /** Minimum loading time in ms to avoid flash */
    minLoadTime?: number;
}

/**
 * PageLoadingWrapper - Wraps page content with loading skeleton
 * 
 * Usage:
 * <PageLoadingWrapper loading={isLoading} variant="form">
 *   <YourPageContent />
 * </PageLoadingWrapper>
 */
export const PageLoadingWrapper: React.FC<PageLoadingWrapperProps> = ({
    loading,
    children,
    variant = "default",
    skeleton,
    minLoadTime = 0,
}) => {
    const [showLoading, setShowLoading] = React.useState(loading);
    const loadStartRef = React.useRef<number>(0);

    React.useEffect(() => {
        if (loading) {
            loadStartRef.current = Date.now();
            setShowLoading(true);
        } else {
            const elapsed = Date.now() - loadStartRef.current;
            const remaining = Math.max(0, minLoadTime - elapsed);
            if (remaining > 0) {
                const timer = setTimeout(() => setShowLoading(false), remaining);
                return () => clearTimeout(timer);
            }
            setShowLoading(false);
        }
    }, [loading, minLoadTime]);

    if (!showLoading) {
        return <>{children}</>;
    }

    // Custom skeleton provided
    if (skeleton) {
        return <>{skeleton}</>;
    }

    // Default skeleton variants
    return (
        <div className="w-full animate-in fade-in duration-300">
            {variant === "default" && <DefaultSkeleton />}
            {variant === "form" && <FormSkeleton />}
            {variant === "table" && <TableSkeleton />}
            {variant === "cards" && <CardsSkeleton />}
        </div>
    );
};

/** Default page skeleton with title and content blocks */
const DefaultSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
        </div>
        {/* Content blocks */}
        <div className="space-y-4">
            <div className="bg-white dark:bg-[#242424] rounded-2xl p-6 shadow-sm">
                <Skeleton className="h-6 w-48 mb-4" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                </div>
            </div>
            <div className="bg-white dark:bg-[#242424] rounded-2xl p-6 shadow-sm">
                <Skeleton className="h-6 w-40 mb-4" />
                <div className="flex gap-4">
                    <Skeleton className="h-24 w-24 rounded-xl" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            </div>
        </div>
    </div>
);

/** Form-style skeleton with inputs and labels */
const FormSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
            <Skeleton className="h-8 w-72" />
            <Skeleton className="h-4 w-80" />
        </div>
        {/* Form fields */}
        <div className="bg-white dark:bg-[#242424] rounded-2xl p-6 shadow-sm space-y-5">
            {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-lg" />
                </div>
            ))}
            {/* Toggle/switch field */}
            <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-12 rounded-full" />
            </div>
        </div>
        {/* Action button */}
        <Skeleton className="h-12 w-40 rounded-lg" />
    </div>
);

/** Table skeleton with header and rows */
const TableSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {/* Table */}
        <div className="bg-white dark:bg-[#242424] rounded-2xl shadow-sm overflow-hidden">
            {/* Table header */}
            <div className="bg-gray-50 dark:bg-[#1F1F1F] px-6 py-3 flex gap-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24 ml-auto" />
                <Skeleton className="h-4 w-20" />
            </div>
            {/* Table rows */}
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-6 py-4 border-t border-gray-100 dark:border-[#1F1F1F] flex gap-4 items-center">
                    <Skeleton className="h-4 w-4 rounded" />
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1 space-y-1">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            ))}
        </div>
    </div>
);

/** Cards grid skeleton */
const CardsSkeleton: React.FC = () => (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-36 rounded-lg" />
        </div>
        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white dark:bg-[#242424] rounded-2xl shadow-sm overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <div className="p-4 space-y-2">
                        <Skeleton className="h-5 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <div className="flex gap-2 pt-2">
                            <Skeleton className="h-6 w-16 rounded-full" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </div>
                </div>
            ))}
        </div>
    </div>
);

export default PageLoadingWrapper;

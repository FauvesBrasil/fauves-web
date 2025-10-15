import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const NextEventCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 w-full flex flex-col gap-6 shadow-sm">
      <Skeleton className="h-7 w-72" />
      <div className="flex items-center bg-[#F6F7FB] rounded-xl px-6 py-5 gap-6">
        <div className="flex flex-col items-center justify-center w-16">
          <Skeleton className="h-4 w-10 mb-1" />
          <Skeleton className="h-7 w-10" />
        </div>
        <div className="flex-1 flex flex-col gap-2">
          <Skeleton className="h-5 w-64" />
          <Skeleton className="h-4 w-52" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="flex flex-col items-end min-w-[120px] gap-1">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
        <Skeleton className="h-6 w-6" />
      </div>
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        <div className="flex items-center gap-0 w-full">
          <Skeleton className="h-1 w-1/3" />
          <Skeleton className="h-1 w-1/3 ml-2" />
          <Skeleton className="h-1 w-1/3 ml-2" />
        </div>
      </div>
    </div>
  );
};

export default NextEventCardSkeleton;

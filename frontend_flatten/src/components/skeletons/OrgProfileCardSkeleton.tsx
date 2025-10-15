import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const OrgProfileCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col justify-between p-5 bg-white rounded-xl border border-solid border-zinc-200 h-[283px] w-[259px]">
      <div>
        <div className="flex flex-col gap-3 items-start">
          <Skeleton className="h-[50px] w-[50px] rounded-full" />
          <Skeleton className="h-7 w-40" />
          <div className="flex gap-5 items-center">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        </div>
        <div className="flex flex-col items-start mt-8">
          <Skeleton className="h-5 w-8" />
          <Skeleton className="h-4 w-24 mt-1" />
        </div>
      </div>
    </div>
  );
};

export default OrgProfileCardSkeleton;

import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const HelpTilesSkeleton: React.FC = () => {
  return (
    <div className="p-5 bg-white rounded-xl border border-solid border-zinc-200 w-full">
      <div className="flex flex-col gap-1.5 items-start mb-4 w-full">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-6 items-center">
        {[0,1,2,3].map((k) => (
          <div key={k} className="flex flex-col gap-4 items-center px-7 py-6 bg-white rounded-xl border border-solid border-zinc-200 h-[140px] w-[156px]">
            <Skeleton className="h-[43px] w-[43px] rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HelpTilesSkeleton;

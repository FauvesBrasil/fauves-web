import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const EventPageSkeleton: React.FC = () => {
  return (
    <div className="flex overflow-hidden flex-col pb-20 bg-white rounded-3xl min-h-screen">
      <div className="h-[320px] w-full relative">
        <Skeleton className="absolute inset-0 rounded-t-3xl" />
      </div>
      <div className="flex flex-col items-center mx-auto mt-5 max-w-[1000px] w-full px-4">
        <Skeleton className="w-full aspect-[2.86] rounded-3xl" />
        <div className="flex flex-row gap-8 w-full mt-10 max-md:flex-col max-md:gap-6">
          <div className="flex flex-col w-[62%] max-md:w-full gap-4">
            <Skeleton className="h-5 w-28 rounded-full" />
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-5 w-1/2" />
            <div className="flex flex-row gap-4 mt-6 max-md:flex-col">
              <div className="flex-1 p-6 rounded-xl border bg-white">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-5 w-40" />
              </div>
              <div className="flex-1 p-6 rounded-xl border bg-white">
                <Skeleton className="h-5 w-24 mb-3" />
                <Skeleton className="h-5 w-60" />
              </div>
            </div>
            <Skeleton className="h-6 w-48 mt-6" />
            <Skeleton className="h-24 w-full mt-3" />
          </div>
          <div className="flex flex-col w-[38%] max-md:w-full gap-4">
            <div className="p-5 rounded-xl border bg-white">
              <Skeleton className="h-6 w-56 mx-auto" />
              <Skeleton className="h-10 w-full mt-5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventPageSkeleton;

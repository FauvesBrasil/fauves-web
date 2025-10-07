import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CreateEditEventSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen w-full bg-white flex relative">
      <div className="flex-1 flex flex-col ml-[350px]">
        <div className="flex flex-col items-left py-10 ml-20 mt-20">
          <div className="w-full max-w-[800px] flex flex-col gap-8">
            <Skeleton className="h-[350px] w-full rounded-2xl" />
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-4">
              <Skeleton className="h-6 w-60" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-4">
              <Skeleton className="h-6 w-60" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-4">
              <Skeleton className="h-6 w-60" />
              <Skeleton className="h-24 w-full" />
            </div>
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 flex flex-col gap-4">
              <Skeleton className="h-6 w-60" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEditEventSkeleton;

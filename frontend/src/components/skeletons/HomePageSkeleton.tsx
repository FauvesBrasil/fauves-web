import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const CardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 p-3 bg-white rounded-2xl border border-gray-200 shadow-sm">
    <Skeleton className="w-full aspect-[2/1] rounded-xl" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

const HomePageSkeleton: React.FC = () => {
  return (
    <div className="w-full relative bg-white my-0 rounded-[20px]">
      <div className="max-w-[1352px] mx-auto">
        <main>
          <section className="relative px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
            <div className="flex items-center gap-4 max-md:flex-col max-md:items-start">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-10 w-48 rounded-xl" />
              <Skeleton className="h-10 flex-1 rounded-xl" />
            </div>
          </section>
          <section className="px-[156px] py-5 max-md:p-5 max-sm:p-[15px]">
            <Skeleton className="h-6 w-64 mb-5" />
            <div className="flex gap-3">
              {[0,1,2,3,4,5].map(i => (
                <Skeleton key={i} className="h-8 w-24 rounded-full" />
              ))}
            </div>
          </section>
          <section className="px-[156px] pb-10 grid grid-cols-4 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
            {Array.from({ length: 8 }).map((_, idx) => (
              <CardSkeleton key={idx} />
            ))}
          </section>
        </main>
      </div>
    </div>
  );
};

export default HomePageSkeleton;

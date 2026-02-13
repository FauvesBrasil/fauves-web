import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import AppShell from "@/components/AppShell";

const CardSkeleton: React.FC = () => (
  <div className="flex flex-col gap-3 p-3 bg-white dark:bg-[#1F1F1F] rounded-2xl border border-gray-200 dark:border-[#2A2A2A] shadow-sm">
    <Skeleton className="w-full aspect-[2/1] rounded-xl" />
    <Skeleton className="h-5 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

const HomePageSkeleton: React.FC = () => {
  return (
    <AppShell>
      {/* Event Slider Skeleton */}
      <div className="w-full mb-6">
        <Skeleton className="w-full h-[400px] max-md:h-[300px] rounded-none" />
      </div>

      <div className="max-w-[1352px] mx-auto">
        <main>
          {/* Category Tags Section */}
          <section className="px-[156px] py-5 max-md:p-5 max-sm:px-[30px] max-sm:py-5">
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[0, 1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-9 w-28 rounded-full flex-shrink-0" />
              ))}
            </div>
          </section>

          {/* Events Grid Section */}
          <section className="px-[156px] pb-10 max-md:p-5 max-sm:px-[30px] max-sm:py-5">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-4 gap-6 max-lg:grid-cols-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              {Array.from({ length: 8 }).map((_, idx) => (
                <CardSkeleton key={idx} />
              ))}
            </div>
          </section>
        </main>
      </div>
    </AppShell>
  );
};

export default HomePageSkeleton;

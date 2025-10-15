import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

const ProfilePageSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-[1352px] mx-auto px-5 py-10">
        <div className="flex gap-[100px] items-start mx-auto w-fit max-md:flex-col max-md:gap-8">
          <div className="sticky top-24 self-start flex flex-row items-center gap-5">
            <Skeleton className="h-[100px] w-[100px] rounded-full" />
            <div>
              <Skeleton className="h-7 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="max-w-[520px] w-full">
            <section className="mb-16">
              <Skeleton className="h-6 w-24 mb-5" />
              <Skeleton className="h-20 w-full mb-2" />
              <Skeleton className="h-20 w-full" />
            </section>
            <section className="mb-16">
              <Skeleton className="h-6 w-24 mb-5" />
              <Skeleton className="h-[130px] w-full mb-5" />
              <Skeleton className="h-4 w-64" />
            </section>
            <section>
              <Skeleton className="h-6 w-24 mb-5" />
              <Skeleton className="h-20 w-full" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePageSkeleton;

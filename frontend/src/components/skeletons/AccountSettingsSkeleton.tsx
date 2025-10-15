import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";

const AccountSettingsSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <div className="flex">
        <div className="w-[280px] h-[100vh] bg-gray-50 border-r border-gray-100 max-md:w-[250px] max-sm:hidden">
          <div className="p-8 pt-5 flex flex-col gap-6">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-40" />
            ))}
          </div>
        </div>
        <div className="flex-1 flex justify-center items-start py-12 px-8 bg-[#F8F7FA]">
          <div className="w-full max-w-[700px] bg-white rounded-3xl shadow-xl p-10 border border-gray-100">
            <Skeleton className="h-8 w-64 mb-2" />
            <hr className="my-6 border-gray-200" />
            <div className="mb-8">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="flex gap-6 items-center">
                <Skeleton className="h-[120px] w-[120px] rounded-xl" />
                <Skeleton className="h-16 w-[340px]" />
              </div>
            </div>
            <Skeleton className="h-5 w-48 mb-3" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-10 w-full mb-6" />
            <Skeleton className="h-5 w-48 mb-3" />
            <div className="grid grid-cols-2 gap-4 mb-6">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
            <Skeleton className="h-10 w-full mb-6" />
            <div className="flex justify-end mt-6">
              <Skeleton className="h-11 w-36" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountSettingsSkeleton;

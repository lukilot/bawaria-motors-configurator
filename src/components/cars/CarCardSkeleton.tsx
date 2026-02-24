import { cn } from '@/lib/utils';
import { Camera } from 'lucide-react';

export function CarCardSkeleton({ view = 'grid' }: { view?: 'grid' | 'list' }) {
    if (view === 'list') {
        return (
            <div className="flex flex-col md:flex-row bg-white overflow-hidden shadow-sm border border-gray-100 rounded-sm">
                {/* Image Skeleton */}
                <div className="w-full md:w-[320px] aspect-[4/3] relative shrink-0 bg-gray-100 animate-pulse flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-200" />
                </div>

                {/* Details Skeleton */}
                <div className="flex-1 p-5 md:p-6 flex flex-col min-w-0">
                    <div className="flex justify-between items-start gap-4 mb-2">
                        <div className="flex-1">
                            <div className="h-4 w-16 bg-gray-200 rounded-sm mb-2 animate-pulse" />
                            <div className="h-6 w-3/4 bg-gray-200 rounded-sm mb-3 animate-pulse" />
                            <div className="flex gap-2 mb-4">
                                <div className="h-5 w-24 bg-gray-100 rounded-full animate-pulse" />
                                <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
                            </div>
                        </div>
                    </div>

                    {/* Features Grid */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-auto pt-4 border-t border-gray-100">
                        <div className="h-3 w-16 bg-gray-100 rounded-sm animate-pulse" />
                        <div className="h-3 w-20 bg-gray-100 rounded-sm animate-pulse" />
                        <div className="h-3 w-24 bg-gray-100 rounded-sm animate-pulse" />
                        <div className="h-3 w-16 bg-gray-100 rounded-sm animate-pulse" />
                    </div>
                </div>

                {/* Price Sidebar Skeleton */}
                <div className="w-full md:w-[280px] p-5 md:p-6 bg-gray-50 flex flex-col justify-between shrink-0 border-t md:border-t-0 md:border-l border-gray-100">
                    <div className="space-y-2 mb-6">
                        <div className="h-3 w-24 bg-gray-200 rounded-sm ml-auto animate-pulse" />
                        <div className="h-8 w-40 bg-gray-300 rounded-sm ml-auto animate-pulse" />
                        <div className="h-3 w-32 bg-gray-200 rounded-sm ml-auto animate-pulse" />
                    </div>

                    <div className="space-y-2">
                        <div className="h-10 w-full bg-gray-200 rounded-sm animate-pulse" />
                        <div className="flex gap-2">
                            <div className="h-10 flex-1 bg-gray-200 rounded-sm animate-pulse" />
                            <div className="h-10 flex-1 bg-gray-200 rounded-sm animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col bg-white overflow-hidden shadow-sm border border-gray-100 group rounded-sm">
            {/* Image Skeleton */}
            <div className="relative aspect-[4/3] bg-gray-100 animate-pulse flex items-center justify-center">
                <Camera className="w-8 h-8 text-gray-200" />
            </div>

            {/* Details Skeleton */}
            <div className="p-5 flex flex-col flex-1">
                <div className="h-3 w-16 bg-gray-200 rounded-sm mb-2 animate-pulse" />
                <div className="h-6 w-3/4 bg-gray-200 rounded-sm mb-3 animate-pulse" />
                <div className="h-3 w-1/2 bg-gray-100 rounded-sm mb-1 animate-pulse" />
                <div className="h-3 w-2/3 bg-gray-100 rounded-sm animate-pulse mb-6" />

                <div className="mt-auto pt-4 border-t border-gray-100 mb-6">
                    <div className="h-3 w-20 bg-gray-200 rounded-sm mb-1 animate-pulse" />
                    <div className="h-7 w-32 bg-gray-300 rounded-sm mb-1 animate-pulse" />
                    <div className="h-3 w-24 bg-gray-200 rounded-sm animate-pulse" />
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <div className="h-10 w-full bg-gray-200 rounded-sm animate-pulse" />
                    <div className="h-10 w-full bg-gray-200 rounded-sm animate-pulse" />
                </div>
            </div>
        </div>
    );
}

export function SRPFallback() {
    return (
        <div className="max-w-[1600px] mx-auto px-6 py-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
                <div className="space-y-4">
                    <div className="h-10 w-64 bg-gray-200 rounded-sm animate-pulse" />
                    <div className="h-4 w-48 bg-gray-100 rounded-sm animate-pulse" />
                </div>
                <div className="flex gap-4">
                    <div className="h-10 w-40 bg-gray-200 rounded-full animate-pulse" />
                    <div className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
                </div>
            </div>

            {/* Content Layout */}
            <div className="flex gap-8 items-start">
                {/* Fixed sidebar layout match */}
                <div className="w-[320px] hidden xl:block shrink-0 sticky top-28 h-screen">
                    <div className="h-8 w-32 bg-gray-200 rounded-sm mb-6 animate-pulse" />
                    <div className="space-y-4">
                        <div className="h-[400px] w-full bg-gray-100 rounded-sm animate-pulse" />
                    </div>
                </div>

                {/* Grid Skeleton */}
                <div className="flex-1 w-full min-w-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <CarCardSkeleton key={i} view="grid" />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

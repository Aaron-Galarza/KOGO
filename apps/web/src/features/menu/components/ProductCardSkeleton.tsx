export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl bg-white shadow-md">
      <div className="h-40 w-full bg-gray-200 sm:h-48 md:h-52 lg:h-56"></div>
      <div className="p-3 md:p-4">
        <div className="mb-1 h-4 w-3/4 rounded bg-gray-200 sm:h-5 md:mb-2"></div>
        <div className="mb-2 h-3 w-full rounded bg-gray-200 sm:h-4 sm:mb-3 md:mb-4"></div>
        <div className="mb-2 h-3 w-2/3 rounded bg-gray-200 sm:h-4 sm:mb-3 md:mb-4"></div>
        <div className="flex items-center justify-between">
          <div className="h-4 w-16 rounded bg-gray-200 sm:h-5 sm:w-20 md:h-6"></div>
          <div className="h-7 w-20 rounded-lg bg-gray-200 sm:h-8 sm:w-24 md:w-28"></div>
        </div>
      </div>
    </div>
  );
}

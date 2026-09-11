import { Skeleton } from "@/components/ui/skeleton";

/** Reproduce la estructura del detalle para que no salte el layout al cargar. */
export default function CardLoading() {
  return (
    <div className="grid gap-8 md:grid-cols-[320px_1fr]">
      <Skeleton className="aspect-[5/7] rounded-xl" />
      <div className="flex flex-col gap-6">
        <Skeleton className="h-9 w-2/3" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      </div>
    </div>
  );
}

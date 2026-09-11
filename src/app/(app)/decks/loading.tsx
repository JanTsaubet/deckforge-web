import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de carga de la biblioteca mientras llegan los datos (streaming con Suspense). */
export default function DecksLoading() {
  return (
    <div className="flex flex-col gap-8">
      <Skeleton className="h-9 w-48" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

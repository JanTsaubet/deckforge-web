import { Skeleton } from "@/components/ui/skeleton";

/** Esqueleto de la vista de un mazo: mismo reparto que la pantalla, para que no salte. */
export default function DeckLoading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-36 rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="flex flex-col gap-4">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-40" />
          ))}
        </div>
        <div className="flex flex-col gap-5">
          <Skeleton className="hidden aspect-[488/680] lg:block" />
          <Skeleton className="h-24" />
        </div>
      </div>
    </div>
  );
}

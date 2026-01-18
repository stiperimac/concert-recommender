import { Suspense } from "react";
import PopularClient from "./PopularClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm">Učitavanje...</div>}>
      <PopularClient />
    </Suspense>
  );
}

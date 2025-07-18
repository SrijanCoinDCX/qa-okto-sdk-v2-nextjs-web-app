
"use client";

import SolanaRawTransactionEstimate from "@/app/components/UserOpWithEstimation/SVMRawTransactionWithEstimation";



export default function SolanaRawTransactionEstimatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <div className="flex flex-col gap-2 w-full">
        <SolanaRawTransactionEstimate />
      </div>
    </main>
  );
}
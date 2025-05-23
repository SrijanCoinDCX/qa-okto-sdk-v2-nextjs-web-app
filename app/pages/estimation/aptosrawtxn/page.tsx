"use client";

import AptosRawTransactionEstimate from "@/app/components/UserOpWithEstimation/APTOSRawTransactionWithEstimation";

export default function AptosRawTransactionEstimatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <div className="flex flex-col gap-2 w-full">
        <AptosRawTransactionEstimate />
      </div>
    </main>
  );
} 
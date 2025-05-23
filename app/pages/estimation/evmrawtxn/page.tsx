"use client";

import EVMRawTransactionEstimate from "@/app/components/UserOpWithEstimation/EVMRawTransactionWithEstimation";

export default function EVMRawTransactionEstimatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <div className="flex flex-col gap-2 w-full">
        <EVMRawTransactionEstimate />
      </div>
    </main>
  );
} 
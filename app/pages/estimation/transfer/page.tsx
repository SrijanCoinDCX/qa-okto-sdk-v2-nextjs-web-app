"use client";

import TokenTransferEstimate from "@/app/components/UserOpWithEstimation/TokenTransferWithEstimate";


export default function TransferTokenWithEstimationPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <div className="flex flex-col gap-2 w-full">
        <TokenTransferEstimate />
      </div>
    </main>
  );
} 
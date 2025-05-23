"use client";

import NFTTransferEstimate from "@/app/components/UserOpWithEstimation/NftTransferWithEstimate";

export default function NFTTransferEstimatePage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <div className="flex flex-col gap-2 w-full">
        <NFTTransferEstimate />
      </div>
    </main>
  );
} 
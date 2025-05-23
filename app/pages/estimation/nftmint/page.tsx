"use client";

import NFTMintEstimate from "@/app/components/UserOpWithEstimation/NFTMintWithEstimate";


export default function NFTMintEstimatePage() {
    return (
        <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
            <div className="flex flex-col gap-2 w-full">
                <NFTMintEstimate />
            </div>
        </main>
    );
} 
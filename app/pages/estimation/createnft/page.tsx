"use client";

import NFTCollectionCreationEstimate from "@/app/components/UserOpWithEstimation/NFTCollectionCreationWithEstimate";


export default function CreateNFTPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <h1 className="text-black font-bold text-3xl mb-8">Create NFT</h1>
      <div className="flex flex-col gap-2 w-full">
        <NFTCollectionCreationEstimate />
      </div>
    </main>
  );
} 
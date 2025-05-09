"use client";

import TransferNFT from "@/app/components/UserOp/TransferNFT";



export default function TransferNFTPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <h1 className="text-black font-bold text-3xl mb-8">Transfer NFT</h1>
      <div className="flex flex-col gap-2 w-full">
        <TransferNFT />
      </div>
    </main>
  );
} 
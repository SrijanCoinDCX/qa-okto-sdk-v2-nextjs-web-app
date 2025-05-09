"use client";

import AptosRawTransaction from "@/app/components/UserOp/AptosRawTransaction";

export default function AptosRawTransactionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-violet-200 w-full">
      <h1 className="text-black font-bold text-3xl mb-8">Aptos Raw Transaction</h1>
      <div className="flex flex-col gap-2 w-full">
        <AptosRawTransaction />
      </div>
    </main>
  );
} 
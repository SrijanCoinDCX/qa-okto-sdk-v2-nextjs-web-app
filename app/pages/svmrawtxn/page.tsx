"use client";

import SvmRawTransaction from "@/app/components/UserOp/SvmRawTransaction";

export default function SVMRawTransactionPage() {
  return (
    <main className="flex min-h-screen flex-col items-center p-12 bg-gray-900 w-full">
      <h1 className="text-white font-bold text-3xl mb-8">Solana Raw Transaction</h1>
      <div className="flex flex-col gap-2 w-full">
        <SvmRawTransaction />
      </div>
    </main>
  );
}
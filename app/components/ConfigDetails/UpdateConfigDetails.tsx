"use client";
import { useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { STORAGE_KEY } from "@/app/constants";
import { Config } from "./ConfigDetailsAndSetUp";

interface UpdateConfigDetailsProps {
    config: Config;
    setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

export default function UpdateConfigDetails({
    config,
    setConfig
}: UpdateConfigDetailsProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleConfigUpdate = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        setConfig({
            environment: (formData.get("environment") as string) || "sandbox",
            clientPrivateKey: (formData.get("clientPrivateKey") as string) || "",
            clientSWA: (formData.get("clientSWA") as string) || "",
        });
        setIsOpen(false);
    };

    const handleResetConfig = () => {
        const defaultConfig = {
            environment: process.env.NEXT_PUBLIC_ENVIRONMENT || "sandbox",
            clientPrivateKey: process.env.NEXT_PUBLIC_CLIENT_PRIVATE_KEY || "",
            clientSWA: process.env.NEXT_PUBLIC_CLIENT_SWA || "",
        };
        setConfig(defaultConfig);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error("Error clearing config:", error);
        }
        setIsOpen(false);
    };

    return (
        <div className="relative">
            {/* Animated Hex Background */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 z-0 pointer-events-none"
            >
                <div className="absolute w-32 h-32 bg-hexagon-pattern bg-contain opacity-10 top-0 left-0" />
                <div className="absolute w-20 h-20 bg-hexagon-pattern bg-contain opacity-10 bottom-2 right-2 top-2" />
            </motion.div>

            <button
                onClick={() => setIsOpen(!isOpen)}
                className="z-10 relative w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-400 to-purple-600 mt-6 
                                     text-center text-white text-sm font-semibold shadow-md hover:from-indigo-500 hover:to-purple-700 transition-all"
            >
                {isOpen ? "Hide Config" : "Show / Update"}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.form
                        onSubmit={handleConfigUpdate}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="relative z-10 mt-4 space-y-3 p-4 rounded-xl bg-white/80 
                                             shadow-inner backdrop-blur-md border border-gray-200"
                    >
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Environment</label>
                            <select
                                name="environment"
                                defaultValue={config.environment}
                                className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-purple-500"
                            >
                                <option value="sandbox">Sandbox</option>
                                <option value="staging">Staging</option>
                                <option value="production">Production</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">Private Key</label>
                            <input
                                type="text"
                                name="clientPrivateKey"
                                defaultValue={config.clientPrivateKey}
                                placeholder="Enter private key"
                                className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-purple-500"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-700 block mb-1">SWA Address</label>
                            <input
                                type="text"
                                name="clientSWA"
                                defaultValue={config.clientSWA}
                                placeholder="Enter SWA address"
                                className="w-full p-2 text-sm rounded-lg border border-gray-300 focus:ring-purple-500"
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button
                                type="submit"
                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2 rounded-lg transition-all"
                            >
                                Save
                            </button>
                            <button
                                type="button"
                                onClick={handleResetConfig}
                                className="flex-1 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition-all"
                            >
                                Reset
                            </button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>
        </div>
    );
}
'use client';

import { motion, AnimatePresence, useAnimationControls } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { EyeIcon, EyeOffIcon, ChevronDownIcon, CopyIcon } from 'lucide-react';
import { toast as hotToast, ToastBar, ToastIcon } from 'react-hot-toast';
import UpdateConfigDetails from './UpdateConfigDetails';
import { Config } from './ConfigDetailsAndSetUp';

function cn(...classes: (string | undefined | false | null | Record<string, boolean>)[]): string {
    return classes
        .map((cls) => {
            if (!cls) return '';
            if (typeof cls === 'string') return cls;
            if (typeof cls === 'object') {
                return Object.entries(cls)
                    .filter(([_, value]) => Boolean(value))
                    .map(([key]) => key)
                    .join(' ');
            }
            return '';
        })
        .filter(Boolean)
        .join(' ');
}

interface CompactNodeSummaryProps {
    config: Config;
    userSWA?: string;
    truncate?: (value: string) => string;
    setConfig: React.Dispatch<React.SetStateAction<Config>>;
}

// ----- Helper Functions -----

const getStatus = (config: Config, userSWA?: string) => {
    if (!config.clientPrivateKey && !userSWA) return 'UNCONFIGURED';
    if (!config.clientPrivateKey || !userSWA) return 'PARTIAL';
    return 'CONFIGURED';
};

const getStatusColors = (status: string) => {
    switch (status) {
        case 'CONFIGURED':
            return { ring: 'ring-green-400/30', pulse: 'bg-green-400' };
        case 'PARTIAL':
            return { ring: 'ring-orange-400/30', pulse: 'bg-orange-400' };
        default:
            return { ring: 'ring-red-400/30', pulse: 'bg-red-400' };
    }
};

const truncateString = (value: string, len = 20) => {
    if (!value) return '';
    return value.length <= len ? value : `${value.slice(0, len)}...`;
};


const CopyableField = ({ value, label }: { value?: string; label: string }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(value || '');
        showToast({ description: `${label} copied to clipboard.` });
    };

    return value ? (
        <div className="flex items-center justify-between w-full text-sm">
            <span className="font-medium">{label}</span>
            <div className="flex items-center gap-2">
                <span className="truncate max-w-[150px]" title={value}>{value}</span>
                <CopyIcon className="w-4 h-4 cursor-pointer" onClick={handleCopy} />
            </div>
        </div>
    ) : null;
};

const StatusBar = ({ status }: { status: string }) => {
    const { ring, pulse } = getStatusColors(status);

    return (
        <div className="relative flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground">{status}</span>
            <div className={cn('relative h-2 w-6 rounded-full bg-muted/60', ring)}>
                <div className={cn('absolute h-2 rounded-full animate-pulse w-6', pulse)} />
            </div>
        </div>
    );
};

export const CompactConfigDetails = ({
    config,
    userSWA,
    truncate = truncateString,
    setConfig
}: CompactNodeSummaryProps) => {
    const [showDetails, setShowDetails] = useState(false);
    const [showPrivateKey, setShowPrivateKey] = useState(false);
    const status = useMemo(() => getStatus(config, userSWA), [config, userSWA]);

    const controls = useAnimationControls();

    useEffect(() => {
        controls.start({ opacity: [0, 1], transition: { duration: 0.5 } });
    }, [config, userSWA, controls]);

    return (
        <motion.div
            layout
            animate={controls}
            className={cn(
                'p-4 rounded-2xl shadow-md border bg-white backdrop-blur-sm w-full',
            )}
        >
            <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowDetails((prev) => !prev)}
                role="button"
                aria-expanded={showDetails}
            >
                <div className="space-y-1">
                    <StatusBar status={status} />
                    <div className="text-sm text-muted-foreground">
                        Environment: <span className={cn("</div>font-medium px-2 py-0.5 rounded-full", {
                            "bg-red-500 text-white": config.environment?.toLowerCase() === "production",
                            "bg-blue-500 text-white": config.environment?.toLowerCase() === "sandbox"
                        })}>{config.environment ? config.environment.charAt(0).toUpperCase() + config.environment.slice(1).toLowerCase() : 'N/A'}</span>
                    </div>
                    {userSWA !== "not signed in" && (
                        <div className="text-sm text-muted-foreground">
                            User SWA: <span className='text-muted-foreground font-medium'>{userSWA}</span>
                        </div>
                    )}
                </div>
                <ChevronDownIcon
                    className={cn('h-5 w-5 transition-transform', {
                        'rotate-180': showDetails,
                    })}
                />
            </div>

            <AnimatePresence initial={false}>
                {showDetails && (
                    <motion.div
                        key="details"
                        layout
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4 space-y-3 text-sm text-muted-foreground"
                    >
                        <div className="flex justify-between items-center">
                            <span className="font-medium">Private Key</span>
                            {config.clientPrivateKey ? (
                                <div className="flex items-center gap-2">
                                    <span>
                                        {showPrivateKey
                                            ? truncate(config.clientPrivateKey)
                                            : '••••••••••••'}
                                    </span>
                                    <button onClick={() => setShowPrivateKey((s) => !s)}>
                                        {showPrivateKey ? (
                                            <EyeOffIcon className="h-4 w-4" />
                                        ) : (
                                            <EyeIcon className="h-4 w-4" />
                                        )}
                                    </button>
                                </div>
                            ) : (
                                <span className="text-red-500">Not Provided</span>
                            )}
                        </div>

                        <CopyableField label="Client SWA" value={config.clientSWA} />
                        <CopyableField label="User SWA" value={userSWA} />
                        <UpdateConfigDetails config={config} setConfig={setConfig}/>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

function showToast({ description }: { description: string }) {
    hotToast.success(description, {
        className: 'bg-white text-black shadow-md rounded-lg p-4',
        duration: 3000,
    });
}


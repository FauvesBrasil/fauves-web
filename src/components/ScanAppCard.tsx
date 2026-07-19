import { useState } from 'react';
import { Clipboard, ClipboardCheck, Smartphone, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QRCodeSVG } from 'qrcode.react';

interface ScanAppCardProps {
    accessCode?: string | null;
    eventId?: string;
}

export const ScanAppCard = ({ accessCode, eventId }: ScanAppCardProps) => {
    const [copied, setCopied] = useState(false);

    // DEBUG: Log para verificar renderização

    // URL do APK - ajustar quando publicado
    const apkUrl = 'https://github.com/fauvesbrasil/fauves-scan/releases/latest/download/FauvesScan.apk';

    const copyCode = async () => {
        if (accessCode) {
            try {
                await navigator.clipboard.writeText(accessCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            } catch (e) {
                // no-op
            }
        }
    };

    if (!accessCode) {
        return (
            <div className="bg-white rounded-2xl border-2 border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div className="text-[#091747] font-semibold text-lg">
                        Aplicativo de Scanner
                    </div>
                </div>
                <p className="text-xs text-[#091747]/50">
                    Código de acesso não disponível neste evento.
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#1a1a1a] rounded-xl shadow-sm p-4 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-6">
            {/* Left: Info + Code (horizontal) */}
            <div className="flex items-center gap-4 flex-1">
                {/* Icon */}
                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                    <Smartphone className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>

                {/* Title and Instructions */}
                <div className="flex-1">
                    <div className="text-sm font-semibold text-zinc-900 dark:text-white">App Scanner</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                        Use o app para fazer check-in dos ingressos no dia do evento
                    </div>
                </div>

                {/* Access Code */}
                <div className="flex items-center gap-2">
                    <Input
                        value={accessCode}
                        readOnly
                        className="font-mono text-base font-bold text-center tracking-wider bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 w-32 h-9 px-2"
                    />
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={copyCode}
                        className="h-9 px-3"
                    >
                        {copied ? (
                            <>
                                <ClipboardCheck className="w-3.5 h-3.5 text-green-600 mr-1.5" />
                                <span className="text-xs">Copiado!</span>
                            </>
                        ) : (
                            <>
                                <Clipboard className="w-3.5 h-3.5 mr-1.5" />
                                <span className="text-xs">Copiar</span>
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Right: Download Button */}
            <button
                onClick={() => window.open(apkUrl, '_blank')}
                className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-700 rounded-lg transition-colors whitespace-nowrap"
            >
                <Download className="w-4 h-4" />
                Baixar App
            </button>
        </div>
    );
};

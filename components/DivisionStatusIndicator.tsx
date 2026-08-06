import React from 'react';
import { 
    Clock, 
    Swords, 
    CheckCircle2, 
    XCircle, 
    Crown, 
    Lock, 
    Flame, 
    ShieldAlert, 
    Hourglass, 
    Zap 
} from 'lucide-react';

export type DivisionStatusType = 
    | 'PENDING' 
    | 'WAITING_OPPONENT' 
    | 'READY_TO_PLAY' 
    | 'IN_PROGRESS' 
    | 'ACTIVE' 
    | 'QUALIFIED' 
    | 'COMPLETED' 
    | 'ELIMINATED' 
    | 'CHAMPION';

interface DivisionStatusIndicatorProps {
    status: DivisionStatusType | string;
    customLabel?: string;
    size?: 'sm' | 'md' | 'lg';
    showIcon?: boolean;
    animated?: boolean;
    className?: string;
}

export const DivisionStatusIndicator: React.FC<DivisionStatusIndicatorProps> = ({
    status,
    customLabel,
    size = 'md',
    showIcon = true,
    animated = true,
    className = ''
}) => {
    // Determine configuration based on status type
    const getStatusConfig = () => {
        const normStatus = (status || '').toUpperCase();

        switch (normStatus) {
            case 'WAITING_OPPONENT':
            case 'WAITING':
            case 'AGUARDANDO':
                return {
                    label: customLabel || 'Aguardando Adversário',
                    bg: 'bg-cyan-500/10 hover:bg-cyan-500/20',
                    border: 'border-cyan-500/40',
                    text: 'text-cyan-300',
                    shadow: 'shadow-[0_0_15px_rgba(6,182,212,0.25)]',
                    icon: Hourglass,
                    pulseColor: 'bg-cyan-400'
                };

            case 'READY_TO_PLAY':
            case 'READY':
            case 'PRONTO':
                return {
                    label: customLabel || 'Pronto para Batalhar',
                    bg: 'bg-emerald-500/15 hover:bg-emerald-500/25',
                    border: 'border-emerald-400/60',
                    text: 'text-emerald-300 font-extrabold',
                    shadow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
                    icon: Zap,
                    pulseColor: 'bg-emerald-400'
                };

            case 'IN_PROGRESS':
            case 'IN_MATCH':
            case 'ACTIVE':
            case 'EM_ANDAMENTO':
                return {
                    label: customLabel || 'Em Andamento',
                    bg: 'bg-amber-500/15 hover:bg-amber-500/25',
                    border: 'border-amber-500/50',
                    text: 'text-amber-300 font-extrabold',
                    shadow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
                    icon: Swords,
                    pulseColor: 'bg-amber-400'
                };

            case 'QUALIFIED':
            case 'COMPLETED':
            case 'CONCLUIDO':
                return {
                    label: customLabel || 'Concluído / Classificado',
                    bg: 'bg-green-500/15 hover:bg-green-500/25',
                    border: 'border-green-500/50',
                    text: 'text-green-300 font-black',
                    shadow: 'shadow-[0_0_15px_rgba(34,197,94,0.25)]',
                    icon: CheckCircle2,
                    pulseColor: 'bg-green-400'
                };

            case 'CHAMPION':
            case 'WINNER':
            case 'CAMPEAO':
                return {
                    label: customLabel || '🏆 Campeão da Divisão',
                    bg: 'bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-orange-500/25',
                    border: 'border-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.5)]',
                    text: 'text-yellow-300 font-black tracking-widest',
                    shadow: 'shadow-[0_0_25px_rgba(245,158,11,0.4)]',
                    icon: Crown,
                    pulseColor: 'bg-yellow-400'
                };

            case 'ELIMINATED':
            case 'ELIMINADO':
                return {
                    label: customLabel || 'Eliminado',
                    bg: 'bg-red-500/10 hover:bg-red-500/20',
                    border: 'border-red-500/30',
                    text: 'text-red-400',
                    shadow: 'shadow-none',
                    icon: XCircle,
                    pulseColor: 'bg-red-500'
                };

            case 'PENDING':
            case 'LOCKED':
            case 'BLOQUEADO':
            default:
                return {
                    label: customLabel || 'Bloqueado',
                    bg: 'bg-stone-900/80',
                    border: 'border-white/10',
                    text: 'text-stone-400',
                    shadow: 'shadow-none',
                    icon: Lock,
                    pulseColor: 'bg-stone-500'
                };
        }
    };

    const config = getStatusConfig();
    const IconComponent = config.icon;

    // Size variations
    const sizeClasses = {
        sm: {
            padding: 'px-2.5 py-1',
            text: 'text-[9px]',
            icon: 12,
            dot: 'w-1.5 h-1.5'
        },
        md: {
            padding: 'px-3.5 py-1.5',
            text: 'text-xs',
            icon: 14,
            dot: 'w-2 h-2'
        },
        lg: {
            padding: 'px-5 py-2.5',
            text: 'text-sm',
            icon: 18,
            dot: 'w-2.5 h-2.5'
        }
    }[size];

    return (
        <div 
            className={`inline-flex items-center gap-2 rounded-full border backdrop-blur-md transition-all duration-300 select-none ${config.bg} ${config.border} ${config.text} ${config.shadow} ${sizeClasses.padding} ${sizeClasses.text} ${className}`}
        >
            {/* Animated Status Pulse Indicator Dot */}
            {animated && (
                <span className="relative flex shrink-0 items-center justify-center">
                    {(status === 'IN_PROGRESS' || status === 'ACTIVE' || status === 'WAITING_OPPONENT' || status === 'READY_TO_PLAY') && (
                        <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${config.pulseColor}`} />
                    )}
                    <span className={`relative inline-flex rounded-full ${sizeClasses.dot} ${config.pulseColor}`} />
                </span>
            )}

            {/* Icon */}
            {showIcon && IconComponent && (
                <IconComponent size={sizeClasses.icon} className="shrink-0 opacity-90" />
            )}

            {/* Status Text Label */}
            <span className="font-black uppercase tracking-wider whitespace-nowrap">
                {config.label}
            </span>
        </div>
    );
};

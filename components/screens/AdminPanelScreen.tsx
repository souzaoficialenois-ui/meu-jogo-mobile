import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, PlayerProfile } from '../../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BASE_CHARACTERS as ORIGINAL_BASE_CHARACTERS } from '../../personagens/CharacterDatabase';
const BASE_CHARACTERS = ORIGINAL_BASE_CHARACTERS.filter(c => c.id !== 'random');
import { 
    Users, Shield, Ban, Gift, Search, ChevronLeft, MoreVertical,
    UserCircle, BadgeCheck, Coins, Diamond, Ticket,
    Trophy, BarChart3, Activity, Zap, LayoutDashboard, RefreshCw, Mail, 
    Clapperboard, Code2, Menu, X, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AudioManager } from '../../services/AudioManager';

import { AdminRemoteConfigTab } from './AdminRemoteConfigTab';

export const AdminPanelScreen: React.FC = () => {
    const { 
        changeScene, isAdmin: isCurrentUserAdmin, isOfflineMode, fetchAllUsers, 
        updatePlayerProfileByAdmin, sendRewardToPlayer, generatePromoCode, sendInMail,
        globalEngineOverrides, updateGlobalEngineOverride,
        t
    } = useSceneManager() as any;

    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PLAYERS' | 'AGENTS' | 'AMBASSADORS' | 'PROMO' | 'BROADCAST' | 'CHARACTERS' | 'GAME_CONFIG' | 'REMOTE_CONFIG'>('DASHBOARD');

    const [users, setUsers] = useState<PlayerProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<PlayerProfile | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // Character Editor State
    const [selectedCharacterId, setSelectedCharacterId] = useState<string>('');
    const [charOverrides, setCharOverrides] = useState<any>({});

    // Engine Config State
    const [engineOverridesLocal, setEngineOverridesLocal] = useState<any>({});
    
    // Reward Modal
    const [rewardModal, setRewardModal] = useState<{ isOpen: boolean, type: 'COIN' | 'GEM' | 'TICKET' }>({ isOpen: false, type: 'COIN' });
    const [rewardAmount, setRewardAmount] = useState('100');

    // Promo Code State
    const [promoForm, setPromoForm] = useState({ code: '', type: 'COIN' as any, amount: '100', isSingle: true });
    
    // Broadcast State
    const [mailForm, setMailForm] = useState({ subject: '', content: '', rewardType: 'NONE' as any, rewardAmount: '0' });

    // Project Diagnostics / Sweep State
    const [sweepResult, setSweepResult] = useState<any>(null);
    const [isSweeping, setIsSweeping] = useState(false);

    const handleRunDiagnosticsSweep = async () => {
        setIsSweeping(true);
        try {
            const { ProjectSweepManager } = await import('../../services/ProjectSweepManager');
            const result = await ProjectSweepManager.getInstance().runSweep(false);
            setSweepResult(result);
        } catch (e) {
            console.error("Failed to run diagnostics sweep:", e);
        }
        setIsSweeping(false);
    };

    useEffect(() => {
        if (!isCurrentUserAdmin) {
            changeScene(SceneName.MAIN_MENU);
            return;
        }
        loadUsers();
    }, [isCurrentUserAdmin]);

    // Data Loaders
    const loadUsers = async () => {
        setIsLoading(true);
        try {
            const allUsers = await fetchAllUsers();
            setUsers(allUsers);
        } catch (error) {
            console.error("Failed to fetch users:", error);
        }
        setIsLoading(false);
    };

    const loadCharacterOverrides = async (charId: string) => {
        setIsLoading(true);
        try {
            if (isOfflineMode) {
                const localData = localStorage.getItem('dd2d_char_overrides');
                if (localData) {
                    const parsed = JSON.parse(localData);
                    setCharOverrides(parsed[charId] || {});
                } else setCharOverrides({});
            } else {
                const docRef = doc(db, 'character_overrides', charId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) setCharOverrides(docSnap.data());
                else setCharOverrides({});
            }
        } catch (error) { console.error(error); }
        setIsLoading(false);
    };

    useEffect(() => {
        setEngineOverridesLocal(globalEngineOverrides || {});
    }, [globalEngineOverrides, activeTab]);

    const handleSaveEngineOverrides = async () => {
        try {
            if (isOfflineMode) {
                localStorage.setItem('dd2d_engine_overrides', JSON.stringify(engineOverridesLocal));
                updateGlobalEngineOverride(engineOverridesLocal);
                alert("Game engine variables updated locally.");
            } else {
                const docRef = doc(db, 'engine_overrides', 'global');
                await setDoc(docRef, engineOverridesLocal, { merge: true });
                updateGlobalEngineOverride(engineOverridesLocal);
                alert("Game engine variables updated on server.");
            }
        } catch(error) {
            alert("Error saving game engine overrides");
        }
    }

    const handleEngineOverrideChange = (field: string, value: number) => {
        setEngineOverridesLocal((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSaveCharacterOverrides = async () => {
        if (!selectedCharacterId) return;
        try {
            if (isOfflineMode) {
                const localData = localStorage.getItem('dd2d_char_overrides');
                const parsed = localData ? JSON.parse(localData) : {};
                parsed[selectedCharacterId] = charOverrides;
                localStorage.setItem('dd2d_char_overrides', JSON.stringify(parsed));
                
                const charToUpdate = BASE_CHARACTERS.find(c => c.id === selectedCharacterId);
                if (charToUpdate) {
                    if (charOverrides.attack !== undefined) charToUpdate.stats.attack = charOverrides.attack;
                    if (charOverrides.defense !== undefined) charToUpdate.stats.defense = charOverrides.defense;
                    if (charOverrides.speed !== undefined) charToUpdate.stats.speed = charOverrides.speed;
                    if (charOverrides.maxHp !== undefined) charToUpdate.maxHp = charOverrides.maxHp;
                    
                    if (charOverrides.animations) {
                        if (!charToUpdate.spriteConfig) charToUpdate.spriteConfig = { animations: {} } as any;
                        if (!charToUpdate.spriteConfig.animations) charToUpdate.spriteConfig.animations = {};
                        
                        Object.entries(charOverrides.animations).forEach(([animKey, animVal]: [string, any]) => {
                            if (animVal && animVal.baseDamage !== undefined) {
                                if (!charToUpdate.spriteConfig.animations[animKey]) {
                                    charToUpdate.spriteConfig.animations[animKey] = {} as any;
                                }
                                charToUpdate.spriteConfig.animations[animKey].baseDamage = animVal.baseDamage;
                            }
                        });
                    }
                }
                
                alert("Sobrava/Modificadores do personagem salvos localmente!");
            } else {
                const docRef = doc(db, 'character_overrides', selectedCharacterId);
                await setDoc(docRef, charOverrides, { merge: true });
                alert("Sobrava/Modificadores do personagem salvos na nuvem!");
            }
        } catch (error) {
            console.error("Failed to save character overrides:", error);
            alert("Erro ao salvar modificadores.");
        }
    };

    const handleCharOverrideChange = (field: string, value: any) => {
        setCharOverrides((prev: any) => ({
            ...prev,
            [field]: value
        }));
    };

    const handleAnimDamageChange = (animKey: string, damage: any) => {
        setCharOverrides((prev: any) => ({
            ...prev,
            animations: {
                ...(prev.animations || {}),
                [animKey]: {
                    ...(prev.animations?.[animKey] || {}),
                    baseDamage: damage
                }
            }
        }));
    };

    // User Actions
    const handleToggleBan = async (user: PlayerProfile) => {
        try {
            const newBanState = !user.isBanned;
            await updatePlayerProfileByAdmin(user.playerId, { isBanned: newBanState });
            setUsers(users.map(u => u.playerId === user.playerId ? { ...u, isBanned: newBanState } : u));
        } catch (error) {
            console.error("Failed to toggle ban:", error);
        }
    };

    const handleChangeRole = async (user: PlayerProfile, role: any) => {
        try {
            await updatePlayerProfileByAdmin(user.playerId, { role });
            setUsers(users.map(u => u.playerId === user.playerId ? { ...u, role } : u));
        } catch (error) {
            console.error("Failed to change role:", error);
        }
    };

    const handleSendRewardNotification = async (user: PlayerProfile) => {
        try {
            const amount = parseInt(rewardAmount) || 0;
            if (amount <= 0) return;
            await sendRewardToPlayer(user.playerId, rewardModal.type, amount);
            alert(`Enviado ${amount} ${rewardModal.type} para ${user.name}`);
            setRewardModal({ isOpen: false, type: 'COIN' });
        } catch (error) {
            console.error("Failed to send reward:", error);
        }
    };

    // Promo Code Action
    const handleGeneratePromo = async () => {
        if (!promoForm.code || !promoForm.amount) return;
        try {
            await generatePromoCode({
                code: promoForm.code,
                rewardType: promoForm.type,
                rewardAmount: parseInt(promoForm.amount),
                isSingleUse: promoForm.isSingle
            });
            alert(`Código ${promoForm.code} criado com sucesso!`);
            setPromoForm({ code: '', type: 'COIN', amount: '100', isSingle: true });
        } catch (error) {
            console.error("Failed to generate code:", error);
        }
    };

    // Broadcast Action
    const handleSendBroadcast = async () => {
        if (!mailForm.subject || !mailForm.content) return;
        try {
            await sendInMail({
                subject: mailForm.subject,
                content: mailForm.content,
                rewardType: mailForm.rewardType !== 'NONE' ? mailForm.rewardType : undefined,
                rewardAmount: mailForm.rewardType !== 'NONE' ? parseInt(mailForm.rewardAmount) : undefined,
                isGlobal: true
            });
            alert("Mensagem Global enviada!");
            setMailForm({ subject: '', content: '', rewardType: 'NONE', rewardAmount: '0' });
        } catch (error) {
            console.error("Failed to send broadcast:", error);
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.playerId.toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        if (activeTab === 'PLAYERS') return u.role === 'PLAYER' || u.role === 'VETERAN';
        if (activeTab === 'AGENTS') return u.role === 'MODERATOR' || u.role === 'ADMIN';
        if (activeTab === 'AMBASSADORS') return u.role === 'AMBASSADOR';
        return true;
    });

    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        changeScene(SceneName.MAIN_MENU);
    };

    const sidebarCategories = [
        {
            title: "VISÃO GERAL",
            items: [
                { id: 'DASHBOARD', label: 'Dashboard & Métricas', icon: LayoutDashboard },
            ]
        },
        {
            title: "COMUNIDADE",
            items: [
                { id: 'PLAYERS', label: 'Lutadores', icon: Users, badge: users.filter(u => u.role === 'PLAYER' || u.role === 'VETERAN').length },
                { id: 'AGENTS', label: 'Mestres / Staff', icon: Shield, badge: users.filter(u => u.role === 'MODERATOR' || u.role === 'ADMIN').length },
                { id: 'AMBASSADORS', label: 'Embaixadores', icon: BadgeCheck, badge: users.filter(u => u.role === 'AMBASSADOR').length },
                { id: 'BROADCAST', label: 'Mensagem Global', icon: Mail },
                { id: 'PROMO', label: 'Promo Codes', icon: Code2 },
            ]
        },
        {
            title: "BANCO DE DADOS",
            items: [
                { id: 'CHARACTERS', label: 'Atributos Lutadores', icon: Zap },
                { id: 'GAME_CONFIG', label: 'Engine de Batalha', icon: Settings },
                { id: 'REMOTE_CONFIG', label: 'Remote Config', icon: Activity },
            ]
        },
        {
            title: "FERRAMENTAS",
            items: [
                { id: 'ANIMATION_TOOLS', label: 'Editor de Animações', icon: Clapperboard, isAction: true },
            ]
        }
    ];

    return (
        <div className="relative w-full h-full min-h-screen bg-stone-950 text-stone-200 overflow-hidden font-sans flex flex-col select-none">
            {/* Dark background image with subtle texture & gradient overlay */}
            <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 scale-105 pointer-events-none transition-all duration-1000"
                style={{ backgroundImage: `url('/Assets/fundosdastelas/modos/m3.png')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/80 via-stone-950/90 to-stone-950 pointer-events-none" />
            <div className="absolute inset-0 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-25 pointer-events-none" />

            {/* HEADER BAR */}
            <div className="h-16 md:h-20 px-4 md:px-8 flex items-center justify-between relative z-50 shrink-0 bg-stone-900/60 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="w-10 h-10 md:w-12 md:h-12 bg-stone-900/80 hover:bg-stone-800 flex items-center justify-center border border-white/10 rounded-xl transition-all shadow-lg cursor-pointer group"
                    >
                        <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 text-stone-300 group-hover:-translate-x-0.5 transition-transform" />
                    </button>
                    <div>
                        <h1 className="text-lg md:text-2xl font-black italic uppercase tracking-wider text-white flex items-center gap-2 drop-shadow-md">
                            <Shield className="w-6 h-6 text-orange-500" />
                            <span className="bg-gradient-to-r from-orange-400 via-amber-300 to-amber-500 bg-clip-text text-transparent">PAINEL ADMIN</span>
                        </h1>
                        <p className="text-[10px] md:text-xs font-bold text-stone-400 uppercase tracking-widest hidden sm:block">
                            FIGHTER LEGEND • ARENA CONTROL CENTER
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => {
                            AudioManager.getInstance().playSFX('click');
                            changeScene(SceneName.ANIMATION_PREVIEW);
                        }}
                        className="bg-orange-600/20 hover:bg-orange-600/30 border border-orange-500/30 text-orange-400 hover:text-orange-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg backdrop-blur-sm cursor-pointer"
                    >
                        <Clapperboard className="w-4 h-4" />
                        <span className="hidden sm:inline">Animações (Editor)</span>
                    </button>

                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden w-10 h-10 bg-stone-800/80 border border-white/10 rounded-xl flex items-center justify-center text-stone-300"
                    >
                        {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden relative z-10">
                {/* SIDEBAR NAVIGATION */}
                <div className={`
                    fixed md:relative inset-y-0 left-0 z-40 w-72 bg-stone-900/90 md:bg-stone-900/40 backdrop-blur-md border-r border-white/5 flex flex-col p-4 gap-6 overflow-y-auto custom-scrollbar transition-transform duration-300
                    ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    {sidebarCategories.map((cat, idx) => (
                        <div key={idx} className="space-y-1">
                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] px-3 pb-2">
                                {cat.title}
                            </p>
                            <div className="space-y-1">
                                {cat.items.map((item) => {
                                    const Icon = item.icon;
                                    const isActive = activeTab === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                AudioManager.getInstance().playSFX('click');
                                                if (item.isAction && item.id === 'ANIMATION_TOOLS') {
                                                    changeScene(SceneName.ANIMATION_PREVIEW);
                                                } else {
                                                    setActiveTab(item.id as any);
                                                    setIsMobileMenuOpen(false);
                                                }
                                            }}
                                            className={`
                                                relative w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all group cursor-pointer
                                                ${isActive 
                                                    ? 'bg-orange-600/20 text-white font-black italic border border-orange-500/30 shadow-md shadow-orange-600/10' 
                                                    : 'text-stone-400 hover:text-stone-200 hover:bg-white/5 border border-transparent'}
                                            `}
                                        >
                                            <div className="flex items-center gap-3">
                                                <Icon className={`w-4 h-4 ${isActive ? 'text-orange-400' : 'text-stone-500 group-hover:text-stone-300'}`} />
                                                <span>{item.label}</span>
                                            </div>
                                            {item.badge !== undefined && (
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-black ${isActive ? 'bg-orange-500/30 text-orange-200' : 'bg-stone-800 text-stone-400'}`}>
                                                    {item.badge}
                                                </span>
                                            )}
                                            {isActive && (
                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-orange-500" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))}

                    <div className="mt-auto pt-4 border-t border-white/5">
                        <div className="p-3 bg-stone-950/60 border border-white/5 rounded-xl flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 font-black">
                                A
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black text-white truncate">ADMINISTRADOR</p>
                                <p className="text-[10px] font-mono text-stone-500 truncate">Sessão Segura</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* VIEWPORT CONTENT */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8">
                    {isLoading && users.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4">
                            <RefreshCw className="w-8 h-8 text-orange-500 animate-spin" />
                            <p className="text-xs font-black uppercase tracking-widest text-stone-400">Carregando dados da arena...</p>
                        </div>
                    ) : (
                        <div className="max-w-6xl mx-auto space-y-6">
                            <AnimatePresence mode="wait">
                                {/* DASHBOARD */}
                                {activeTab === 'DASHBOARD' && (
                                    <motion.div 
                                        key="dashboard" 
                                        initial={{ opacity: 0, y: 10 }} 
                                        animate={{ opacity: 1, y: 0 }} 
                                        exit={{ opacity: 0, y: -10 }} 
                                        className="space-y-6"
                                    >
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-xl md:text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                                    <LayoutDashboard className="w-6 h-6 text-orange-500" /> Visão Geral da Arena
                                                </h2>
                                                <p className="text-xs text-stone-400">Estatísticas globais e atalhos operacionais</p>
                                            </div>
                                            <button 
                                                onClick={loadUsers} 
                                                className="bg-stone-800/80 hover:bg-stone-700/80 border border-white/10 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-stone-200 flex items-center gap-2 transition-all cursor-pointer"
                                            >
                                                <RefreshCw className="w-4 h-4 text-orange-400" /> Atualizar Dados
                                            </button>
                                        </div>

                                        {/* Metric Cards Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                                                <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-orange-400 shrink-0">
                                                    <Users className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Total Usuários</p>
                                                    <p className="text-2xl font-black italic text-white">{users.length}</p>
                                                </div>
                                            </div>

                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                                                <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400 shrink-0">
                                                    <Trophy className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Vitórias Registradas</p>
                                                    <p className="text-2xl font-black italic text-white">
                                                        {users.reduce((acc, u) => acc + Number(u.wins || 0), 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                                                <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 shrink-0">
                                                    <Zap className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Personagens Base</p>
                                                    <p className="text-2xl font-black italic text-white">{BASE_CHARACTERS.length}</p>
                                                </div>
                                            </div>

                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-5 backdrop-blur-sm flex items-center gap-4">
                                                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400 shrink-0">
                                                    <Shield className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500">Staff / Mestres</p>
                                                    <p className="text-2xl font-black italic text-white">
                                                        {users.filter(u => u.role === 'ADMIN' || u.role === 'MODERATOR').length}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                            {/* Desempenho Global */}
                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm space-y-6">
                                                <h3 className="text-sm font-black text-stone-300 uppercase tracking-widest flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4 text-orange-500" /> Desempenho & Estatísticas
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-stone-950/60 rounded-xl border border-white/5">
                                                        <div>
                                                            <p className="text-[10px] text-stone-500 font-black uppercase">Média de Vitórias por Lutador</p>
                                                            <p className="text-xl font-black italic text-white mt-1">
                                                                {users.length > 0 ? (users.reduce((acc, u) => acc + Number(u.wins || 0), 0) / users.length).toFixed(1) : '0'}
                                                            </p>
                                                        </div>
                                                        <Trophy className="w-8 h-8 text-amber-500/20" />
                                                    </div>

                                                    <div className="flex items-center justify-between p-4 bg-stone-950/60 rounded-xl border border-white/5">
                                                        <div>
                                                            <p className="text-[10px] text-stone-500 font-black uppercase">Taxa Global de Vitórias</p>
                                                            <p className="text-xl font-black italic text-white mt-1">
                                                                {(() => {
                                                                    const w = users.reduce((acc, u) => acc + (u.wins || 0), 0);
                                                                    const l = users.reduce((acc, u) => acc + (u.losses || 0), 0);
                                                                    return w + l === 0 ? '0%' : Math.round((w / (w + l)) * 100) + '%';
                                                                })()}
                                                            </p>
                                                        </div>
                                                        <Activity className="w-8 h-8 text-orange-500/20" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Diagnóstico e Varredura */}
                                            <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-sm font-black text-stone-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-orange-500 animate-pulse" /> Diagnóstico e Varredura
                                                    </h3>
                                                    <p className="text-xs text-stone-400 leading-relaxed mb-4">
                                                        Analisa todos os recursos do jogo (beams, projéteis, auras, hitboxes) e remove de forma segura qualquer elemento órfão ou inválido de cache.
                                                    </p>
                                                    {sweepResult && (
                                                        <div className="p-3 bg-stone-950/60 rounded-xl border border-white/5 space-y-1 text-[11px] font-bold text-stone-300 mb-4">
                                                            <div className="flex justify-between">
                                                                <span>Beams Limpos:</span>
                                                                <span className="text-orange-400">{sweepResult.deletedBeams.length}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Projéteis Limpos:</span>
                                                                <span className="text-orange-400">{sweepResult.deletedProjectiles.length}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Auras Limpas:</span>
                                                                <span className="text-orange-400">{sweepResult.deletedAuras.length}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Hitboxes Corrigidos:</span>
                                                                <span className="text-orange-400">{sweepResult.cleanedHitboxesCount}</span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    onClick={handleRunDiagnosticsSweep}
                                                    disabled={isSweeping}
                                                    className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/15 cursor-pointer"
                                                >
                                                    <RefreshCw className={`w-4 h-4 ${isSweeping ? 'animate-spin' : ''}`} />
                                                    {isSweeping ? 'Executando Varredura...' : 'Executar Varredura e Limpeza'}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* USER LISTS */}
                                {['PLAYERS', 'AGENTS', 'AMBASSADORS'].includes(activeTab) && (
                                    <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <h2 className="text-xl font-black italic uppercase text-white tracking-tight">
                                                {activeTab === 'PLAYERS' ? t('rank_fighter') + 's' : activeTab === 'AGENTS' ? t('rank_master') + 's' : t('rank_ambassador') + 's'}
                                            </h2>
                                            <div className="relative w-full sm:w-auto">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-500" />
                                                <input 
                                                    type="text"
                                                    placeholder="Buscar por ID ou Nome..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full sm:w-64 bg-stone-950/60 border border-white/10 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-white focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {filteredUsers.map((user, idx) => (
                                                <div key={`admin-user-${user.playerId || idx}-${idx}`} className={`bg-stone-900/40 border ${user.isBanned ? 'border-red-500/40' : 'border-white/5'} rounded-2xl p-5 backdrop-blur-sm flex flex-col gap-4 relative`}>
                                                    {user.isBanned && (
                                                        <div className="absolute top-0 right-4 bg-red-500/20 text-red-400 text-[10px] font-black italic px-2.5 py-1 rounded-b-lg border-x border-b border-red-500/40">
                                                            BANIDO
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-12 h-12 bg-stone-950 rounded-xl border border-white/10 flex items-center justify-center shrink-0 text-stone-400">
                                                            <UserCircle className="w-7 h-7" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-black italic uppercase text-white truncate">{user.name}</h3>
                                                                {user.role === 'ADMIN' && <BadgeCheck className="w-4 h-4 text-orange-400 shrink-0" />}
                                                                {user.role === 'AMBASSADOR' && <BadgeCheck className="w-4 h-4 text-amber-400 shrink-0" />}
                                                            </div>
                                                            <p className="text-[10px] text-stone-500 font-mono truncate">{user.playerId}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-center">
                                                        <div className="bg-stone-950/60 p-2 rounded-xl border border-white/5">
                                                            <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-0.5">Win / Loss</p>
                                                            <p className="text-xs font-black">
                                                                <span className="text-orange-400">{user.wins || 0}</span>
                                                                <span className="text-stone-600 mx-1">/</span>
                                                                <span className="text-red-400">{user.losses || 0}</span>
                                                            </p>
                                                        </div>
                                                        <div className="bg-stone-950/60 p-2 rounded-xl border border-white/5">
                                                            <p className="text-[8px] uppercase tracking-widest text-stone-500 mb-0.5">Visto em</p>
                                                            <p className="text-[10px] font-bold text-stone-300 mt-1">
                                                                {user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'Nunca'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                                                        <button 
                                                            onClick={() => { setSelectedUser(user); setRewardModal({ isOpen: true, type: 'COIN' }); }} 
                                                            className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Gift className="w-3.5 h-3.5" /> Enviar Presente
                                                        </button>
                                                        <button 
                                                            onClick={() => handleToggleBan(user)} 
                                                            className={`p-2 rounded-xl border transition-all cursor-pointer ${user.isBanned ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20'}`}
                                                            title={user.isBanned ? "Desbanir Usuário" : "Banir Usuário"}
                                                        >
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                        <div className="relative group/menu">
                                                            <button className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition-colors cursor-pointer">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-stone-900 border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-20 p-1">
                                                                <button onClick={async () => {
                                                                    if (confirm(`Desbloquear todos os personagens para ${user.name}?`)) {
                                                                        await updatePlayerProfileByAdmin(user.playerId, { unlockedCharacterIds: BASE_CHARACTERS.map(c => c.id) } as any);
                                                                        alert("Personagens desbloqueados!");
                                                                    }
                                                                }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-amber-400">Liberar Personagens</button>
                                                                
                                                                <button onClick={async () => {
                                                                    if (confirm(`Resetar KDA de ${user.name}?`)) {
                                                                        await updatePlayerProfileByAdmin(user.playerId, { wins: 0, losses: 0 });
                                                                        alert("Status resetado!");
                                                                        loadUsers();
                                                                    }
                                                                }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-orange-400">Resetar KDA</button>
                                                                
                                                                <div className="h-px bg-white/5 my-1" />
                                                                
                                                                <button onClick={() => handleChangeRole(user, 'PLAYER')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-stone-300">Tornar Player</button>
                                                                <button onClick={() => handleChangeRole(user, 'AMBASSADOR')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-amber-400">Tornar Embaixador</button>
                                                                <button onClick={() => handleChangeRole(user, 'MODERATOR')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-purple-400">Tornar Moderador</button>
                                                                {user.role !== 'ADMIN' && <button onClick={() => handleChangeRole(user, 'ADMIN')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-red-400">Tornar Admin</button>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <div className="col-span-full py-12 text-center text-stone-500 italic">
                                                    Nenhum usuário encontrado.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* BROADCAST */}
                                {activeTab === 'BROADCAST' && (
                                    <motion.div key="broadcast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
                                        <h2 className="text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                            <Mail className="w-6 h-6 text-orange-400" /> Transmissão Global
                                        </h2>
                                        <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-stone-400">Assunto</label>
                                                <input 
                                                    value={mailForm.subject} 
                                                    onChange={e => setMailForm({...mailForm, subject: e.target.value})} 
                                                    className="w-full bg-stone-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-colors text-white" 
                                                    placeholder="Aviso Geral a todos os Lutadores..." 
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-stone-400">Mensagem</label>
                                                <textarea 
                                                    value={mailForm.content} 
                                                    onChange={e => setMailForm({...mailForm, content: e.target.value})} 
                                                    rows={5} 
                                                    className="w-full bg-stone-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-colors resize-none text-white" 
                                                    placeholder="Digite o conteúdo da transmissão..." 
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-400">Recompensa Anexa</label>
                                                    <select value={mailForm.rewardType} onChange={e => setMailForm({...mailForm, rewardType: e.target.value as any})} className="w-full bg-stone-950 border border-orange-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none text-white">
                                                        <option value="NONE">Nenhuma</option>
                                                        <option value="COIN">Moedas GP</option>
                                                        <option value="GEM">Gemas</option>
                                                        <option value="TICKET">Tickets</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-400">Quantidade</label>
                                                    <input type="number" value={mailForm.rewardAmount} onChange={e => setMailForm({...mailForm, rewardAmount: e.target.value})} disabled={mailForm.rewardType === 'NONE'} className="w-full bg-stone-950 border border-orange-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none text-white disabled:opacity-50" />
                                                </div>
                                            </div>
                                            <button onClick={handleSendBroadcast} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-orange-600/20">
                                                Disparar Transmissão
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* PROMO CODES */}
                                {activeTab === 'PROMO' && (
                                    <motion.div key="promo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
                                        <h2 className="text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                            <Code2 className="w-6 h-6 text-orange-400" /> Gerador de Promo Codes
                                        </h2>
                                        <div className="bg-stone-900/40 border border-white/5 rounded-2xl p-6 space-y-5 backdrop-blur-sm">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-stone-400">Código de Ativação</label>
                                                <input value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} className="w-full bg-stone-950/60 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono tracking-[0.2em] focus:border-orange-500 focus:outline-none transition-colors text-white uppercase" placeholder="LEGEND-2026" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Tipo de Recompensa</label>
                                                    <select value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value as any})} className="w-full bg-stone-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none">
                                                        <option value="COIN">Moedas GP</option>
                                                        <option value="GEM">Gemas</option>
                                                        <option value="TICKET">Tickets</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Quantidade</label>
                                                    <input type="number" value={promoForm.amount} onChange={e => setPromoForm({...promoForm, amount: e.target.value})} className="w-full bg-stone-950/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-stone-950/40 rounded-xl border border-white/5">
                                                <input type="checkbox" checked={promoForm.isSingle} onChange={e => setPromoForm({...promoForm, isSingle: e.target.checked})} className="w-5 h-5 rounded bg-stone-950 border-stone-700 text-orange-500 focus:ring-0 cursor-pointer" />
                                                <div>
                                                    <p className="text-xs font-bold text-white">Uso Único (Single Use)</p>
                                                    <p className="text-[10px] text-stone-500">O código expira imediatamente após o primeiro resgate.</p>
                                                </div>
                                            </div>
                                            <button onClick={handleGeneratePromo} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-black uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-orange-600/20">
                                                Gerar Código
                                            </button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* CHARACTERS EDITOR */}
                                {activeTab === 'CHARACTERS' && (
                                    <motion.div key="characters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                                <Zap className="w-6 h-6 text-amber-400" /> Atributos dos Lutadores
                                            </h2>
                                            {selectedCharacterId && (
                                                <button onClick={handleSaveCharacterOverrides} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg cursor-pointer">
                                                    Salvar Alterações
                                                </button>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-220px)]">
                                            {/* Fighter selector list */}
                                            <div className="w-full md:w-64 shrink-0 bg-stone-900/40 rounded-2xl border border-white/5 overflow-hidden flex flex-col backdrop-blur-sm">
                                                <div className="p-4 border-b border-white/5 bg-stone-950/40">
                                                    <p className="text-xs font-black uppercase tracking-widest text-stone-400">Selecione um Lutador</p>
                                                </div>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                    {BASE_CHARACTERS.map(char => (
                                                        <button 
                                                            key={char.id} 
                                                            onClick={() => { setSelectedCharacterId(char.id); loadCharacterOverrides(char.id); }} 
                                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedCharacterId === char.id ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-stone-400 hover:bg-white/5 hover:text-white'}`}
                                                        >
                                                            {char.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Character details */}
                                            {selectedCharacterId ? (
                                                <div className="flex-1 bg-stone-900/40 rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar space-y-8 backdrop-blur-sm">
                                                    <div>
                                                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Status Base</h3>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {['maxHp', 'attack', 'defense', 'speed'].map(stat => (
                                                                <div key={stat} className="bg-stone-950/60 p-4 border border-white/5 rounded-xl">
                                                                    <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">{stat.replace('max', '')}</label>
                                                                    <input 
                                                                        type="number" 
                                                                        value={Number.isNaN(charOverrides[stat]) ? '' : (charOverrides[stat] ?? (stat === 'maxHp' ? BASE_CHARACTERS.find(c=>c.id===selectedCharacterId)?.maxHp : (BASE_CHARACTERS.find(c=>c.id===selectedCharacterId)?.stats as any)?.[stat]) ?? 0)} 
                                                                        onChange={e => { const val = parseFloat(e.target.value); handleCharOverrideChange(stat, isNaN(val) ? undefined : val); }} 
                                                                        className="w-full bg-transparent border-b border-white/20 focus:border-amber-500 px-0 py-1 text-white font-bold focus:outline-none transition-colors" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Dano de Golpes (Animations)</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {Object.entries(BASE_CHARACTERS.find(c => c.id === selectedCharacterId)?.spriteConfig?.animations || {})
                                                                .filter(([key, anim]) => anim && (String((anim as any).dealsDamage) !== 'false'))
                                                                .map(([key, anim]) => {
                                                                    const overrideDamage = Number.isNaN(charOverrides.animations?.[key]?.baseDamage) ? '' : (charOverrides.animations?.[key]?.baseDamage ?? (anim as any)?.baseDamage ?? '');
                                                                    return (
                                                                        <div key={key} className="bg-stone-950/60 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-stone-300 uppercase">{key}</span>
                                                                            <input 
                                                                                type="number" 
                                                                                placeholder={String((anim as any)?.baseDamage||'0')} 
                                                                                value={overrideDamage} 
                                                                                onChange={e => { const val = parseFloat(e.target.value); handleAnimDamageChange(key, isNaN(val) ? undefined : val); }} 
                                                                                className="w-20 bg-stone-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-center font-bold text-amber-400 focus:border-amber-500 focus:outline-none" 
                                                                            />
                                                                        </div>
                                                                    );
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center bg-stone-900/20 rounded-2xl border border-white/5 border-dashed">
                                                    <p className="text-stone-500 font-bold uppercase tracking-widest text-xs">Selecione um Lutador para Editar</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* GAME ENGINE CONFIG */}
                                {activeTab === 'GAME_CONFIG' && (
                                    <motion.div key="game_config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                                <Settings className="w-6 h-6 text-orange-400" /> Variáveis da Engine de Batalha
                                            </h2>
                                            <button onClick={handleSaveEngineOverrides} className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase transition-all shadow-lg cursor-pointer">
                                                Salvar Globalmente
                                            </button>
                                        </div>

                                        <div className="bg-stone-900/40 rounded-2xl border border-white/5 p-6 space-y-8 backdrop-blur-sm">
                                            <div>
                                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Física & Geral</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['GRAVITY', 'FRICTION', 'MOVE_SPEED', 'JUMP_FORCE', 'MAX_HP'].map(stat => (
                                                        <div key={stat} className="bg-stone-950/60 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">{stat}</label>
                                                            <input 
                                                                type="number" step="0.1"
                                                                value={Number.isNaN(engineOverridesLocal[stat]) ? '' : engineOverridesLocal[stat] ?? ''} 
                                                                placeholder="Padrão"
                                                                onChange={e => { const val = parseFloat(e.target.value); handleEngineOverrideChange(stat, isNaN(val) ? undefined! : val); }} 
                                                                className="w-full bg-transparent border-b border-white/20 focus:border-orange-500 px-0 py-1 text-white font-bold focus:outline-none transition-colors" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Sistema de Ki</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['MAX_KI', 'KI_CHARGE_RATE', 'KI_GAIN_ON_HIT', 'KI_GAIN_ON_DAMAGE', 'KI_COST_SPECIAL', 'KI_BLAST_COST', 'KI_BLAST_SPEED', 'KI_BLAST_DAMAGE', 'KI_BLAST_COOLDOWN'].map(stat => (
                                                        <div key={stat} className="bg-stone-950/60 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">{stat.replace('KI_', '')}</label>
                                                            <input 
                                                                type="number" step="1"
                                                                value={Number.isNaN(engineOverridesLocal[stat]) ? '' : engineOverridesLocal[stat] ?? ''} 
                                                                placeholder="Padrão"
                                                                onChange={e => { const val = parseFloat(e.target.value); handleEngineOverrideChange(stat, isNaN(val) ? undefined! : val); }} 
                                                                className="w-full bg-transparent border-b border-white/20 focus:border-orange-500 px-0 py-1 text-white font-bold focus:outline-none transition-colors" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <h3 className="text-xs font-black text-stone-400 uppercase tracking-widest mb-4">Mecânicas de Combate</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['MAX_COMBO', 'DAMAGE_TIER_1', 'DAMAGE_TIER_2', 'DAMAGE_TIER_3', 'MAX_GUARD', 'GUARD_REGEN_RATE', 'CHIP_DAMAGE_PERCENT'].map(stat => (
                                                        <div key={stat} className="bg-stone-950/60 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-stone-500 uppercase tracking-widest mb-2">{stat}</label>
                                                            <input 
                                                                type="number" step="0.1"
                                                                value={Number.isNaN(engineOverridesLocal[stat]) ? '' : engineOverridesLocal[stat] ?? ''} 
                                                                placeholder="Padrão"
                                                                onChange={e => { const val = parseFloat(e.target.value); handleEngineOverrideChange(stat, isNaN(val) ? undefined! : val); }} 
                                                                className="w-full bg-transparent border-b border-white/20 focus:border-orange-500 px-0 py-1 text-white font-bold focus:outline-none transition-colors" 
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* REMOTE CONFIG */}
                                {activeTab === 'REMOTE_CONFIG' && (
                                    <AdminRemoteConfigTab />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

            {/* REWARD MODAL */}
            <AnimatePresence>
                {rewardModal.isOpen && selectedUser && (
                    <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-stone-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl space-y-6">
                            <div>
                                <h3 className="text-lg font-black uppercase text-white">Enviar Recursos</h3>
                                <p className="text-xs text-stone-400 font-mono">Destinatário: {selectedUser.name}</p>
                            </div>
                            
                            <div className="flex gap-2">
                                {[
                                    { id: 'COIN', icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20' }, 
                                    { id: 'GEM', icon: Diamond, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' }, 
                                    { id: 'TICKET', icon: Ticket, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20' }
                                ].map(t => (
                                    <button 
                                        key={t.id} 
                                        onClick={() => setRewardModal(p => ({ ...p, type: t.id as any }))} 
                                        className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all cursor-pointer ${rewardModal.type === t.id ? t.bg + ' ' + t.color : 'bg-stone-950/50 border-white/5 text-stone-500 hover:bg-stone-950'}`}
                                    >
                                        <t.icon className="w-5 h-5" />
                                        <span className="text-[10px] font-black">{t.id}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-stone-400">Quantidade</label>
                                <input 
                                    type="number" 
                                    value={rewardAmount} 
                                    onChange={e => setRewardAmount(e.target.value)} 
                                    className="w-full bg-stone-950 border border-white/10 focus:border-orange-500 rounded-xl px-4 py-3 text-lg font-bold text-white outline-none" 
                                />
                            </div>

                            <div className="flex gap-3">
                                <button onClick={() => setRewardModal(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-xs font-bold uppercase tracking-wider text-stone-300 transition-colors cursor-pointer">
                                    Cancelar
                                </button>
                                <button onClick={() => handleSendRewardNotification(selectedUser)} className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-lg shadow-orange-600/20">
                                    Enviar
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

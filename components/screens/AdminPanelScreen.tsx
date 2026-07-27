import React, { useState, useEffect } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, PlayerProfile, UserRole } from '../../types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { BASE_CHARACTERS as ORIGINAL_BASE_CHARACTERS } from '../../personagens/CharacterDatabase';
const BASE_CHARACTERS = ORIGINAL_BASE_CHARACTERS.filter(c => c.id !== 'random');
import { STAGE_DB } from '../../constants/StageDatabase';
import { WORLD_HEIGHT, GROUND_Y, WORLD_WIDTH } from '../../constants';
import { 
    Users, Shield, Ban, Gift, Search, ArrowLeft, MoreVertical,
    CheckCircle2, XCircle, UserCircle, BadgeCheck, Coins, Diamond, Ticket,
    Trophy, BarChart3, Activity, Zap, LayoutDashboard, RefreshCw, Mail, 
    Clapperboard, Map, Code2, Menu, X, Gamepad2, Settings, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AudioManager } from '../../services/AudioManager';

import { AdminRemoteConfigTab } from './AdminRemoteConfigTab';
import { EffectConfigKeyManager } from '../../services/EffectConfigKeyManager';

export const AdminPanelScreen: React.FC = () => {
    const { 
        changeScene, isAdmin: isCurrentUserAdmin, isOfflineMode, fetchAllUsers, 
        updatePlayerProfileByAdmin, sendRewardToPlayer, generatePromoCode, sendInMail,
        updateGlobalStageOverride, globalStageOverrides, globalEngineOverrides, updateGlobalEngineOverride,
        t
    } = useSceneManager();

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
                        Object.keys(charOverrides.animations).forEach(animKey => {
                            if (charToUpdate.spriteConfig?.animations?.[animKey]) {
                                const animData = charOverrides.animations[animKey];
                                charToUpdate.spriteConfig.animations[animKey] = {
                                    ...charToUpdate.spriteConfig.animations[animKey],
                                    ...animData
                                };
                            }
                        });
                    }
                }
                alert("Propriedades atualizadas localmente (Modo Offline).");
            } else {
                const docRef = doc(db, 'character_overrides', selectedCharacterId);
                await setDoc(docRef, charOverrides, { merge: true });
                alert("Propriedades atualizadas no servidor.");
            }
        } catch (error) { alert("Erro ao salvar."); }
    };

    const handleCharOverrideChange = (field: string, value: number) => {
        setCharOverrides((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleAnimDamageChange = (animKey: string, damage: number) => {
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

    // Actions
    const handleBack = () => {
        AudioManager.getInstance().playSFX('click');
        changeScene(SceneName.MAIN_MENU);
    };

    const handleToggleBan = async (user: PlayerProfile) => {
        AudioManager.getInstance().playSFX('click');
        const isBanning = !user.isBanned;
        if (confirm(`${isBanning ? 'Ban' : 'Unban'} user ${user.name}?`)) {
            await updatePlayerProfileByAdmin(user.playerId, { isBanned: isBanning });
            loadUsers();
        }
    };

    const handleChangeRole = async (user: PlayerProfile, newRole: UserRole) => {
        AudioManager.getInstance().playSFX('click');
        if (confirm(`Change role of ${user.name} to ${newRole}?`)) {
            await updatePlayerProfileByAdmin(user.playerId, { role: newRole });
            loadUsers();
        }
    };

    const handleSendRewardNotification = async (user: PlayerProfile) => {
        const amount = parseInt(rewardAmount) || 0;
        await sendRewardToPlayer(user.playerId, { type: rewardModal.type, amount });
        setRewardModal({ ...rewardModal, isOpen: false });
        alert("Assets and Transmission Sent");
    };

    const handleGeneratePromo = async () => {
        if (!promoForm.code) return;
        await generatePromoCode(promoForm.code, { type: promoForm.type, amount: parseInt(promoForm.amount) || 0 }, promoForm.isSingle);
        alert(`Promo code ${promoForm.code.toUpperCase()} generated.`);
        setPromoForm({ ...promoForm, code: '' });
    };

    const handleSendBroadcast = async () => {
        if (!mailForm.subject || !mailForm.content) return;
        if (confirm(`Send broadcast to ${users.length} agents?`)) {
            for (const user of users) {
                const reward = mailForm.rewardType !== 'NONE' ? { type: mailForm.rewardType, amount: parseInt(mailForm.rewardAmount) || 0 } : null;
                await sendInMail(user.playerId, mailForm.subject, mailForm.content, reward);
            }
            alert("Broadcast complete.");
            setMailForm({ subject: '', content: '', rewardType: 'NONE', rewardAmount: '0' });
        }
    };

    const filteredUsers = users.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.playerId.toLowerCase().includes(searchQuery.toLowerCase());
        if (activeTab === 'AMBASSADORS') return matchesSearch && u.role === 'AMBASSADOR';
        if (activeTab === 'PLAYERS') return matchesSearch && u.role === 'PLAYER';
        if (activeTab === 'VETERANS') return matchesSearch && u.role === 'VETERAN';
        if (activeTab === 'MODERATORS') return matchesSearch && u.role === 'MODERATOR';
        if (activeTab === 'AGENTS') return matchesSearch && (u.role === 'ADMIN' || u.role === 'AMBASSADOR' || u.role === 'MODERATOR');
        return matchesSearch;
    });

    const navigation = [
        { section: 'DASHBOARD', items: [
            { id: 'DASHBOARD', label: t('admin_tab_dashboard') || 'Visão Geral', icon: LayoutDashboard },
            { id: 'BROADCAST', label: t('admin_tab_broadcast') || 'Mensagens Globais', icon: Mail },
            { id: 'PROMO', label: t('admin_tab_promo') || 'Promo Codes', icon: Code2 },
        ]},
        { section: 'COMMUNITY', items: [
            { id: 'PLAYERS', label: t('rank_fighter') + 's', icon: Users },
            { id: 'VETERANS', label: t('rank_veteran') + 's', icon: Users },
            { id: 'AMBASSADORS', label: t('rank_ambassador') + 's', icon: BadgeCheck },
            { id: 'MODERATORS', label: t('rank_mod') + 's', icon: Shield },
            { id: 'AGENTS', label: t('rank_admin') + '/' + t('rank_mod'), icon: Shield },
        ]},
        { section: 'DATABASE', items: [
            { id: 'CHARACTERS', label: t('menu_characters') || 'Personagens', icon: Zap },
            { id: 'GAME_CONFIG', label: t('menu_settings') || 'Sistemas e Engine', icon: Settings },
            { id: 'REMOTE_CONFIG', label: 'Acesso Online & Versão', icon: Target },
        ]},
        { section: 'DEV TOOLS', items: [
            { id: 'ANIM_PREVIEW', label: 'Animações (Preview)', icon: Clapperboard, action: () => changeScene(SceneName.ANIMATION_PREVIEW) },
        ]}
    ];

    const StatCard = ({ title, value, icon: Icon, colorClass, highlightClass }: any) => (
        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-white/10 transition-colors">
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${highlightClass} opacity-5 blur-3xl rounded-full -mr-16 -mt-16`}></div>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                    <Icon className={`w-6 h-6 ${colorClass}`} />
                </div>
            </div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-1">{title}</p>
            <p className="text-3xl font-black italic text-white drop-shadow-md">{value}</p>
        </div>
    );

    return (
        <div className="flex h-screen bg-[#0A0A0B] text-slate-300 font-sans overflow-hidden select-none relative">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img 
                    src="/Assets/fundosdastelas/modos/m9.png" 
                    alt="Background" 
                    className="w-full h-full object-cover opacity-10"
                />
            </div>
            
            {/* Mobile Header */}
            <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-[#111113]/90 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-4 z-50">
                <div className="flex items-center gap-3">
                    <button onClick={handleBack} className="p-2 -ml-2 text-slate-400 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-base font-black italic tracking-tighter text-orange-400 flex items-center gap-2 uppercase">
                        <Trophy className="w-4 h-4" /> Arena Master
                    </h1>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-slate-400 hover:text-white">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {/* Sidebar */}
            <div className={`
                fixed inset-y-0 left-0 z-40 w-64 bg-[#111113] border-r border-white/5 flex flex-col transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0
                ${isMobileMenuOpen ? 'translate-x-0 pt-16 md:pt-0' : '-translate-x-full'}
            `}>
                <div className="hidden md:flex p-6 border-b border-white/5 items-center justify-between">
                    <h1 className="text-lg font-black italic tracking-tighter text-orange-400 flex items-center gap-3 uppercase">
                        <Trophy className="w-5 h-5" /> Arena Master
                    </h1>
                    <button onClick={handleBack} className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-6">
                    {navigation.map((section, sIdx) => (
                        <div key={sIdx}>
                            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3 mb-2">{section.section}</h3>
                            <div className="space-y-1">
                                {section.items.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (item.action) item.action();
                                            else setActiveTab(item.id as any);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === item.id && !item.action ? 'bg-orange-500/10 text-orange-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                                    >
                                        <item.icon className="w-4 h-4" />
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Overlay for mobile */}
            {isMobileMenuOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden relative pt-16 md:pt-0">
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#0A0A0B]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
                            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                            <p className="text-[10px] font-black italic text-slate-500 animate-pulse tracking-widest">LOADING DATABASE...</p>
                        </div>
                    ) : (
                        <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
                            <AnimatePresence mode="popLayout">
                                {/* DASHBOARD */}
                                {activeTab === 'DASHBOARD' && (
                                    <motion.div key="dashboard" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                        <div className="flex items-center justify-between mb-2">
                                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">Visão Geral</h2>
                                            <button onClick={loadUsers} className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-xs font-bold transition-colors">
                                                <RefreshCw className="w-3.5 h-3.5" /> Sincronizar
                                            </button>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <StatCard title="Total Agentes" value={users.length} icon={Users} colorClass="text-orange-400" highlightClass="from-orange-500 to-orange-500" />
                                            <StatCard title="Suspensos" value={users.filter(u => u.isBanned).length} icon={Ban} colorClass="text-red-400" highlightClass="from-red-500 to-orange-500" />
                                            <StatCard title="Membros da Equipe" value={users.filter(u => u.role === 'ADMIN' || u.role === 'AMBASSADOR').length} icon={Shield} colorClass="text-orange-400" highlightClass="from-orange-500 to-orange-500" />
                                            <StatCard title="Partidas Totais" value={users.reduce((acc, u) => acc + (u.wins || 0) + (u.losses || 0), 0)} icon={Gamepad2} colorClass="text-yellow-400" highlightClass="from-yellow-500 to-amber-500" />
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                            <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6">
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                                    <BarChart3 className="w-4 h-4" /> Desempenho Global
                                                </h3>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Média de Vitórias p/ Usuário</p>
                                                            <p className="text-xl font-black italic mt-1">{users.length > 0 ? (users.reduce((acc, u) => acc + Number(u.wins || 0), 0) / users.length).toFixed(1) : '0'}</p>
                                                        </div>
                                                        <Trophy className="w-8 h-8 text-yellow-500/20" />
                                                    </div>
                                                    <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
                                                        <div>
                                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Taxa de Vitórias Global</p>
                                                            <p className="text-xl font-black italic mt-1">{(() => {
                                                                const w = users.reduce((acc, u) => acc + (u.wins || 0), 0);
                                                                const l = users.reduce((acc, u) => acc + (u.losses || 0), 0);
                                                                return w+l === 0 ? '0%' : Math.round((w / (w + l)) * 100) + '%';
                                                            })()}</p>
                                                        </div>
                                                        <Activity className="w-8 h-8 text-orange-500/20" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* DIAGNOSTICS & SWEEP TOOL */}
                                            <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                                                <div>
                                                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                        <Activity className="w-4 h-4 text-orange-500 animate-pulse" /> Diagnóstico e Varredura de Recursos
                                                    </h3>
                                                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                                                        Analisa todos os recursos criados (beams, projéteis, auras, hitboxes, efeitos) e remove de forma segura e definitiva qualquer recurso órfão, não configurado ou inválido de caches, referências e banco de dados.
                                                     </p>
                                                     {sweepResult && (
                                                         <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1 text-[11px] font-bold text-slate-400 mb-4">
                                                             <div className="flex justify-between">
                                                                 <span>Beams Removidos:</span>
                                                                 <span className="text-orange-400">{sweepResult.deletedBeams.length}</span>
                                                             </div>
                                                             <div className="flex justify-between">
                                                                 <span>Projéteis Removidos:</span>
                                                                 <span className="text-orange-400">{sweepResult.deletedProjectiles.length}</span>
                                                             </div>
                                                             <div className="flex justify-between">
                                                                 <span>Auras Removidas:</span>
                                                                 <span className="text-orange-400">{sweepResult.deletedAuras.length}</span>
                                                             </div>
                                                             <div className="flex justify-between">
                                                                 <span>Hitboxes Limpos:</span>
                                                                 <span className="text-orange-400">{sweepResult.cleanedHitboxesCount}</span>
                                                             </div>
                                                             <div className="flex justify-between">
                                                                 <span>VFX Órfãos Limpos:</span>
                                                                 <span className="text-orange-400">{sweepResult.cleanedVfxCount}</span>
                                                             </div>
                                                         </div>
                                                     )}
                                                 </div>
                                                 <button
                                                     onClick={handleRunDiagnosticsSweep}
                                                     disabled={isSweeping}
                                                     className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-orange-600/50 py-3 rounded-xl text-xs font-black uppercase tracking-widest text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-600/15"
                                                 >
                                                     <RefreshCw className={`w-4 h-4 ${isSweeping ? 'animate-spin' : ''}`} />
                                                     {isSweeping ? 'Executando Varredura...' : 'Executar Varredura e Limpeza'}
                                                 </button>
                                             </div>
                                        </div>
                                    </motion.div>
                                )}

                                {/* USERS GRIDS (PLAYERS, AGENTS, AMBASSADORS) */}
                                {['PLAYERS', 'AGENTS', 'AMBASSADORS'].includes(activeTab) && (
                                    <motion.div key="users" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight">
                                                {activeTab === 'PLAYERS' ? t('rank_fighter') + 's' : activeTab === 'AGENTS' ? t('rank_master') + 's' : t('rank_ambassador') + 's'}
                                            </h2>
                                            <div className="relative w-full sm:w-auto">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                                <input 
                                                    type="text"
                                                    placeholder="Buscar por ID ou Nome..."
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                    className="w-full sm:w-64 bg-[#18181b] border border-white/10 focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-sm font-medium focus:outline-none transition-colors"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                                            {filteredUsers.map(user => (
                                                <div key={user.playerId} className={`bg-[#18181b] border ${user.isBanned ? 'border-red-500/30' : 'border-white/5'} rounded-2xl p-5 flex flex-col gap-4 relative`}>
                                                    {user.isBanned && <div className="absolute top-0 right-4 bg-red-500/10 text-red-400 text-[10px] font-black italic px-2 py-1 rounded-b-lg border-x border-b border-red-500/30">BANNED</div>}
                                                    
                                                    <div className="flex gap-4 items-center">
                                                        <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-white/10 flex items-center justify-center shrink-0">
                                                            <UserCircle className="w-6 h-6 text-slate-500" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2">
                                                                <h3 className="font-black italic uppercase text-white truncate">{user.name}</h3>
                                                                {user.role === 'ADMIN' && <BadgeCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                                                                {user.role === 'AMBASSADOR' && <BadgeCheck className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 font-mono truncate">{user.playerId}</p>
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-center">
                                                        <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                                                            <p className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">Win / Loss</p>
                                                            <p className="text-xs font-black"><span className="text-orange-400">{user.wins}</span><span className="text-slate-600 mx-1">/</span><span className="text-red-400">{user.losses}</span></p>
                                                        </div>
                                                        <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                                                            <p className="text-[8px] uppercase tracking-widest text-slate-500 mb-0.5">Last Seen</p>
                                                            <p className="text-[10px] font-bold text-slate-300 mt-1">{user.lastLoginDate ? new Date(user.lastLoginDate).toLocaleDateString() : 'Never'}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 mt-auto pt-2 border-t border-white/5">
                                                        <button onClick={() => { setSelectedUser(user); setRewardModal({ isOpen: true, type: 'COIN' }); }} className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5">
                                                            <Gift className="w-3.5 h-3.5" /> Presente
                                                        </button>
                                                        <button onClick={() => handleToggleBan(user)} className={`p-1.5 rounded-lg transition-colors ${user.isBanned ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'}`}>
                                                            <Ban className="w-4 h-4" />
                                                        </button>
                                                        <div className="relative group/menu">
                                                            <button className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
                                                                <MoreVertical className="w-4 h-4" />
                                                            </button>
                                                            <div className="absolute bottom-full right-0 mb-2 w-48 bg-[#18181b] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-10 p-1">
                                                                <button onClick={async () => {
                                                                    if (confirm(`Unlock all characters for ${user.name}?`)) {
                                                                        const { BASE_CHARACTERS } = await import('../../personagens/CharacterDatabase');
                                                                        await updatePlayerProfileByAdmin(user.playerId, { unlockedCharacterIds: BASE_CHARACTERS.filter(c => c.id !== 'random').map(c => c.id) } as any);
                                                                        alert("All characters unlocked!");
                                                                    }
                                                                }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-yellow-400">Unlock Characters</button>
                                                                
                                                                <button onClick={async () => {
                                                                    if (confirm(`Reset KDA of ${user.name}?`)) {
                                                                        await updatePlayerProfileByAdmin(user.playerId, { wins: 0, losses: 0 });
                                                                        alert("Status reset!");
                                                                        loadUsers();
                                                                    }
                                                                }} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-orange-400">Reset KDA</button>
                                                                
                                                                <div className="h-px bg-white/5 my-1"></div>
                                                                
                                                                <button onClick={() => handleChangeRole(user, 'PLAYER')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-slate-300">Make Player</button>
                                                                <button onClick={() => handleChangeRole(user, 'VETERAN')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-cyan-400">Make Veteran</button>
                                                                <button onClick={() => handleChangeRole(user, 'AMBASSADOR')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-amber-400">Make Ambassador</button>
                                                                <button onClick={() => handleChangeRole(user, 'MODERATOR')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-purple-400">Make Moderator</button>
                                                                {user.role !== 'ADMIN' && <button onClick={() => handleChangeRole(user, 'ADMIN')} className="w-full text-left px-3 py-2 hover:bg-white/5 rounded-lg text-xs font-bold text-red-400">Make Admin</button>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                            {filteredUsers.length === 0 && (
                                                <div className="col-span-full py-12 text-center text-slate-500 italic">
                                                    Nenhum usuário encontrado.
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}

                                {/* OTHER TABS - Will use standard layout structure */}
                                {activeTab === 'BROADCAST' && (
                                    <motion.div key="broadcast" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
                                        <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                            <Mail className="w-6 h-6 text-orange-400" /> Mensagem Global
                                        </h2>
                                        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Subject</label>
                                                <input value={mailForm.subject} onChange={e => setMailForm({...mailForm, subject: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-colors" placeholder="Notice to all Fighters..." />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Message</label>
                                                <textarea value={mailForm.content} onChange={e => setMailForm({...mailForm, content: e.target.value})} rows={5} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-orange-500 focus:outline-none transition-colors resize-none" placeholder="Enter transmission body here..." />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 p-4 bg-orange-500/5 rounded-xl border border-orange-500/10">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-400">Attach Reward</label>
                                                    <select value={mailForm.rewardType} onChange={e => setMailForm({...mailForm, rewardType: e.target.value as any})} className="w-full bg-black/60 border border-orange-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none">
                                                        <option value="NONE">None</option>
                                                        <option value="COIN">Coins</option>
                                                        <option value="GEM">Gems</option>
                                                        <option value="TICKET">Tickets</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-orange-400">Amount</label>
                                                    <input type="number" value={mailForm.rewardAmount} onChange={e => setMailForm({...mailForm, rewardAmount: e.target.value})} disabled={mailForm.rewardType === 'NONE'} className="w-full bg-black/60 border border-orange-500/30 rounded-lg px-3 py-2 text-xs focus:outline-none disabled:opacity-50" />
                                                </div>
                                            </div>
                                            <button onClick={handleSendBroadcast} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-black uppercase tracking-widest transition-colors">Dispatch Transmission</button>
                                        </div>
                                    </motion.div>
                                )}

                                {activeTab === 'PROMO' && (
                                    <motion.div key="promo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto space-y-6">
                                        <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                            <Code2 className="w-6 h-6 text-orange-400" /> Promo Codes
                                        </h2>
                                        <div className="bg-[#18181b] border border-white/5 rounded-2xl p-6 space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black uppercase tracking-widest text-slate-500">Activation Code</label>
                                                <input value={promoForm.code} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-center text-xl font-mono tracking-[0.2em] focus:border-orange-500 focus:outline-none transition-colors" placeholder="FIGHT-2024" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Reward Type</label>
                                                    <select value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value as any})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none">
                                                        <option value="COIN">Coins (GP)</option>
                                                        <option value="GEM">Gems</option>
                                                        <option value="TICKET">Tickets</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Quantity</label>
                                                    <input type="number" value={promoForm.amount} onChange={e => setPromoForm({...promoForm, amount: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none" />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 p-4 bg-black/20 rounded-xl border border-white/5">
                                                <input type="checkbox" checked={promoForm.isSingle} onChange={e => setPromoForm({...promoForm, isSingle: e.target.checked})} className="w-5 h-5 rounded bg-black border-slate-700 text-orange-500 focus:ring-0" />
                                                <div>
                                                    <p className="text-xs font-bold text-white">Single Use Only</p>
                                                    <p className="text-[10px] text-slate-500">Code self-destructs after first claim.</p>
                                                </div>
                                            </div>
                                            <button onClick={handleGeneratePromo} className="w-full bg-orange-600 hover:bg-orange-500 text-white rounded-xl py-4 font-black uppercase tracking-widest transition-colors ">Generate Code</button>
                                        </div>
                                    </motion.div>
                                )}

                                {/* CHARACTERS AND STAGES kept minimal structurally to fit token limits, using identical form structures from old code but styled */}
                                {activeTab === 'CHARACTERS' && (
                                    <motion.div key="characters" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                                <Zap className="w-6 h-6 text-amber-400" /> Stats dos Personagens
                                            </h2>
                                            {selectedCharacterId && <button onClick={handleSaveCharacterOverrides} className="bg-amber-500 hover:bg-amber-400 text-black px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-colors">Salvar Alterações</button>}
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-200px)]">
                                            <div className="w-full md:w-64 shrink-0 bg-[#18181b] rounded-2xl border border-white/5 overflow-hidden flex flex-col">
                                                <div className="p-4 border-b border-white/5 bg-black/20">
                                                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Select Fighter</p>
                                                </div>
                                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                                    {BASE_CHARACTERS.map(char => (
                                                        <button key={char.id} onClick={() => { setSelectedCharacterId(char.id); loadCharacterOverrides(char.id); }} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all \${selectedCharacterId === char.id ? 'bg-amber-500/10 text-amber-400' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                                                            {char.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {selectedCharacterId ? (
                                                <div className="flex-1 bg-[#18181b] rounded-2xl border border-white/5 p-6 overflow-y-auto custom-scrollbar space-y-8">
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Base Stats</h3>
                                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                                            {['maxHp', 'attack', 'defense', 'speed'].map(stat => (
                                                                <div key={stat} className="bg-black/30 p-4 border border-white/5 rounded-xl">
                                                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.replace('max', '')}</label>
                                                                    <input type="number" 
                                                                        value={Number.isNaN(charOverrides[stat]) ? '' : (charOverrides[stat] ?? (stat === 'maxHp' ? BASE_CHARACTERS.find(c=>c.id===selectedCharacterId)?.maxHp : (BASE_CHARACTERS.find(c=>c.id===selectedCharacterId)?.stats as any)?.[stat]) ?? 0)} 
                                                                        onChange={e => { const val = parseFloat(e.target.value); handleCharOverrideChange(stat, isNaN(val) ? undefined : val); }} 
                                                                        className="w-full bg-transparent border-b border-white/20 focus:border-amber-500 px-0 py-1 text-white font-bold focus:outline-none transition-colors" 
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Move Damages</h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            {Object.entries(BASE_CHARACTERS.find(c => c.id === selectedCharacterId)?.spriteConfig?.animations || {})
                                                                .filter(([key, anim]) => anim && (String(anim.dealsDamage) !== 'false'))
                                                                .map(([key, anim]) => {
                                                                    const overrideDamage = Number.isNaN(charOverrides.animations?.[key]?.baseDamage) ? '' : (charOverrides.animations?.[key]?.baseDamage ?? anim?.baseDamage ?? '');
                                                                    return (
                                                                        <div key={key} className="bg-black/30 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                                                                            <span className="text-xs font-bold text-slate-300 uppercase">{key}</span>
                                                                            <input type="number" placeholder={String(anim?.baseDamage||'0')} value={overrideDamage} onChange={e => { const val = parseFloat(e.target.value); handleAnimDamageChange(key, isNaN(val) ? undefined : val); }} className="w-20 bg-black/60 border border-white/10 rounded px-2 py-1 text-xs text-center focus:border-amber-500 focus:outline-none" />
                                                                        </div>
                                                                    )
                                                                })
                                                            }
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center bg-[#18181b]/50 rounded-2xl border border-white/5 border-dashed">
                                                    <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Aguardando Seleção</p>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                                 {activeTab === 'GAME_CONFIG' && (
                                    <motion.div key="game_config" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                                                <Settings className="w-6 h-6 text-orange-400" /> Configurações do Motor (Game Engine)
                                            </h2>
                                            <button onClick={handleSaveEngineOverrides} className="bg-orange-500 hover:bg-orange-400 text-black px-6 py-2.5 rounded-lg text-xs font-black uppercase transition-colors">Salvar Globalmente</button>
                                        </div>

                                        <div className="bg-[#18181b] rounded-2xl border border-white/5 p-6 space-y-8">
                                            
                                            <div>
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Physics & General</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['GRAVITY', 'FRICTION', 'MOVE_SPEED', 'JUMP_FORCE', 'MAX_HP'].map(stat => (
                                                        <div key={stat} className="bg-black/30 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</label>
                                                            <input type="number" step="0.1"
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
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Ki System</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['MAX_KI', 'KI_CHARGE_RATE', 'KI_GAIN_ON_HIT', 'KI_GAIN_ON_DAMAGE', 'KI_COST_SPECIAL', 'KI_BLAST_COST', 'KI_BLAST_SPEED', 'KI_BLAST_DAMAGE', 'KI_BLAST_COOLDOWN'].map(stat => (
                                                        <div key={stat} className="bg-black/30 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.replace('KI_', '')}</label>
                                                            <input type="number" step="1"
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
                                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-4">Combat Mechanics</h3>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                    {['MAX_COMBO', 'DAMAGE_TIER_1', 'DAMAGE_TIER_2', 'DAMAGE_TIER_3', 'MAX_GUARD', 'GUARD_REGEN_RATE', 'CHIP_DAMAGE_PERCENT'].map(stat => (
                                                        <div key={stat} className="bg-black/30 p-4 border border-white/5 rounded-xl">
                                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat}</label>
                                                            <input type="number" step="0.1"
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
                                {activeTab === 'REMOTE_CONFIG' && (
                                    <AdminRemoteConfigTab />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>

             {/* Reward Modal */}
             <AnimatePresence>
                 {rewardModal.isOpen && selectedUser && (
                     <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                         <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-[#18181b] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                             <h3 className="text-lg font-black uppercase text-white mb-2">Send Assets</h3>
                             <p className="text-xs text-slate-400 mb-6 font-mono">ID: {selectedUser.name}</p>
                             
                             <div className="flex gap-2 mb-6">
                                 {[{id: 'COIN', icon: Coins, color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/20'}, 
                                   {id: 'GEM', icon: Diamond, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20'}, 
                                   {id: 'TICKET', icon: Ticket, color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/20'}].map(t => (
                                     <button key={t.id} onClick={() => setRewardModal(p => ({ ...p, type: t.id as any }))} className={`flex-1 py-3 rounded-xl border flex flex-col items-center gap-2 transition-colors \${rewardModal.type === t.id ? t.bg + ' ' + t.color : 'bg-black/30 border-white/5 text-slate-500 hover:bg-black/50'}`}>
                                         <t.icon className="w-5 h-5" />
                                         <span className="text-[10px] font-black">{t.id}</span>
                                     </button>
                                 ))}
                             </div>

                             <div className="space-y-2 mb-8">
                                 <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Amount</label>
                                 <input type="number" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} className="w-full bg-black/50 border border-white/10 focus:border-orange-500 rounded-xl px-4 py-3 text-lg font-bold outline-none" />
                             </div>

                             <div className="flex gap-3">
                                 <button onClick={() => setRewardModal(p => ({ ...p, isOpen: false }))} className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold uppercase tracking-wider transition-colors">Cancel</button>
                                 <button onClick={() => handleSendRewardNotification(selectedUser)} className="flex-1 py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider transition-colors ">Send</button>
                             </div>
                         </motion.div>
                     </div>
                 )}
             </AnimatePresence>
        </div>
    );
};

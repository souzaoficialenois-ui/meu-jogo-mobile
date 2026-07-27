import React, { useEffect, useState } from 'react';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName } from '../../types';
import { WIN_REWARD, RESOURCE_SPRITES } from '../../constants';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, RotateCcw, LogOut, Medal, Award, Users2 } from 'lucide-react';
import { AudioManager } from '../../services/AudioManager';
import { NetworkManager } from '../../services/NetworkManager';
import { useUI } from '../../contexts/UIContext';

export const ResultScreen: React.FC = () => {
    const { s, sx, sy, getPos } = useUI();
    const {
        matchResult,
        changeScene,
        destroyGameSession,
        createGameSession,
        startLoading,
        addCoins,
        addGems,
        unlockCharacter,
        handleBattleEnd,
        activeTournament,
        notifyMissionProgress,
        gameEngine,
        updateMatchStats,
        lastRankedReward,
        resetLastRankedReward,
        beginCharacterSelection,
        t // Added for translations
    } = useSceneManager();

    const [coinsAwarded, setCoinsAwarded] = useState(false);
    const [storyRewards, setStoryRewards] = useState<{coins: number, gems: number, unlockedChar?: string} | null>(null);

    const isOnline = matchResult?.gameMode === 'ONLINE';
    const isHost = NetworkManager.getInstance().isHost;
    const isWinner = isOnline 
        ? (matchResult?.winner === 1 && isHost) || (matchResult?.winner === 2 && !isHost)
        : matchResult?.winner === 1;

    useEffect(() => {
        if (!matchResult) {
            changeScene(SceneName.MAIN_MENU);
            return;
        }

        if (!coinsAwarded && matchResult.winner !== null) {
            notifyMissionProgress('BATTLE_PLAY', 1);
            if (matchResult.matchStats?.p1.damageDealt) {
                notifyMissionProgress('DAMAGE_DEALT', Math.floor(matchResult.matchStats.p1.damageDealt));
            }
            
            // ONLINE MATCH STATS
            if (isOnline) {
                updateMatchStats(isWinner);
            }

            if (isWinner) {
                if (matchResult.gameMode === 'STORY') {
                    // Story Mode specific rewards!
                    const activeChId = localStorage.getItem('dd2d_active_story_chapter') || 'story_chapter_1';
                    
                    let completedList: string[] = [];
                    const saved = localStorage.getItem('dd2d_completed_stories');
                    if (saved) {
                        try { completedList = JSON.parse(saved); } catch(_) {}
                    }

                    const rewardsMap: Record<string, {coins: number, gems: number, unlockId?: string, label: string}> = {
                        'story_chapter_1': { coins: 500, gems: 50, label: 'Saga Saiyajin: O Rival Lendário' },
                        'story_chapter_2': { coins: 750, gems: 80, label: 'Saga Namekusei: A Fúria Imperdoável' },
                        'story_chapter_3': { coins: 1000, gems: 100, label: 'Saga Futuro: O Julgamento Divino' },
                        'story_chapter_4': { coins: 1500, gems: 150, label: 'Saga Divina: O Instinto Supremo vs O Ego' },
                        'story_chapter_5': { coins: 2500, gems: 250, unlockId: 'majin_buu_gohan', label: 'Fusão Suprema: O Combate Final das Divindades' }
                    };

                    const chRewards = rewardsMap[activeChId] || { coins: 500, gems: 50, label: 'Saga Histórica' };
                    const isFirstTime = !completedList.includes(activeChId);
                    
                    if (isFirstTime) {
                        completedList.push(activeChId);
                        localStorage.setItem('dd2d_completed_stories', JSON.stringify(completedList));
                        
                        addCoins(chRewards.coins);
                        if (addGems) {
                            addGems(chRewards.gems);
                        }
                        
                        let unlockedName = '';
                        if (chRewards.unlockId) {
                            try {
                                if (unlockCharacter) {
                                    const unlockRes = unlockCharacter(chRewards.unlockId);
                                    if (unlockRes && unlockRes.name) {
                                        unlockedName = unlockRes.name;
                                    } else {
                                        unlockedName = chRewards.unlockId.toUpperCase();
                                    }
                                }
                            } catch (e) {
                                console.error('Unlock character failed', e);
                            }
                        }
                        
                        setStoryRewards({
                            coins: chRewards.coins,
                            gems: chRewards.gems,
                            unlockedChar: unlockedName || undefined
                        });
                    } else {
                        // Replay rewards (gives 10% of standard coins)
                        const repCoins = Math.floor(chRewards.coins * 0.1);
                        addCoins(repCoins);
                        setStoryRewards({
                            coins: repCoins,
                            gems: 0
                        });
                    }
                    
                    AudioManager.getInstance().playSFX('victory');
                } else if (!activeTournament && matchResult.gameMode !== 'TRAINING') {
                    const reward = matchResult.gameMode === 'BOSS' ? WIN_REWARD * 10 : WIN_REWARD;
                    addCoins(reward);
                }
                notifyMissionProgress('BATTLE_WIN', 1);
                if (matchResult.gameMode !== 'STORY') {
                    AudioManager.getInstance().playSFX('victory');
                }
            } else {
                AudioManager.getInstance().playSFX('defeat');
            }
            setCoinsAwarded(true);
        }
    }, [matchResult, coinsAwarded, addCoins, addGems, unlockCharacter, notifyMissionProgress, activeTournament]);

    if (!matchResult) return null;

    const handleContinueTournament = () => {
        resetLastRankedReward?.();
        handleBattleEnd(matchResult.winner!);
    };

    const handleRematch = () => {
        if (!gameEngine) return;
        resetLastRankedReward?.();
        const p1Team = gameEngine.p1Team.map(p => p.data);
        const p2Team = gameEngine.p2Team.map(p => p.data);
        const mode = matchResult.gameMode || 'ARCADE';
        createGameSession(p1Team, p2Team, mode === 'TRAINING', mode);
        startLoading(SceneName.VS_SCREEN);
    };

    const handleMainMenu = () => {
        destroyGameSession();
        resetLastRankedReward?.();
        if (matchResult.gameMode === 'STORY') {
            changeScene(SceneName.STORY_MODE);
        } else {
            changeScene(SceneName.MAIN_MENU);
        }
    };

    // Get winning and losing characters if possible for display
    const winningPlayer = isWinner 
        ? (isOnline && !isHost ? gameEngine?.p2Team?.[gameEngine?.p2ActiveIdx || 0] : gameEngine?.p1Team?.[gameEngine?.p1ActiveIdx || 0]) 
        : (isOnline && !isHost ? gameEngine?.p1Team?.[gameEngine?.p1ActiveIdx || 0] : gameEngine?.p2Team?.[gameEngine?.p2ActiveIdx || 0]);
    
    // Prioritize victory/defeat animations based on match outcome
    const animKey = isWinner ? 'vitoria' : 'derrota';
    const winningCharacterUrl = winningPlayer?.data?.spriteConfig?.animations[animKey]?.imageUrl || 
                               winningPlayer?.data?.spriteConfig?.animations['IDLE']?.imageUrl || 
                               winningPlayer?.data?.portraitUrl;

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute inset-0 bg-stone-950 flex items-center justify-center z-[100] overflow-hidden"
        >
            {/* Full-bleed background image for Result Screen */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                <img 
                    src={isWinner ? "/Assets/Modos/sele%C3%A7%C3%A3o%20de%20modo%20fundo2.png" : "/Assets/Modos/sele%C3%A7%C3%A3o%20de%20modo%20fundo3.png"} 
                    className="w-full h-full object-cover opacity-20 grayscale-[20%]" 
                    alt="" 
                />
                <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-sm" />
            </div>

            {/* Dynamic Background Effects */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                <motion.div 
                    initial={{ opacity: 0, scale: 1.2 }}
                    animate={{ opacity: 0.3, scale: 1 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                    className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full mix-blend-color-dodge ${isWinner ? 'bg-orange-600/10' : 'bg-red-900/10'}`} 
                    style={{ width: s(1920), height: s(1920) }}
                />
                <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20" />
                
                {/* Winner side flash */}
                <motion.div 
                    initial={{ x: isWinner ? '-100%' : '100%', opacity: 0 }} 
                    animate={{ x: 0, opacity: 1 }} 
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    className={`absolute inset-y-0 ${isWinner ? 'left-0' : 'right-0'} w-2/3 skew-x-[-20deg] ${isWinner ? '-ml-32 border-r-[12px] border-orange-500 bg-gradient-to-r from-orange-900/80 to-orange-500/10' : '-mr-32 border-l-[12px] border-red-500 bg-gradient-to-l from-red-900/80 to-red-500/10'} `}
                />
            </div>

            {/* Character Render (if winner) */}
            <AnimatePresence>
                {winningCharacterUrl && (
                    <motion.div
                        initial={{ x: isWinner ? -200 : 200, opacity: 0, scale: 0.9 }}
                        animate={{ x: isWinner ? -100 : 100, opacity: 1, scale: 1.5 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                        className={`absolute bottom-0 select-none pointer-events-none drop-shadow-2xl brightness-110 origin-bottom`}
                        style={{
                            left: isWinner ? sx(256) : 'auto',
                            right: !isWinner ? sx(256) : 'auto'
                        }}
                    >
                        <img 
                            src={winningCharacterUrl} 
                            style={{ 
                                height: sy(432), 
                                objectFit: 'contain',
                                transform: isWinner ? 'scaleX(1)' : 'scaleX(-1)', // Face center
                                filter: 'drop-shadow(0px 0px 30px rgba(0,0,0,0.8))'
                            }}
                            referrerPolicy="no-referrer"
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            <div 
                className={`relative z-30 flex flex-col items-center w-full`}
                style={{ 
                    maxWidth: s(896), 
                    padding: `0 ${s(24)}`,
                    marginLeft: winningCharacterUrl ? (isWinner ? 'auto' : 0) : 'auto',
                    marginRight: winningCharacterUrl ? (!isWinner ? 'auto' : 0) : 'auto',
                    paddingRight: winningCharacterUrl && isWinner ? s(96) : s(24),
                    paddingLeft: winningCharacterUrl && !isWinner ? s(96) : s(24)
                }}
            >
                
                {/* Result Header */}
                <motion.div
                    initial={{ y: -50, opacity: 0, scale: 0.8 }}
                    animate={{ y: 0, opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 12, delay: 0.4 }}
                    className="flex flex-col items-center"
                    style={{ marginBottom: s(32) }}
                >
                    <div className="flex items-center mb-2" style={{ gap: s(16) }}>
                        <div className={`${isWinner ? 'bg-orange-400' : 'bg-red-400'}`} style={{ height: s(2), width: s(80) }} />
                        <span className={`font-bold uppercase ${isWinner ? 'text-orange-300' : 'text-red-300'}`} style={{ fontSize: s(18), tracking: '0.4em' }}>
                            {t('result_match_over') || 'RESULTADO DO COMBATE'}
                        </span>
                        <div className={`${isWinner ? 'bg-orange-400' : 'bg-red-400'}`} style={{ height: s(2), width: s(80) }} />
                    </div>
                    
                    <h1 className={`font-header italic uppercase tracking-tighter leading-none text-transparent bg-clip-text ${
                        isWinner 
                            ? 'bg-gradient-to-b from-white via-blue-200 to-orange-500'
                            : 'bg-gradient-to-b from-white via-red-200 to-red-600'
                    }`} style={{ 
                        fontSize: s(112),
                        WebkitTextStroke: `2px ${isWinner ? 'rgba(30,58,138,0.5)' : 'rgba(127,29,29,0.5)'}` 
                    }}>
                        {isWinner ? (t('result_victory') || 'VITÓRIA') : (t('result_defeat') || 'DERROTA')}
                    </h1>
                </motion.div>

                {/* Stats Bento Grid Box */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                    className={`w-full border rounded-3xl ${
                        isWinner 
                            ? 'bg-orange-950/20 border-orange-500/20' 
                            : 'bg-red-950/20 border-red-500/20'
                    } relative overflow-hidden`}
                    style={{ padding: s(24), marginBottom: s(32) }}
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
                    
                    <div className="flex items-center border-b border-white/10" style={{ gap: s(12), paddingBottom: s(12), marginBottom: s(20) }}>
                        <Medal className={`${isWinner ? 'text-orange-400' : 'text-red-400'}`} style={{ width: s(20), height: s(20) }} />
                        <h3 className="font-black text-white tracking-widest uppercase" style={{ fontSize: s(18) }}>
                            {t('result_stats') || 'ESTATÍSTICAS DA LUTA'}
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-2" style={{ gapX: s(32), gapY: s(24) }}>
                        <div className="flex flex-col" style={{ gap: s(4) }}>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase" style={{ fontSize: s(12) }}>{t('result_damage_dealt') || 'DANO CAUSADO'}</span>
                            <span className={`font-black ${isWinner ? 'text-orange-300' : 'text-red-300'}`} style={{ fontSize: s(24) }}>
                                {Math.floor(matchResult.matchStats?.p1.damageDealt || 0)}
                            </span>
                        </div>
                        <div className="flex flex-col" style={{ gap: s(4) }}>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase" style={{ fontSize: s(12) }}>{t('result_max_combo') || 'COMBO MÁXIMO'}</span>
                            <span className={`font-black ${isWinner ? 'text-orange-300' : 'text-red-300'}`} style={{ fontSize: s(24) }}>
                                {matchResult.matchStats?.p1.maxCombo || 0}
                            </span>
                        </div>
                        {matchResult.gameMode === 'SURVIVAL' && (
                            <div className="flex flex-col" style={{ gap: s(4) }}>
                                <span className="text-amber-500/70 font-bold tracking-widest uppercase" style={{ fontSize: s(12) }}>{t('result_waves_survived') || 'HORDAS'}</span>
                                <span className="font-black text-amber-400" style={{ fontSize: s(24) }}>
                                    {isWinner ? matchResult.wave : (matchResult.wave ? matchResult.wave - 1 : 0)}
                                </span>
                            </div>
                        )}
                        <div className="flex flex-col" style={{ gap: s(4) }}>
                            <span className="text-zinc-500 font-bold tracking-widest uppercase" style={{ fontSize: s(12) }}>{t('result_time_remaining') || 'TEMPO'}</span>
                            <span className="text-zinc-200 font-black" style={{ fontSize: s(24) }}>
                                {matchResult.timer}s
                            </span>
                        </div>
                    </div>

                    {/* Rewards Section inside Stats */}
                    <div className={`pt-5 border-t`} style={{ 
                        marginTop: s(24),
                        borderColor: isWinner ? 'rgba(249,115,22,0.2)' : 'rgba(239,68,68,0.2)'
                    }}>
                        {matchResult.gameMode === 'STORY' ? (
                            <div className="flex flex-col" style={{ gap: s(12) }}>
                                <div className="flex items-center" style={{ gap: s(12) }}>
                                    <Trophy className="text-yellow-500" style={{ width: s(32), height: s(32) }} />
                                    <div className="flex flex-col text-left">
                                        <span className="text-orange-400 font-bold tracking-wider uppercase" style={{ fontSize: s(10) }}>MISSÃO HISTÓRIA</span>
                                        {isWinner ? (
                                            <span className="font-black italic text-yellow-500" style={{ fontSize: s(20) }}>
                                                VITÓRIA! CAPÍTULO CONCLUÍDO
                                            </span>
                                        ) : (
                                            <span className="font-black italic text-red-500" style={{ fontSize: s(20) }}>
                                                FALHA! TENTE NOVAMENTE
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isWinner && storyRewards && (
                                    <div className="flex flex-wrap items-center bg-orange-950/25 border border-orange-500/30 rounded-xl mt-2 w-full text-left" style={{ gap: s(16), padding: s(16) }}>
                                        <div className="flex items-center" style={{ gap: s(8) }}>
                                            <img 
                                                src={RESOURCE_SPRITES.curr_coins} 
                                                alt="" 
                                                className="object-contain" 
                                                style={{ width: s(24), height: s(24) }}
                                                referrerPolicy="no-referrer"
                                                draggable={false}
                                            />
                                            <span className="font-black text-yellow-400" style={{ fontSize: s(18) }}>+{storyRewards.coins} Ouro</span>
                                        </div>
                                        {storyRewards.gems > 0 && (
                                            <div className="flex items-center" style={{ gap: s(8) }}>
                                                <img 
                                                    src={RESOURCE_SPRITES.curr_gems} 
                                                    alt="" 
                                                    className="object-contain" 
                                                    style={{ width: s(24), height: s(24) }}
                                                    referrerPolicy="no-referrer"
                                                    draggable={false}
                                                />
                                                <span className="font-black text-orange-400" style={{ fontSize: s(18) }}>+{storyRewards.gems} Diamantes</span>
                                            </div>
                                        )}
                                        {storyRewards.unlockedChar && (
                                            <div className="text-amber-300 font-black flex items-center uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 rounded sm:ml-auto animate-pulse" style={{ gap: s(6), fontSize: s(12), padding: `${s(4)}px ${s(10)}px` }}>
                                                <span>★ DESBLOQUEOU: {storyRewards.unlockedChar}!</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : isOnline && lastRankedReward ? (
                            <div className="flex flex-col w-full text-left" style={{ gap: s(16) }}>
                                <div className="flex items-center border-b border-white/5" style={{ gap: s(12), paddingBottom: s(8) }}>
                                    <Trophy className="text-amber-400" style={{ width: s(32), height: s(32) }} />
                                    <div className="flex flex-col text-left">
                                        <span className="text-amber-500 font-bold tracking-wider uppercase" style={{ fontSize: s(10) }}>PONTUAÇÃO COMPETITIVA</span>
                                        <span className="font-black italic text-amber-400" style={{ fontSize: s(20) }}>
                                            {lastRankedReward.pointsChange >= 0 ? `+${lastRankedReward.pointsChange}` : lastRankedReward.pointsChange} PONTOS RP
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 bg-slate-950/60 border border-slate-800 rounded-xl" style={{ gap: s(12), padding: s(14), fontSize: s(12) }}>
                                    <div>
                                        <span className="text-slate-500 block">Pontos Base:</span>
                                        <span className="font-extrabold text-slate-200">
                                            {lastRankedReward.basePoints >= 0 ? `+${lastRankedReward.basePoints}` : lastRankedReward.basePoints}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Bônus de Combo:</span>
                                        <span className="font-extrabold text-amber-400">+{lastRankedReward.comboBonus} RP</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Bônus de Dano:</span>
                                        <span className="font-extrabold text-amber-400">+{lastRankedReward.damageBonus} RP</span>
                                    </div>
                                    <div>
                                        <span className="text-slate-500 block">Bônus de Streak:</span>
                                        <span className="font-extrabold text-amber-400">+{lastRankedReward.streakBonus} RP</span>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row items-center bg-amber-500/10 border border-amber-500/20 rounded-xl justify-between" style={{ gap: s(12), padding: s(12) }}>
                                    <div className="flex items-center" style={{ gap: s(10) }}>
                                        <Award className="text-amber-400" style={{ width: s(20), height: s(20) }} />
                                        <div className="text-left">
                                            <span className="text-slate-400 block uppercase font-bold" style={{ fontSize: s(10) }}>Novo Rank Geral</span>
                                            <span className="font-black text-amber-300" style={{ fontSize: s(14) }}>
                                                {lastRankedReward.newRankName} {lastRankedReward.newSubRank}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right sm:ml-auto">
                                        <span className="text-slate-500 block" style={{ fontSize: s(10) }}>Total de Pontos</span>
                                        <span className="font-black text-amber-400 font-mono" style={{ fontSize: s(14) }}>
                                            {lastRankedReward.newTotalPoints} RP
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : isWinner && !activeTournament && matchResult.gameMode !== 'TRAINING' ? (
                            <div className="flex items-center" style={{ gap: s(12) }}>
                                <img 
                                    src={RESOURCE_SPRITES.curr_coins} 
                                    alt="" 
                                    className="object-contain" 
                                    style={{ width: s(40), height: s(40) }}
                                    referrerPolicy="no-referrer"
                                    draggable={false}
                                />
                                <div className="flex flex-col">
                                    <span className="text-zinc-400 font-bold tracking-wider uppercase" style={{ fontSize: s(10) }}>{t('result_rewards') || 'RECOMPENSAS'}</span>
                                    <span className="font-black italic text-yellow-400" style={{ fontSize: s(24) }}>
                                        + {matchResult.gameMode === 'BOSS' ? WIN_REWARD * 10 : WIN_REWARD} Ouro
                                    </span>
                                </div>
                            </div>
                        ) : activeTournament ? (
                            <div className="flex items-center" style={{ gap: s(12) }}>
                                <Trophy className={`${isWinner ? 'text-sky-400' : 'text-zinc-600'}`} style={{ width: s(32), height: s(32) }} />
                                <div className="flex flex-col">
                                    <span className="text-zinc-400 font-bold tracking-wider uppercase" style={{ fontSize: s(10) }}>{t('result_tournament_status') || 'TORNEIO'}</span>
                                    <span className={`font-black italic tracking-wider ${isWinner ? 'text-sky-400' : 'text-red-400'}`} style={{ fontSize: s(18) }}>
                                        {isWinner ? (t('result_advancing') || "AVANÇANDO...") : (t('result_eliminated') || "ELIMINADO.")}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="font-bold italic text-zinc-600 flex items-center justify-center w-full" style={{ fontSize: s(14), padding: `${s(8)}px 0` }}>
                                {t('result_no_rewards') || 'NENHUMA RECOMPENSA OBTIDA'}
                            </span>
                        )}
                    </div>
                </motion.div>

                {/* Bottom Actions */}
                <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.8 }}
                    className="flex flex-col sm:flex-row w-full z-40 items-center justify-center"
                    style={{ gap: s(16) }}
                >
                    {activeTournament ? (
                        <button 
                            onClick={handleContinueTournament}
                            className={`group relative overflow-hidden transition-all duration-300 transform hover:scale-[1.02] active:scale-95 rounded-xl flex-1 w-full ${
                                isWinner ? 'bg-orange-600 hover:bg-orange-500 ' : 'bg-red-600 hover:bg-red-500 '
                            }`}
                            style={{ 
                                padding: `${s(16)}px ${s(32)}px`,
                                maxWidth: s(280)
                            }}
                        >
                            <span className="relative z-10 font-black italic text-white tracking-widest truncate" style={{ fontSize: s(18) }}>
                                {isWinner ? (t('result_next_match') || 'PRÓXIMA LUTA') : (t('result_exit_tournament') || 'SAIR DO TORNEIO')}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleRematch}
                                className={`group relative transition-all duration-300 transform hover:scale-[1.02] active:scale-95 border rounded-xl flex-1 w-full flex items-center justify-center ${
                                    isWinner 
                                        ? 'bg-orange-900/40 border-orange-400 hover:bg-orange-600 hover:border-transparent text-blue-100 hover:text-white ' 
                                        : 'bg-red-900/40 border-red-400 hover:bg-red-600 hover:border-transparent text-red-100 hover:text-white '
                                }`}
                                style={{ 
                                    padding: `${s(16)}px ${s(24)}px`,
                                    maxWidth: s(220),
                                    gap: s(12)
                                }}
                            >
                                <RotateCcw className="transition-transform group-hover:-rotate-90 group-hover:scale-110" style={{ width: s(20), height: s(20) }} />
                                <span className="font-black italic tracking-widest" style={{ fontSize: s(14) }}>
                                    {t('result_rematch') || 'REVANCHE'}
                                </span>
                            </button>
                            {(matchResult.gameMode === 'LOCAL_VS' || matchResult.gameMode === 'ARCADE' || matchResult.gameMode === 'TRAINING') && (
                                <button 
                                    onClick={() => {
                                        resetLastRankedReward?.();
                                        beginCharacterSelection(matchResult.gameMode || 'ARCADE');
                                    }}
                                    className="group relative transition-all duration-300 transform hover:scale-[1.02] active:scale-95 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-xl flex-1 w-full flex items-center justify-center"
                                    style={{ 
                                        padding: `${s(16)}px ${s(24)}px`,
                                        maxWidth: s(220),
                                        gap: s(12)
                                    }}
                                >
                                    <Users2 className="text-zinc-400 group-hover:text-white transition-colors" style={{ width: s(20), height: s(20) }} />
                                    <span className="font-black italic text-zinc-300 group-hover:text-white tracking-widest transition-colors" style={{ fontSize: s(12) }}>
                                        {t('result_change_chars') || 'TROCAR PERSONAGENS'}
                                    </span>
                                </button>
                            )}
                            <button 
                                onClick={handleMainMenu}
                                className="group relative transition-all duration-300 transform hover:scale-[1.02] active:scale-95 bg-white/5 hover:bg-white/10 border border-white/20 hover:border-white/40 rounded-xl flex-1 w-full flex items-center justify-center"
                                style={{ 
                                    padding: `${s(16)}px ${s(24)}px`,
                                    maxWidth: s(220),
                                    gap: s(12)
                                }}
                            >
                                <LogOut className="text-zinc-400 group-hover:text-white transition-colors" style={{ width: s(20), height: s(20) }} />
                                <span className="font-black italic text-zinc-300 group-hover:text-white tracking-widest transition-colors" style={{ fontSize: s(14) }}>
                                    {t('result_main_menu') || 'MENU PRINCIPAL'}
                                </span>
                            </button>
                        </>
                    )}
                </motion.div>
            </div>
        </motion.div>
    );
};

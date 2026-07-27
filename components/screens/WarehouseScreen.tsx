import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSceneManager } from '../../contexts/SceneContext';
import { SceneName, CharacterData, RarityTier } from '../../types';
import { RARITY_INFO, BASE_CHARACTERS, RESOURCE_SPRITES } from '../../constants';
import { SummonManager } from '../../services/SummonManager';
import { AudioManager } from '../../services/AudioManager';
import { 
    ChevronLeft, 
    ChevronRight,
    Search, 
    Backpack, 
    Lock, 
    Check, 
    User, 
    Award, 
    Palette, 
    Clock, 
    Sparkles, 
    Star,
    Coins, 
    Gem as GemIcon, 
    Zap,
    Flame,
    Backpack as BackpackIcon,
    Shield,
    Trash2,
    Eye,
    X
} from 'lucide-react';
import { useUI, UIProvider } from '../../contexts/UIContext';
import { EvolutionModal } from '../EvolutionModal';
import { KiParticles } from '../KiParticles';

type WarehouseTab = 'ALL' | 'CHARACTERS' | 'SKINS' | 'COSMETICS' | 'CURRENCIES' | 'TICKETS' | 'CONSUMABLES' | 'TITLES';

const WarehouseScreenContent: React.FC = () => {
    const { 
        changeScene, 
        coins, 
        gems, 
        rouletteCoins, 
        bannerTokens,
        unlockedItems, 
        unlockedCharacters, 
        playerProfile,
        updateProfile,
        equippedSkins: rawEquippedSkins,
        setEquippedSkins,
        upgradeStat,
        markItemAsSeen,
        t
    } = useSceneManager();
    const { s } = useUI();
    const equippedSkins = rawEquippedSkins || {};

    // --- STATE ---
    const [activeTab, setActiveTab] = useState<WarehouseTab>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
    const [selectedItemType, setSelectedItemType] = useState<'CHARACTER' | 'GACHA_ITEM' | 'CURRENCY' | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [isConverting, setIsConverting] = useState(false);
    const [selectedConversionType, setSelectedConversionType] = useState<'COIN' | 'UNIVERSAL' | 'CHARACTER_CRYSTAL' | null>(null);
    const [conversionQty, setConversionQty] = useState(0);
    const [targetCharId, setTargetCharId] = useState<string | null>(null);
    const [evolutionChar, setEvolutionChar] = useState<CharacterData | null>(null);

    const { addCoins, spendRouletteCoins, crystalBalances, convertCrystalsToUniversal, convertUniversalToCrystals } = useSceneManager();

    // Track active currencies
    const currencyItems = useMemo(() => {
        const items: any[] = [];
        
        const possibleCurrencies = [
            { id: 'curr_gems', name: 'Diamantes', amount: gems, category: 'Recurso', description: 'Moeda premium utilizada para giros em qualquer roleta e compras exclusivas na loja.', icon: GemIcon, color: '#22d3ee' },
            { id: 'curr_coins', name: 'Ouro', amount: coins, category: 'Recurso', description: 'Moeda comum ganha em combates, missões e passe de batalha. Usada para melhorias de atributos de personagens.', icon: Coins, color: '#facc15' },
        ];

        possibleCurrencies.forEach(curr => {
            if (curr.amount > 0) items.push(curr);
        });

        // Map individual banner tokens (consolation coins)
        if (rouletteCoins) {
            Object.entries(rouletteCoins).forEach(([bannerId, amount]) => {
                if ((amount as number) <= 0) return;
                let bannerName = 'Padrão';
                let bannerColor = '#a855f7'; // Purple
                
                if (bannerId === 'banner_legendary' || bannerId === 'legendary_characters') {
                    bannerName = 'Lendária';
                    bannerColor = '#fbbf24'; // Amber
                } else if (bannerId === 'rare_items') {
                    bannerName = 'de Itens';
                    bannerColor = '#ec4899'; // Pink
                } else if (bannerId === 'eternal_characters') {
                    bannerName = 'Eterna';
                    bannerColor = '#06b6d4'; // Cyan
                }

                items.push({
                    id: `roulette_${bannerId}`,
                    name: `Moeda Roulette ${bannerName}`,
                    amount: amount as number,
                    category: 'Recurso',
                    description: `Moeda de consolação obtida na Roulette ${bannerName}. Pode ser trocada por skins e itens exclusivos na Loja de Resgate ou convertida em Ouro (3 por 50).`,
                    icon: Zap,
                    color: bannerColor,
                    bannerId: bannerId,
                    isRouletteCoin: true
                } as any);
            });
        }

        [
            { id: 'token_standard', name: 'Token Roulette Padrão', amount: bannerTokens['banner_standard'] || 0, category: 'Tickets', description: 'Tokens específicos necessários para realizar giros na Roulette Padrão.', icon: Shield, color: '#a855f7' },
            { id: 'token_eternal', name: 'Token Roulette Eterna', amount: bannerTokens['eternal_characters'] || 0, category: 'Tickets', description: 'Tokens específicos necessários para realizar giros exclusivos na Roulette Eterna.', icon: Flame, color: '#06b6d4' },
            { id: 'token_legendary', name: 'Token Roulette Lendária', amount: bannerTokens['banner_legendary'] || 0, category: 'Tickets', description: 'Tokens específicos necessários para realizar giros exclusivos na Roulette Lendária.', icon: Sparkles, color: '#fbbf24' },
            { id: 'token_items', name: 'Token Roulette de Itens', amount: bannerTokens['rare_items'] || 0, category: 'Tickets', description: 'Tokens específicos necessários para realizar giros exclusivos na Roulette de Itens.', icon: Backpack, color: '#ec4899' },
        ].forEach(token => {
            if (token.amount > 0) items.push(token);
        });

        // Map Evolution Crystals
        Object.entries(crystalBalances).forEach(([charId, amount]) => {
            if ((amount as number) <= 0) return;
            
            if (charId === 'UNIVERSAL') {
                items.push({
                    id: `crystal_UNIVERSAL`,
                    name: `Cristal Universal`,
                    amount: amount,
                    category: 'Recurso',
                    description: `Cristal de conversão. Pode ser transformado em cristais evolutivos de qualquer herói no Armazém (Taxa: 3 para 1).`,
                    icon: Sparkles,
                    color: '#f97316',
                    isCrystal: true,
                    isUniversal: true,
                    charId: 'UNIVERSAL'
                } as any);
                return;
            }

            const char = BASE_CHARACTERS.find(c => c.id === charId);
            items.push({
                id: `crystal_${charId}`,
                name: `Cristal de ${char?.name || 'Evolução'}`,
                amount: amount,
                category: 'Recurso',
                description: `Cristal evolutivo exclusivo para ${char?.name}. Usado para aumentar o nível de evolução do herói. Pode ser convertido em Cristal Universal (Taxa: 1 para 1).`,
                icon: Star,
                color: '#06b6d4',
                isCrystal: true,
                charId: charId
            } as any);
        });

        return items;
    }, [gems, coins, rouletteCoins, bannerTokens, crystalBalances]);

    // Combine everything into a flat inventory pool
    const inventoryPool = useMemo(() => {
        const pool: any[] = [];

        // 1. Unlocked Characters (Source of truth for owned characters)
        unlockedCharacters.forEach(char => {
            const classTag = char.tags?.[0] || t('rank_warrior');
            const isNew = unlockedItems[char.id]?.isNew || false;
            pool.push({
                id: char.id,
                name: char.name,
                category: t('category_characters') || 'Personagens',
                rarity: char.rarity,
                description: `${t('desc_warrior_prefix') || 'Guerreiro lendário da classe'} ${classTag.toUpperCase()}. ${t('desc_warrior_suffix') || 'Atributos iniciais robustos e técnicas supremas exclusivas de combate.'}`,
                rawCharacter: char,
                isUnlocked: true,
                isNew,
                type: 'CHARACTER'
            });
        });

        // 2. Custom Gacha Items
        SummonManager.GACHA_ITEMS.forEach(item => {
            const inventoryData = unlockedItems[item.id];
            const quantity = inventoryData?.quantity || 0;
            const isNew = inventoryData?.isNew || false;

            if (quantity <= 0) return;

            let mappedCategory = 'Cosméticos';
            if (item.category === 'Avatar') mappedCategory = 'Avatares';
            else if (item.category === 'Fundo') mappedCategory = 'Fundos de Avatar';
            else if (item.category === 'Cenario') mappedCategory = 'Cenários';

            pool.push({
                id: item.id,
                name: item.name,
                category: mappedCategory,
                subCategory: item.category,
                rarity: item.rarity,
                description: item.description,
                imageUrl: item.imageUrl,
                isUnlocked: true,
                quantity,
                isNew,
                type: 'GACHA_ITEM'
            });
        });

        // 3. Currencies
        currencyItems.forEach(curr => {
            if (curr.amount <= 0) return;
            
            pool.push({
                id: curr.id,
                name: curr.name,
                category: 'Recursos',
                rarity: 'RARE',
                description: curr.description,
                amount: curr.amount,
                color: curr.color,
                isUnlocked: true,
                type: 'CURRENCY',
                rawCurrency: curr,
                isRouletteCoin: (curr as any).isRouletteCoin,
                bannerId: (curr as any).bannerId,
                isCrystal: (curr as any).isCrystal,
                isUniversal: (curr as any).isUniversal,
                charId: (curr as any).charId
            });
        });

        // 4. Titles
        if (playerProfile?.unlockedTitles) {
            playerProfile.unlockedTitles.forEach(titleId => {
                pool.push({
                    id: `title_${titleId}`,
                    name: titleId,
                    category: t('category_titles') || 'Títulos',
                    rarity: 'LEGENDARY',
                    description: t('desc_title') || 'Um título honorário para exibir em seu perfil de jogador.',
                    isUnlocked: true,
                    type: 'GACHA_ITEM', // Reuse type for simplicity
                    subCategory: 'Title',
                    imageUrl: RESOURCE_SPRITES[`TITLE_${titleId.toUpperCase().replace(/\s+/g, '_')}`] || RESOURCE_SPRITES.TITLE_LEGEND
                });
            });
        }

        return pool;
    }, [unlockedCharacters, unlockedItems, currencyItems]);

    // Apply filtering
    const filteredItems = useMemo(() => {
        let items = [...inventoryPool];

        if (activeTab === 'CHARACTERS') items = items.filter(i => i.category === 'Personagens');
        else if (activeTab === 'SKINS') items = items.filter(i => i.category === 'Trajes');
        else if (activeTab === 'COSMETICS') items = items.filter(i => i.category === 'Cosméticos' || i.category === 'Avatares' || i.category === 'Fundos de Avatar' || i.category === 'Cenários');
        else if (activeTab === 'CURRENCIES') items = items.filter(i => i.category === 'Recursos' && !i.id.startsWith('token_'));
        else if (activeTab === 'TICKETS') items = items.filter(i => i.category === 'Tickets' || i.id.startsWith('token_'));
        else if (activeTab === 'CONSUMABLES') items = items.filter(i => i.category === 'Consumíveis');
        else if (activeTab === 'TITLES') items = items.filter(i => i.category === 'Títulos');

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(query));
        }

        const rarityWeights: Record<string, number> = { ETERNAL: 5, LEGENDARY: 4, EPIC: 3, RARE: 2, COMMON: 1 };
        return items.sort((a, b) => (rarityWeights[b.rarity] || 0) - (rarityWeights[a.rarity] || 0));
    }, [inventoryPool, activeTab, searchQuery]);

    const selectedItem = useMemo(() => {
        return inventoryPool.find(i => i.id === selectedItemId && i.type === selectedItemType) || (filteredItems.length > 0 ? filteredItems[0] : null);
    }, [inventoryPool, selectedItemId, selectedItemType, filteredItems]);

    // Actions
    const handleEquipCosmetic = (item: any) => {
        if (!playerProfile) return;
        AudioManager.getInstance().playSFX('confirm');
        
        if (item.subCategory === 'Avatar') {
            updateProfile(playerProfile.name, item.id, playerProfile.backgroundId || '1');
            setSuccessMessage(`Avatar alterado para "${item.name}"`);
        } else if (item.subCategory === 'Fundo') {
            updateProfile(playerProfile.name, playerProfile.avatarId, item.id);
            setSuccessMessage(`Fundo alterado para "${item.name}"`);
        }
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    const handleEquipSkin = (skinId: string) => {
        let characterId = 'goku_ssj';
        if (skinId.includes('goku_ui_dom')) characterId = 'goku_mui';
        else if (skinId.includes('broly')) characterId = 'broly_lssj';
        
        setEquippedSkins(prev => {
            const updated = { ...prev };
            if (updated[characterId] === skinId) delete updated[characterId];
            else updated[characterId] = skinId;
            return updated;
        });
        AudioManager.getInstance().playSFX('confirm');
        setSuccessMessage('Traje atualizado!');
        setTimeout(() => setSuccessMessage(null), 2000);
    };

    const handleConversion = () => {
        if (!selectedItem) return;
        
        if (selectedConversionType === 'COIN') {
            const bannerId = selectedItem.bannerId;
            const amountToConvert = conversionQty;
            if (amountToConvert <= 0 || amountToConvert % 3 !== 0) return;
            const goldToReceive = (amountToConvert / 3) * 50;
            const success = spendRouletteCoins(amountToConvert, bannerId);
            if (success) {
                addCoins(goldToReceive);
                AudioManager.getInstance().playSFX('confirm');
                setSuccessMessage(`CONVERTIDO! +${goldToReceive} GOLD`);
                setIsConverting(false);
            }
        } else if (selectedConversionType === 'UNIVERSAL') {
            const charId = selectedItem.charId;
            const result = convertCrystalsToUniversal(charId, conversionQty);
            if (result.success) {
                setSuccessMessage(result.message);
                setIsConverting(false);
            }
        } else if (selectedConversionType === 'CHARACTER_CRYSTAL') {
            if (!targetCharId) return;
            const result = convertUniversalToCrystals(targetCharId, conversionQty);
            if (result.success) {
                setSuccessMessage(result.message);
                setIsConverting(false);
            }
        }
        
        setTimeout(() => setSuccessMessage(null), 2500);
    };

    // Effect to reset conversion qty when opening modal
    useEffect(() => {
        if (isConverting && selectedItem) {
            const maxAvailable = Math.min(50, Math.floor(selectedItem.amount / 3) * 3);
            setConversionQty(maxAvailable > 0 ? 3 : 0);
        }
    }, [isConverting, selectedItem]);

    const TabButton = ({ type, label, icon: Icon }: { type: WarehouseTab, label: string, icon: any }) => {
        const isActive = activeTab === type;
        return (
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => { setActiveTab(type); AudioManager.getInstance().playSFX('click'); }}
                className={`flex items-center justify-center gap-2 font-black italic tracking-widest uppercase transition-all border-b-2 cursor-pointer ${isActive ? 'border-orange-500 text-white shadow-sm' : 'border-transparent text-stone-500 hover:text-stone-300'}`}
                style={{ height: s(40), padding: `0 ${s(16)}px`, fontSize: s(12) }}
            >
                <Icon size={s(14)} />
                {label}
            </motion.button>
        );
    };

    return (
        <div className="w-full h-full bg-stone-950 flex flex-col font-sans select-none overflow-hidden text-stone-200 relative">
            {/* Background Layer */}
            <div className="absolute inset-0 z-0">
                <img src="/Assets/fundosdastelas/fundobanner/b3.png" alt="" className="w-full h-full object-cover opacity-20" />
                <div className="absolute inset-0 bg-gradient-to-b from-stone-950 via-transparent to-stone-950" />
            </div>

            {/* Ki Particles */}
            <KiParticles color="cyan" particleCount={25} speed={1.0} />

            {/* TOP BAR */}
            <motion.header 
                initial={{ opacity: 0, y: -50 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-0 left-0 right-0 px-10 flex items-center justify-between z-50 bg-stone-900 border-b border-white/10 backdrop-blur-sm"
                style={{ height: s(112), padding: `0 ${s(40)}px` }}
            >
                <button 
                    onClick={() => changeScene(SceneName.MAIN_MENU)}
                    className="rounded-full border-2 border-stone-600 flex items-center justify-center bg-stone-950/40 hover:border-orange-500 hover:bg-stone-800 text-stone-300 hover:text-white transition-all active:scale-95 shrink-0 group cursor-pointer"
                    style={{ width: s(80), height: s(80) }}
                >
                    <ChevronLeft style={{ width: s(40), height: s(40) }} className="group-hover:-translate-x-1 transition-transform" />
                </button>
                
                <h1 className="font-header italic uppercase tracking-wider text-white text-center absolute left-1/2 -translate-x-1/2 pointer-events-none flex flex-col" style={{ fontSize: s(48) }}>
                    <span className="text-orange-500 tracking-[0.4em] block font-sans" style={{ fontSize: s(12), marginBottom: s(4) }}>INVENTÁRIO E RECURSOS</span>
                    ARMAZÉM
                </h1>

                <div className="flex items-center bg-stone-900 border-2 border-stone-700 rounded-full" style={{ gap: s(16), padding: `${s(8)}px ${s(24)}px` }}>
                    <div className="flex items-center" style={{ gap: s(8) }}>
                        <img src={RESOURCE_SPRITES.curr_gems} alt="" className="object-contain" style={{ width: s(24), height: s(24) }} />
                        <span className="font-black italic text-white" style={{ fontSize: s(20) }}>{gems}</span>
                    </div>
                    <div className="bg-white/20" style={{ width: s(1), height: s(24) }} />
                    <div className="flex items-center" style={{ gap: s(8) }}>
                        <img src={RESOURCE_SPRITES.curr_coins} alt="" className="object-contain" style={{ width: s(24), height: s(24) }} />
                        <span className="font-black italic text-white" style={{ fontSize: s(20) }}>{coins}</span>
                    </div>
                </div>
            </motion.header>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 w-full flex overflow-hidden relative z-10" style={{ marginTop: s(144), marginBottom: s(32), padding: `0 ${s(40)}px`, gap: s(40) }}>
                
                {/* LEFT COLUMN: Grid + Tabs */}
                <div className="flex flex-col overflow-hidden" style={{ width: s(500), gap: s(16) }}>
                    {/* Tabs */}
                    <div className="flex border-b border-white/5 overflow-x-auto scrollbar-none shrink-0" style={{ gap: s(8) }}>
                        <TabButton type="ALL" label="TUDO" icon={Backpack} />
                        <TabButton type="CHARACTERS" label="HERÓIS" icon={User} />
                        <TabButton type="COSMETICS" label="COSMÉTICOS" icon={Award} />
                        <TabButton type="TITLES" label="TÍTULOS" icon={Sparkles} />
                        <TabButton type="TICKETS" label="TICKETS" icon={Zap} />
                        <TabButton type="CURRENCIES" label="RECURSOS" icon={Coins} />
                    </div>

                    {/* Search */}
                    <div className="relative shrink-0">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={s(16)} />
                        <input 
                            type="text" 
                            placeholder="BUSCAR ITEM..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                            className="w-full bg-stone-900 border border-stone-800 rounded-xl text-stone-100 font-black tracking-widest placeholder:text-stone-700 outline-none focus:border-orange-500 transition-all uppercase"
                            style={{ height: s(48), paddingLeft: s(44), fontSize: s(12) }}
                        />
                    </div>

                    {/* Grid */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4">
                        <div className="grid grid-cols-3" style={{ gap: s(12) }}>
                            {filteredItems.map((item, index) => {
                                const isSelected = selectedItem?.id === item.id;
                                const isLocked = !item.isUnlocked;
                                return (
                                    <button
                                        key={`${item.type}-${item.id}-${index}`}
                                        onClick={() => { 
                                            setSelectedItemId(item.id); 
                                            setSelectedItemType(item.type); 
                                            if (item.isNew) markItemAsSeen(item.id);
                                            AudioManager.getInstance().playSFX('click'); 
                                        }}
                                        className={`relative aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all group ${isSelected ? 'border-orange-500 scale-[1.02] shadow-lg shadow-orange-500/20' : 'border-stone-800 opacity-70 hover:opacity-100 hover:border-stone-600'}`}
                                    >
                                        <div className="absolute inset-0 bg-stone-900">
                                            {item.type === 'CHARACTER' ? (
                                                <img src={item.rawCharacter?.spriteConfig?.portraitUrl || undefined} className="w-full h-full object-cover object-[center_20%]" alt="" />
                                            ) : (
                                                <img 
                                                    src={
                                                        item.type === 'CURRENCY' ? (
                                                            item.rawCurrency?.isCrystal ? (
                                                                item.rawCurrency.isUniversal ? RESOURCE_SPRITES.UNIVERSAL : (RESOURCE_SPRITES[item.rawCurrency.charId] || RESOURCE_SPRITES.curr_gems)
                                                            ) :
                                                            RESOURCE_SPRITES[item.id] || (item.id.startsWith('roulette_') ? RESOURCE_SPRITES.curr_roulette : RESOURCE_SPRITES.curr_gems)
                                                        ) :
                                                        item.imageUrl
                                                    } 
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                                                    alt="" 
                                                />
                                            )}
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                                        
                                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 font-black italic uppercase text-white border" style={{ fontSize: s(8), borderColor: item.color || '#444' }}>
                                            {item.rarity}
                                        </div>

                                        {item.isNew && (
                                            <div className="absolute top-2 right-2 px-2 py-0.5 bg-orange-500 text-white font-black italic text-[8px] rounded-sm animate-pulse z-20">
                                                NOVO
                                            </div>
                                        )}

                                        {item.type === 'CURRENCY' && (
                                            <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 backdrop-blur-sm border border-white/10">
                                                <span className="text-orange-400 font-black" style={{ fontSize: s(10) }}>{item.amount.toLocaleString()}</span>
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Preview & Details */}
                <div className="flex-1 relative flex flex-col bg-stone-900 border border-stone-800 rounded-[2rem] overflow-hidden">
                    <AnimatePresence mode="wait">
                        {selectedItem && (
                            <motion.div
                                key={`${selectedItem.type}-${selectedItem.id}`}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="absolute inset-0 flex flex-col"
                            >
                                {/* Visual Area */}
                                <div className="flex-1 relative overflow-hidden flex items-center justify-center">
                                    {selectedItem.type === 'CHARACTER' ? (
                                        <img src={selectedItem.rawCharacter?.spriteConfig?.portraitUrl || undefined} className="w-full h-full object-cover object-[center_20%]" alt="" />
                                    ) : (
                                        <img 
                                            src={
                                                selectedItem.type === 'CURRENCY' ? (
                                                    selectedItem.rawCurrency?.isCrystal ? (
                                                        selectedItem.rawCurrency.isUniversal ? RESOURCE_SPRITES.UNIVERSAL : (RESOURCE_SPRITES[selectedItem.rawCurrency.charId] || RESOURCE_SPRITES.curr_gems)
                                                    ) : (RESOURCE_SPRITES[selectedItem.id] || (selectedItem.id.startsWith('roulette_') ? RESOURCE_SPRITES.curr_roulette : RESOURCE_SPRITES.curr_gems))
                                                ) :
                                                selectedItem.imageUrl
                                            } 
                                            className="w-full h-full object-contain p-2 drop-shadow-[0_0_30px_rgba(255,165,0,0.4)]" 
                                            alt="" 
                                        />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-stone-900 via-transparent to-transparent" />
                                    
                                    {/* Success Message Overlay */}
                                    <AnimatePresence>
                                        {successMessage && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0 }}
                                                className="absolute bottom-10 px-6 py-3 bg-green-600 text-white font-black italic uppercase rounded-full shadow-2xl flex items-center gap-2"
                                            >
                                                <Check size={18} />
                                                {successMessage}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>

                                {/* Info Area */}
                                <div className="p-10 pt-0 relative z-10">
                                    {/* Preview Icon for Currency/Items in Details - Hidden as background is now used */}
                                    {/* {selectedItem.type === 'CURRENCY' && (
                                        <div className="flex justify-center mb-6">
                                            <img 
                                                src={
                                                    selectedItem.id.startsWith('roulette_') ? RESOURCE_SPRITES.curr_roulette || RESOURCE_SPRITES.curr_tickets :
                                                    selectedItem.rawCurrency?.isCrystal ? (
                                                        selectedItem.rawCurrency.isUniversal ? RESOURCE_SPRITES.UNIVERSAL : (RESOURCE_SPRITES[selectedItem.rawCurrency.charId] || RESOURCE_SPRITES.curr_gems)
                                                    ) :
                                                    RESOURCE_SPRITES[selectedItem.id] || RESOURCE_SPRITES.curr_gems
                                                } 
                                                className="w-32 h-32 object-contain drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]" 
                                                alt="" 
                                            />
                                        </div>
                                    )} */}

                                    <div className="mb-6">
                                        <img 
                                            src="/Assets/ui/logo/logojogo.png" 
                                            alt="Logo" 
                                            className="w-32 md:w-48 h-auto object-contain drop-shadow-[0_0_15px_rgba(255,165,0,0.3)]" 
                                        />
                                    </div>
                                    
                                    <h2 className="font-black italic uppercase tracking-tighter text-white leading-none mb-6" style={{ fontSize: s(72) }}>
                                        {selectedItem.name}
                                    </h2>

                                    {/* Description removed as requested */}

                                    {/* Actions */}
                                    <div className="mt-10 flex gap-4">
                                        {selectedItem.isUnlocked && selectedItem.type === 'CHARACTER' && (
                                            <button 
                                                onClick={() => setEvolutionChar(selectedItem.rawCharacter)}
                                                className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl flex items-center gap-3"
                                            >
                                                <span>EVOLUIR LUTADOR</span>
                                                <ChevronRight />
                                            </button>
                                        )}
                                        {selectedItem.isUnlocked && selectedItem.type === 'GACHA_ITEM' && selectedItem.subCategory === 'Title' && (
                                            <button 
                                                onClick={() => {
                                                    updateProfile(playerProfile.name, playerProfile.avatarId, playerProfile.backgroundId || '1', playerProfile.unlockedTitles, selectedItem.name);
                                                    setSuccessMessage(`Título "${selectedItem.name}" equipado!`);
                                                    setTimeout(() => setSuccessMessage(null), 2000);
                                                    AudioManager.getInstance().playSFX('confirm');
                                                }}
                                                className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl flex items-center gap-3"
                                            >
                                                <span>EQUIPAR TÍTULO</span>
                                                <Sparkles />
                                            </button>
                                        )}
                                        {selectedItem.isUnlocked && selectedItem.type === 'GACHA_ITEM' && selectedItem.subCategory !== 'Title' && (
                                            <button 
                                                onClick={() => handleEquipCosmetic(selectedItem)}
                                                className="h-16 px-10 bg-orange-600 hover:bg-orange-500 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl flex items-center gap-3"
                                            >
                                                <span>EQUIPAR NO PERFIL</span>
                                                <Palette />
                                            </button>
                                        )}
                                        {selectedItem.type === 'CURRENCY' && (
                                            <div className="flex flex-col gap-4">
                                                {selectedItem.isRouletteCoin && (
                                                    <button 
                                                        onClick={() => { setIsConverting(true); setSelectedConversionType('COIN'); }}
                                                        disabled={selectedItem.amount < 3}
                                                        className={`h-16 px-10 rounded-2xl transition-all shadow-xl flex items-center gap-3 font-black italic uppercase ${selectedItem.amount >= 3 ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-stone-800 text-stone-600 cursor-not-allowed opacity-50'}`}
                                                    >
                                                        <span>CONVERTER EM GOLD</span>
                                                        <Coins />
                                                    </button>
                                                )}
                                                {selectedItem.rawCurrency?.isCrystal && !selectedItem.rawCurrency?.isUniversal && (
                                                    <button 
                                                        onClick={() => { setIsConverting(true); setSelectedConversionType('UNIVERSAL'); }}
                                                        className="h-16 px-10 bg-cyan-600 hover:bg-cyan-500 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl flex items-center gap-3"
                                                    >
                                                        <span>CONVERTER EM UNIVERSAL</span>
                                                        <Sparkles />
                                                    </button>
                                                )}
                                                {selectedItem.rawCurrency?.isUniversal && (
                                                    <button 
                                                        onClick={() => { setIsConverting(true); setSelectedConversionType('CHARACTER_CRYSTAL'); }}
                                                        disabled={selectedItem.amount < 3}
                                                        className={`h-16 px-10 rounded-2xl transition-all shadow-xl flex items-center gap-3 font-black italic uppercase ${selectedItem.amount >= 3 ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-stone-800 text-stone-600 cursor-not-allowed opacity-50'}`}
                                                    >
                                                        <span>CONVERTER EM PERSONAGEM</span>
                                                        <Zap />
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => changeScene(SceneName.SHOP)}
                                                    className="h-16 px-10 bg-stone-800/40 border border-stone-700 hover:bg-stone-700 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl flex items-center gap-3"
                                                >
                                                    <span>IR PARA LOJA</span>
                                                    <ChevronRight />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>

            {/* Conversion Modal */}
            <AnimatePresence>
                {isConverting && selectedItem && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="w-full max-w-md bg-stone-900 border-2 border-stone-800 rounded-[2rem] p-8 overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 p-4">
                                <button onClick={() => setIsConverting(false)} className="text-stone-500 hover:text-white">
                                    <X size={s(24)} />
                                </button>
                            </div>

                            <h3 className="text-2xl font-black italic uppercase text-white mb-2">
                                {selectedConversionType === 'COIN' ? 'CONVERSÃO DE MOEDAS' : 
                                 selectedConversionType === 'UNIVERSAL' ? 'CONVERSÃO PARA UNIVERSAL' : 
                                 'CONVERSÃO PARA PERSONAGEM'}
                            </h3>
                            <p className="text-stone-400 font-bold mb-8 uppercase tracking-widest text-xs">
                                {selectedConversionType === 'COIN' ? 'TAXA: 3 MOEDAS = 50 GOLD' : 
                                 selectedConversionType === 'UNIVERSAL' ? 'TAXA: 1 CRISTAL = 1 UNIVERSAL' : 
                                 'TAXA: 3 UNIVERSAIS = 1 CRISTAL'}
                            </p>

                            <div className="bg-stone-950 rounded-2xl p-6 mb-8 border border-white/5">
                                {selectedConversionType === 'CHARACTER_CRYSTAL' && (
                                    <div className="mb-6">
                                        <label className="text-stone-500 font-black italic uppercase text-[10px] mb-2 block">SELECIONE O HERÓI:</label>
                                        <div className="grid grid-cols-5 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                            {BASE_CHARACTERS.map(char => (
                                                <button 
                                                    key={char.id}
                                                    onClick={() => { setTargetCharId(char.id); AudioManager.getInstance().playSFX('click'); }}
                                                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${targetCharId === char.id ? 'border-orange-500' : 'border-stone-800 opacity-50'}`}
                                                >
                                                    <img src={char.spriteConfig.portraitUrl} className="w-full h-full object-cover" alt={char.name} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-stone-500 font-black italic uppercase text-[10px]">QUANTIDADE PARA CONVERTER:</span>
                                    <span className="text-white font-black italic" style={{ color: selectedItem.color }}>{conversionQty}</span>
                                </div>
                                
                                <input 
                                    type="range"
                                    min={selectedConversionType === 'UNIVERSAL' ? 1 : 3}
                                    max={selectedConversionType === 'UNIVERSAL' ? selectedItem.amount : Math.floor(selectedItem.amount / 3) * 3}
                                    step={selectedConversionType === 'UNIVERSAL' ? 1 : 3}
                                    value={conversionQty}
                                    onChange={(e) => {
                                        setConversionQty(parseInt(e.target.value));
                                        AudioManager.getInstance().playSFX('click');
                                    }}
                                    className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-orange-500 mb-6"
                                    style={{ accentColor: selectedItem.color }}
                                />

                                <div className="flex items-center justify-between border-t border-white/5 pt-4">
                                    <div className="flex flex-col">
                                        <span className="text-orange-500 font-black italic uppercase text-[10px]" style={{ color: selectedItem.color }}>VOCÊ RECEBE:</span>
                                        <div className="flex items-center gap-2">
                                            {selectedConversionType === 'COIN' ? <Coins className="text-yellow-500" size={16} /> : <Sparkles className="text-cyan-400" size={16} />}
                                            <span className="text-2xl font-black italic text-white">
                                                {selectedConversionType === 'COIN' ? ((conversionQty / 3) * 50).toLocaleString() : 
                                                 selectedConversionType === 'UNIVERSAL' ? conversionQty : 
                                                 Math.floor(conversionQty / 3)}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-stone-500 font-black italic uppercase text-[10px]">RESTANTE:</span>
                                        <div className="text-xl font-black italic text-stone-300">
                                            {selectedItem.amount - conversionQty}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button 
                                    onClick={handleConversion}
                                    disabled={selectedConversionType === 'CHARACTER_CRYSTAL' && !targetCharId}
                                    className={`w-full h-16 text-white font-black italic uppercase rounded-2xl transition-all shadow-xl ${selectedConversionType === 'CHARACTER_CRYSTAL' && !targetCharId ? 'bg-stone-800 text-stone-600' : 'bg-orange-600 hover:bg-orange-500'}`}
                                >
                                    CONFIRMAR TROCA
                                </button>
                                <button 
                                    onClick={() => setIsConverting(false)}
                                    className="w-full h-14 text-stone-500 hover:text-stone-300 font-black italic uppercase tracking-widest text-xs"
                                >
                                    CANCELAR
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {evolutionChar && (
                    <EvolutionModal 
                        character={evolutionChar} 
                        onClose={() => setEvolutionChar(null)} 
                    />
                )}
            </AnimatePresence>

            <style>{`
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                
                @keyframes float {
                    0% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                    100% { transform: translateY(0px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export const WarehouseScreen: React.FC = () => (
    <UIProvider>
        <WarehouseScreenContent />
    </UIProvider>
);

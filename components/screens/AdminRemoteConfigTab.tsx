import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { APIManager, AppConfigData } from '../../services/APIManager';
import { AudioManager } from '../../services/AudioManager';

export const AdminRemoteConfigTab: React.FC = () => {
    const [config, setConfig] = useState<AppConfigData>({
        game_version: "1.0.0",
        maintenance_mode: false,
        update_url: "https://site.com/download",
        currentVersion: "1.0.0",
        forceUpdate: true,
        maintenance: false,
        updateMessage: "Atualize o jogo para acessar o multiplayer online.",
        downloadUrl: "https://site.com/download"
    });
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setIsLoading(true);
        const data = await APIManager.getAppConfig();
        if (data) {
            setConfig(data);
        }
        setIsLoading(false);
    };

    const handleSave = async () => {
        AudioManager.getInstance().playSFX('confirm');
        setIsSaving(true);
        try {
            await APIManager.setAppConfig({
                ...config,
                game_version: config.game_version,
                maintenance_mode: config.maintenance_mode,
                update_url: config.update_url,
                currentVersion: config.game_version,
                downloadUrl: config.update_url,
                maintenance: config.maintenance_mode,
                forceUpdate: true
            });
            alert("Configuração remota salva com sucesso!");
        } catch (e) {
            console.error(e);
            alert("Erro ao salvar configuração.");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return <div className="p-8 text-center text-slate-400">Carregando configuração remota...</div>;
    }

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black italic uppercase text-white tracking-tight flex items-center gap-3">
                    <Settings className="w-6 h-6 text-orange-400" /> Acesso Online & Versão (Live Service)
                </h2>
                <button 
                    onClick={loadConfig}
                    className="p-2 bg-stone-800 hover:bg-stone-700 rounded-lg transition-colors border border-stone-600"
                >
                    <RefreshCw className="w-5 h-5 text-stone-300" />
                </button>
            </div>

            <div className="bg-stone-900 border border-stone-700/50 rounded-2xl p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Game Version */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">Versão Requerida (game_version)</label>
                        <input 
                            type="text" 
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                            value={config.game_version}
                            onChange={(e) => setConfig({...config, game_version: e.target.value})}
                        />
                        <p className="text-[10px] text-slate-500 pl-1">Se a versão instalada for diferente desta, o acesso do jogador é totalmente bloqueado.</p>
                    </div>

                    {/* Update URL */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">URL de Download (update_url)</label>
                        <input 
                            type="text" 
                            className="w-full bg-stone-950 border border-stone-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-orange-500 transition-colors"
                            value={config.update_url}
                            onChange={(e) => setConfig({...config, update_url: e.target.value})}
                        />
                        <p className="text-[10px] text-slate-500 pl-1">Link direcionado ao clicar no botão "Atualizar Jogo".</p>
                    </div>

                    {/* Maintenance Mode */}
                    <div className="space-y-2 flex flex-col justify-center">
                        <label className="flex items-center gap-3 cursor-pointer p-4 bg-stone-950 border border-stone-700 rounded-xl hover:border-orange-500 transition-colors">
                            <input 
                                type="checkbox" 
                                className="w-5 h-5 accent-orange-500"
                                checked={config.maintenance_mode}
                                onChange={(e) => setConfig({...config, maintenance_mode: e.target.checked})}
                            />
                            <div>
                                <span className="text-sm font-bold text-white uppercase block">Manutenção Ativa (maintenance_mode)</span>
                                <span className="text-[10px] text-slate-500">Bloqueia todos os acessos se ativado, redirecionando para a tela de manutenção.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="mt-8 flex justify-end gap-3 pt-6 border-t border-stone-800">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white rounded-xl text-sm font-black italic uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2 cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Salvando...' : 'Salvar Configuração'}
                    </button>
                </div>
            </div>
        </motion.div>
    );
};

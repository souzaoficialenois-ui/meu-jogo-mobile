import React from 'react';
import { ShieldCheck, LogOut, Trash2 } from 'lucide-react';
import { PanelCard, SettingRow } from './SettingsSharedComponents';

interface AccountTabProps {
    currentUser: any;
    logout: () => void;
    deleteAccount: () => void;
    setShowResetConfirm: (v: boolean) => void;
    isPt: boolean;
}

export const AccountTab: React.FC<AccountTabProps> = ({ currentUser, logout, deleteAccount, setShowResetConfirm, isPt }) => (
    <div className="space-y-8">
        <PanelCard title={isPt ? 'Segurança' : 'Security'} subtitle={isPt ? 'Gerencie sua conta e privacidade' : 'Manage your account and privacy'} icon={ShieldCheck}>
            <SettingRow label={isPt ? 'Sessão Atual' : 'Current Session'} description={currentUser?.email || (isPt ? 'Convidado' : 'Guest')}>
                <button 
                    onClick={logout}
                    className="px-6 py-3 bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/30 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest flex items-center gap-2"
                >
                    <LogOut size={14} />
                    {isPt ? 'SAIR DA CONTA' : 'LOGOUT'}
                </button>
            </SettingRow>
        </PanelCard>

        <PanelCard title={isPt ? 'Zona de Perigo' : 'Danger Zone'} subtitle={isPt ? 'Ações irreversíveis' : 'Irreversible actions'} icon={Trash2}>
             <SettingRow label={isPt ? 'Limpar Progresso' : 'Wipe Progress'} description={isPt ? 'Apaga conquistas e recordes locais' : 'Deletes local achievements and records'}>
                <button 
                    onClick={() => setShowResetConfirm(true)}
                    className="px-6 py-3 bg-stone-900/40 hover:bg-red-900/20 text-stone-500 hover:text-red-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
                >
                    {isPt ? 'RESETE TOTAL' : 'FULL RESET'}
                </button>
            </SettingRow>
            {currentUser && (
                <SettingRow label={isPt ? 'Deletar Conta' : 'Delete Account'} description={isPt ? 'Remove permanentemente seus dados do servidor' : 'Permanently remove your data from the server'}>
                    <button 
                        onClick={deleteAccount}
                        className="px-6 py-3 bg-stone-900/40 hover:bg-red-900/20 text-stone-500 hover:text-red-500 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest border border-white/5"
                    >
                        {isPt ? 'APAGAR CONTA' : 'DELETE ACCOUNT'}
                    </button>
                </SettingRow>
            )}
        </PanelCard>
    </div>
);

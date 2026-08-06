import React, { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleClearAndReload = () => {
    try {
      localStorage.removeItem('dd_first_launch_done_v2');
      localStorage.removeItem('dd2d_char_overrides');
      sessionStorage.clear();
    } catch (e) {
      console.warn("Could not clear storage:", e);
    }
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[100000] bg-stone-950 flex flex-col items-center justify-center p-6 select-none font-sans text-stone-200">
          <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[90vw] max-w-[500px] max-h-[500px] bg-orange-600/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 w-full max-w-lg bg-stone-900/90 border-2 border-orange-500/50 rounded-2xl p-6 md:p-8 shadow-2xl backdrop-blur-md flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center mb-4 text-orange-400">
              <AlertTriangle className="w-8 h-8 animate-pulse" />
            </div>

            <h1 className="text-2xl md:text-3xl font-header italic uppercase tracking-wider text-white mb-2">
              FIGHTER LEGEND
            </h1>
            <p className="text-xs md:text-sm font-bold text-orange-400 uppercase tracking-widest mb-4">
              Ocorreu uma falha inesperada na interface
            </p>

            <div className="w-full bg-stone-950/80 border border-stone-800 rounded-xl p-3 mb-6 text-left font-mono text-[11px] text-stone-400 max-h-28 overflow-y-auto custom-scrollbar">
              <p className="text-red-400 font-bold">{this.state.error?.toString() || "Erro desconhecido"}</p>
            </div>

            <div className="w-full flex flex-col gap-3">
              <button
                onClick={this.handleReset}
                className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-header italic text-sm tracking-widest uppercase rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>

              <button
                onClick={this.handleReload}
                className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-header italic text-sm tracking-widest uppercase rounded-xl border border-stone-700 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                Recarregar Jogo
              </button>

              <button
                onClick={this.handleClearAndReload}
                className="w-full py-2.5 bg-transparent hover:bg-stone-950 text-stone-500 hover:text-stone-300 font-bold text-xs uppercase tracking-wider transition-all"
              >
                Limpar Cache e Reiniciar
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-6 flex flex-col items-center justify-center font-mono">
          <div className="max-w-xl w-full bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <h2 className="text-lg font-bold text-rose-400">Application Runtime Error</h2>
            <p className="text-xs text-slate-300">HaulMaster encountered an unexpected error during execution:</p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-rose-300 overflow-x-auto max-h-40 whitespace-pre-wrap">
              {this.state.error && this.state.error.toString()}
              {this.state.errorInfo && this.state.errorInfo.componentStack}
            </div>
            <button
              onClick={() => {
                localStorage.removeItem('haulmaster_game_state_v4');
                window.location.reload();
              }}
              className="px-4 py-2 bg-amber-400 text-slate-950 font-bold text-xs rounded-xl hover:bg-amber-300 transition-colors cursor-pointer"
            >
              Reset Save & Restart Game
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

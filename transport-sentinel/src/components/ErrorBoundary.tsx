import { Component, type ErrorInfo, type ReactNode } from 'react';

/**
 * Keeps one broken view from blanking the console.
 *
 * A CCO screen shows eight modules; a render error in the commercial view
 * should not take the alert ticker and the map down with it. Reset is keyed
 * on the section in `Console`, so navigating away and back clears the error
 * without a page reload — which in a control room means without losing the
 * operator's place.
 */

interface Props {
    children: ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    override state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    override componentDidCatch(error: Error, info: ErrorInfo): void {
        console.error('[Console] La vista falló al renderizar:', error, info.componentStack);
    }

    override render(): ReactNode {
        const { error } = this.state;
        if (!error) return this.props.children;

        return (
            <div className="occ-panel flex flex-col items-center gap-3 p-8 text-center" role="alert">
                <p className="label-mono" style={{ color: 'var(--color-alert)' }}>
                    Error al cargar el módulo
                </p>
                <p className="max-w-md text-sm text-steel">{error.message}</p>
                <button
                    type="button"
                    onClick={() => this.setState({ error: null })}
                    className="min-h-11 rounded-lg border border-steel/25 px-4 text-sm text-ice hover:border-[var(--color-brand)]"
                >
                    Reintentar
                </button>
            </div>
        );
    }
}

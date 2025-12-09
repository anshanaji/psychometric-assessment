import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '20px',
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    textAlign: 'center',
                    backgroundColor: '#f8fafc',
                    color: '#1e293b'
                }}>
                    <h1 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 'bold' }}>Something went wrong</h1>
                    <p style={{ marginBottom: '24px', color: '#64748b' }}>
                        We're sorry, but the application encountered an unexpected error.
                    </p>
                    <div style={{
                        padding: '16px',
                        backgroundColor: '#fff',
                        borderRadius: '8px',
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        maxWidth: '600px',
                        width: '100%',
                        overflow: 'auto',
                        marginBottom: '24px',
                        textAlign: 'left'
                    }}>
                        <code style={{ fontSize: '14px', color: '#ef4444' }}>
                            {this.state.error?.message || 'Unknown error'}
                        </code>
                    </div>
                    <button
                        onClick={() => window.location.reload()}
                        style={{
                            padding: '10px 20px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            fontWeight: 500,
                            transition: 'background-color 0.2s'
                        }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;

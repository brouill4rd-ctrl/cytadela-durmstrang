import React from 'react';
import { ShieldAlert, RefreshCw, Home, RotateCcw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Durmstrang ErrorBoundary] Wykryto zakłócenie aury:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('durmstrang_current_view');
      window.location.href = '/';
    } catch (_) {
      window.location.reload();
    }
  };

  handleClearCache = () => {
    try {
      const keysToPreserve = ['durmstrang_current_user_id'];
      const savedUser = localStorage.getItem('durmstrang_current_user_id');
      localStorage.clear();
      if (savedUser) {
        localStorage.setItem('durmstrang_current_user_id', savedUser);
      }
      window.location.href = '/';
    } catch (_) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at center, #101624 0%, #06090e 100%)',
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem',
            fontFamily: 'var(--font-sans, "Inter", sans-serif)'
          }}
        >
          <div
            style={{
              maxWidth: '650px',
              width: '100%',
              background: 'rgba(15, 20, 30, 0.95)',
              border: '1px solid rgba(197, 159, 78, 0.35)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.9), 0 0 30px rgba(197, 159, 78, 0.15)',
              borderRadius: '12px',
              padding: '2.5rem',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Top decorative glow */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '2px',
                background: 'linear-gradient(90deg, transparent, var(--gold-ancient, #c59f4e), transparent)'
              }}
            />

            <div
              style={{
                width: '72px',
                height: '72px',
                margin: '0 auto 1.5rem',
                borderRadius: '50%',
                background: 'rgba(197, 159, 78, 0.1)',
                border: '1px solid rgba(197, 159, 78, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--gold-glow, #eecf82)',
                boxShadow: '0 0 20px rgba(197, 159, 78, 0.2)'
              }}
            >
              <ShieldAlert size={38} />
            </div>

            <div
              style={{
                fontFamily: 'var(--font-heading, "Cinzel", serif)',
                fontSize: '1.8rem',
                fontWeight: 700,
                color: '#ffffff',
                marginBottom: '0.5rem',
                letterSpacing: '0.04em'
              }}
            >
              ᛞ Zakłócenie Aury Cytadeli ᛞ
            </div>

            <p style={{ color: '#94a3b8', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Prastare bariery Durmstrangu natrafiły na nieoczekiwane zakłócenie magicznego przepływu. 
              Twoje dane i postępy są bezpieczne w Kronikach Paktu.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.6)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '0.8rem 1rem',
                  fontSize: '0.8rem',
                  color: '#f87171',
                  textAlign: 'left',
                  fontFamily: 'monospace',
                  marginBottom: '2rem',
                  maxHeight: '120px',
                  overflowY: 'auto'
                }}
              >
                {this.state.error.toString()}
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.8rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #c59f4e 0%, #8b6b23 100%)',
                  color: '#06090e',
                  fontWeight: 700,
                  border: 'none',
                  borderRadius: '6px',
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(197, 159, 78, 0.3)'
                }}
              >
                <RefreshCw size={16} /> Odnów Połączenie
              </button>

              <button
                onClick={this.handleResetState}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e5e7eb',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '6px',
                  padding: '0.75rem 1.2rem',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <Home size={16} /> Sala Główna
              </button>

              <button
                onClick={this.handleClearCache}
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#fca5a5',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '6px',
                  padding: '0.75rem 1.2rem',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <RotateCcw size={15} /> Oczyść Pamięć Podręczną
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

import React from 'react';
import { Calculator } from 'lucide-react';

export default function ScoreExplanation() {
    return (
        <div className="card animate-in" style={{ animationDelay: '100ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <Calculator size={20} />
                    Cómo se calcula el Score
                </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: '2rem' }}>
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-primary)' }}>Fórmula Maestra</h3>
                    <div style={{
                        background: '#0d1117',
                        padding: '1rem',
                        borderRadius: '6px',
                        fontFamily: 'monospace',
                        marginBottom: '1rem',
                        border: '1px solid #30363d',
                        fontSize: '0.85rem'
                    }}>
                        Unified_Score = (W_Email × Email_Score) + (W_Teams × Teams_Score)
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                        Combinamos el flujo de **Email** (Volumen + Velocidad) con la interacción en **Teams** (Reuniones + Organización + Video).
                    </p>
                    <div className="privacy-badge" style={{
                        marginTop: '1.5rem',
                        padding: '1rem',
                        background: 'rgba(45, 164, 78, 0.1)',
                        border: '1px solid rgba(45, 164, 78, 0.3)',
                        borderRadius: '6px'
                    }}>
                        <h4 style={{ color: '#3fb950', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            🛡️ Privacy-First Commitment
                        </h4>
                        <p style={{ fontSize: '0.8rem', color: '#8b949e', margin: 0 }}>
                            Esta plataforma **solo procesa metadatos**. El contenido de mensajes, correos o grabaciones **nunca** es accedido, almacenado ni analizado.
                        </p>
                    </div>
                </div>
                <div>
                    <h3 style={{ marginBottom: '1rem', color: 'var(--accent-secondary)' }}>Badges (Metáfora Ajedrez)</h3>
                    <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <li><span className="badge-icon">♚</span> <strong>Formales:</strong> Liderazgo jerárquico y estructural.</li>
                        <li><span className="badge-icon">♛</span> <strong>Estratega:</strong> Arquitectura de procesos y tecnología.</li>
                        <li><span className="badge-icon">♜</span> <strong>Conector:</strong> Facilitadores de comunicación inter-departamental.</li>
                        <li><span className="badge-icon">♞</span> <strong>Exploradores:</strong> Motores de agilidad y cambio rápido.</li>
                        <li><span className="badge-icon">♗</span> <strong>Guías:</strong> Referentes técnicos y especialistas de dominio.</li>
                        <li><span className="badge-icon">♙</span> <strong>Colaborador:</strong> Fuerza operativa y ejecución táctica.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

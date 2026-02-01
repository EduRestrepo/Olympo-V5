import React from 'react';
import { User, Share2, Globe, TrendingUp } from 'lucide-react';

const ConnectorCards = ({ bridges }) => {
    return (
        <div className="connectors-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
            {bridges.map((bridge, index) => (
                <div key={index} className="data-card connector-card" style={{
                    position: 'relative',
                    padding: '1.5rem',
                    border: '1px solid rgba(88, 166, 255, 0.2)',
                    background: 'linear-gradient(135deg, rgba(88, 166, 255, 0.05) 0%, rgba(0, 0, 0, 0) 100%)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
                        }}>
                            {bridge.badge || '♙'}
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>{bridge.name}</h3>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#8b949e' }}>{bridge.department}</p>
                        </div>
                        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--accent-primary)' }}>
                                {Math.round(bridge.bridge_score)}
                            </div>
                            <div style={{ fontSize: '0.65rem', color: '#8b949e', textTransform: 'uppercase' }}>Bridge Score</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#58a6ff', marginBottom: '0.2rem' }}>
                                <Share2 size={14} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>CONEXIONES</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{bridge.communities_connected}</div>
                            <div style={{ fontSize: '0.6rem', color: '#8b949e' }}>Comunidades</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.8rem', borderRadius: '8px', textAlign: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#2da44e', marginBottom: '0.2rem' }}>
                                <TrendingUp size={14} />
                                <span style={{ fontSize: '0.7rem', fontWeight: 'bold' }}>CENTRALIDAD</span>
                            </div>
                            <div style={{ fontSize: '1rem', fontWeight: 'bold' }}>{(bridge.betweenness_centrality * 100).toFixed(1)}%</div>
                            <div style={{ fontSize: '0.6rem', color: '#8b949e' }}>Normalizada</div>
                        </div>
                    </div>

                    <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.75rem', color: '#8b949e' }}>{bridge.email}</span>
                            <button
                                className="btn-secondary"
                                style={{ padding: '2px 8px', fontSize: '0.7rem', cursor: 'pointer' }}
                                onClick={() => alert(`Perfil de ${bridge.name} en construcción`)}
                            >
                                Ver Perfil
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ConnectorCards;

import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import { UserMinus, Flame, Network, AlertTriangle, TrendingDown, Clock, Activity, Info } from 'lucide-react';
import './IntelligenceTab.css';

const IntelligenceTab = () => {
    const [activeView, setActiveView] = useState('churn');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        churn: [],
        burnout: [],
        isolation: []
    });

    const views = [
        { id: 'churn', label: 'Riesgo de Fuga', icon: <UserMinus size={18} /> },
        { id: 'burnout', label: 'Burnout', icon: <Flame size={18} /> },
        { id: 'isolation', label: 'Aislamiento', icon: <Network size={18} /> }
    ];

    // Load ALL data once on mount
    useEffect(() => {
        loadAllData();
    }, []);

    const loadAllData = async () => {
        if (dataLoaded) return;

        setLoading(true);
        setError(null);

        try {
            const [churn, burnout, isolation] = await Promise.all([
                analyticsApi.predictions.getChurnRisk(),
                analyticsApi.predictions.getBurnout(),
                analyticsApi.predictions.getIsolation()
            ]);

            const needsCalculation =
                !churn || churn.length === 0 ||
                !burnout || burnout.length === 0 ||
                !isolation || isolation.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.predictions.calculate();
                setCalculating(false);
                setLoading(true);

                const [newChurn, newBurnout, newIsolation] = await Promise.all([
                    analyticsApi.predictions.getChurnRisk(),
                    analyticsApi.predictions.getBurnout(),
                    analyticsApi.predictions.getIsolation()
                ]);

                setData({
                    churn: newChurn || [],
                    burnout: newBurnout || [],
                    isolation: newIsolation || []
                });
            } else {
                setData({
                    churn: churn || [],
                    burnout: burnout || [],
                    isolation: isolation || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading intelligence data:', err);
            setError(err.message || 'Error al cargar los datos');
        } finally {
            setLoading(false);
            setCalculating(false);
        }
    };

    const renderContent = () => {
        if (calculating) {
            return (
                <div className="calculating-state">
                    <LoadingSpinner message="🔄 Calculando análisis predictivo..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando análisis predictivo..." />;
        if (error) return <ErrorState message={error} onRetry={loadAllData} />;

        const currentData = data[activeView];
        if (!currentData || currentData.length === 0) {
            return (
                <EmptyState
                    icon={views.find(v => v.id === activeView)?.icon}
                    title={views.find(v => v.id === activeView)?.label}
                    message="No hay datos disponibles para esta vista"
                />
            );
        }

        return (
            <div className="view-render-container animate-in">
                {/* --- CHURN VIEW --- */}
                {activeView === 'churn' && (
                    <div className="risk-dashboard">
                        <div className="risk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {currentData.map((item, index) => (
                                <div key={index} className="risk-card" style={{
                                    background: '#1c1c1e', padding: '16px', borderRadius: '12px',
                                    borderLeft: `4px solid ${item.risk_level === 'high' ? '#ff3b30' : item.risk_level === 'medium' ? '#ff9500' : '#30d158'}`
                                }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                                        <div className={`risk-badge ${item.risk_level}`} style={{
                                            background: item.risk_level === 'high' ? 'rgba(255, 59, 48, 0.2)' : 'rgba(255, 149, 0, 0.2)',
                                            color: item.risk_level === 'high' ? '#ff3b30' : '#ff9500',
                                            padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', textTransform: 'uppercase'
                                        }}>
                                            {item.risk_level === 'high' ? 'CRÍTICO' : 'ALERTA'}
                                        </div>
                                    </div>
                                    <div className="card-metrics">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#888' }}>Score de Riesgo</span>
                                            <span style={{ color: '#fff', fontWeight: 'bold' }}>{Math.round(item.risk_score)}%</span>
                                        </div>
                                        <div className="progress-bar" style={{ height: '4px', background: '#333', borderRadius: '2px', marginBottom: '12px' }}>
                                            <div style={{
                                                width: `${Math.min(100, item.risk_score)}%`, height: '100%', borderRadius: '2px',
                                                background: item.risk_level === 'high' ? '#ff3b30' : '#ff9500'
                                            }} />
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#ff3b30' }}>
                                            <TrendingDown size={14} />
                                            <span>Caída comunicación: {Math.round(item.communication_decline_pct || 0)}%</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- BURNOUT VIEW --- */}
                {activeView === 'burnout' && (
                    <div className="risk-dashboard">
                        <div className="risk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {currentData.map((item, index) => (
                                <div key={index} className="risk-card" style={{ background: '#1c1c1e', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #bf5af2' }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                                        <Flame size={16} color="#bf5af2" />
                                    </div>
                                    <div className="card-metrics">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#888' }}>Sobrecarga Sostenida</span>
                                            <span style={{ color: '#fff' }}>{item.sustained_overload_weeks} semanas</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                            <span style={{ color: '#888' }}>Burnout Score</span>
                                            <span style={{ color: '#bf5af2', fontWeight: 'bold' }}>{Math.round(item.burnout_score)}/100</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- ISOLATION VIEW --- */}
                {activeView === 'isolation' && (
                    <div className="risk-dashboard">
                        <div className="risk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                            {currentData.map((item, index) => (
                                <div key={index} className="risk-card" style={{ background: '#1c1c1e', padding: '16px', borderRadius: '12px', borderLeft: '4px solid #0a84ff' }}>
                                    <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                        <div style={{ fontWeight: '600', color: '#fff' }}>{item.name}</div>
                                        <Network size={16} color="#0a84ff" />
                                    </div>
                                    <div className="card-metrics">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '0.9rem' }}>
                                            <Activity size={14} color="#888" />
                                            <span style={{ color: '#888' }}>Conexiones Activas:</span>
                                            <span style={{ color: '#fff' }}>{item.active_connections_count}</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem' }}>
                                            <Clock size={14} color="#888" />
                                            <span style={{ color: '#888' }}>Días inactivo:</span>
                                            <span style={{ color: item.days_since_last_interaction > 30 ? '#ff3b30' : '#fff' }}>{item.days_since_last_interaction}</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="view-disclaimer" style={{ marginTop: '24px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            {activeView === 'churn' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Riesgo de Fuga (Churn):</strong> Modelo predictivo que analiza patrones de desconexión digital para alertar sobre posible rotación.</p>
                            )}
                            {activeView === 'burnout' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Riesgo de Burnout:</strong> Identifica sobrecarga digital crónica (trabajo fuera de horario y falta de pausas).</p>
                            )}
                            {activeView === 'isolation' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Riesgo de Aislamiento:</strong> Detecta usuarios que están perdiendo centralidad en la red de comunicaciones.</p>
                            )}
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                                <strong>Nota Predictiva:</strong> Estos indicadores son probabilidades basadas en modelos estadísticos de comportamiento digital. Deben usarse como guia para el diálogo, no como verdades absolutas.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="intelligence-tab">
            <div className="tab-intro">
                <h2>🧠 Inteligencia Predictiva</h2>
                <p>Anticipa riesgos y problemas antes de que ocurran</p>
            </div>

            <div className="view-selector">
                {views.map(view => (
                    <button
                        key={view.id}
                        className={`view-button ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => setActiveView(view.id)}
                    >
                        <span className="view-icon">{view.icon}</span>
                        <span className="view-label">{view.label}</span>
                    </button>
                ))}
            </div>

            <div className="view-content">
                {renderContent()}
            </div>
        </div>
    );
};

export default IntelligenceTab;

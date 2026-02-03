import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import { Activity, Clock, Users, Mail, AlertTriangle, Zap, Info } from 'lucide-react';
import {
    ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
    BarChart, Bar
} from 'recharts';
import './MeetingsTab.css';

const MeetingsTab = () => {
    const [activeView, setActiveView] = useState('efficiency');
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        efficiency: [],
        costs: [],
        recommendations: []
    });

    const views = [
        { id: 'efficiency', label: 'Eficiencia', icon: <Activity size={18} /> },
        { id: 'recommendations', label: 'Estrategias de Optimización', icon: <Zap size={18} /> }
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
            // Removed Costs view as per user request
            const [efficiency, recommendations] = await Promise.all([
                analyticsApi.meetings.getEfficiency(),
                analyticsApi.meetings.getRecommendations()
            ]);

            const needsCalculation =
                !efficiency || efficiency.length === 0 ||
                !recommendations || recommendations.length === 0;

            if (needsCalculation) {
                setCalculating(true);
                setLoading(false);
                await analyticsApi.meetings.calculate();
                setCalculating(false);
                setLoading(true);

                const [newEfficiency, newRecommendations] = await Promise.all([
                    analyticsApi.meetings.getEfficiency(),
                    analyticsApi.meetings.getRecommendations()
                ]);

                setData({
                    efficiency: newEfficiency || [],
                    recommendations: newRecommendations || []
                });
            } else {
                setData({
                    efficiency: efficiency || [],
                    recommendations: recommendations || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading meetings data:', err);
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
                    <LoadingSpinner message="🔄 Calculando métricas de reuniones..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando datos de reuniones..." />;
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
            <div className="data-display animate-in">
                <div className="view-render-container">
                    {/* --- EFFICIENCY VIEW --- */}
                    {activeView === 'efficiency' && (
                        <div className="efficiency-dashboard">
                            <div className="stats-row">
                                <div className="stat-card">
                                    <div className="stat-icon-bg efficiency"><Activity size={20} /></div>
                                    <div className="stat-info">
                                        <label>Score Global</label>
                                        <div className="value">
                                            {Math.round(currentData.reduce((acc, m) => acc + (parseFloat(m.efficiency_score) || 0), 0) / (currentData.length || 1))}
                                            <span className="unit">/100</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-bg time"><Clock size={20} /></div>
                                    <div className="stat-info">
                                        <label>Duración Promedio</label>
                                        <div className="value">
                                            {Math.round(currentData.reduce((acc, m) => acc + (parseFloat(m.duration_minutes) || 0), 0) / (currentData.length || 1))}
                                            <span className="unit">min</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <div className="stat-icon-bg attendees"><Users size={20} /></div>
                                    <div className="stat-info">
                                        <label>Promedio Asistentes</label>
                                        <div className="value">
                                            {Math.round(currentData.reduce((acc, m) => acc + (parseFloat(m.participant_count) || 0), 0) / (currentData.length || 1))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="chart-section" style={{ marginTop: '24px', background: '#1c1c1e', padding: '20px', borderRadius: '12px' }}>
                                <h4>Distribución de Duración vs Asistentes</h4>
                                <div style={{ height: 300, width: '100%' }}>
                                    <ResponsiveContainer>
                                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                                            <XAxis type="number" dataKey="duration_minutes" name="Duración" unit=" min" stroke="#888" />
                                            <YAxis type="number" dataKey="participant_count" name="Asistentes" stroke="#888" />
                                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#2c2c2e', borderColor: '#444' }} />
                                            <Legend />
                                            <Scatter name="Reuniones" data={currentData} fill="#0a84ff">
                                                {currentData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.efficiency_score < 50 ? '#ff3b30' : entry.efficiency_score < 80 ? '#ff9500' : '#30d158'} />
                                                ))}
                                            </Scatter>
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RECOMMENDATIONS VIEW (Synthesized) --- */}
                    {activeView === 'recommendations' && (
                        <div className="strategies-dashboard">
                            {/* Calculations for Summary */}
                            {(() => {
                                const totalRecs = currentData.length;
                                const emailRecs = currentData.filter(r => r.recommendation_type === 'could_be_email');
                                const durationRecs = currentData.filter(r => r.recommendation_type === 'reduce_duration');
                                const participantRecs = currentData.filter(r => r.recommendation_type === 'reduce_participants');

                                const emailSavings = emailRecs.reduce((acc, r) => acc + (parseFloat(r.potential_savings_hours) || 0), 0);
                                const durationSavings = durationRecs.reduce((acc, r) => acc + (parseFloat(r.potential_savings_hours) || 0), 0);
                                const participantSavings = participantRecs.reduce((acc, r) => acc + (parseFloat(r.potential_savings_hours) || 0), 0);

                                const totalSavings = emailSavings + durationSavings + participantSavings;

                                return (
                                    <div className="strategy-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                                        {/* Hero Summary Card */}
                                        <div className="strategy-card hero" style={{ gridColumn: '1 / -1', background: 'linear-gradient(135deg, #0a84ff22 0%, #0a84ff05 100%)', border: '1px solid #0a84ff44', borderRadius: '12px', padding: '24px', display: 'flex', alignItems: 'center', gap: '24px' }}>
                                            <div className="strategy-icon" style={{ background: '#0a84ff22', padding: '16px', borderRadius: '50%' }}><Zap size={32} color="#0a84ff" /></div>
                                            <div className="strategy-content">
                                                <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', color: '#fff' }}>Potencial de Ahorro Detectado</h3>
                                                <p className="strategy-text" style={{ margin: 0, color: '#ccc', lineHeight: '1.5' }}>
                                                    Hemos analizado {totalRecs} patrones de reuniones ineficientes.
                                                    Implementando estas estrategias, la organización podría recuperar aproximadamente <strong style={{ color: '#fff', fontSize: '1.1rem' }}>{Math.round(totalSavings)} horas</strong> de productividad mensualmente.
                                                </p>
                                            </div>
                                        </div>

                                        {/* Strategy 1: Async/Email */}
                                        <div className="strategy-card" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #30d158' }}>
                                            <div className="strategy-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <Mail size={24} color="#30d158" />
                                                <h4 style={{ margin: 0, color: '#fff' }}>Cultura Asíncrona</h4>
                                            </div>
                                            <p className="strategy-desc" style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px' }}>
                                                Se detectaron <strong>{emailRecs.length} reuniones</strong> cortas e informativas que podrían reemplazarse por correos o mensajes.
                                            </p>
                                            <div className="strategy-impact" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px' }}>
                                                <span style={{ color: '#888' }}>Impacto estimado:</span>
                                                <strong style={{ color: '#30d158' }}>{Math.round(emailSavings)} hrs/mes</strong>
                                            </div>
                                        </div>

                                        {/* Strategy 2: Agenda Hygiene */}
                                        <div className="strategy-card" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ff9500' }}>
                                            <div className="strategy-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <Clock size={24} color="#ff9500" />
                                                <h4 style={{ margin: 0, color: '#fff' }}>Higiene de Agenda</h4>
                                            </div>
                                            <p className="strategy-desc" style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px' }}>
                                                <strong>{durationRecs.length} reuniones</strong> exceden los 60 minutos. Reducir la duración estándar a 45 min mejoraría la concentración.
                                            </p>
                                            <div className="strategy-impact" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px' }}>
                                                <span style={{ color: '#888' }}>Impacto estimado:</span>
                                                <strong style={{ color: '#ff9500' }}>{Math.round(durationSavings)} hrs/mes</strong>
                                            </div>
                                        </div>

                                        {/* Strategy 3: Lean Meetings */}
                                        <div className="strategy-card" style={{ background: '#1c1c1e', padding: '20px', borderRadius: '12px', borderLeft: '4px solid #ff3b30' }}>
                                            <div className="strategy-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                                <Users size={24} color="#ff3b30" />
                                                <h4 style={{ margin: 0, color: '#fff' }}>Reuniones Lean</h4>
                                            </div>
                                            <p className="strategy-desc" style={{ color: '#aaa', fontSize: '0.9rem', marginBottom: '16px' }}>
                                                <strong>{participantRecs.length} sesiones</strong> tienen exceso de participantes (&gt;8). Limitar la asistencia a tomadores de decisiones clave.
                                            </p>
                                            <div className="strategy-impact" style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #333', paddingTop: '12px' }}>
                                                <span style={{ color: '#888' }}>Impacto estimado:</span>
                                                <strong style={{ color: '#ff3b30' }}>{Math.round(participantSavings)} hrs/mes</strong>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                <div className="view-disclaimer" style={{ marginTop: '24px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            {activeView === 'efficiency' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Eficiencia de Reuniones:</strong> Analiza la calidad del tiempo invertido basándose en duración, asistentes y uso de video.</p>
                            )}
                            {activeView === 'recommendations' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Estrategias IA:</strong> Propuestas de alto impacto para recuperar tiempo productivo mediante mejores hábitos de comunicación.</p>
                            )}
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                                <strong>Privacidad y Datos:</strong> Datos extraídos de Teams Call Records (duración y participantes). No se graban audios ni se leen transcripciones.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="meetings-tab">
            <div className="tab-intro">
                <h2>📅 Análisis de Reuniones</h2>
                <p>Optimiza el tiempo y los costos de las reuniones en tu organización</p>
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

export default MeetingsTab;

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

    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const views = [
        { id: 'churn', label: 'Riesgo de Fuga', icon: <UserMinus size={18} /> },
        { id: 'burnout', label: 'Burnout', icon: <Flame size={18} /> },
        { id: 'isolation', label: 'Aislamiento', icon: <Network size={18} /> }
    ];

    useEffect(() => {
        loadAllData();
    }, []);

    // Reset pagination and search when view changes
    useEffect(() => {
        setSearchTerm('');
        setCurrentPage(1);
    }, [activeView]);

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

    const getFilteredAndPaginatedData = () => {
        const currentData = data[activeView] || [];

        // Filter by search term
        const filtered = currentData.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase()))
        );

        // Calculate pagination
        const totalItems = filtered.length;
        const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        return { paginated, totalPages, totalItems };
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

        const { paginated, totalPages, totalItems } = getFilteredAndPaginatedData();

        if (!data[activeView] || data[activeView].length === 0) {
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
                {/* --- SEARCH BAR --- */}
                <div className="search-container" style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        {/* We need the Search icon here, will add import later if needed or assumes lucide-react has it */}
                        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar persona..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset to page 1 on search
                            }}
                            style={{
                                width: '100%', padding: '10px 10px 10px 36px', borderRadius: '8px',
                                background: '#1c1c1e', border: '1px solid #333', color: '#fff', fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <div style={{ alignSelf: 'center', color: '#888', fontSize: '0.9rem' }}>
                        {totalItems} resultados
                    </div>
                </div>

                {paginated.length === 0 ? (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                        No se encontraron resultados para "{searchTerm}"
                    </div>
                ) : (
                    <>
                        {/* --- CHURN VIEW --- */}
                        {activeView === 'churn' && (
                            <div className="risk-dashboard">
                                <div className="risk-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                    {paginated.map((item, index) => (
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
                                    {paginated.map((item, index) => (
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
                                    {paginated.map((item, index) => (
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
                    </>
                )}

                {/* --- PAGINATION CONTROLS --- */}
                {totalPages > 1 && (
                    <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px', marginTop: '24px' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', background: '#333', color: '#fff', border: 'none',
                                opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'default' : 'pointer'
                            }}
                        >
                            Anterior
                        </button>
                        <span style={{ color: '#888' }}>Página {currentPage} de {totalPages}</span>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            style={{
                                padding: '8px 16px', borderRadius: '6px', background: '#333', color: '#fff', border: 'none',
                                opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'default' : 'pointer'
                            }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}

                <div className="view-disclaimer" style={{ marginTop: '32px', padding: '20px', background: 'rgba(25, 25, 25, 0.5)', border: '1px solid #333', borderRadius: '12px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <Info size={24} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <h4 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: '1rem' }}>Detalle Técnico de los Modelos Predictivos</h4>

                            {activeView === 'churn' && (
                                <>
                                    <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>
                                        <strong>Riesgo de Fuga (Churn):</strong> Probabilidad calculada combinando tres factores ponderados:
                                    </p>
                                    <ul style={{ margin: '8px 0 12px 20px', padding: 0, listStyleType: 'disc', color: '#b0b0b0' }}>
                                        <li><strong>Caída de Interacciones (40%):</strong> Comparación de interacciones actuales vs. promedio de los últimos 60 días.</li>
                                        <li><strong>Contracción de Red (30%):</strong> Reducción en el número de contactos únicos con los que interactúa.</li>
                                        <li><strong>Inactividad (30%):</strong> Días consecutivos sin actividad registrada en plataformas conectadas.</li>
                                    </ul>
                                </>
                            )}
                            {activeView === 'burnout' && (
                                <>
                                    <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>
                                        <strong>Riesgo de Burnout:</strong> Índice de saturación digital basado en:
                                    </p>
                                    <ul style={{ margin: '8px 0 12px 20px', padding: 0, listStyleType: 'disc', color: '#b0b0b0' }}>
                                        <li><strong>Sobrecarga Sostenida:</strong> Semanas consecutivas con actividad fuera del horario laboral (&gt;20%).</li>
                                        <li><strong>Intensidad de Reuniones:</strong> Más de 20 horas semanales dedicadas a reuniones (suma 30 puntos).</li>
                                        <li><strong>Volumen de Correo:</strong> Más de 150 correos procesados semanalmente (suma 25 puntos).</li>
                                    </ul>
                                </>
                            )}
                            {activeView === 'isolation' && (
                                <>
                                    <p style={{ margin: '0 0 8px 0', lineHeight: '1.5' }}>
                                        <strong>Riesgo de Aislamiento:</strong> Medida de centralidad inversa calculada como:
                                    </p>
                                    <code style={{ display: 'block', background: '#333', padding: '8px', borderRadius: '4px', margin: '8px 0', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                                        Score = 100 - (Conexiones Activas * 5) + Días de Inactividad
                                    </code>
                                    <p style={{ margin: '8px 0', fontSize: '0.85rem', color: '#888' }}>
                                        Un score &gt; 70 indica aislamiento crítico (menos de 2 conexiones activas o alta inactividad).
                                    </p>
                                </>
                            )}

                            <div style={{ fontSize: '0.85rem', color: '#888', borderTop: '1px solid #333', paddingTop: '12px', marginTop: '12px' }}>
                                <strong>Nota de Privacidad:</strong> Estos algoritmos procesan únicamente metadatos de colaboración (tiempo, volumen, frecuencia). No analizan el contenido de mensajes ni reuniones.
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

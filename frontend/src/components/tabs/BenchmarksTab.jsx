import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyStates';
import './BenchmarksTab.css';

const BenchmarksTab = () => {
    const [activeView, setActiveView] = useState('departments');

    const views = [
        { id: 'departments', label: 'Departamentos', icon: '🏢' },
        { id: 'evolution', label: 'Evolución Temporal', icon: '📊' },
        { id: 'rankings', label: 'Rankings', icon: '🏆' },
        { id: 'export', label: 'Exportar', icon: '📥' }
    ];

    const rankingTypes = [
        { id: 'top_collaborators', label: 'Top Colaboradores', icon: '🤝' },
        { id: 'most_connected', label: 'Más Conectados', icon: '🔗' },
        { id: 'fastest_responders', label: 'Respuesta Rápida', icon: '⚡' },
        { id: 'meeting_organizers', label: 'Organizadores', icon: '📅' },
        { id: 'bridge_connectors', label: 'Conectores', icon: '🌉' }
    ];

    return (
        <div className="benchmarks-tab">
            <div className="tab-intro">
                <h2>📈 Benchmarks y Comparaciones</h2>
                <p>Compara departamentos, visualiza evolución temporal y exporta reportes</p>
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
                {activeView === 'departments' && (
                    <div className="departments-view">
                        <div className="action-bar">
                            <button className="primary-button">
                                🔄 Calcular Benchmarks
                            </button>
                            <div className="info-text">
                                <span className="info-icon">ℹ️</span>
                                Compara métricas clave entre departamentos
                            </div>
                        </div>

                        <div className="metrics-selector">
                            <h3>Métricas Disponibles</h3>
                            <div className="metrics-grid">
                                <div className="metric-chip">📧 Volumen de Email</div>
                                <div className="metric-chip">⏱️ Tiempo de Respuesta</div>
                                <div className="metric-chip">🤝 Score de Colaboración</div>
                                <div className="metric-chip">📞 Horas de Reuniones</div>
                                <div className="metric-chip">🔗 Tamaño de Red</div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🏢"
                            title="Comparación departamental"
                            message="Calcula benchmarks para comparar el desempeño entre departamentos"
                        />
                    </div>
                )}

                {activeView === 'evolution' && (
                    <div className="evolution-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Snapshots Disponibles</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Tendencia General</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔄</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Último Snapshot</div>
                                </div>
                            </div>
                        </div>

                        <div className="info-banner">
                            <span className="info-icon">💡</span>
                            <div className="info-content">
                                <strong>Snapshots Temporales</strong>
                                <p>Visualiza cómo evolucionan las métricas de tu organización</p>
                            </div>
                        </div>

                        <EmptyState
                            icon="📊"
                            title="Evolución temporal"
                            message="Los snapshots históricos permitirán visualizar tendencias"
                        />
                    </div>
                )}

                {activeView === 'rankings' && (
                    <div className="rankings-view">
                        <div className="rankings-selector">
                            <h3>Selecciona un Ranking</h3>
                            <div className="rankings-grid">
                                {rankingTypes.map(ranking => (
                                    <button key={ranking.id} className="ranking-card">
                                        <span className="ranking-icon">{ranking.icon}</span>
                                        <span className="ranking-label">{ranking.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="ranking-results">
                            <EmptyState
                                icon="🏆"
                                title="Rankings"
                                message="Selecciona un tipo de ranking para ver el top 20"
                            />
                        </div>
                    </div>
                )}

                {activeView === 'export' && (
                    <div className="export-view">
                        <div className="export-options">
                            <h3>Exportar Datos</h3>
                            <div className="export-grid">
                                <div className="export-card">
                                    <div className="export-icon">👥</div>
                                    <div className="export-content">
                                        <h4>Usuarios (Actors)</h4>
                                        <p>Información completa de usuarios y métricas</p>
                                        <button className="export-button">📥 Exportar CSV</button>
                                    </div>
                                </div>

                                <div className="export-card">
                                    <div className="export-icon">🔗</div>
                                    <div className="export-content">
                                        <h4>Interacciones</h4>
                                        <p>Datos de comunicación entre usuarios</p>
                                        <button className="export-button">📥 Exportar CSV</button>
                                    </div>
                                </div>

                                <div className="export-card">
                                    <div className="export-icon">⚡</div>
                                    <div className="export-content">
                                        <h4>Scores de Influencia</h4>
                                        <p>Métricas de influencia y centralidad</p>
                                        <button className="export-button">📥 Exportar CSV</button>
                                    </div>
                                </div>

                                <div className="export-card">
                                    <div className="export-icon">⏰</div>
                                    <div className="export-content">
                                        <h4>Análisis Temporal</h4>
                                        <p>Métricas de sobrecarga y patrones</p>
                                        <button className="export-button">📥 Exportar CSV</button>
                                    </div>
                                </div>

                                <div className="export-card">
                                    <div className="export-icon">👥</div>
                                    <div className="export-content">
                                        <h4>Comunidades</h4>
                                        <p>Detección de comunidades y silos</p>
                                        <button className="export-button">📥 Exportar CSV</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="export-history">
                            <h3>Historial de Exportaciones</h3>
                            <EmptyState
                                icon="📥"
                                title="Sin exportaciones recientes"
                                message="El historial de exportaciones aparecerá aquí"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BenchmarksTab;

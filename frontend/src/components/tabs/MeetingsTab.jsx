import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyStates';
import './MeetingsTab.css';

const MeetingsTab = () => {
    const [activeView, setActiveView] = useState('efficiency');

    const views = [
        { id: 'efficiency', label: 'Eficiencia', icon: '⚡' },
        { id: 'costs', label: 'Costos', icon: '💰' },
        { id: 'attendance', label: 'Asistencia', icon: '📅' },
        { id: 'recommendations', label: 'Recomendaciones', icon: '💡' }
    ];

    return (
        <div className="meetings-tab">
            <div className="tab-intro">
                <h2>📞 Análisis de Reuniones</h2>
                <p>Optimiza el tiempo de reuniones y mejora la eficiencia organizacional</p>
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
                {activeView === 'efficiency' && (
                    <div className="efficiency-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">⚡</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Score Promedio</div>
                                </div>
                            </div>
                            <div className="stat-card success">
                                <div className="stat-icon">🏆</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Reuniones Eficientes</div>
                                </div>
                            </div>
                            <div className="stat-card danger">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Requieren Mejora</div>
                                </div>
                            </div>
                        </div>

                        <div className="info-banner">
                            <span className="info-icon">📊</span>
                            <div className="info-content">
                                <strong>Factores de Eficiencia</strong>
                                <p>Duración, número de participantes, frecuencia y seguimiento</p>
                            </div>
                        </div>

                        <EmptyState
                            icon="⚡"
                            title="Análisis de eficiencia"
                            message="Calcula métricas de reuniones para ver scores de eficiencia"
                            action={
                                <button className="primary-button">
                                    🔄 Calcular Métricas
                                </button>
                            }
                        />
                    </div>
                )}

                {activeView === 'costs' && (
                    <div className="costs-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Costo Total (Horas)</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Promedio por Reunión</div>
                                </div>
                            </div>
                            <div className="stat-card danger">
                                <div className="stat-icon">🔥</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Reunión Más Costosa</div>
                                </div>
                            </div>
                        </div>

                        <div className="alert-banner warning">
                            <span className="alert-icon">💡</span>
                            <div className="alert-content">
                                <strong>Cálculo de Costos</strong>
                                <p>Costo = Duración (horas) × Número de Participantes</p>
                            </div>
                        </div>

                        <EmptyState
                            icon="💰"
                            title="Análisis de costos"
                            message="Visualiza el costo en horas-persona de tus reuniones"
                        />
                    </div>
                )}

                {activeView === 'attendance' && (
                    <div className="attendance-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">📅</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Tasa de Asistencia</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Participantes Promedio</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔄</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Reuniones Recurrentes</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="📅"
                            title="Patrones de asistencia"
                            message="Identifica patrones de participación en reuniones"
                        />
                    </div>
                )}

                {activeView === 'recommendations' && (
                    <div className="recommendations-view">
                        <div className="info-banner success">
                            <span className="info-icon">💡</span>
                            <div className="info-content">
                                <strong>Recomendaciones Automáticas</strong>
                                <p>Sugerencias basadas en análisis de eficiencia y costos</p>
                            </div>
                        </div>

                        <div className="recommendations-list">
                            <EmptyState
                                icon="💡"
                                title="Recomendaciones pendientes"
                                message="Las sugerencias de optimización aparecerán aquí después del análisis"
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MeetingsTab;

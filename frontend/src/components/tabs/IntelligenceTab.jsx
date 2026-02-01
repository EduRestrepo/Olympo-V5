import React, { useState } from 'react';
import { EmptyState } from '../shared/EmptyStates';
import './IntelligenceTab.css';

const IntelligenceTab = () => {
    const [activeView, setActiveView] = useState('churn');

    const views = [
        { id: 'churn', label: 'Riesgo de Rotación', icon: '🚪' },
        { id: 'burnout', label: 'Burnout', icon: '🔥' },
        { id: 'isolation', label: 'Aislamiento', icon: '🏝️' },
        { id: 'trends', label: 'Tendencias', icon: '📈' }
    ];

    return (
        <div className="intelligence-tab">
            <div className="tab-intro">
                <h2>🔮 Inteligencia Predictiva</h2>
                <p>Detecta riesgos tempranos y predice tendencias de colaboración</p>
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
                {activeView === 'churn' && (
                    <div className="churn-view">
                        <div className="alert-banner danger">
                            <span className="alert-icon">🚪</span>
                            <div className="alert-content">
                                <strong>Detección Temprana de Rotación</strong>
                                <p>Identifica usuarios con patrones de comunicación decrecientes</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card danger">
                                <div className="stat-icon">🔴</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Riesgo Alto</div>
                                </div>
                            </div>
                            <div className="stat-card warning">
                                <div className="stat-icon">🟡</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Riesgo Medio</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📉</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Cambio Promedio</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🚪"
                            title="Análisis de riesgo de rotación"
                            message="Calcula métricas predictivas para identificar usuarios en riesgo"
                            action={
                                <button className="primary-button">
                                    🔄 Calcular Riesgos
                                </button>
                            }
                        />
                    </div>
                )}

                {activeView === 'burnout' && (
                    <div className="burnout-view">
                        <div className="alert-banner warning">
                            <span className="alert-icon">🔥</span>
                            <div className="alert-content">
                                <strong>Indicadores de Burnout</strong>
                                <p>Sobrecarga de trabajo, horarios extendidos y falta de descanso</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card danger">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Usuarios en Riesgo</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">⏰</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Horas Promedio/Semana</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📧</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Emails Fuera de Horario</div>
                                </div>
                            </div>
                        </div>

                        <div className="risk-factors">
                            <h3>Factores de Riesgo</h3>
                            <div className="factors-grid">
                                <div className="factor-card">
                                    <span className="factor-icon">📞</span>
                                    <span className="factor-label">+40h reuniones/semana</span>
                                </div>
                                <div className="factor-card">
                                    <span className="factor-icon">📧</span>
                                    <span className="factor-label">+200 emails/semana</span>
                                </div>
                                <div className="factor-card">
                                    <span className="factor-icon">🌙</span>
                                    <span className="factor-label">Actividad nocturna</span>
                                </div>
                                <div className="factor-card">
                                    <span className="factor-icon">📅</span>
                                    <span className="factor-label">Sin días libres</span>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🔥"
                            title="Monitor de burnout"
                            message="Identifica señales tempranas de agotamiento en tu equipo"
                        />
                    </div>
                )}

                {activeView === 'isolation' && (
                    <div className="isolation-view">
                        <div className="info-banner">
                            <span className="info-icon">🏝️</span>
                            <div className="info-content">
                                <strong>Alertas de Aislamiento</strong>
                                <p>Detecta usuarios con baja conectividad en la red organizacional</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card warning">
                                <div className="stat-icon">🏝️</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Usuarios Aislados</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔗</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Conexiones Promedio</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Umbral de Aislamiento</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🏝️"
                            title="Análisis de aislamiento"
                            message="Identifica usuarios que necesitan mayor integración"
                        />
                    </div>
                )}

                {activeView === 'trends' && (
                    <div className="trends-view">
                        <div className="stats-grid">
                            <div className="stat-card success">
                                <div className="stat-icon">📈</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Tendencia General</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔮</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Predicción 30 días</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Confianza del Modelo</div>
                                </div>
                            </div>
                        </div>

                        <div className="info-banner">
                            <span className="info-icon">💡</span>
                            <div className="info-content">
                                <strong>Pronósticos de Colaboración</strong>
                                <p>Basados en patrones históricos y tendencias actuales</p>
                            </div>
                        </div>

                        <EmptyState
                            icon="📈"
                            title="Tendencias y pronósticos"
                            message="Visualiza la evolución esperada de la colaboración"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntelligenceTab;

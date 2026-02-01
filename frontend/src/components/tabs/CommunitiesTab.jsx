import React, { useState } from 'react';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import './CommunitiesTab.css';

const CommunitiesTab = () => {
    const [activeView, setActiveView] = useState('communities');
    const [loading, setLoading] = useState(false);
    const [communities, setCommunities] = useState([]);

    const views = [
        { id: 'communities', label: 'Mapa de Comunidades', icon: '🗺️' },
        { id: 'silos', label: 'Detector de Silos', icon: '🚧' },
        { id: 'bridges', label: 'Conectores', icon: '🌉' },
        { id: 'diversity', label: 'Diversidad', icon: '🌈' }
    ];

    return (
        <div className="communities-tab">
            <div className="tab-intro">
                <h2>👥 Detección de Comunidades</h2>
                <p>Identifica grupos, silos organizacionales y conectores clave en la red</p>
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
                {activeView === 'communities' && (
                    <div className="communities-view">
                        <div className="action-bar">
                            <button className="primary-button">
                                🔍 Detectar Comunidades
                            </button>
                            <div className="info-text">
                                <span className="info-icon">ℹ️</span>
                                Usa el algoritmo Louvain para identificar grupos naturales
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">👥</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Comunidades Detectadas</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📊</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Modularidad</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">👤</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Tamaño Promedio</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🗺️"
                            title="Mapa de comunidades"
                            message="Ejecuta la detección para visualizar las comunidades en tu organización"
                        />
                    </div>
                )}

                {activeView === 'silos' && (
                    <div className="silos-view">
                        <div className="alert-banner danger">
                            <span className="alert-icon">🚧</span>
                            <div className="alert-content">
                                <strong>¿Qué son los silos organizacionales?</strong>
                                <p>Grupos que colaboran internamente pero tienen poca interacción con el resto de la organización</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card danger">
                                <div className="stat-icon">⚠️</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Silos Detectados</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">📉</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Índice de Aislamiento</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🚧"
                            title="Análisis de silos pendiente"
                            message="Detecta primero las comunidades para identificar silos organizacionales"
                        />
                    </div>
                )}

                {activeView === 'bridges' && (
                    <div className="bridges-view">
                        <div className="info-banner">
                            <span className="info-icon">💡</span>
                            <div className="info-content">
                                <strong>Conectores de Red</strong>
                                <p>Personas que conectan diferentes comunidades y facilitan el flujo de información</p>
                            </div>
                        </div>

                        <div className="stats-grid">
                            <div className="stat-card success">
                                <div className="stat-icon">🌉</div>
                                <div className="stat-content">
                                    <div className="stat-value">0</div>
                                    <div className="stat-label">Conectores Identificados</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🔗</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Betweenness Promedio</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🌉"
                            title="Análisis de conectores"
                            message="Los conectores clave aparecerán aquí después de la detección"
                        />
                    </div>
                )}

                {activeView === 'diversity' && (
                    <div className="diversity-view">
                        <div className="stats-grid">
                            <div className="stat-card">
                                <div className="stat-icon">🌈</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Índice de Diversidad</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🏢</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Departamentos Conectados</div>
                                </div>
                            </div>
                            <div className="stat-card">
                                <div className="stat-icon">🌍</div>
                                <div className="stat-content">
                                    <div className="stat-value">-</div>
                                    <div className="stat-label">Países Representados</div>
                                </div>
                            </div>
                        </div>

                        <EmptyState
                            icon="🌈"
                            title="Métricas de diversidad"
                            message="Analiza la diversidad de conexiones en tu red organizacional"
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default CommunitiesTab;

import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import CommunityMap from '../analytics/CommunityMap';
import SiloChart from '../analytics/SiloChart';
import ConnectorCards from '../analytics/ConnectorCards';
import DiversityStats from '../analytics/DiversityStats';
import RadarProfile from '../RadarProfile';
import { Users, LayoutGrid, Network, Layers, Target, Info, RefreshCw } from 'lucide-react';
import './CommunitiesTab.css';

const CommunitiesTab = () => {
    const [activeView, setActiveView] = useState('communities');
    const [selectedProfile, setSelectedProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [error, setError] = useState(null);
    const [dataLoaded, setDataLoaded] = useState(false);
    const [data, setData] = useState({
        communities: [],
        silos: [],
        bridges: [],
        diversity: []
    });

    const views = [
        { id: 'communities', label: 'Mapa de Comunidades', icon: <Network size={18} />, description: 'Agrupaciones naturales de usuarios segun su interaccion' },
        { id: 'silos', label: 'Detector de Silos', icon: <Layers size={18} />, description: 'Departamentos con alta concentracion de interaccion interna' },
        { id: 'bridges', label: 'Conectores', icon: <Users size={18} />, description: 'Personas clave que unen diferentes areas' },
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
            // Fetch all data in parallel
            const [communities, silos, bridges, diversity] = await Promise.all([
                analyticsApi.communities.getAll(),
                analyticsApi.communities.getSilos(),
                analyticsApi.communities.getBridges(),
                analyticsApi.communities.getDiversity()
            ]);

            // Check if ANY data is missing
            const needsCalculation =
                !communities || communities.length === 0 ||
                !silos || silos.length === 0 ||
                !bridges || bridges.length === 0;

            if (needsCalculation) {
                // Calculate once for ALL metrics
                setCalculating(true);
                setLoading(false);
                await analyticsApi.communities.calculate();
                setCalculating(false);
                setLoading(true);

                // Re-fetch all data
                const [newCommunities, newSilos, newBridges, newDiversity] = await Promise.all([
                    analyticsApi.communities.getAll(),
                    analyticsApi.communities.getSilos(),
                    analyticsApi.communities.getBridges(),
                    analyticsApi.communities.getDiversity()
                ]);

                setData({
                    communities: newCommunities || [],
                    silos: newSilos || [],
                    bridges: newBridges || [],
                    diversity: newDiversity || []
                });
            } else {
                setData({
                    communities: communities || [],
                    silos: silos || [],
                    bridges: bridges || [],
                    diversity: diversity || []
                });
            }

            setDataLoaded(true);
        } catch (err) {
            console.error('Error loading communities data:', err);
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
                    <LoadingSpinner message="🔄 Calculando métricas de comunidades..." />
                    <p className="calculating-info">
                        Esto puede tardar unos segundos. Los datos se están generando automáticamente.
                    </p>
                </div>
            );
        }

        if (loading) return <LoadingSpinner message="Cargando datos de comunidades..." />;
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
                <div className="view-header">
                    <div className="view-title-group">
                        <div className="view-icon-bg">
                            {views.find(v => v.id === activeView)?.icon}
                        </div>
                        <div>
                            <h3>{views.find(v => v.id === activeView)?.label}</h3>
                            <p>{views.find(v => v.id === activeView)?.description}</p>
                        </div>
                    </div>
                </div>

                <div className="view-render-container">
                    {activeView === 'communities' && <CommunityMap communities={data.communities} />}
                    {activeView === 'silos' && <SiloChart silos={data.silos} />}
                    {activeView === 'bridges' && (
                        <ConnectorCards
                            bridges={data.bridges}
                            onViewProfile={setSelectedProfile}
                        />
                    )}
                    {activeView === 'diversity' && <DiversityStats diversity={data.diversity} />}
                </div>

                <div className="view-disclaimer" style={{ marginTop: '24px', padding: '16px', background: 'rgba(10, 132, 255, 0.1)', border: '1px solid rgba(10, 132, 255, 0.2)', borderRadius: '8px', fontSize: '0.9rem', color: '#c9d1d9' }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Info size={20} style={{ color: '#0a84ff', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            {activeView === 'communities' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Mapa de Comunidades:</strong> Visualiza cómo fluye realmente la información en tu organización, agrupando usuarios por frecuencia de interacción.</p>
                            )}
                            {activeView === 'silos' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Detector de Silos:</strong> Los silos representan grupos con alta comunicación interna pero bajo contacto con el exterior.</p>
                            )}
                            {activeView === 'bridges' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Conectores Clave:</strong> Estos usuarios actúan como 'puentes humanos' entre departamentos.</p>
                            )}
                            {activeView === 'diversity' && (
                                <p style={{ margin: '0 0 8px 0' }}><strong>💡 Pluralidad y Salud de Red:</strong> Muestra la riqueza de las conexiones inter-departamentales y la agilidad organizacional.</p>
                            )}
                            <div style={{ fontSize: '0.85rem', opacity: 0.8, borderTop: '1px solid rgba(10, 132, 255, 0.1)', paddingTop: '8px', marginTop: '8px' }}>
                                <strong>Privacidad y Datos:</strong> Procesamiento anonimizado de metadatos (quién contacta a quién y cuándo). No se lee el contenido de las comunicaciones.
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                {renderContent()}
            </div>

            {/* Profile Modal */}
            {selectedProfile && (
                <RadarProfile
                    actor={selectedProfile}
                    onClose={() => setSelectedProfile(null)}
                    isAnonymous={false}
                />
            )}
        </div>
    );
};

export default CommunitiesTab;

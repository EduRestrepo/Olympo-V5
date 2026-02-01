import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi';
import { EmptyState, ErrorState } from '../shared/EmptyStates';
import { LoadingSpinner } from '../shared/LoadingStates';
import CommunityMap from '../analytics/CommunityMap';
import SiloChart from '../analytics/SiloChart';
import ConnectorCards from '../analytics/ConnectorCards';
import DiversityStats from '../analytics/DiversityStats';
import { Users, LayoutGrid, Network, Layers, Target, Info, RefreshCw } from 'lucide-react';
import './CommunitiesTab.css';

const CommunitiesTab = () => {
    const [activeView, setActiveView] = useState('communities');
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
        { id: 'diversity', label: 'Diversidad', icon: <Target size={18} />, description: 'Salud de la red y apertura de colaboracion' }
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
                    {activeView === 'bridges' && <ConnectorCards bridges={data.bridges} />}
                    {activeView === 'diversity' && <DiversityStats diversity={data.diversity} />}
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
        </div>
    );
};

export default CommunitiesTab;

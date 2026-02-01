import { useState, useEffect } from 'react';
import TopInfluencers from './components/TopInfluencers';
import ScoreExplanation from './components/ScoreExplanation';
import PowerBalance from './components/PowerBalance';
import ChannelTotals from './components/ChannelTotals';
import NetworkPulse from './components/NetworkPulse';
import ToneIndex from './components/ToneIndex';
import InfluenceGraph from './components/InfluenceGraph';
import RadarProfile from './components/RadarProfile';
import Settings from './components/Settings';
import TabContainer from './components/shared/TabContainer';
import TemporalTab from './components/tabs/TemporalTab';
import CommunitiesTab from './components/tabs/CommunitiesTab';
import MeetingsTab from './components/tabs/MeetingsTab';
import IntelligenceTab from './components/tabs/IntelligenceTab';
import BenchmarksTab from './components/tabs/BenchmarksTab';
import { api } from './services/api';
import { Info, EyeOff, Eye, ShieldCheck, Activity, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

function App() {
    const [about, setAbout] = useState(null);
    const [showAbout, setShowAbout] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [selectedActor, setSelectedActor] = useState(null);
    const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' or 'settings'
    const [activeTab, setActiveTab] = useState('overview'); // Tab navigation

    useEffect(() => {
        api.getAbout().then(setAbout);
    }, []);


    return (
        <div className="container">
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '1rem',
                borderBottom: '1px solid var(--border-subtle)'
            }}>
                <div>
                    <h1 style={{ fontSize: '2rem', background: 'linear-gradient(90deg, #fff, #8b949e)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>OLYMPUS</h1>
                    <p style={{ color: 'var(--text-muted)' }}>Organizational Analytics Platform</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <div style={{ display: 'flex', background: 'var(--bg-panel)', borderRadius: '8px', padding: '0.25rem', border: '1px solid var(--border-subtle)' }}>
                        <button
                            onClick={() => setActivePage('dashboard')}
                            className={`btn-toggle ${activePage === 'dashboard' ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}
                        >
                            <LayoutDashboard size={16} />
                            Dashboard
                        </button>
                        <button
                            onClick={() => setActivePage('settings')}
                            className={`btn-toggle ${activePage === 'settings' ? 'active' : ''}`}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', border: 'none' }}
                        >
                            <SettingsIcon size={16} />
                            Configuración
                        </button>
                    </div>
                    <button
                        onClick={() => setShowAbout(!showAbout)}
                        className="btn-info"
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border-subtle)',
                            color: 'var(--text-main)',
                            padding: '0.5rem 1rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Info size={18} />
                        About
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3fb950', fontSize: '0.8rem', border: '1px solid rgba(63, 185, 80, 0.3)', padding: '0 1rem', borderRadius: '6px', background: 'rgba(63, 185, 80, 0.05)' }}>
                        <ShieldCheck size={16} />
                        Privacy Secured
                    </div>
                </div>
            </header>

            <div className="settings-bar">
                <label className="toggle-switch">
                    <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={() => setIsAnonymous(!isAnonymous)}
                    />
                    {isAnonymous ? <EyeOff size={18} className="text-accent" /> : <Eye size={18} />}
                    Modo Anonimización (Privacy-Plus)
                </label>
                <div style={{ height: '20px', width: '1px', background: 'var(--border-subtle)' }} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <Activity size={16} />
                    Live Dataset: Metadata Only
                </div>
            </div>

            <div className="privacy-badge" style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                background: 'rgba(45, 164, 78, 0.1)',
                border: '1px solid rgba(45, 164, 78, 0.3)',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <h4 style={{ color: '#3fb950', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
                    🛡️ Privacy-First
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#8b949e', margin: 0 }}>
                    Solo analizamos <strong>metadatos</strong> (quién, cuándo, cuánto). El contenido (el "qué") es privado y nunca es accesible.
                </p>
            </div>

            {showAbout && (
                <div className="card animate-in" style={{ marginBottom: '2rem', borderColor: 'var(--accent-primary)' }}>
                    {about ? (
                        <>
                            <h3 style={{ color: 'var(--accent-primary)' }}>{about.project}</h3>
                            <p><strong>Versión:</strong> {about.version}</p>
                            <p>{about.description}</p>
                            {about.author && (
                                <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                                    <p><strong>Autor:</strong> {about.author}</p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        {about.emails && about.emails.map((email, i) => (
                                            <small key={i} style={{ color: 'var(--text-muted)' }}>{email}</small>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <p>Cargando información...</p>
                    )}
                </div>
            )}

            {activePage === 'dashboard' ? (
                <TabContainer
                    tabs={[
                        { id: 'overview', label: 'Dashboard', icon: '📊', description: 'Vista general de la red' },
                        { id: 'temporal', label: 'Temporal', icon: '⏰', description: 'Análisis temporal' },
                        { id: 'communities', label: 'Comunidades', icon: '👥', description: 'Detección de comunidades' },
                        { id: 'meetings', label: 'Reuniones', icon: '📞', description: 'Análisis de reuniones' },
                        { id: 'intelligence', label: 'Inteligencia', icon: '🔮', description: 'Analytics predictivos' },
                        { id: 'benchmarks', label: 'Benchmarks', icon: '📈', description: 'Comparaciones y rankings' }
                    ]}
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                >
                    {activeTab === 'overview' && (
                        <div className="grid-dashboard">
                            <TopInfluencers onSelectActor={setSelectedActor} isAnonymous={isAnonymous} />
                            <ScoreExplanation />

                            <PowerBalance />
                            <ChannelTotals />

                            <NetworkPulse />
                            <ToneIndex />
                            <InfluenceGraph onSelectActor={setSelectedActor} isAnonymous={isAnonymous} />
                        </div>
                    )}
                    {activeTab === 'temporal' && <TemporalTab />}
                    {activeTab === 'communities' && <CommunitiesTab />}
                    {activeTab === 'meetings' && <MeetingsTab />}
                    {activeTab === 'intelligence' && <IntelligenceTab />}
                    {activeTab === 'benchmarks' && <BenchmarksTab />}
                </TabContainer>
            ) : (
                <Settings />
            )}

            {selectedActor && (
                <RadarProfile
                    actor={selectedActor}
                    isAnonymous={isAnonymous}
                    onClose={() => setSelectedActor(null)}
                />
            )}

            <footer style={{ marginTop: '4rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                &copy; 2026 Olympus Analytics. Enterprise Network Science.
            </footer>
        </div>
    );
}

export default App;

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
import { api } from './services/api';
import { Info, EyeOff, Eye, ShieldCheck, Activity, LayoutDashboard, Settings as SettingsIcon } from 'lucide-react';

function App() {
    const [about, setAbout] = useState(null);
    const [showAbout, setShowAbout] = useState(false);
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [selectedActor, setSelectedActor] = useState(null);
    const [activePage, setActivePage] = useState('dashboard'); // 'dashboard' or 'settings'

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

            {showAbout && (
                <div className="card animate-in" style={{ marginBottom: '2rem', borderColor: 'var(--accent-primary)' }}>
                    {about ? (
                        <>
                            <h3 style={{ color: 'var(--accent-primary)' }}>{about.project}</h3>
                            <p><strong>Versión:</strong> {about.version}</p>
                            <p>{about.description}</p>
                        </>
                    ) : (
                        <p>Cargando información...</p>
                    )}
                </div>
            )}

            {activePage === 'dashboard' ? (
                <div className="grid-dashboard">
                    <TopInfluencers onSelectActor={setSelectedActor} isAnonymous={isAnonymous} />
                    <ScoreExplanation />

                    <PowerBalance />
                    <ChannelTotals />

                    <NetworkPulse />
                    <ToneIndex />
                    <InfluenceGraph onSelectActor={setSelectedActor} isAnonymous={isAnonymous} />
                </div>
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

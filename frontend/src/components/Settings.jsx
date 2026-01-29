import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Database, Shield, Globe, Terminal, UserMinus, UserCheck, AlertCircle, Play, RefreshCw, Trash2, FileText, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../services/api';

const Settings = () => {
    const [settings, setSettings] = useState({
        ms_graph_tenant_id: '',
        ms_graph_client_id: '',
        ms_graph_client_secret: '',
        extraction_lookback_days: '30',
        extraction_max_users: '100',
        excluded_users: '',
        mandatory_users: '',
        app_env: 'dev',
        app_debug: 'true',
        influence_weight_email: '0.6',
        influence_weight_teams: '0.4',
        threshold_email_vol: '500',
        threshold_teams_freq: '50'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [extracting, setExtracting] = useState(false);
    const [resetting, setResetting] = useState(false);
    const [logs, setLogs] = useState('');
    const [lastSync, setLastSync] = useState(null);

    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.get('/api/settings');
            if (data) {
                setSettings(prev => ({ ...prev, ...data }));
                if (data.system_last_sync) setLastSync(data.system_last_sync);
            }
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const res = await api.post('/api/settings', settings);
            if (res) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            } else {
                setMessage({ type: 'error', text: 'Error de red o servidor al guardar.' });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleTestConnection = async (e) => {
        e.preventDefault();
        setTestingConnection(true);
        setMessage({ type: '', text: '' });
        try {
            const res = await api.post('/api/settings/test-connection', {});
            // Check for null/undefined response which commonly happens with the api wrapper
            if (res) {
                if (res.status === 'success') {
                    setMessage({ type: 'success', text: res.message || 'Conexión Exitosa' });
                } else {
                    setMessage({ type: 'error', text: res.message || 'Error desconocido del servidor' });
                }
            } else {
                setMessage({ type: 'error', text: 'No se pudo conectar con el servidor (Respuesta nula)' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: error.message || 'Error de Conexión' });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleExtraction = async (e) => {
        e.preventDefault();
        if (!confirm('¿Iniciar extracción de datos? Esto puede tardar varios minutos.')) return;

        setExtracting(true);
        setLogs('Iniciando extracción...\n');
        setMessage({ type: '', text: '' });

        // Start polling logs every 2 seconds
        const pollInterval = setInterval(async () => {
            try {
                const logRes = await api.get('/api/settings/logs');
                if (logRes && logRes.logs) {
                    setLogs(logRes.logs);

                    const textarea = document.getElementById('log-viewer');
                    if (textarea) textarea.scrollTop = textarea.scrollHeight;
                }
            } catch (err) {
                console.error('Error polling logs', err);
            }
        }, 2000);

        try {
            const res = await api.post('/api/settings/extract-data', {});
            if (res) {
                setLogs(res.logs || 'Extracción completada.');
                setMessage({ type: 'success', text: 'Datos extraídos correctamente' });
                setLastSync(new Date().toISOString());
            } else {
                setLogs(prev => prev + '\n[ERROR] El servidor no respondió corrextamente.');
                setMessage({ type: 'error', text: 'Hubo un problema iniciando la extracción.' });
            }
        } catch (error) {
            setLogs(prev => prev + '\n[ERROR] ' + (error.message || 'Fallo desconocido'));
            setMessage({ type: 'error', text: 'Fallo en la extracción' });
        } finally {
            clearInterval(pollInterval);
            setExtracting(false);
        }
    };

    const [wiping, setWiping] = useState(false);
    const [seeding, setSeeding] = useState(false);

    // ... (keep earlier code)

    const handleWipe = async (e) => {
        e.preventDefault();
        if (!confirm('¡PELIGRO! Esto borrará TODOS los datos de la base de datos. ¿Estás seguro?')) return;

        setWiping(true);
        try {
            const res = await api.wipeDatabase();
            if (res && res.status === 'success') {
                setMessage({ type: 'success', text: res.message || 'Base de datos borrada.' });
            } else {
                setMessage({ type: 'error', text: (res?.message) || 'Error al borrar la BD.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error crítico al borrar.' });
        } finally {
            setWiping(false);
        }
    };

    const handleSeed = async (e) => {
        e.preventDefault();
        if (!confirm('Esto cargará 120 usuarios de prueba. (Se recomienda borrar la BD antes si no está vacía). ¿Continuar?')) return;

        setSeeding(true);
        try {
            const res = await api.seedDatabase();
            if (res && res.status === 'success') {
                setMessage({ type: 'success', text: res.message || 'Datos de simulación cargados.' });
            } else {
                setMessage({ type: 'error', text: (res?.message) || 'Error al cargar datos.' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error crítico al simular.' });
        } finally {
            setSeeding(false);
        }
    };

    if (loading) return <div className="card">Cargando configuración...</div>;

    const SectionHeader = ({ icon: Icon, title }) => (
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem', color: 'var(--text-main)' }}>
            <Icon size={18} className="text-accent" />
            {title}
        </h3>
    );

    return (
        <div className="card animate-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div className="card-header">
                <h2 className="card-title">
                    <SettingsIcon className="text-accent" />
                    Configuración del Sistema
                </h2>
                {message.text && (
                    <div style={{
                        position: 'fixed',
                        top: '20px',
                        right: '20px',
                        zIndex: 9999,
                        background: message.type === 'success' ? '#238636' : '#da3633',
                        color: 'white',
                        padding: '1rem 1.5rem',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                        animation: 'fadeIn 0.3s ease-out'
                    }}>
                        {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
                        {message.text}
                    </div>
                )}
            </div>

            <form onSubmit={handleSave} style={{ padding: '0 1rem 2rem 1rem' }}>

                {/* --- SECCION 1: CONEXIÓN --- */}
                <SectionHeader icon={Globe} title="Conexión Microsoft 365" />
                <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div className="stat-item">
                        <label className="stat-label">Tenant ID</label>
                        <input className="graph-search-input" name="ms_graph_tenant_id" value={settings.ms_graph_tenant_id} onChange={handleChange} placeholder="e.g. 000000..." style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Client ID</label>
                        <input className="graph-search-input" name="ms_graph_client_id" value={settings.ms_graph_client_id} onChange={handleChange} placeholder="App Client ID" style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Client Secret</label>
                        <input type="password" className="graph-search-input" name="ms_graph_client_secret" value={settings.ms_graph_client_secret} onChange={handleChange} placeholder="••••••••" style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>
                    <div style={{ marginTop: '0.5rem' }}>
                        <button onClick={handleTestConnection} disabled={testingConnection} className="graph-search-btn" style={{ background: 'transparent', border: '1px solid var(--accent-primary)', color: 'var(--accent-primary)', width: 'auto' }}>
                            {testingConnection ? <RefreshCw className="spin" size={16} /> : <CheckCircle size={16} />}
                            {testingConnection ? ' Probando...' : ' Probar Conexión'}
                        </button>
                    </div>
                </div>

                {/* --- SECCION 2: ENTORNO Y SISTEMA --- */}
                <SectionHeader icon={Terminal} title="Sistema y Entorno" />
                <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="stat-item">
                        <label className="stat-label">Entorno (APP_ENV)</label>
                        <select className="graph-search-input" name="app_env" value={settings.app_env} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }}>
                            <option value="dev">Desarrollo (Simulación / Test)</option>
                            <option value="prod">Producción (Live Graph Data)</option>
                        </select>
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Debug Mode</label>
                        <select className="graph-search-input" name="app_debug" value={settings.app_debug} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }}>
                            <option value="true">Activado</option>
                            <option value="false">Desactivado</option>
                        </select>
                    </div>
                    <div className="stat-item" style={{ gridColumn: 'span 2', marginTop: '0.5rem', background: 'rgba(248, 81, 73, 0.05)', border: '1px solid rgba(248, 81, 73, 0.2)', borderRadius: '6px', padding: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            <label className="stat-label" style={{ color: '#f85149', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <AlertCircle size={16} /> Acciones de Datos
                            </label>
                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                <button onClick={handleWipe} disabled={wiping || seeding} className="graph-search-btn" style={{ flex: 1, background: '#f85149', borderColor: '#f85149', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Trash2 size={16} />
                                    {wiping ? 'Borrando...' : 'Borrar DB (Limpiar Todo)'}
                                </button>
                                <button onClick={handleSeed} disabled={wiping || seeding} className="graph-search-btn" style={{ flex: 1, background: 'var(--accent-primary)', borderColor: 'var(--accent-primary)', color: 'white', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                    <Database size={16} />
                                    {seeding ? 'Cargando...' : 'Simular DB (100+ Usuarios)'}
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0.25rem 0 0 0' }}>
                                Usa "Borrar" antes de "Simular" para asegurar datos limpios. "Simular" carga datos de prueba para demos.
                            </p>
                        </div>
                    </div>
                </div>

                {/* --- SECCION 3: EXTRACCIÓN Y FILTROS --- */}

                {/* --- SECCION 2.5: PONDERACION (PESOS) --- */}
                <div className="settings-group" style={{ marginTop: '2rem' }}>
                    <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Estrategia de Influencia (Pesos)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '1rem' }}>
                        Define el peso relativo de cada canal en la fórmula final. La suma debe ser 100%.
                    </p>
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        <div className="stat-item" style={{ background: 'rgba(163, 113, 247, 0.05)', borderColor: 'rgba(163, 113, 247, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="stat-label" style={{ color: '#a371f7' }}>Peso Email</label>
                                <span style={{ fontWeight: 'bold', color: '#e6edf3' }}>{Math.round(settings.influence_weight_email * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={settings.influence_weight_email}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setSettings(prev => ({
                                        ...prev,
                                        influence_weight_email: val,
                                        influence_weight_teams: parseFloat((1 - val).toFixed(2)) // Auto-balance
                                    }));
                                }}
                                style={{ width: '100%', accentColor: '#a371f7' }}
                            />
                        </div>
                        <div className="stat-item" style={{ background: 'rgba(45, 164, 78, 0.05)', borderColor: 'rgba(45, 164, 78, 0.2)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                <label className="stat-label" style={{ color: '#2da44e' }}>Peso Teams</label>
                                <span style={{ fontWeight: 'bold', color: '#e6edf3' }}>{Math.round(settings.influence_weight_teams * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0" max="1" step="0.05"
                                value={settings.influence_weight_teams}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setSettings(prev => ({
                                        ...prev,
                                        influence_weight_teams: val,
                                        influence_weight_email: parseFloat((1 - val).toFixed(2)) // Auto-balance
                                    }));
                                }}
                                style={{ width: '100%', accentColor: '#2da44e' }}
                            />
                        </div>
                    </div>
                </div>

                <div className="settings-group" style={{ marginTop: '2rem' }}>
                    <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>Umbrales de Referencia (Benchmarks)</h4>
                    <p style={{ fontSize: '0.8rem', color: '#8b949e', marginBottom: '1rem' }}>
                        Define el volumen de actividad requerido para obtener 100 puntos en cada categoría.
                    </p>
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="stat-item">
                            <label className="stat-label">Meta Emails Mensuales (100 Pts)</label>
                            <input
                                type="number"
                                className="graph-search-input"
                                name="threshold_email_vol"
                                value={settings.threshold_email_vol}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Meta Reuniones Mensuales (100 Pts)</label>
                            <input
                                type="number"
                                className="graph-search-input"
                                name="threshold_teams_freq"
                                value={settings.threshold_teams_freq}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>
                </div>

                {/* --- SECCION 3: EXTRACCIÓN Y FILTROS --- */}
                <SectionHeader icon={Database} title="Extracción de Datos" />
                <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="stat-item">
                        <label className="stat-label">Periodo (Días)</label>
                        <input type="number" min="15" max="90" className="graph-search-input" name="extraction_lookback_days" value={settings.extraction_lookback_days} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Max Usuarios</label>
                        <input type="number" className="graph-search-input" name="extraction_max_users" value={settings.extraction_max_users} onChange={handleChange} style={{ width: '100%', marginTop: '0.5rem' }} />
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Exclusiones (Emails)</label>
                        <textarea className="graph-search-input" name="excluded_users" value={settings.excluded_users} onChange={handleChange} placeholder="user1@example.com, user2@example.com" style={{ width: '100%', marginTop: '0.5rem', minHeight: '80px', fontFamily: 'monospace' }} />
                    </div>
                    <div className="stat-item">
                        <label className="stat-label">Usuarios Obligatorios (Emails)</label>
                        <textarea className="graph-search-input" name="mandatory_users" value={settings.mandatory_users} onChange={handleChange} placeholder="ceo@example.com, cto@example.com" style={{ width: '100%', marginTop: '0.5rem', minHeight: '80px', fontFamily: 'monospace' }} />
                    </div>
                </div>

                {/* --- AREA DE LOGS --- */}
                <div className="stat-item" style={{ marginTop: '2rem', background: '#0d1117', border: '1px solid #30363d', borderRadius: '6px', padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                        <label className="stat-label" style={{ color: 'var(--text-main)' }}>Consola de Operaciones</label>
                        {lastSync && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Última sinc: {lastSync}</span>}
                    </div>

                    <textarea id="log-viewer" readOnly value={logs}
                        style={{ width: '100%', height: '200px', background: 'transparent', color: '#c9d1d9', fontFamily: 'monospace', fontSize: '0.8rem', border: 'none', resize: 'vertical' }}
                    />

                    <div style={{ borderTop: '1px solid #30363d', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <button onClick={handleExtraction} disabled={extracting} className="graph-search-btn" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'var(--accent-secondary)' }}>
                            {extracting ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
                            {extracting ? ' Extrayendo datos (Espere...)' : ' Iniciar Extracción Ahora'}
                        </button>
                    </div>
                </div>

                <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'center', padding: '1rem', background: 'var(--bg-card)', position: 'sticky', bottom: 0, borderTop: '1px solid var(--border-subtle)' }}>
                    <button type="submit" className="graph-search-btn" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 3rem', fontSize: '1.1rem' }}>
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>

            </form>
        </div>
    );
};

export default Settings;

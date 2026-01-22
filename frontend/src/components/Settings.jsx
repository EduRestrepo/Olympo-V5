import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Database, Shield, Globe, Terminal, UserMinus, UserCheck, AlertCircle } from 'lucide-react';
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
        influence_weight_teams: '0.4'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [activeTab, setActiveTab] = useState('m365');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const data = await api.get('/api/settings');
            if (data) setSettings(prev => ({ ...prev, ...data }));
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
            await api.post('/api/settings', settings);
            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
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

    if (loading) return <div className="card">Cargando configuración...</div>;

    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            className={`btn-toggle ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.25rem' }}
        >
            <Icon size={16} />
            {label}
        </button>
    );

    return (
        <div className="card animate-in">
            <div className="card-header">
                <h2 className="card-title">
                    <SettingsIcon className="text-accent" />
                    Configuración del Sistema
                </h2>
                {message.text && (
                    <div className={`status-pill ${message.type === 'success' ? 'status-active' : 'status-critical'}`}
                        style={{ fontSize: '0.85rem', padding: '0.4rem 1rem' }}>
                        {message.text}
                    </div>
                )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '1rem' }}>
                <TabButton id="m365" label="M365 Connection" icon={Globe} />
                <TabButton id="system" label="System & Env" icon={Terminal} />
                <TabButton id="extraction" label="Data Extraction" icon={Database} />
                <TabButton id="users" label="User Lists" icon={Shield} />
            </div>

            <form onSubmit={handleSave}>
                {activeTab === 'm365' && (
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="stat-item">
                            <label className="stat-label">Tenant ID</label>
                            <input
                                className="graph-search-input"
                                name="ms_graph_tenant_id"
                                value={settings.ms_graph_tenant_id}
                                onChange={handleChange}
                                placeholder="e.g. 00000000-0000-0000-0000-000000000000"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Client ID</label>
                            <input
                                className="graph-search-input"
                                name="ms_graph_client_id"
                                value={settings.ms_graph_client_id}
                                onChange={handleChange}
                                placeholder="App Registration Client ID"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Client Secret</label>
                            <input
                                type="password"
                                className="graph-search-input"
                                name="ms_graph_client_secret"
                                value={settings.ms_graph_client_secret}
                                onChange={handleChange}
                                placeholder="••••••••••••••••"
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'system' && (
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="stat-item">
                            <label className="stat-label">Entorno (APP_ENV)</label>
                            <select
                                className="graph-search-input"
                                name="app_env"
                                value={settings.app_env}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                <option value="dev">Desarrollo (Simulación / Test)</option>
                                <option value="prod">Producción (Live Graph Data)</option>
                            </select>
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Debug Mode</label>
                            <select
                                className="graph-search-input"
                                name="app_debug"
                                value={settings.app_debug}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                <option value="true">Activado</option>
                                <option value="false">Desactivado</option>
                            </select>
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Peso Email (0-1)</label>
                            <input
                                type="number" step="0.1"
                                className="graph-search-input"
                                name="influence_weight_email"
                                value={settings.influence_weight_email}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Peso Teams (0-1)</label>
                            <input
                                type="number" step="0.1"
                                className="graph-search-input"
                                name="influence_weight_teams"
                                value={settings.influence_weight_teams}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'extraction' && (
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr 1fr' }}>
                        <div className="stat-item">
                            <label className="stat-label">Periodo de Extracción (Días)</label>
                            <input
                                type="number" min="15" max="90"
                                className="graph-search-input"
                                name="extraction_lookback_days"
                                value={settings.extraction_lookback_days}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                            <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Min: 15, Max: 90</small>
                        </div>
                        <div className="stat-item">
                            <label className="stat-label">Límite Máximo de Usuarios</label>
                            <input
                                type="number"
                                className="graph-search-input"
                                name="extraction_max_users"
                                value={settings.extraction_max_users}
                                onChange={handleChange}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            />
                        </div>
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="grid-dashboard" style={{ gridTemplateColumns: '1fr' }}>
                        <div className="stat-item">
                            <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserMinus size={14} className="text-accent-tertiary" />
                                Lista de Excepciones (Emails)
                            </label>
                            <textarea
                                className="graph-search-input"
                                name="excluded_users"
                                value={settings.excluded_users}
                                onChange={handleChange}
                                placeholder="usuario1@empresa.com, usuario2@empresa.com"
                                style={{ width: '100%', marginTop: '0.5rem', minHeight: '80px', fontFamily: 'monospace' }}
                            />
                        </div>
                        <div className="stat-item">
                            <label className="stat-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <UserCheck size={14} className="text-accent" />
                                Usuarios Obligatorios (Emails)
                            </label>
                            <textarea
                                className="graph-search-input"
                                name="mandatory_users"
                                value={settings.mandatory_users}
                                onChange={handleChange}
                                placeholder="ceo@empresa.com, cto@empresa.com"
                                style={{ width: '100%', marginTop: '0.5rem', minHeight: '80px', fontFamily: 'monospace' }}
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(240, 136, 62, 0.1)', padding: '1rem', borderRadius: '4px', border: '1px solid rgba(240, 136, 62, 0.2)' }}>
                            <AlertCircle className="text-accent-tertiary" />
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                Los cambios en los filtros de usuarios y periodos requerirán una nueva ejecución del motor de ingesta (Cerebro) para verse reflejados.
                            </p>
                        </div>
                    </div>
                )}

                <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button
                        type="submit"
                        className="graph-search-btn"
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 2rem' }}
                    >
                        <Save size={18} />
                        {saving ? 'Guardando...' : 'Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;

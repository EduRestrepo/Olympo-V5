import React, { useState, useEffect } from 'react';
import analyticsApi from '../../services/analyticsApi'; // Assuming this has a generic 'get' or I can add getSystemStatus

const IngestionProgress = () => {
    const [status, setStatus] = useState(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        let intervalId;

        const checkStatus = async () => {
            try {
                // We'll need to add this method to analyticsApi or fetch directly
                const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8000'}/api/system/status`);
                const data = await response.json();

                setStatus(data);

                if (data.status === 'Running') {
                    setVisible(true);
                } else {
                    // Hide after a delay if it WAS running
                    if (visible && data.progress === 100) {
                        setTimeout(() => setVisible(false), 5000);
                    } else if (data.status === 'Idle') {
                        setVisible(false);
                    }
                }
            } catch (err) {
                console.error("Failed to check system status", err);
            }
        };

        // Check immediately and then every 3 seconds
        checkStatus();
        intervalId = setInterval(checkStatus, 3000);

        return () => clearInterval(intervalId);
    }, [visible]);

    if (!visible || !status) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            background: '#161b22',
            borderBottom: '1px solid #30363d',
            zIndex: 9999,
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        }}>
            <div style={{ display: 'flex', flexDirection: 'column', width: '300px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#c9d1d9', fontWeight: 600 }}>
                        {status.status === 'Running' ? '🔄 Sincronizando datos...' : '✅ Sincronización completa'}
                    </span>
                    <span style={{ fontSize: '12px', color: '#58a6ff' }}>{status.progress}%</span>
                </div>
                <div style={{ width: '100%', height: '6px', background: 'rgba(56, 139, 253, 0.2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${status.progress}%`,
                        height: '100%',
                        background: '#238636',
                        borderRadius: '3px',
                        transition: 'width 0.5s ease-out'
                    }} />
                </div>
            </div>
            <div style={{ fontSize: '11px', color: '#8b949e', borderLeft: '1px solid #30363d', paddingLeft: '16px' }}>
                {status.message}
            </div>
        </div>
    );
};

export default IngestionProgress;

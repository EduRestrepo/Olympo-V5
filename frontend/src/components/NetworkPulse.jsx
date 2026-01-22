import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '../services/api';
import { Activity } from 'lucide-react';

export default function NetworkPulse() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.getNetworkPulse().then(res => {
            if (res) setData(res);
        });
    }, []);

    return (
        <div className="card animate-in" style={{ animationDelay: '300ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <div className="animate-pulse-heart">
                        <Activity size={20} className="text-blue-500" />
                    </div>
                    Pulso de la Red
                </div>
            </div>
            <div className="split-cols">
                <div style={{ height: 250 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <defs>
                                <linearGradient id="colorPulse" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#58a6ff" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
                            <XAxis dataKey="date" hide />
                            <YAxis stroke="#8b949e" />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#161b22', borderColor: '#30363d', borderRadius: '8px', border: '1px solid #30363d' }}
                                itemStyle={{ color: '#58a6ff' }}
                            />
                            <Line
                                type="monotone"
                                dataKey="value"
                                stroke="#58a6ff"
                                strokeWidth={4}
                                dot={false}
                                activeDot={{ r: 6, fill: '#58a6ff', stroke: '#fff', strokeWidth: 2 }}
                                isAnimationActive={true}
                                animationDuration={2000}
                                animationEasing="ease-in-out"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6' }}>
                        Mide la <strong>salud vital</strong> de la comunicación. Evalúa la densidad de conexiones,
                        la agilidad de respuesta y la estabilidad de los flujos de información en tiempo real.
                        Un pulso alto indica una organización altamente conectada y dinámica.
                    </p>
                </div>
            </div>
        </div>
    );
}

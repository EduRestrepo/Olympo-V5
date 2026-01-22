import { useState, useEffect } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { api } from '../services/api';
import { Scale } from 'lucide-react';

const COLORS = ['#58a6ff', '#a371f7', '#3fb950', '#d29922', '#f85149', '#8b949e'];

const CustomizedContent = (props) => {
    const { root, depth, x, y, width, height, index, name, value, badge } = props;

    return (
        <g>
            <rect
                x={x}
                y={y}
                width={width}
                height={height}
                style={{
                    fill: COLORS[index % COLORS.length],
                    stroke: '#0d1117',
                    strokeWidth: 2 / (depth + 1),
                    strokeOpacity: 1 / (depth + 1),
                }}
            />
            {width > 50 && height > 30 && (
                <text
                    x={x + width / 2}
                    y={y + height / 2 + 7}
                    textAnchor="middle"
                    fill="#fff"
                    fontSize={14}
                    fontWeight="bold"
                >
                    {name} {badge}
                </text>
            )}
        </g>
    );
};

export default function PowerBalance() {
    const [data, setData] = useState([]);

    useEffect(() => {
        api.getBalancePower().then(res => {
            if (res) {
                // Backend sends badge icons as 'name'. We map them to titles.
                const treeData = res.map(item => {
                    const title = getTitleByBadge(item.name);
                    return {
                        ...item,
                        title: title,
                        badge: item.name, // item.name is already the icon '♚'
                        displayName: `${item.name} ${title}`
                    };
                });
                setData(treeData);
            }
        });
    }, []);

    const totalValue = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="card animate-in" style={{ animationDelay: '200ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <Scale size={20} />
                    Balance de Poder (Influencia por Rol)
                </div>
            </div>
            <div className="grid-2-cols" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.5fr) 1fr', gap: '1.5rem', alignItems: 'center' }}>
                <div style={{ height: 320, width: '100%', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '10px' }}>
                    <ResponsiveContainer>
                        <Treemap
                            data={data}
                            dataKey="value"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            fill="#8884d8"
                            content={<CustomizedContent />}
                        >
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const item = payload[0].payload;
                                        const percent = ((item.value / totalValue) * 100).toFixed(1);
                                        return (
                                            <div className="tooltip-custom" style={{ backgroundColor: '#161b22', border: '1px solid #30363d', padding: '10px', borderRadius: '4px' }}>
                                                <p style={{ margin: 0, fontWeight: 'bold', color: COLORS[payload[0].index % COLORS.length] }}>{item.displayName}</p>
                                                <p style={{ margin: '5px 0 0', color: '#8b949e', fontSize: '0.85rem' }}>Peso en la Red: {percent}%</p>
                                                <p style={{ margin: '2px 0 0', color: '#e6edf3', fontSize: '0.9rem' }}>Score Acumulado: {Math.round(item.value)}</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                        </Treemap>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3 style={{ color: 'var(--text-main)', marginBottom: '1rem', fontSize: '1.2rem' }}>Distribución de Influencia</h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: '1.6', fontSize: '0.95rem' }}>
                        Este <strong>Treemap</strong> visualiza el peso relativo de cada rol en la organización. El área de cada bloque es proporcional a la influencia acumulada.
                    </p>
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {data.map((item, idx) => (
                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', alignItems: 'center', padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color: COLORS[idx % COLORS.length], display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.2rem' }}>{item.badge}</span>
                                    {item.title}
                                </span>
                                <span style={{ color: 'var(--text-muted)', fontWeight: 'bold' }}>{((item.value / totalValue) * 100).toFixed(1)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getTitleByBadge(badge) {
    const titles = { '♚': 'Formales', '♛': 'Estratega', '♜': 'Conector', '♞': 'Exploradores', '♗': 'Guía', '♙': 'Colaborador' };
    return titles[badge] || 'Actor';
}

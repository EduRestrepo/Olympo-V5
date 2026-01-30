import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Crown, Trophy, Activity, Medal, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function TopInfluencers({ onSelectActor, isAnonymous }) {
    const [data, setData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        api.getTopInfluencers().then(res => {
            if (res) {
                setData(res);
                setFilteredData(res);
            }
        });
    }, []);

    useEffect(() => {
        const results = data.filter(actor =>
            actor.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredData(results);
        setCurrentPage(1); // Reset to page 1 on search
    }, [searchTerm, data]);

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    const handleExportPDF = () => {
        const doc = new jsPDF();
        doc.text("Top Influyentes - Olympo", 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleDateString()}`, 14, 22);

        const tableColumn = ["Rank", "Nombre", "Unified Score", "Badge", "Volumen (Email)", "Volumen (Teams)", "Respuesta Avg", "Canal"];
        const tableRows = [];

        filteredData.forEach(actor => {
            const displayName = isAnonymous ? `Actor ${actor.id}` : actor.name;
            const actorData = [
                actor.rank,
                displayName,
                actor.unified_score,
                actor.badge,
                Math.round(actor.total_volume),
                actor.teams_metrics ? actor.teams_metrics.total_meetings : 0,
                actor.avg_response_formatted,
                actor.dominant_channel
            ];
            tableRows.push(actorData);
        });

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 25,
        });

        doc.save("olympo_influencers.pdf");
    };

    return (
        <div className="card animate-in" style={{ animationDelay: '0ms' }}>
            <div className="card-header">
                <div className="card-title">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Top Influyentes
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div className="search-container" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={16} style={{ position: 'absolute', left: '8px', color: '#8b949e' }} />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                background: '#0d1117',
                                border: '1px solid #30363d',
                                borderRadius: '4px',
                                padding: '4px 8px 4px 30px',
                                color: 'white',
                                fontSize: '0.85rem'
                            }}
                        />
                    </div>
                    <button onClick={handleExportPDF} title="Exportar PDF" style={{ background: 'transparent', border: '1px solid #30363d', color: 'var(--text-main)', padding: '4px 8px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Download size={16} /> PDF
                    </button>
                </div>
            </div>

            <div style={{ overflowX: 'auto', minHeight: '300px' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Nombre</th>
                            <th>Unified Score</th>
                            <th>Badge</th>
                            <th>Volumen (Email)</th>
                            <th>Volumen (Teams)</th>
                            <th>Respuesta Avg</th>
                            <th>Canal</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.map((actor) => {
                            const displayName = isAnonymous ? `Actor ${actor.id}` : actor.name;
                            return (
                                <tr
                                    key={actor.id}
                                    onClick={() => onSelectActor(actor)}
                                    style={{ cursor: 'pointer', transition: 'background 0.2s' }}
                                    className="hover-row"
                                >
                                    <td style={{ fontWeight: 'bold', color: actor.rank <= 3 ? '#ecbdfc' : 'inherit' }}>
                                        #{actor.rank}
                                    </td>
                                    <td style={{ fontWeight: 500 }}>{displayName}</td>
                                    <td>
                                        <span style={{
                                            display: 'inline-block',
                                            padding: '2px 10px',
                                            borderRadius: '12px',
                                            background: `rgba(88, 166, 255, ${actor.unified_score / 100 * 0.4})`,
                                            border: '1px solid rgba(88, 166, 255, 0.3)',
                                            color: '#fff',
                                            fontWeight: 600
                                        }}>
                                            {actor.unified_score || 0}
                                        </span>
                                    </td>
                                    <td style={{ fontSize: '1.2em' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span className={`badge-animated ${actor.rank <= 3 ? 'badge-fast' : 'badge-slow'}`}>{actor.badge}</span>
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                                                {getBadgeTitle(actor.badge)}
                                            </span>
                                        </span>
                                    </td>
                                    <td>{Math.round(actor.total_volume)}</td>
                                    <td>{actor.teams_metrics ? actor.teams_metrics.total_meetings : 0}</td>
                                    <td>{actor.avg_response_formatted}</td>
                                    <td>
                                        <span style={{
                                            textTransform: 'capitalize',
                                            color: actor.dominant_channel === 'Teams' ? 'var(--accent-secondary)' : 'var(--accent-primary)',
                                            fontSize: '0.8rem'
                                        }}>
                                            {actor.dominant_channel || '-'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        {currentItems.length === 0 && (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    No se encontraron resultados
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem', gap: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        style={{ background: 'transparent', border: 'none', color: currentPage === 1 ? '#444' : 'var(--accent-primary)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                        Página {currentPage} de {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        style={{ background: 'transparent', border: 'none', color: currentPage === totalPages ? '#444' : 'var(--accent-primary)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}

function getBadgeTitle(badge) {
    const titles = { '♚': 'Formales', '♛': 'Estratega', '♜': 'Conector', '♞': 'Exploradores', '♗': 'Guía', '♙': 'Colaborador' };
    return titles[badge] || 'Actor';
}

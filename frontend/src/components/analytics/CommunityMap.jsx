import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Filter, X, ZoomIn, ZoomOut, Maximize, Users, ChevronLeft, ChevronRight } from 'lucide-react';

const CommunityMap = ({ communities }) => {
    const svgRef = useRef(null);
    const [visibleCommunities, setVisibleCommunities] = useState({});
    const [showFilter, setShowFilter] = useState(false);
    const [selectedNode, setSelectedNode] = useState(null);
    const [memberPage, setMemberPage] = useState(0);

    const MEMBERS_PER_PAGE = 10;

    // Reset page when node changes
    useEffect(() => {
        setMemberPage(0);
    }, [selectedNode]);

    // Initialize standard colors
    const communityColors = d3.scaleOrdinal(d3.schemeTableau10);

    // Initialize visibility state when data loads
    useEffect(() => {
        if (communities && communities.length > 0) {
            const initialVisibility = {};
            communities.forEach(c => {
                initialVisibility[c.name] = true;
            });
            setVisibleCommunities(prev => Object.keys(prev).length === 0 ? initialVisibility : prev);
        }
    }, [communities]);

    const toggleCommunity = (name) => {
        setVisibleCommunities(prev => ({ ...prev, [name]: !prev[name] }));
    };

    const toggleAll = (show) => {
        const newVisibility = {};
        communities.forEach(c => { newVisibility[c.name] = show; });
        setVisibleCommunities(newVisibility);
    };

    const zoomBehaviorRef = useRef(null);
    const zoomSelectionRef = useRef(null);

    useEffect(() => {
        if (!communities || communities.length === 0) return;

        const width = 800;
        const height = 600;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "transparent");

        const container = svg.append("g");

        // Zoom capability
        const zoom = d3.zoom()
            .scaleExtent([0.1, 8])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        svg.call(zoom);
        zoomBehaviorRef.current = zoom;
        zoomSelectionRef.current = svg;

        // --- Data Preparation with Aggregation ---

        // 1. Filter visible communities
        // 2. Aggregate by name to prevent duplicates
        const aggregated = {};

        communities.forEach(comm => {
            if (visibleCommunities[comm.name] === false) return;

            if (!aggregated[comm.name]) {
                aggregated[comm.name] = {
                    name: comm.name,
                    members: [],
                    description: comm.description,
                    color: communityColors(comm.name)
                };
            }
            // Merge members
            aggregated[comm.name].members = [...aggregated[comm.name].members, ...comm.members];
        });

        // 3. Create nodes from aggregated data
        const nodes = Object.values(aggregated).map((comm, i) => {
            // Deduplicate members by actor_id just in case
            const uniqueMembers = Array.from(new Map(comm.members.map(m => [m.actor_id, m])).values());

            return {
                id: comm.name,
                name: comm.name,
                active_members: uniqueMembers.length,
                members: uniqueMembers, // Store for overlay details
                value: uniqueMembers.length,
                description: comm.description,
                color: comm.color,
                group: i,
                x: width / 2 + (Math.random() - 0.5) * 50,
                y: height / 2 + (Math.random() - 0.5) * 50
            };
        });

        // --- Simulation ---

        const simulation = d3.forceSimulation(nodes)
            .force("charge", d3.forceManyBody().strength(50))
            .force("collide", d3.forceCollide().radius(d => Math.sqrt(d.value) * 15 + 20).strength(0.7).iterations(3))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("y", d3.forceY(height / 2).strength(0.05))
            .force("x", d3.forceX(width / 2).strength(0.05));

        // --- Rendering ---

        const nodeGroup = container.append("g")
            .attr("class", "nodes")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation));

        // Node Circles
        nodeGroup.append("circle")
            .attr("r", d => Math.sqrt(d.value) * 15)
            .attr("fill", d => d.color)
            .attr("stroke", "rgba(255,255,255,0.4)")
            .attr("stroke-width", 2)
            .style("cursor", "pointer")
            .style("filter", "drop-shadow(0px 4px 6px rgba(0,0,0,0.3))")
            .on("click", (event, d) => {
                event.stopPropagation();
                setSelectedNode(d);
            })
            .transition().duration(800)
            .attrTween("r", d => {
                const i = d3.interpolate(0, Math.sqrt(d.value) * 15);
                return t => i(t);
            });

        // Community Name Label
        nodeGroup.append("text")
            .text(d => d.name)
            .attr("text-anchor", "middle")
            .attr("dy", -5)
            .style("fill", "#fff")
            .style("font-size", d => Math.min(24, Math.max(14, Math.sqrt(d.value) * 3)) + "px")
            .style("font-weight", "bold")
            .style("pointer-events", "none")
            .style("text-shadow", "0 2px 4px rgba(0,0,0,0.8)");

        // Member Count Label
        nodeGroup.append("text")
            .text(d => `${d.value} Miembros`)
            .attr("text-anchor", "middle")
            .attr("dy", 20)
            .style("fill", "rgba(255,255,255,0.9)")
            .style("font-size", d => Math.min(16, Math.max(10, Math.sqrt(d.value) * 2)) + "px")
            .style("pointer-events", "none");

        // --- Ticker ---
        simulation.on("tick", () => {
            nodeGroup.attr("transform", d => `translate(${d.x},${d.y})`);
        });

        // Helper: auto-zoom to fit on load
        setTimeout(() => {
            if (!container.node()) return;
            const bounds = container.node().getBBox();
            if (bounds.width === 0) return;

            const fullWidth = width;
            const fullHeight = height;
            const scale = 0.8 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
            const translate = [
                fullWidth / 2 - scale * (bounds.x + bounds.width / 2),
                fullHeight / 2 - scale * (bounds.y + bounds.height / 2)
            ];

            svg.transition().duration(1000).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        }, 800);

        function drag(simulation) {
            function dragstarted(event) {
                if (!event.active) simulation.alphaTarget(0.3).restart();
                event.subject.fx = event.subject.x;
                event.subject.fy = event.subject.y;
            }
            function dragged(event) {
                event.subject.fx = event.x;
                event.subject.fy = event.y;
            }
            function dragended(event) {
                if (!event.active) simulation.alphaTarget(0);
                event.subject.fx = null;
                event.subject.fy = null;
            }
            return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
        }

        return () => simulation.stop();
    }, [communities, visibleCommunities]);


    // Helper for insights
    const getTopDepartment = (members) => {
        if (!members || members.length === 0) return 'N/A';
        const counts = {};
        members.forEach(m => {
            const dept = m.department || 'Desconocido';
            counts[dept] = (counts[dept] || 0) + 1;
        });
        return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    };

    return (
        <div className="community-map-container" style={{ position: 'relative', width: '100%', height: '600px', background: 'radial-gradient(circle at center, #1b2028 0%, #0d1117 100%)', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(48, 54, 61, 0.5)' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%', cursor: 'grab' }} onMouseDown={(e) => e.target.style.cursor = 'grabbing'} onMouseUp={(e) => e.target.style.cursor = 'grab'}></svg>

            {/* Controls Overlay */}
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                    onClick={() => setShowFilter(!showFilter)}
                    style={{
                        background: showFilter ? '#1f6feb' : '#21262d',
                        border: '1px solid rgba(240,246,252,0.1)',
                        color: '#c9d1d9',
                        width: 32, height: 32,
                        borderRadius: 6,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                    title="Filtrar Comunidades"
                >
                    <Filter size={16} />
                </button>
            </div>

            <div style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 8 }}>
                <button
                    onClick={() => zoomSelectionRef.current && zoomSelectionRef.current.transition().duration(500).call(zoomBehaviorRef.current.scaleBy, 1.3)}
                    className="map-control-btn"
                    style={{ background: '#21262d', border: '1px solid rgba(240,246,252,0.1)', color: '#c9d1d9', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <ZoomIn size={16} />
                </button>
                <button
                    onClick={() => zoomSelectionRef.current && zoomSelectionRef.current.transition().duration(500).call(zoomBehaviorRef.current.scaleBy, 0.7)}
                    className="map-control-btn"
                    style={{ background: '#21262d', border: '1px solid rgba(240,246,252,0.1)', color: '#c9d1d9', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <ZoomOut size={16} />
                </button>
                <button
                    onClick={() => zoomSelectionRef.current && zoomSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity)}
                    className="map-control-btn"
                    style={{ background: '#21262d', border: '1px solid rgba(240,246,252,0.1)', color: '#c9d1d9', width: 32, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                    <Maximize size={16} />
                </button>
            </div>

            {/* Filter Panel */}
            {showFilter && (
                <div style={{
                    position: 'absolute', top: 60, right: 20,
                    background: 'rgba(22, 27, 34, 0.95)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid #30363d',
                    borderRadius: '8px', padding: '16px',
                    width: '260px', maxHeight: '400px', overflowY: 'auto',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    zIndex: 20
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h4 style={{ margin: 0, color: '#f0f6fc', fontSize: '13px', fontWeight: 600 }}>Comunidades Activas</h4>
                        <button onClick={() => setShowFilter(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                        <button
                            onClick={() => toggleAll(true)}
                            style={{ flex: 1, padding: '4px', fontSize: '11px', background: 'rgba(35, 134, 54, 0.2)', border: '1px solid #238636', borderRadius: '4px', color: '#3fb950', cursor: 'pointer' }}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => toggleAll(false)}
                            style={{ flex: 1, padding: '4px', fontSize: '11px', background: 'rgba(33, 38, 45, 0.5)', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', cursor: 'pointer' }}
                        >
                            Ninguna
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Unique names for filter */}
                        {Array.from(new Set(communities.map(c => c.name))).map((name) => {
                            const color = communityColors(name);
                            return (
                                <label key={name} style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#c9d1d9', fontSize: '12px', cursor: 'pointer', padding: '4px', borderRadius: '4px', transition: 'background 0.2s', userSelect: 'none' }} className="filter-item">
                                    <input
                                        type="checkbox"
                                        checked={visibleCommunities[name] !== false}
                                        onChange={() => toggleCommunity(name)}
                                        style={{ accentColor: color }}
                                    />
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }}></span>
                                    <span style={{ flex: 1 }}>{name}</span>
                                </label>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Selected Node Details Overlay */}
            {selectedNode && (
                <div style={{
                    position: 'absolute', bottom: 20, left: 20,
                    background: 'rgba(22, 27, 34, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid #30363d',
                    borderRadius: '8px', padding: '16px',
                    width: '350px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    zIndex: 25,
                    animation: 'fadeIn 0.2s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 44, height: 44, borderRadius: '8px', background: selectedNode.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 'bold', color: '#fff' }}>
                                <Users size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', color: '#f0f6fc' }}>{selectedNode.name}</h3>
                                <p style={{ margin: 0, fontSize: '12px', color: '#8b949e' }}>{selectedNode.active_members} Miembros</p>
                            </div>
                        </div>
                        <button onClick={() => setSelectedNode(null)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}><X size={18} /></button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '10px', color: '#8b949e', textTransform: 'uppercase' }}>Depto Principal</div>
                            <div style={{ color: '#fff', fontSize: '13px', fontWeight: 600, truncate: true }}>{getTopDepartment(selectedNode.members)}</div>
                        </div>
                        <div style={{ background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px' }}>
                            <div style={{ fontSize: '10px', color: '#8b949e', textTransform: 'uppercase' }}>Densidad</div>
                            <div style={{ color: '#3fb950', fontSize: '13px', fontWeight: 600 }}>Alta</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: 8 }}>
                        <h4 style={{ fontSize: '12px', color: '#8b949e', marginBottom: 8, borderBottom: '1px solid #30363d', paddingBottom: 4 }}>Miembros ({selectedNode.members.length})</h4>

                        {selectedNode.members.length > 0 ? (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minHeight: '200px' }}>
                                    {selectedNode.members
                                        .slice(memberPage * MEMBERS_PER_PAGE, (memberPage + 1) * MEMBERS_PER_PAGE)
                                        .map((member, idx) => (
                                            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px', background: member.is_core_member ? 'rgba(56, 139, 253, 0.1)' : 'transparent', borderRadius: '4px', fontSize: '12px', borderLeft: member.is_core_member ? '2px solid #388bfd' : 'none' }}>
                                                <span style={{ color: '#c9d1d9' }}>{member.actor_name}</span>
                                                <span style={{ color: '#8b949e', fontSize: '11px' }}>{member.department}</span>
                                            </div>
                                        ))}
                                </div>

                                {selectedNode.members.length > MEMBERS_PER_PAGE && (
                                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12, alignItems: 'center' }}>
                                        <button
                                            onClick={() => setMemberPage(p => Math.max(0, p - 1))}
                                            disabled={memberPage === 0}
                                            style={{ background: 'none', border: 'none', color: memberPage === 0 ? '#484f58' : '#58a6ff', cursor: memberPage === 0 ? 'default' : 'pointer' }}
                                        >
                                            <ChevronLeft size={16} />
                                        </button>
                                        <span style={{ fontSize: '11px', color: '#8b949e' }}>
                                            {memberPage + 1} / {Math.ceil(selectedNode.members.length / MEMBERS_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={() => setMemberPage(p => Math.min(Math.ceil(selectedNode.members.length / MEMBERS_PER_PAGE) - 1, p + 1))}
                                            disabled={memberPage >= Math.ceil(selectedNode.members.length / MEMBERS_PER_PAGE) - 1}
                                            style={{ background: 'none', border: 'none', color: memberPage >= Math.ceil(selectedNode.members.length / MEMBERS_PER_PAGE) - 1 ? '#484f58' : '#58a6ff', cursor: memberPage >= Math.ceil(selectedNode.members.length / MEMBERS_PER_PAGE) - 1 ? 'default' : 'pointer' }}
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div style={{ padding: '20px', textAlign: 'center', color: '#8b949e', fontSize: '12px' }}>
                                No hay miembros visibles
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CommunityMap;

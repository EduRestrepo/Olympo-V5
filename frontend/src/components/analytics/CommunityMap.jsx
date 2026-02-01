import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Filter, X } from 'lucide-react';

const CommunityMap = ({ communities }) => {
    const svgRef = useRef(null);
    const [visibleCommunities, setVisibleCommunities] = useState({});
    const [showFilter, setShowFilter] = useState(false);

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

    useEffect(() => {
        if (!communities || communities.length === 0) return;

        const width = 800;
        const height = 500;

        // Filter data
        const activeCommunities = communities.filter(c => visibleCommunities[c.name] !== false);

        // Prepare data for D3
        const nodes = [];
        const links = [];
        // const communityColors = d3.scaleOrdinal(d3.schemeTableau10); // Removed local decl

        communities.forEach((comm, commIdx) => {
            if (!comm.members || !Array.isArray(comm.members)) {
                console.warn('CommunityMap: Invalid members for community', comm);
                return;
            }
            // Use consistent color based on name/index
            const color = communityColors(comm.name);
            comm.members.forEach((member, memberIdx) => {
                nodes.push({
                    id: member.actor_id,
                    name: member.actor_name || 'Unknown',
                    department: member.department,
                    community: comm.name,
                    color: color,
                    isCore: member.is_core_member
                });

                // Link to some other members of the same community to keep them together
                if (memberIdx > 0) {
                    links.push({
                        source: comm.members[0].actor_id,
                        target: member.actor_id,
                        value: 1
                    });
                }
            });
        });

        console.log('CommunityMap: Nodes:', nodes.length, 'Links:', links.length);
        if (nodes.length === 0) return;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current)
            .attr("viewBox", [0, 0, width, height])
            .style("background", "transparent");

        const container = svg.append("g");

        // Zoom capability
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on("zoom", (event) => {
                container.attr("transform", event.transform);
            });

        svg.call(zoom);

        // Store refs for external control
        zoomBehaviorRef.current = zoom;
        zoomSelectionRef.current = svg;

        const simulation = d3.forceSimulation(nodes)
            .force("link", d3.forceLink(links).id(d => d.id).distance(50))
            .force("charge", d3.forceManyBody().strength(-150))
            .force("center", d3.forceCenter(width / 2, height / 2))
            .force("collision", d3.forceCollide().radius(25));

        // Aufo-fit bounds after simulation settles
        setTimeout(() => {
            if (!container.node()) return;
            const bounds = container.node().getBBox();
            const fullWidth = width;
            const fullHeight = height;

            if (bounds.width === 0 || bounds.height === 0) return;

            const midX = bounds.x + bounds.width / 2;
            const midY = bounds.y + bounds.height / 2;
            const scale = 0.85 / Math.max(bounds.width / fullWidth, bounds.height / fullHeight);
            const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];

            svg.transition().duration(1000).call(
                zoom.transform,
                d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale)
            );
        }, 1200);

        const link = container.append("g")
            .attr("stroke", "rgba(255,255,255,0.1)")
            .selectAll("line")
            .data(links)
            .join("line");

        const node = container.append("g")
            .selectAll("g")
            .data(nodes)
            .join("g")
            .call(drag(simulation));

        node.append("circle")
            .attr("r", d => d.isCore ? 12 : 8)
            .attr("fill", d => d.color)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1.5);

        node.append("text")
            .text(d => d.name)
            .attr("x", 12)
            .attr("y", 4)
            .style("fill", "#fff")
            .style("font-size", "10px")
            .style("pointer-events", "none")
            .style("text-shadow", "0 1px 2px rgba(0,0,0,0.8)");

        // Tooltip simple
        node.append("title")
            .text(d => `${d.name}\nDPTO: ${d.department}\n${d.community}`);

        simulation.on("tick", () => {
            link
                .attr("x1", d => d.source.x)
                .attr("y1", d => d.source.y)
                .attr("x2", d => d.target.x)
                .attr("y2", d => d.target.y);

            node.attr("transform", d => `translate(${d.x},${d.y})`);
        });

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

    // We need a ref to store the d3 Zoom behavior to use it in buttons
    const zoomBehaviorRef = useRef(null);
    const zoomSelectionRef = useRef(null);

    // This replacement handles the new structure
    return (
        <div className="community-map-container" style={{ position: 'relative', width: '100%', height: '500px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden' }}>
            <svg ref={svgRef} style={{ width: '100%', height: '100%' }}></svg>

            {/* Filter Toggle Button */}
            <button
                onClick={() => setShowFilter(!showFilter)}
                style={{
                    position: 'absolute', top: '20px', left: '20px',
                    background: '#21262d', border: '1px solid #30363d',
                    color: '#c9d1d9', padding: '8px', borderRadius: '6px',
                    cursor: 'pointer', zIndex: 20
                }}
                title="Filtrar Comunidades"
            >
                <Filter size={16} />
            </button>

            {/* Filter Panel */}
            {showFilter && (
                <div style={{
                    position: 'absolute', top: '60px', left: '20px',
                    background: '#161b22', border: '1px solid #30363d',
                    borderRadius: '8px', padding: '12px', zIndex: 20,
                    width: '250px', maxHeight: '350px', overflowY: 'auto',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                        <h4 style={{ margin: 0, color: '#fff', fontSize: '14px' }}>Comunidades</h4>
                        <button onClick={() => setShowFilter(false)} style={{ background: 'none', border: 'none', color: '#8b949e', cursor: 'pointer' }}>
                            <X size={14} />
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                        <button
                            onClick={() => toggleAll(true)}
                            style={{ flex: 1, padding: '4px', fontSize: '11px', background: '#238636', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer' }}
                        >
                            Todas
                        </button>
                        <button
                            onClick={() => toggleAll(false)}
                            style={{ flex: 1, padding: '4px', fontSize: '11px', background: '#21262d', border: '1px solid #30363d', borderRadius: '4px', color: '#c9d1d9', cursor: 'pointer' }}
                        >
                            Ninguna
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {communities.map((comm) => (
                            <label key={comm.name} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#c9d1d9', fontSize: '12px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleCommunities[comm.name] !== false}
                                    onChange={() => toggleCommunity(comm.name)}
                                />
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: communityColors(comm.name), display: 'inline-block' }}></span>
                                {comm.name} <span style={{ color: '#8b949e' }}>({comm.members.length})</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            <div className="map-controls" style={{ position: 'absolute', bottom: '20px', right: '20px', display: 'flex', gap: '8px', zIndex: 10 }}>
                <button
                    onClick={() => {
                        if (zoomSelectionRef.current && zoomBehaviorRef.current) {
                            zoomSelectionRef.current.transition().duration(750).call(zoomBehaviorRef.current.transform, d3.zoomIdentity);
                        }
                    }}
                    style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                    title="Centrar"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                </button>
                <button
                    onClick={() => {
                        if (zoomSelectionRef.current && zoomBehaviorRef.current) {
                            zoomSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 1.2);
                        }
                    }}
                    style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                    title="Zoom In"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
                <button
                    onClick={() => {
                        if (zoomSelectionRef.current && zoomBehaviorRef.current) {
                            zoomSelectionRef.current.transition().duration(300).call(zoomBehaviorRef.current.scaleBy, 0.8);
                        }
                    }}
                    style={{ background: '#21262d', border: '1px solid #30363d', color: '#c9d1d9', padding: '8px', borderRadius: '6px', cursor: 'pointer' }}
                    title="Zoom Out"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </button>
            </div>
        </div>
    );
};

export default CommunityMap;

'use client';

import { useCallback, useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  NodeTypes,
  EdgeTypes,
  Panel,
  useReactFlow,
  BackgroundVariant
} from 'reactflow';
import 'reactflow/dist/style.css';
import Link from 'next/link';

import NetworkNode from './NetworkNode';
import SiteHeaderNode from './SiteHeaderNode';
import OrthogonalVpnEdge from './OrthogonalVpnEdge';
import OrthogonalTrunkEdge from './OrthogonalTrunkEdge';
import OrthogonalSanEdge from './OrthogonalSanEdge';
import OrthogonalConnectionEdge from './OrthogonalConnectionEdge';
import { parseNetworkConfig } from '../utils/network-parser';

// Define custom node types
const nodeTypes: NodeTypes = {
  networkNode: NetworkNode,
  siteHeader: SiteHeaderNode, // Use dedicated component for site headers
};

// Define custom edge types
const edgeTypes: EdgeTypes = {
  vpnEdge: OrthogonalVpnEdge, // Custom VPN edge type with right-angled routing
  trunkEdge: OrthogonalTrunkEdge, // Custom Trunk edge type with right-angled routing
  sanEdge: OrthogonalSanEdge, // Custom SAN edge type with right-angled routing
  connectionEdge: OrthogonalConnectionEdge, // Custom standard connection edge with right-angled routing
};

interface NetworkMapProps {
  yamlContent: string;
  isAdmin?: boolean;
}

// Toolbar component with device search
const NetworkToolbar = ({ 
  nodes, 
  onSearch, 
  onZoomToFit, 
  onSiteSelect 
}: { 
  nodes: Node[]; 
  onSearch: (id: string) => void;
  onZoomToFit: () => void;
  onSiteSelect: (siteId: string) => void;
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string, label: string, type?: string }[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Extract site information from nodes
  const sites = useMemo(() => {
    const siteMap = new Map<string, string>();
    
    nodes.forEach(node => {
      if (node.data?.siteId && node.id.startsWith('site-') && node.id.endsWith('-header')) {
        const siteId = node.data.siteId;
        siteMap.set(siteId, node.data.label);
      }
    });
    
    return Array.from(siteMap.entries()).map(([id, name]) => ({ id, name }));
  }, [nodes]);

  // Handle search input
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);
    
    if (!term) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }
    
    // Filter nodes based on search term
    const results = nodes
      .filter(node => 
        node.type === 'networkNode' && 
        (node.data?.label?.toLowerCase().includes(term) || 
         node.data?.ip?.toLowerCase().includes(term))
      )
      .map(node => ({
        id: node.id,
        label: node.data.label,
        type: node.data.type
      }))
      .slice(0, 8); // Limit to prevent too many results
    
    setSearchResults(results);
    setShowResults(true);
  };
  
  const handleResultClick = (nodeId: string) => {
    onSearch(nodeId);
    setSearchTerm('');
    setSearchResults([]);
    setShowResults(false);
  };
  
  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowResults(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);
  
  return (
    <div className="absolute top-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 flex flex-col gap-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search devices..."
          value={searchTerm}
          onChange={handleSearchChange}
          onClick={e => e.stopPropagation()}
          className="w-64 px-3 py-2 border rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
        />
        
        {/* Search results dropdown */}
        {showResults && searchResults.length > 0 && (
          <div 
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg overflow-hidden z-50"
            onClick={e => e.stopPropagation()}
          >
            {searchResults.map(result => (
              <div
                key={result.id}
                className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer flex items-center"
                onClick={() => handleResultClick(result.id)}
              >
                <span className="mr-2">
                  {result.type === 'router' ? '🌐' :
                   result.type === 'switch' ? '🔀' :
                   result.type === 'firewall' ? '🛡️' :
                   result.type === 'server' ? '🖥️' :
                   result.type === 'hypervisor' ? '🖥️🖥️' :
                   result.type === 'vpn' ? '🔒' :
                   result.type === 'storage' ? '💾' : '📌'}
                </span>
                <span className="text-sm font-medium dark:text-white">{result.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Site filters */}
      <div className="flex flex-wrap gap-1">
        {sites.map(site => (
          <button
            key={site.id}
            onClick={() => onSiteSelect(site.id)}
            className={`text-xs px-2 py-1 rounded ${
              site.id.startsWith('main') ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200' :
              site.id.startsWith('data') ? 'bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900 dark:text-green-200' :
              'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-200'
            }`}
          >
            {site.name}
          </button>
        ))}
      </div>
      
      {/* Zoom to fit button */}
      <button
        onClick={onZoomToFit}
        className="flex items-center gap-1 text-sm px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 011.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
        </svg>
        Fit View
      </button>
    </div>
  );
};

const NetworkMapInner = ({ yamlContent, isAdmin = false }: NetworkMapProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
  const reactFlowInstance = useReactFlow();
  
  // Set mounted state after component mounts to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse YAML and set up nodes/edges on component mount or YAML content change
  useEffect(() => {
    const setupNetwork = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!yamlContent.trim()) {
          setNodes([]);
          setEdges([]);
          setError('No network configuration provided');
          return;
        }
        
        const { nodes: parsedNodes, edges: parsedEdges } = await parseNetworkConfig(yamlContent);
        setNodes(parsedNodes);
        setEdges(parsedEdges);
      } catch (err) {
        console.error('Error setting up network:', err);
        setError(`Failed to parse network configuration: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    setupNetwork();
  }, [yamlContent, setNodes, setEdges]);

  // Handle node selection
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    // Only process clicks on network nodes, not background or site headers
    if (node.type !== 'networkNode') return;
    
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          selected: n.id === node.id,
        },
      }))
    );
  }, [setNodes]);

  // Focus and zoom to a specific node
  const focusNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Select the node
    setNodes(nodes.map(n => ({
      ...n,
      data: {
        ...n.data,
        selected: n.id === nodeId,
      },
    })));
    
    // Center view on node with animation
    reactFlowInstance.setCenter(
      node.position.x + (node.width || 150) / 2, 
      node.position.y + (node.height || 150) / 2,
      { zoom: 1.5, duration: 800 }
    );
  }, [nodes, setNodes, reactFlowInstance]);
  
  // Zoom to fit the entire diagram
  const zoomToFit = useCallback(() => {
    reactFlowInstance.fitView({ padding: 0.2, duration: 800 });
  }, [reactFlowInstance]);
  
  // Focus on a specific site
  const focusSite = useCallback((siteId: string) => {
    // Find all nodes in the site
    const siteNodes = nodes.filter(n => n.data?.siteId === siteId);
    if (siteNodes.length === 0) return;
    
    // Find the site background node to get dimensions
    const siteBackgroundNode = nodes.find(n => n.id === `site-${siteId}-bg`);
    if (!siteBackgroundNode) return;
    
    // Calculate the center of the site
    const x = siteBackgroundNode.position.x + (siteBackgroundNode.style?.width as number || 600) / 2;
    const y = siteBackgroundNode.position.y + (siteBackgroundNode.style?.height as number || 400) / 2;
    
    // Center and zoom to the site
    reactFlowInstance.setCenter(x, y, { zoom: 0.8, duration: 800 });
  }, [nodes, reactFlowInstance]);

  if (!mounted) {
    return <div className="flex h-full items-center justify-center">Loading network diagram...</div>;
  }
  
  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading network diagram...</div>;
  }

  if (error) {
    return <div className="text-red-500 p-4">{error}</div>;
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={isAdmin ? onNodesChange : undefined} // Only allow node changes if admin
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        nodesDraggable={isAdmin} // Disable dragging for non-admins
        nodesConnectable={isAdmin} // Disable connecting for non-admins
        elementsSelectable={true} // Allow selection for info viewing
        attributionPosition="bottom-right"
        minZoom={0.2}
        maxZoom={3}
        defaultEdgeOptions={{
          type: 'connectionEdge',
          animated: false,
        }}
      >
        <Controls 
          position="bottom-right"
          showInteractive={true}
          fitViewOptions={{ padding: 0.2, duration: 800 }}
        />
        
        <Background 
          variant={BackgroundVariant.Dots}
          color="#99a8bb"
          size={1.5}
          gap={16}
        />
        
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-left"
          maskColor="rgba(0, 0, 0, 0.1)"
          nodeBorderRadius={4}
        />
        
        {/* Add network toolbar with search */}
        <NetworkToolbar 
          nodes={nodes} 
          onSearch={focusNode} 
          onZoomToFit={zoomToFit}
          onSiteSelect={focusSite}
        />
      </ReactFlow>
    </div>
  );
};

// Wrap the component with ReactFlowProvider
const NetworkMap = (props: NetworkMapProps) => (
  <ReactFlowProvider>
    <div className="h-full">
      <NetworkMapInner {...props} />
    </div>
  </ReactFlowProvider>
);

export default NetworkMap; 
'use client';

import { useCallback, useEffect, useState } from 'react';
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
  Panel
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

const NetworkMapInner = ({ yamlContent, isAdmin = false }: NetworkMapProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  
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
      >
        <Controls />
        
        <MiniMap
          nodeStrokeWidth={3}
          zoomable
          pannable
          maskColor="rgba(0, 0, 0, 0.1)"
        />
        <Background />
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
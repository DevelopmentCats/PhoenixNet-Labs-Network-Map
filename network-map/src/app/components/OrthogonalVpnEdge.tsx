'use client';

import React, { useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position } from 'reactflow';

// Custom edge component for VPN connections with smart orthogonal routing
export default function OrthogonalVpnEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  style = {},
  markerEnd,
  data,
  label,
  sourceHandleId,
  targetHandleId,
}: EdgeProps) {
  // Default style for VPN connections
  const vpnStyle = {
    stroke: '#2563eb', // Blue color
    strokeWidth: 3,
    strokeDasharray: '5,5',
    ...style
  };

  // Create a path with strictly orthogonal (right-angled) segments
  const [edgePath, labelX, labelY] = useMemo(() => {
    // Extract a deterministic offset from the edge ID
    let edgeNumber = 0;
    try {
      // Use a more stable approach for generating the edge number
      // This ensures consistency between server and client rendering
      const idSum = id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      edgeNumber = (idSum % 3);
    } catch (e) {
      // Fallback to 0 if any error occurs
      edgeNumber = 0;
    }
    
    // Calculate distances and directions
    const horizontalDistance = Math.abs(targetX - sourceX);
    const verticalDistance = Math.abs(targetY - sourceY);
    const totalDistance = horizontalDistance + verticalDistance;
    const goingRight = targetX > sourceX;
    const goingDown = targetY > sourceY;
    
    // Node dimensions - approximate to ensure clearing
    const nodeWidth = 150;
    const nodeHeight = 70;
    const nodeClearance = 20;
    
    // Calculate safe offsets to avoid nodes
    // For VPN connections, use larger offsets to ensure they stand out
    const safeHorizontalOffset = Math.max(nodeWidth / 2 + nodeClearance, 80);
    const safeVerticalOffset = Math.max(nodeHeight / 2 + nodeClearance, 50);
    
    // Stagger connections with the same source and target
    const edgeStaggerOffset = edgeNumber * 30;
    
    // Safe horizontal offset that accounts for node width and stagger
    const horizontalOffset = safeHorizontalOffset + edgeStaggerOffset;
    const verticalOffset = safeVerticalOffset + edgeStaggerOffset;
    
    // Path variables
    let path;
    
    // Special case for VPN gateway connections
    const isGatewayConnection = id.toLowerCase().includes('gateway');
    
    // For VPN connections, we should ALWAYS use orthogonal paths with proper clearance
    if (isGatewayConnection) {
      // Gateway connections need special handling
      // Use large vertical offset to ensure we go around the gateway
      const gatewayVerticalOffset = 100 + (edgeNumber * 50);
      const direction = edgeNumber % 2 === 0 ? 1 : -1;
      
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${sourceY + (direction * gatewayVerticalOffset)}
              H ${targetX}
              V ${targetY}`;
    }
    else if (Math.abs(sourceY - targetY) < safeVerticalOffset) {
      // Nodes at similar heights - create a path with a vertical detour
      // Use alternating directions based on edge number
      const direction = edgeNumber % 2 === 0 ? 1 : -1;
      const detourOffset = verticalOffset * 1.5 * direction;
      
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${sourceY + detourOffset}
              H ${targetX - horizontalOffset}
              V ${targetY}
              H ${targetX}`;
    }
    else {
      // Use middle points to create a 3-segment path
      // This ensures we have proper clearance on both sides
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${targetY}
              H ${targetX}`;
    }
    
    // Calculate label position centered on the path
    const labelPosX = (sourceX + targetX) / 2;
    const labelPosY = (sourceY + targetY) / 2 - 15 - (edgeNumber * 5);
    
    return [path, labelPosX, labelPosY];
  }, [id, sourceX, sourceY, targetX, targetY]);
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path vpn-edge-path"
        d={edgePath}
        style={vpnStyle}
        markerEnd={markerEnd}
      />
      
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              background: 'white',
              padding: '3px 6px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              color: '#2563eb',
              border: '1px solid #93c5fd',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
} 
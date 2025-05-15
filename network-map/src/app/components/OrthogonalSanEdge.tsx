'use client';

import React, { useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position } from 'reactflow';

// Custom edge component for SAN connections with orthogonal routing
export default function OrthogonalSanEdge({
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
  // Default style for SAN connections
  const sanStyle = {
    stroke: '#ea580c', // Orange color
    strokeWidth: 3,
    strokeDasharray: '10,3,3,3', // Double-dash pattern
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
    const goingRight = targetX > sourceX;
    const goingDown = targetY > sourceY;
    
    // Node dimensions - approximate to ensure clearing
    const nodeWidth = 150;
    const nodeHeight = 70;
    const nodeClearance = 15;
    
    // Calculate safe offsets to avoid nodes
    // For SAN connections, use different offsets than other types
    const safeHorizontalOffset = Math.max(nodeWidth / 2 + nodeClearance, 70);
    const safeVerticalOffset = Math.max(nodeHeight / 2 + nodeClearance, 45);
    
    // Stagger connections with the same source and target
    const edgeStaggerOffset = edgeNumber * 30;
    
    // Safe horizontal offset that accounts for node width and stagger
    const horizontalOffset = safeHorizontalOffset + edgeStaggerOffset;
    
    // Path variables
    let path;
    
    // SAN connections are often between servers and storage
    // Route them with different patterns than other connections
    if (Math.abs(sourceY - targetY) < safeVerticalOffset) {
      // For nodes at similar heights - create a path with a vertical detour
      // SAN connections should go in opposite direction than trunk
      const direction = edgeNumber % 2 === 0 ? -1 : 1;
      const detourOffset = (safeVerticalOffset + edgeStaggerOffset) * direction;
      
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${sourceY + detourOffset}
              H ${targetX - horizontalOffset}
              V ${targetY}
              H ${targetX}`;
    }
    else {
      // For most SAN connections, use a simple path
      // Storage connections often go between nodes at different heights
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${targetY}
              H ${targetX}`;
    }
    
    // Label position calculation
    const labelPosX = (sourceX + targetX) / 2;
    const labelPosY = (sourceY + targetY) / 2 - 12;
    
    return [path, labelPosX, labelPosY];
  }, [id, sourceX, sourceY, targetX, targetY]);
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path san-edge-path"
        d={edgePath}
        style={sanStyle}
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
              color: '#ea580c',
              border: '1px solid #fdba74',
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
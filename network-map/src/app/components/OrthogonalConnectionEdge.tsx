'use client';

import React, { useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position } from 'reactflow';

// Custom edge component for standard connections with orthogonal routing
export default function OrthogonalConnectionEdge({
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
  // Default style for regular connections
  const connectionStyle = {
    stroke: '#64748b', // Slate gray color
    strokeWidth: 2,
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
    const nodeClearance = 10;
    
    // Calculate safe offsets to avoid nodes
    // Regular connections use smaller offsets to stay minimal
    const safeHorizontalOffset = Math.max(nodeWidth / 2 + nodeClearance, 30);
    const safeVerticalOffset = Math.max(nodeHeight / 2 + nodeClearance, 25);
    
    // Stagger connections with the same source and target
    const edgeStaggerOffset = edgeNumber * 10; // Smaller stagger for regular connections
    
    // Safe horizontal offset that accounts for node width and stagger
    const horizontalOffset = safeHorizontalOffset + edgeStaggerOffset;
    
    // Path variables
    let path;
    
    // Use more direct routing based on positions
    if (Math.abs(sourceY - targetY) < safeVerticalOffset) {
      // For nodes at similar heights - create a direct horizontal connection
      path = `M ${sourceX} ${sourceY}
              H ${targetX}`;
    }
    else if (Math.abs(sourceX - targetX) < safeHorizontalOffset) {
      // For nodes at similar x positions - create a direct vertical connection
      path = `M ${sourceX} ${sourceY}
              V ${targetY}`;
    }
    else {
      // For most connections, use a simple L path with minimal segments
      const midX = goingRight 
        ? sourceX + horizontalOffset
        : sourceX - horizontalOffset;
        
      path = `M ${sourceX} ${sourceY}
              H ${midX}
              V ${targetY}
              H ${targetX}`;
    }
    
    // Label position calculation
    const labelPosX = (sourceX + targetX) / 2;
    const labelPosY = (sourceY + targetY) / 2 - 10;
    
    return [path, labelPosX, labelPosY];
  }, [id, sourceX, sourceY, targetX, targetY]);
  
  return (
    <>
      <path
        id={id}
        className="react-flow__edge-path connection-edge-path"
        d={edgePath}
        style={connectionStyle}
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
              fontWeight: 500,
              color: '#64748b',
              border: '1px solid #cbd5e1',
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
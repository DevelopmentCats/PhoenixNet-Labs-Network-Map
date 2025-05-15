'use client';

import React, { useMemo } from 'react';
import { EdgeProps, EdgeLabelRenderer, Position } from 'reactflow';

// Custom edge component for Trunk connections with orthogonal routing
export default function OrthogonalTrunkEdge({
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
  // Default style for Trunk connections
  const trunkStyle = {
    stroke: '#16a34a', // Green color
    strokeWidth: 4,
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
    // For Trunk connections, use moderate offsets
    const safeHorizontalOffset = Math.max(nodeWidth / 2 + nodeClearance, 60);
    const safeVerticalOffset = Math.max(nodeHeight / 2 + nodeClearance, 40);
    
    // Stagger connections with the same source and target
    const edgeStaggerOffset = edgeNumber * 25;
    
    // Safe horizontal offset that accounts for node width and stagger
    const horizontalOffset = safeHorizontalOffset + edgeStaggerOffset;
    const verticalOffset = safeVerticalOffset + edgeStaggerOffset;
    
    // Path variables
    let path;
    
    // Trunk connections are often between switches at similar heights
    if (Math.abs(sourceY - targetY) < safeVerticalOffset) {
      // For nodes at similar heights - create a path with a vertical detour
      // Alternate direction based on edge number
      const direction = edgeNumber % 2 === 0 ? 1 : -1; 
      const detourOffset = verticalOffset * direction;
      
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + horizontalOffset}
              V ${sourceY + detourOffset}
              H ${targetX - horizontalOffset}
              V ${targetY}
              H ${targetX}`;
    }
    else if (horizontalDistance < safeHorizontalOffset * 2) {
      // For nodes that are close horizontally but at different heights,
      // create a straight vertical segment with small horizontal offset
      const smallOffset = 30 + (edgeNumber * 15);
      
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + smallOffset}
              V ${targetY}
              H ${targetX}`;
    }
    else {
      // For most connections, use a simple Z-shaped path
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
        className="react-flow__edge-path trunk-edge-path"
        d={edgePath}
        style={trunkStyle}
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
              color: '#16a34a',
              border: '1px solid #86efac',
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
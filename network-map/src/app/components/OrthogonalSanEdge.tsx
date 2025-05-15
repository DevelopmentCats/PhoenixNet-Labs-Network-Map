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
    
    // Path variables
    let path;
    
    // Check if this is a cross-site connection or local connection
    const isCrossSiteConnection = horizontalDistance > 300;
    
    if (isCrossSiteConnection) {
      // For site-to-site SAN connections, create staggered paths to avoid overlaps
      const verticalOffset = 40 + (edgeNumber * 50); // Different offsets for each connection
      const midX = sourceX + (targetX - sourceX) * 0.5;
      
      // Alternating offset directions based on edge number
      const offsetDirection = edgeNumber === 0 ? 0 : (edgeNumber === 1 ? -1 : 1);
      
      if (offsetDirection === 0) {
        // First connection goes more directly
        path = `M ${sourceX} ${sourceY}
                H ${midX}
                V ${targetY}
                H ${targetX}`;
      } else {
        // Create an offset path that goes up or down first to avoid overlapping
        const offsetY = sourceY + (offsetDirection * verticalOffset);
        
        path = `M ${sourceX} ${sourceY}
                V ${offsetY}
                H ${midX}
                V ${targetY}
                H ${targetX}`;
      }
    }
    else if (Math.abs(sourceY - targetY) < 30) {
      // For nodes at very similar heights, use direct horizontal connection
      path = `M ${sourceX} ${sourceY} H ${targetX}`;
    } 
    else if (Math.abs(sourceX - targetX) < 30) {
      // For nodes at very similar x-positions, use direct vertical connection
      path = `M ${sourceX} ${sourceY} V ${targetY}`;
    }
    else {
      // For local SAN connections, use staggered offsets to prevent overlaps
      const offsetDirection = edgeNumber % 2 === 0 ? 1 : -1;
      const offsetAmount = 35 + (edgeNumber * 20);
      
      // SAN connections typically go between servers and storage
      if (goingDown) {
        // For connections going downward, go down first with an offset
        const midX = sourceX + (offsetDirection * offsetAmount);
        
        path = `M ${sourceX} ${sourceY}
                H ${midX}
                V ${targetY}
                H ${targetX}`;
      } else {
        // For connections going upward, go right/left first with an offset
        const midY = sourceY + (offsetDirection * offsetAmount);
        
        path = `M ${sourceX} ${sourceY}
                V ${midY}
                H ${targetX}
                V ${targetY}`;
      }
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
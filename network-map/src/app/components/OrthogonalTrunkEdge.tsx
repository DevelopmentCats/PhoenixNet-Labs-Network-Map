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
    
    // Path variables
    let path;
    
    // Get whether this is a cross-site connection
    const isCrossSiteConnection = horizontalDistance > 300;
    
    if (isCrossSiteConnection) {
      // For site-to-site trunk connections, create staggered paths to avoid overlaps
      const verticalOffset = 20 + (edgeNumber * 40); // Different offsets for each connection
      const midX = sourceX + (targetX - sourceX) * 0.5;
      
      // Alternating offset directions based on edge number
      const offsetDirection = edgeNumber === 0 ? 0 : (edgeNumber === 1 ? 1 : -1);
      
      if (offsetDirection === 0) {
        // First connection goes directly (lowest ID number)
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
      // For local connections, use staggered offsets to prevent overlaps
      const offsetDirection = edgeNumber % 2 === 0 ? 1 : -1;
      const offsetAmount = 25 + (edgeNumber * 15);
      
      if (horizontalDistance > verticalDistance) {
        // If the horizontal distance is larger, move vertically first with offset
        const midY = sourceY + (offsetDirection * offsetAmount);
        
        path = `M ${sourceX} ${sourceY}
                V ${midY}
                H ${targetX}
                V ${targetY}`;
      } else {
        // If the vertical distance is larger, move horizontally first with offset
        const midX = sourceX + (offsetDirection * offsetAmount);
        
        path = `M ${sourceX} ${sourceY}
                H ${midX}
                V ${targetY}
                H ${targetX}`;
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
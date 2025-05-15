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
    // Calculate distances and directions
    const horizontalDistance = Math.abs(targetX - sourceX);
    const verticalDistance = Math.abs(targetY - sourceY);
    const goingRight = targetX > sourceX;
    const goingDown = targetY > sourceY;
    
    // Path variables
    let path;
    
    // Need to check if this is the long connection to the far right data center
    // This is the most reliable check - if the horizontal distance is very large (like 1000+)
    // and we're going right from the source, it's likely the VPN Gateway to Data Center connection
    const isLongDistanceToRight = horizontalDistance > 800 && goingRight;
    
    // Need to check if this is a connection to the branch office (middle target)
    // The branch is typically 400-700 pixels to the right of the VPN gateway
    const isMediumDistanceToRight = horizontalDistance > 400 && horizontalDistance < 700 && goingRight;
    
    // If this is the very long connection to the right - this is the one to Data Center
    if (isLongDistanceToRight) {
      // ALWAYS route this one down and around with a big offset
      const downwardOffset = 180; // Large offset to go well below other elements
      
      // Modified path to approach Data Center horizontally from the side
      path = `M ${sourceX} ${sourceY}
              H ${sourceX + 50} 
              V ${sourceY + downwardOffset}
              H ${targetX - 50}
              V ${targetY}
              H ${targetX}`;
    } 
    // If this is the medium distance connection to the right - likely to Branch Office
    else if (isMediumDistanceToRight) {
      // Direct straight connection to Branch Office
      path = `M ${sourceX} ${sourceY} H ${targetX}`;
    }
    // All other VPN connections
    else {
      // Direct horizontal when at similar heights
      if (Math.abs(sourceY - targetY) < 30) {
        path = `M ${sourceX} ${sourceY} H ${targetX}`;
      } else if (Math.abs(sourceX - targetX) < 30) {
        // Direct vertical if at similar x positions
        path = `M ${sourceX} ${sourceY} V ${targetY}`;
      } else {
        // Default route with one turn
        const turnX = sourceX + (targetX - sourceX) / 3;
        path = `M ${sourceX} ${sourceY}
                H ${turnX}
                V ${targetY}
                H ${targetX}`;
      }
    }
    
    // Calculate label position
    const labelPosX = (sourceX + targetX) / 2;
    const labelPosY = (sourceY + targetY) / 2 - 15;
    
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
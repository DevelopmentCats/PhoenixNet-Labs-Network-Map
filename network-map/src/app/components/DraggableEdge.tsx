'use client';

import { useCallback, useState, useRef, useEffect } from 'react';
import { 
  BaseEdge, 
  EdgeProps, 
  getBezierPath, 
  EdgeLabelRenderer,
  useReactFlow,
  getSimpleBezierPath,
  getStraightPath,
  getSmoothStepPath,
  Position
} from 'reactflow';

// Base component for all draggable connection types
export default function DraggableEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition = Position.Right,
  targetPosition = Position.Left,
  selected,
  style = {},
  markerEnd,
  data,
  label,
  labelStyle,
  labelBgStyle,
  labelBgBorderRadius,
}: EdgeProps) {
  // Get edge data or initialize empty waypoints array if not present
  const waypoints = data?.waypoints || [];
  const { setEdges, getViewport } = useReactFlow();
  
  // Drag state tracking
  const [isDragging, setIsDragging] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragRef = useRef<{ x: number, y: number }>({ x: 0, y: 0 });
  const pathRef = useRef<SVGPathElement>(null);
  
  // Base edge style
  const baseStyle = {
    strokeWidth: 2,
    cursor: 'pointer', // Show pointer cursor on edges
    ...style
  };

  // Calculate path based on waypoints
  let pathSegments = [];
  let edgePath = '';
  let labelX, labelY;

  if (waypoints && waypoints.length > 0) {
    // Start at source
    pathSegments.push(`M ${sourceX},${sourceY}`);
    
    // Add each waypoint as a point on the path
    waypoints.forEach((point: {x: number, y: number}) => {
      pathSegments.push(`L ${point.x},${point.y}`);
    });
    
    // End at target
    pathSegments.push(`L ${targetX},${targetY}`);
    
    // Join path segments
    edgePath = pathSegments.join(' ');
    
    // Position label near the middle of the path
    if (waypoints.length > 0) {
      // Show label near the middle waypoint
      const midIndex = Math.floor(waypoints.length / 2);
      if (midIndex < waypoints.length) {
        labelX = waypoints[midIndex].x;
        labelY = waypoints[midIndex].y;
      } else {
        labelX = (sourceX + targetX) / 2;
        labelY = (sourceY + targetY) / 2;
      }
    } else {
      labelX = (sourceX + targetX) / 2;
      labelY = (sourceY + targetY) / 2;
    }
  } else {
    // If no waypoints, use a smooth step path for better right-angled routing
    [edgePath, labelX, labelY] = getSmoothStepPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      borderRadius: 5 // Slightly rounded corners
    });
  }

  // Find point on the path where user clicked
  const getPointOnPath = (event: React.MouseEvent): { x: number, y: number } => {
    if (!pathRef.current) {
      return { x: 0, y: 0 };
    }

    // Get SVG coordinates
    const { left, top } = document
      .querySelector('.react-flow')
      ?.getBoundingClientRect() || { left: 0, top: 0 };
    
    const viewport = getViewport();
    
    // Convert click position to SVG coordinate space
    const x = (event.clientX - left) / viewport.zoom - viewport.x;
    const y = (event.clientY - top) / viewport.zoom - viewport.y;

    // Get closest point on the path
    const path = pathRef.current;
    const pathLength = path.getTotalLength();
    
    // Function to find the closest point on the path
    let closestPoint = { x: 0, y: 0 };
    let closestDistance = Infinity;
    
    // Sample points along the path
    for (let i = 0; i < pathLength; i += pathLength / 100) {
      const pt = path.getPointAtLength(i);
      const distance = Math.hypot(pt.x - x, pt.y - y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestPoint = { x: pt.x, y: pt.y };
      }
    }

    return closestPoint;
  };

  // Handler for mouse down on the edge path
  const onEdgeMouseDown = useCallback(
    (event: React.MouseEvent) => {
      if (event.detail === 2) {
        // Skip for double clicks - they're handled elsewhere
        return;
      }
      
      event.stopPropagation();
      
      // Prevent dragging when user is trying to pan the canvas
      const isPanningKey = event.altKey || event.ctrlKey || event.metaKey;
      if (isPanningKey) {
        return;
      }
      
      // Get closest point on the path
      const point = getPointOnPath(event);
      
      // Create a new waypoint
      let newWaypoints = [...waypoints];
      
      // Don't add a waypoint if we're very close to source or target
      const distToSource = Math.hypot(point.x - sourceX, point.y - sourceY);
      const distToTarget = Math.hypot(point.x - targetX, point.y - targetY);
      if (distToSource < 20 || distToTarget < 20) {
        return;
      }
      
      // Find where to insert the new waypoint to maintain path order
      if (waypoints.length === 0) {
        // If no waypoints, just add it
        newWaypoints = [point];
      } else {
        // Find the best segment to insert the waypoint into
        let bestSegmentIndex = -1;
        let bestDistance = Infinity;
        
        // Check each segment between waypoints
        const allPoints = [
          { x: sourceX, y: sourceY }, 
          ...waypoints, 
          { x: targetX, y: targetY }
        ];
        
        for (let i = 0; i < allPoints.length - 1; i++) {
          const start = allPoints[i];
          const end = allPoints[i + 1];
          
          // Calculate distance from point to this segment
          const dist = distanceToSegment(point, start, end);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestSegmentIndex = i;
          }
        }
        
        // Insert the new waypoint at the best position (after the segment start)
        if (bestSegmentIndex >= 0) {
          newWaypoints.splice(bestSegmentIndex, 0, point);
        } else {
          newWaypoints.push(point);
        }
      }
      
      // Add the new waypoint and prepare to start dragging it
      setEdges((edges) => 
        edges.map((edge) => {
          if (edge.id === id) {
            return {
              ...edge,
              data: { ...edge.data, waypoints: newWaypoints }
            };
          }
          return edge;
        })
      );
      
      // Set up to start dragging this new waypoint
      const { clientX, clientY } = event;
      dragRef.current = { x: clientX, y: clientY };
      setIsDragging(true);
      setDragIndex(newWaypoints.findIndex(wp => wp.x === point.x && wp.y === point.y));
      
      // Add global event listeners for drag tracking
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [id, waypoints, setEdges, getViewport, sourceX, sourceY, targetX, targetY]
  );
  
  // Calculate distance from point to line segment
  const distanceToSegment = (
    point: {x: number, y: number}, 
    start: {x: number, y: number}, 
    end: {x: number, y: number}
  ): number => {
    const A = point.x - start.x;
    const B = point.y - start.y;
    const C = end.x - start.x;
    const D = end.y - start.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = start.x;
      yy = start.y;
    } else if (param > 1) {
      xx = end.x;
      yy = end.y;
    } else {
      xx = start.x + param * C;
      yy = start.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handler to add a new waypoint on double click
  const handleEdgeClick = useCallback(
    (event: React.MouseEvent) => {
      // Stop propagation to prevent zoom/pan events
      event.stopPropagation();
      
      if (event.detail === 2) { // Double-click
        // Get click position in the flow coordinate system
        const point = getPointOnPath(event);
        
        // Add new waypoint
        const newWaypoints = [...(waypoints || []), point];
        setEdges((edges) => 
          edges.map((edge) => {
            if (edge.id === id) {
              return {
                ...edge,
                data: { ...edge.data, waypoints: newWaypoints }
              };
            }
            return edge;
          })
        );
      }
    },
    [id, waypoints, setEdges, getViewport]
  );

  // Mouse down handler to start dragging a waypoint
  const onWaypointMouseDown = useCallback(
    (index: number) => (event: React.MouseEvent) => {
      event.stopPropagation();
      
      // Store the initial mouse position for the drag
      const { clientX, clientY } = event;
      dragRef.current = { x: clientX, y: clientY };
      
      // Set dragging state
      setIsDragging(true);
      setDragIndex(index);
      
      // Add global event listeners for drag tracking
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    },
    [waypoints, setEdges]
  );
  
  // Mouse move handler for dragging
  const onMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!isDragging || dragIndex === null) return;
      
      event.preventDefault();
      
      const { clientX, clientY } = event;
      const { left, top } = document
        .querySelector('.react-flow')
        ?.getBoundingClientRect() || { left: 0, top: 0 };
      
      const viewport = getViewport();
      
      // Calculate new position with viewport transform applied
      const dx = (clientX - dragRef.current.x) / viewport.zoom;
      const dy = (clientY - dragRef.current.y) / viewport.zoom;
      
      // Update the waypoint position in the state
      setEdges((edges) => 
        edges.map((edge) => {
          if (edge.id === id && edge.data?.waypoints) {
            const newWaypoints = [...edge.data.waypoints];
            newWaypoints[dragIndex] = {
              x: newWaypoints[dragIndex].x + dx,
              y: newWaypoints[dragIndex].y + dy
            };
            
            return {
              ...edge,
              data: { ...edge.data, waypoints: newWaypoints }
            };
          }
          return edge;
        })
      );
      
      // Update reference position for next move event
      dragRef.current = { x: clientX, y: clientY };
    },
    [isDragging, dragIndex, id, setEdges, getViewport]
  );
  
  // Mouse up handler to end dragging
  const onMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragIndex(null);
    
    // Clean up global event listeners
    window.removeEventListener('mousemove', onMouseMove);
    window.removeEventListener('mouseup', onMouseUp);
  }, [onMouseMove]);
  
  // Ensure we clean up event listeners if component unmounts during drag
  useEffect(() => {
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  return (
    <>
      <path 
        ref={pathRef}
        id={id} 
        d={edgePath} 
        className={`react-flow__edge-path ${isDragging ? 'dragging' : ''}`}
        style={{
          ...baseStyle,
          strokeWidth: selected || isDragging 
            ? (typeof baseStyle.strokeWidth === 'number' ? baseStyle.strokeWidth + 1 : baseStyle.strokeWidth) 
            : baseStyle.strokeWidth
        }} 
        markerEnd={markerEnd}
        onClick={handleEdgeClick}
        onMouseDown={onEdgeMouseDown}
      />
      
      {/* Show waypoints when edge is selected */}
      {selected && waypoints && waypoints.map((point: {x: number, y: number}, index: number) => (
        <circle
          key={`${id}-waypoint-${index}`}
          cx={point.x}
          cy={point.y}
          r={6}
          fill={index === dragIndex ? "#1d4ed8" : "white"}
          stroke="#3182ce"
          strokeWidth={1.5}
          className="nodrag nopan waypoint"
          onMouseDown={onWaypointMouseDown(index)}
          style={{ 
            cursor: 'move', 
            filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3))'
          }}
        />
      ))}
      
      <EdgeLabelRenderer>
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              backgroundColor: labelBgStyle?.fill || 'white',
              padding: '4px 8px',
              borderRadius: labelBgBorderRadius || 4,
              fontSize: 12,
              fontWeight: 500,
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              ...labelStyle,
            }}
            className="nodrag nopan"
          >
            {label}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
} 
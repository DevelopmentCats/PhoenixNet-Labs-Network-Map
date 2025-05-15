'use client';

import React from 'react';
import { EdgeProps } from 'reactflow';
import DraggableEdge from './DraggableEdge';

export default function TrunkEdge(props: EdgeProps) {
  // Trunk connection style: thicker solid line
  const trunkStyle = {
    stroke: '#16a34a', // green-600
    strokeWidth: 4,
    strokeLinecap: 'round' as const,
  };

  return (
    <DraggableEdge 
      {...props}
      style={{...trunkStyle, ...props.style}}
      label={props.label || 'Trunk'}
      labelStyle={{
        color: '#16a34a',
        fontWeight: 600,
      }}
      labelBgStyle={{
        fill: 'white',
        fillOpacity: 0.75,
      }}
    />
  );
} 
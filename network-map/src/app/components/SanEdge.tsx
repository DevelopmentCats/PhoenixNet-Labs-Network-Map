'use client';

import React from 'react';
import { EdgeProps } from 'reactflow';
import DraggableEdge from './DraggableEdge';

export default function SanEdge(props: EdgeProps) {
  // SAN connection style: double-dash pattern in orange
  const sanStyle = {
    stroke: '#ea580c', // orange-600
    strokeWidth: 3,
    strokeDasharray: '10,3,3,3', // Double dash pattern
  };

  return (
    <DraggableEdge 
      {...props}
      style={{...sanStyle, ...props.style}}
      label={props.label || 'SAN'}
      labelStyle={{
        color: '#ea580c',
        fontWeight: 600,
      }}
      labelBgStyle={{
        fill: 'white',
        fillOpacity: 0.75,
      }}
    />
  );
} 
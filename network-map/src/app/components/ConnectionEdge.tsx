'use client';

import React from 'react';
import { EdgeProps } from 'reactflow';
import DraggableEdge from './DraggableEdge';

export default function ConnectionEdge(props: EdgeProps) {
  // Regular connection style: simple gray line
  const connectionStyle = {
    stroke: '#64748b', // slate-500
    strokeWidth: 2,
  };

  return (
    <DraggableEdge 
      {...props}
      style={{...connectionStyle, ...props.style}}
      labelStyle={{
        color: '#64748b',
        fontWeight: 500,
      }}
      labelBgStyle={{
        fill: 'white',
        fillOpacity: 0.75,
      }}
    />
  );
} 
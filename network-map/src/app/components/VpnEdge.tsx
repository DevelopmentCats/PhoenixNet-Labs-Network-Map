'use client';

import React from 'react';
import { EdgeProps } from 'reactflow';
import DraggableEdge from './DraggableEdge';

// VPN edge component that uses simple pipe-like routing with right angles
export default function VpnEdge(props: EdgeProps) {
  // VPN connection style: dashed blue line with larger width
  const vpnStyle = {
    stroke: '#2563eb', // blue-600
    strokeWidth: 3,
    strokeDasharray: '5,5', // dashed line
    animation: 'flowAnimation 30s linear infinite',
  };

  return (
    <DraggableEdge 
      {...props}
      style={{...vpnStyle, ...props.style}}
      label={props.label || 'VPN'}
      labelStyle={{
        color: '#2563eb',
        fontWeight: 600,
      }}
      labelBgStyle={{
        fill: 'white',
        fillOpacity: 0.75,
      }}
    />
  );
} 
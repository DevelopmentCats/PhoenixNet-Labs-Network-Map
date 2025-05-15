'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { NetworkNodeData } from './NetworkNode';

// Simple component for site headers with no handles
const SiteHeaderNode = ({ data }: NodeProps<NetworkNodeData>) => {
  const { label } = data;
  
  // Title case function - capitalize first letter of each word
  const titleCase = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className="site-header-node" style={{
      color: 'white',
      fontWeight: 600,
      fontSize: '20px',
      letterSpacing: '0.5px',
      textAlign: 'center',
      width: '100%',
      height: '100%',
      padding: '0 10px',
      fontFamily: "Arial, Helvetica, sans-serif",
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      {titleCase(label)}
    </div>
  );
};

export default memo(SiteHeaderNode); 
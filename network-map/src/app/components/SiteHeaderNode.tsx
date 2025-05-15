'use client';

import { memo } from 'react';
import { NodeProps } from 'reactflow';
import { NetworkNodeData } from './NetworkNode';

// Simple component for site headers with no handles
const SiteHeaderNode = ({ data }: NodeProps<NetworkNodeData>) => {
  const { label, subtitle } = data;
  
  // Title case function - capitalize first letter of each word
  const titleCase = (str: string) => {
    return str.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  };
  
  return (
    <div className="site-header-node flex flex-col justify-center items-center w-full h-full">
      <div className="text-white text-xl font-bold tracking-wide">
        {titleCase(label)}
      </div>
      
      {subtitle && (
        <div className="text-white text-xs opacity-80 mt-1">
          {subtitle}
        </div>
      )}
    </div>
  );
};

export default memo(SiteHeaderNode); 
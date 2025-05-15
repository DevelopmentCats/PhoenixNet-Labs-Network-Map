'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';

// Type definitions
export type DeviceType = 'router' | 'switch' | 'firewall' | 'server' | 'hypervisor' | 'vpn' | 'storage';

export interface NetworkNodeData {
  label: string;
  type?: DeviceType;
  ip?: string;
  model?: string;
  os?: string;
  hypervisorType?: string;
  virtualMachines?: { name: string; ip: string; os: string }[];
  selected?: boolean;
  siteId?: string;
  subtitle?: string;     // For site header subtitle
  isSiteHeader?: boolean; // Flag to identify site headers
  tagColor?: string;     // Color for site tags
}

// Icons for different device types
const IconMap: Record<DeviceType, string> = {
  router: '🌐',
  switch: '🔄',
  firewall: '🔒',
  server: '🖥️',
  hypervisor: '🖥️🖥️',
  vpn: '🔐',
  storage: '💾',
};

// Define color scheme for better visibility
const colorScheme = {
  nodeBg: '#ffffff',
  nodeBgSelected: '#ebf8ff',
  nodeBorder: '#cbd5e0',
  nodeBorderSelected: '#3182ce',
  textPrimary: '#2d3748', // Dark gray for main text
  textSecondary: '#4a5568', // Medium gray for secondary text
  textLabel: '#1a202c',   // Very dark gray for labels
};

const NetworkNode = ({ data }: NodeProps<NetworkNodeData>) => {
  const { label, type, ip, model, os, hypervisorType, virtualMachines, selected, subtitle, isSiteHeader, tagColor } = data;
  
  // If this is a site header, render a horizontal tab with center-aligned text
  if (isSiteHeader) {
    // Title case function - capitalize first letter of each word
    const titleCase = (str: string) => {
      return str.split(' ').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      ).join(' ');
    };
    
    // Return a simple div with no Handle components
    return (
      <div className="site-header-node" style={{
        color: 'white',
        fontWeight: 900,
        fontSize: '21px',
        letterSpacing: '0.5px',
        textAlign: 'center',
        width: '100%',
        height: '100%',
        padding: '0 10px',
        fontFamily: "'Arial Black', Helvetica, sans-serif",
        textShadow: '0 0 0.5px rgba(255,255,255,0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {titleCase(label)}
      </div>
    );
  }
  
  // If this is a site background node or doesn't have a type, render a minimal node
  if (!type) {
    return (
      <div style={{ padding: 0 }}>
        {label && <div className="text-sm font-medium">{label}</div>}
      </div>
    );
  }
  
  // Determine node styling based on type
  const nodeStyles = {
    border: selected ? `2px solid ${colorScheme.nodeBorderSelected}` : `1px solid ${colorScheme.nodeBorder}`,
    borderRadius: '8px',
    padding: '12px',
    minWidth: '150px',
    backgroundColor: selected ? colorScheme.nodeBgSelected : colorScheme.nodeBg,
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    color: colorScheme.textPrimary, // Ensure text color is explicitly set
  };

  // Styling for hypervisor nodes - they're larger to show VMs
  const hypervisorStyles = type === 'hypervisor' 
    ? { 
        minWidth: '200px',
        minHeight: '120px' 
      } 
    : {};

  return (
    <div style={{ ...nodeStyles, ...hypervisorStyles }}>
      {/* Left handle for incoming connections */}
      <Handle type="target" position={Position.Left} style={{ top: '50%' }} />
      
      <div className="flex flex-col">
        <div className="flex items-center mb-2">
          <div className="text-2xl mr-2">{IconMap[type]}</div>
          <div className="font-semibold truncate" style={{ color: colorScheme.textLabel }}>{label}</div>
        </div>
        
        {ip && <div className="text-xs mb-1" style={{ color: colorScheme.textSecondary }}>IP: {ip}</div>}
        {model && <div className="text-xs mb-1" style={{ color: colorScheme.textSecondary }}>Model: {model}</div>}
        {os && <div className="text-xs mb-1" style={{ color: colorScheme.textSecondary }}>OS: {os}</div>}
        
        {/* Additional info for hypervisors */}
        {type === 'hypervisor' && (
          <div className="mt-2 border-t pt-2">
            <div className="text-xs mb-1" style={{ color: colorScheme.textSecondary }}>{hypervisorType}</div>
            {virtualMachines && virtualMachines.length > 0 && (
              <div className="text-xs mt-1">
                <div className="font-semibold" style={{ color: colorScheme.textLabel }}>Virtual Machines:</div>
                <ul className="list-disc pl-4">
                  {virtualMachines.map((vm, idx) => (
                    <li key={idx} className="truncate" style={{ color: colorScheme.textSecondary }}>
                      {vm.name} ({vm.ip})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Right handle for outgoing connections */}
      <Handle type="source" position={Position.Right} style={{ top: '50%' }} />
    </div>
  );
};

export default memo(NetworkNode); 
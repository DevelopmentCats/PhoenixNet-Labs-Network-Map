'use client';

import { memo, useState } from 'react';
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

// Icons for different device types (using more distinctive emoji)
const IconMap: Record<DeviceType, string> = {
  router: '🌐',
  switch: '🔀',
  firewall: '🛡️',
  server: '🖥️',
  hypervisor: '🖥️🖥️',
  vpn: '🔒',
  storage: '💾',
};

// Define color scheme for better visibility
const colorScheme = {
  nodeBg: '#ffffff',
  nodeBgSelected: '#f0f9ff',
  nodeBorder: '#cbd5e0',
  nodeBorderSelected: '#3182ce',
  textPrimary: '#2d3748', // Dark gray for main text
  textSecondary: '#4a5568', // Medium gray for secondary text
  textLabel: '#1a202c',   // Very dark gray for labels
};

// Device type specific styling
const deviceTypeStyles: Record<DeviceType, { 
  bg: string, 
  bgHover: string, 
  bgSelected: string, 
  border: string, 
  borderSelected: string 
}> = {
  router: {
    bg: '#FEF3C7', // Amber 100
    bgHover: '#FDE68A', // Amber 200
    bgSelected: '#FEF3C7', // Amber 100
    border: '#F59E0B', // Amber 500
    borderSelected: '#D97706' // Amber 600
  },
  switch: {
    bg: '#DBEAFE', // Blue 100
    bgHover: '#BFDBFE', // Blue 200
    bgSelected: '#DBEAFE', // Blue 100
    border: '#3B82F6', // Blue 500
    borderSelected: '#2563EB' // Blue 600
  },
  firewall: {
    bg: '#FEE2E2', // Red 100
    bgHover: '#FECACA', // Red 200
    bgSelected: '#FEE2E2', // Red 100
    border: '#EF4444', // Red 500
    borderSelected: '#DC2626' // Red 600
  },
  server: {
    bg: '#D1FAE5', // Green 100
    bgHover: '#A7F3D0', // Green 200
    bgSelected: '#D1FAE5', // Green 100
    border: '#10B981', // Green 500
    borderSelected: '#059669' // Green 600
  },
  hypervisor: {
    bg: '#E0E7FF', // Indigo 100
    bgHover: '#C7D2FE', // Indigo 200
    bgSelected: '#E0E7FF', // Indigo 100
    border: '#6366F1', // Indigo 500
    borderSelected: '#4F46E5' // Indigo 600
  },
  vpn: {
    bg: '#EDE9FE', // Violet 100
    bgHover: '#DDD6FE', // Violet 200
    bgSelected: '#EDE9FE', // Violet 100
    border: '#8B5CF6', // Violet 500
    borderSelected: '#7C3AED' // Violet 600
  },
  storage: {
    bg: '#FCE7F3', // Pink 100
    bgHover: '#FBCFE8', // Pink 200
    bgSelected: '#FCE7F3', // Pink 100
    border: '#EC4899', // Pink 500
    borderSelected: '#DB2777' // Pink 600
  }
};

const NetworkNode = ({ data }: NodeProps<NetworkNodeData>) => {
  const { label, type, ip, model, os, hypervisorType, virtualMachines, selected, subtitle, isSiteHeader, tagColor, siteId } = data;
  const [isHovered, setIsHovered] = useState(false);
  
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
  
  // Get style based on device type
  const typeStyle = deviceTypeStyles[type] || deviceTypeStyles.server;
  
  // Determine node styling based on type, hover state, and selection
  const nodeStyles = {
    border: selected 
      ? `2px solid ${typeStyle.borderSelected}` 
      : isHovered 
        ? `1.5px solid ${typeStyle.border}` 
        : `1px solid ${typeStyle.border}`,
    borderRadius: '8px',
    padding: '12px',
    minWidth: '150px',
    backgroundColor: selected 
      ? typeStyle.bgSelected 
      : isHovered 
        ? typeStyle.bgHover 
        : typeStyle.bg,
    boxShadow: selected || isHovered
      ? '0 4px 8px -1px rgba(0, 0, 0, 0.15), 0 2px 4px -1px rgba(0, 0, 0, 0.08)'
      : '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    color: colorScheme.textPrimary,
    transition: 'all 0.2s ease',
  };

  // Styling for hypervisor nodes - they're larger to show VMs
  const hypervisorStyles = type === 'hypervisor' 
    ? { 
        minWidth: '200px',
        minHeight: '120px' 
      } 
    : {};

  return (
    <div 
      style={{ ...nodeStyles, ...hypervisorStyles }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Left handle for incoming connections */}
      <Handle 
        type="target" 
        position={Position.Left} 
        style={{ 
          top: '50%', 
          background: typeStyle.border,
          border: `2px solid ${selected ? typeStyle.borderSelected : typeStyle.bg}`,
        }} 
      />
      
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
      <Handle 
        type="source" 
        position={Position.Right} 
        style={{ 
          top: '50%', 
          background: typeStyle.border,
          border: `2px solid ${selected ? typeStyle.borderSelected : typeStyle.bg}`,
        }} 
      />
    </div>
  );
};

export default memo(NetworkNode); 
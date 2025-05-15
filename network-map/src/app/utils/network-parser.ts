import yaml from 'js-yaml';
import { Node, Edge, MarkerType } from 'reactflow';
import { NetworkNodeData } from '../components/NetworkNode';

// Types representing the YAML structure
interface NetworkConfig {
  name: string;
  description: string;
  sites: Site[];
}

interface Site {
  id: string;
  name: string;
  location: string;
  devices: Device[];
}

interface Device {
  id: string;
  type: string;
  name: string;
  ip?: string;
  model?: string;
  os?: string;
  hypervisor_type?: string;
  virtual_machines?: VirtualMachine[];
  connections?: Connection[];
  vpn_connections?: VpnConnection[];
  trunk_connections?: TrunkConnection[];
  san_connections?: SanConnection[];
  storage_type?: string;
}

interface VirtualMachine {
  name: string;
  ip: string;
  os: string;
}

// Base connection interface
interface BaseConnection {
  to: string;
  label?: string;
}

interface Connection extends BaseConnection {}

interface VpnConnection {
  to_site: string;
  label?: string;
}

interface TrunkConnection extends BaseConnection {}

interface SanConnection extends BaseConnection {}

// Parse the YAML file and convert to ReactFlow nodes and edges
export async function parseNetworkConfig(yamlContent: string): Promise<{
  nodes: Node<NetworkNodeData>[];
  edges: Edge[];
}> {
  try {
    // Parse YAML content
    const networkConfig = yaml.load(yamlContent) as NetworkConfig;
    const nodes: Node<NetworkNodeData>[] = [];
    const edges: Edge[] = [];
    
    // Track node positions for layout
    const sitePositions: Record<string, { x: number; y: number }> = {};
    const siteNodeIds: Record<string, string[]> = {}; // Track which nodes belong to which site
    const siteDimensions: Record<string, { width: number; height: number; deviceCount: number }> = {};
    
    // Calculate positions for sites (horizontally distributed)
    const siteSpacing = 1100; // Increased spacing between sites
    networkConfig.sites.forEach((site, index) => {
      sitePositions[site.id] = {
        x: index * siteSpacing,
        y: 100
      };
      siteNodeIds[site.id] = [];
      siteDimensions[site.id] = {
        width: 0,
        height: 0,
        deviceCount: site.devices.length
      };
    });
    
    // Process each site
    networkConfig.sites.forEach((site, siteIndex) => {
      const siteBasePosition = sitePositions[site.id];
      
      // Site label is now included in the background node
      
      // Create nodes for devices in this site
      const deviceSpacing = 250;
      const maxDevicesPerRow = 3;
      
      site.devices.forEach((device, deviceIndex) => {
        const row = Math.floor(deviceIndex / maxDevicesPerRow);
        const col = deviceIndex % maxDevicesPerRow;
        
        const position = {
          x: siteBasePosition.x + col * deviceSpacing + 150, // Added offset for better positioning
          y: siteBasePosition.y + 100 + row * 250
        };
        
        // Create node for this device
        nodes.push({
          id: device.id,
          position,
          data: {
            label: device.name,
            type: device.type as any,
            ip: device.ip,
            model: device.model,
            os: device.os,
            hypervisorType: device.hypervisor_type,
            virtualMachines: device.virtual_machines?.map(vm => ({
              name: vm.name,
              ip: vm.ip,
              os: vm.os
            })),
          },
          type: 'networkNode',
        });
        siteNodeIds[site.id].push(device.id);
        
        // Update site dimensions based on device positions
        const rightEdge = position.x + 150; // Approximate width of a node
        const bottomEdge = position.y + 150; // Approximate height of a node
        siteDimensions[site.id].width = Math.max(siteDimensions[site.id].width, rightEdge - siteBasePosition.x);
        siteDimensions[site.id].height = Math.max(siteDimensions[site.id].height, bottomEdge - siteBasePosition.y);
        
        // Process regular connections
        if (device.connections) {
          device.connections.forEach((connection, connIdx) => {
            edges.push({
              id: `connection-${device.id}-${connection.to}-${connIdx}`,
              source: device.id,
              target: connection.to,
              type: 'connectionEdge', // Use our custom orthogonal connection edge
              label: connection.label,
              style: { stroke: '#64748b', strokeWidth: 2 },
              sourceHandle: 'right',
              targetHandle: 'left',
              data: {
                connectionIndex: connIdx
              }
            });
          });
        }
        
        // Process VPN connections
        if (device.vpn_connections) {
          device.vpn_connections.forEach((vpnConnection, vpnIndex) => {
            // Find the router in the target site
            const targetSite = networkConfig.sites.find(s => s.id === vpnConnection.to_site);
            if (targetSite) {
              const targetRouter = targetSite.devices.find(d => d.type === 'router');
              if (targetRouter) {
                // Determine if this is a cross-site VPN connection
                const isCrossSite = targetSite.id !== site.id;
                
                // Create a unique ID for this connection that includes a numeric index for offsetting
                const edgeId = `vpn-${device.id}-${targetRouter.id}-${vpnIndex}`;
                
                // Create VPN connection with our custom edge type
                edges.push({
                  id: edgeId,
                  source: device.id,
                  target: targetRouter.id,
                  type: 'vpnEdge', // The key must match exactly what's registered in edgeTypes
                  animated: true,
                  label: vpnConnection.label || 'VPN',
                  style: { 
                    stroke: '#2563eb',
                    strokeWidth: 3,
                    strokeDasharray: '5,5'
                  },
                  zIndex: 1000,
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#2563eb'
                  },
                  // Explicitly set the source and target positions
                  sourceHandle: 'right',
                  targetHandle: 'left',
                  // Add connection data
                  data: {
                    isCrossSite,
                    vpnIndex
                  }
                });
              }
            }
          });
        }
        
        // Process Trunk connections (high-bandwidth connections between switches)
        if (device.trunk_connections) {
          device.trunk_connections.forEach((trunkConnection, trunkIdx) => {
            edges.push({
              id: `trunk-${device.id}-${trunkConnection.to}-${trunkIdx}`,
              source: device.id,
              target: trunkConnection.to,
              type: 'trunkEdge', // Use our custom orthogonal trunk edge
              label: trunkConnection.label || 'Trunk',
              style: { 
                stroke: '#16a34a',
                strokeWidth: 4,
              },
              sourceHandle: 'right',
              targetHandle: 'left',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#16a34a'
              },
              data: {
                trunkIndex: trunkIdx
              }
            });
          });
        }
        
        // Process SAN connections (Storage Area Network)
        if (device.san_connections) {
          device.san_connections.forEach((sanConnection, sanIdx) => {
            edges.push({
              id: `san-${device.id}-${sanConnection.to}-${sanIdx}`,
              source: device.id,
              target: sanConnection.to,
              type: 'sanEdge', // Use our custom orthogonal SAN edge
              label: sanConnection.label || 'SAN',
              style: { 
                stroke: '#ea580c',
                strokeWidth: 3,
                strokeDasharray: '10,3,3,3'
              },
              sourceHandle: 'right',
              targetHandle: 'left',
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ea580c'
              },
              data: {
                sanIndex: sanIdx
              }
            });
          });
        }
      });
      
      // Calculate minimum dimensions for the site box based on device count
      const minWidth = Math.max(600, Math.min(3, site.devices.length) * deviceSpacing);
      const rows = Math.ceil(site.devices.length / maxDevicesPerRow);
      const minHeight = Math.max(350, rows * 250 + 100);
      
      // Add padding to site dimensions
      siteDimensions[site.id].width = Math.max(minWidth, siteDimensions[site.id].width + 200);
      siteDimensions[site.id].height = Math.max(minHeight, siteDimensions[site.id].height + 200);
      
      // Create a site background node (should be rendered first to be in the background)
      nodes.unshift({
        id: `site-${site.id}-bg`,
        position: { 
          x: siteBasePosition.x - 50, 
          y: siteBasePosition.y - 150
        },
        data: {
          label: '', // Empty label for the background
        },
        style: {
          width: siteDimensions[site.id].width,
          height: siteDimensions[site.id].height + 100,
          backgroundColor: site.id.startsWith('main') ? 'rgba(237, 242, 247, 0.7)' : 'rgba(242, 238, 252, 0.7)',
          border: site.id.startsWith('main') ? '2px solid rgba(49, 130, 206, 0.5)' : '2px solid rgba(124, 58, 237, 0.5)',
          borderRadius: '10px',
          zIndex: -1,
          opacity: 0.9,
        },
        type: 'group',
        draggable: false,
        selectable: false,
        className: 'site-background', // Apply the background pattern CSS
      });
      
      // Calculate device type counts for subtitle
      const deviceTypeCounts = site.devices.reduce((counts: Record<string, number>, device) => {
        counts[device.type] = (counts[device.type] || 0) + 1;
        return counts;
      }, {});
      
      // Create a formatted subtitle showing device counts
      const deviceCountsText = Object.entries(deviceTypeCounts)
        .map(([type, count]) => `${count} ${type}${count > 1 ? 's' : ''}`)
        .join(', ');
      
      // Define colors for this site (without transparency)
      const mainColor = site.id.startsWith('main') ? 
        '#2b6cb0' : '#6d28d9'; // Slightly darker and richer colors

      const borderColor = site.id.startsWith('main') ? 
        '#1e4e8c' : '#5b21b6'; // Even darker border colors
        
      // Add a site tab as a horizontal header on top of the site box, aligned to the left but offset right
      nodes.push({
        id: `site-${site.id}-header`,
        position: { 
          x: siteBasePosition.x - 20, // Offset more to the right of the left edge
          y: siteBasePosition.y - 180  // Position it above the box
        },
        data: {
          label: site.name,  // Will be properly capitalized in the component
          isSiteHeader: true
        },
        style: {
          width: '260px',    // Slightly wider for text
          height: '50px',    // Slightly taller for better text visibility
          backgroundColor: mainColor,
          color: '#ffffff',
          border: `2px solid ${borderColor}`,
          borderRadius: '10px', // Match the site box curvature
          zIndex: 10,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '0',
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)', // Slightly stronger shadow
          fontWeight: 900, // Ensure this is added at the style level too
        },
        type: 'siteHeader', // Use a custom type for site headers instead of 'default'
        draggable: false,
        selectable: false,
        connectable: false, // Prevent connections to this node
      });
    });
    
    return { nodes, edges };
  } catch (error) {
    console.error('Failed to parse network configuration:', error);
    throw error;
  }
} 
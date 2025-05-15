import yaml from 'js-yaml';
import { Node, Edge, MarkerType, Position } from 'reactflow';
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
    
    // Calculate positions for sites (horizontally distributed with better spacing)
    const siteSpacing = 1200; // Increased spacing between sites for better separation
    networkConfig.sites.forEach((site, index) => {
      sitePositions[site.id] = {
        x: index * siteSpacing + 100, // Add initial offset for better screen positioning
        y: 100
      };
      siteNodeIds[site.id] = [];
      siteDimensions[site.id] = {
        width: 0,
        height: 0,
        deviceCount: site.devices.length
      };
    });
    
    // Device type to determine positioning and sizing
    const deviceTypeConfig: Record<string, { width: number, height: number, spacing: number }> = {
      'router': { width: 180, height: 120, spacing: 280 },
      'firewall': { width: 180, height: 120, spacing: 280 },
      'switch': { width: 180, height: 120, spacing: 280 },
      'server': { width: 180, height: 140, spacing: 280 },
      'hypervisor': { width: 220, height: 180, spacing: 320 }, // Larger for VMs
      'vpn': { width: 180, height: 120, spacing: 280 },
      'storage': { width: 180, height: 120, spacing: 280 },
    };
    
    // Process each site
    networkConfig.sites.forEach((site, siteIndex) => {
      const siteBasePosition = sitePositions[site.id];
      
      // Create nodes for devices in this site with intelligent layout
      const maxDevicesPerRow = 3;
      
      // Sort devices to ensure consistent layout:
      // 1. Network infrastructure (routers, firewalls, vpn) at the top
      // 2. Switches in the middle
      // 3. Endpoints (servers, hypervisors, storage) at the bottom
      const deviceTypeOrder: Record<string, number> = {
        'router': 1,
        'firewall': 2,
        'vpn': 3,
        'switch': 4,
        'server': 5,
        'hypervisor': 6,
        'storage': 7,
      };
      
      const sortedDevices = [...site.devices].sort((a, b) => {
        return (deviceTypeOrder[a.type] || 99) - (deviceTypeOrder[b.type] || 99);
      });
      
      // Group devices by type for better organization
      const devicesByType: Record<string, Device[]> = {};
      sortedDevices.forEach(device => {
        if (!devicesByType[device.type]) {
          devicesByType[device.type] = [];
        }
        devicesByType[device.type].push(device);
      });
      
      // Process each device type group
      let currentY = siteBasePosition.y + 120; // Start position after site header
      
      Object.entries(deviceTypeOrder).forEach(([type, order]) => {
        if (!devicesByType[type] || devicesByType[type].length === 0) return;
        
        const devices = devicesByType[type];
        const typeConfig = deviceTypeConfig[type] || deviceTypeConfig['server']; // Default to server config
        
        // Calculate row for this type
        const devicesPerRow = Math.min(devices.length, maxDevicesPerRow);
        const rows = Math.ceil(devices.length / maxDevicesPerRow);
        
        // Calculate centered starting position
        const totalWidth = devicesPerRow * typeConfig.spacing;
        const startX = siteBasePosition.x + (siteDimensions[site.id].width / 2) - (totalWidth / 2) + (typeConfig.spacing / 2);
        
        devices.forEach((device, deviceIndex) => {
          const row = Math.floor(deviceIndex / maxDevicesPerRow);
          const col = deviceIndex % maxDevicesPerRow;
          
          const position = {
            x: startX + col * typeConfig.spacing,
            y: currentY + row * (typeConfig.height + 60) // Add space between rows
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
              siteId: site.id // Track which site this device belongs to
            },
            type: 'networkNode',
            style: {
              width: typeConfig.width,
              height: device.type === 'hypervisor' ? undefined : typeConfig.height // Let hypervisors auto-size for VMs
            }
          });
          siteNodeIds[site.id].push(device.id);
          
          // Update site dimensions based on device positions
          const rightEdge = position.x + typeConfig.width;
          const bottomEdge = position.y + typeConfig.height;
          siteDimensions[site.id].width = Math.max(siteDimensions[site.id].width, rightEdge - siteBasePosition.x + 100);
          siteDimensions[site.id].height = Math.max(siteDimensions[site.id].height, bottomEdge - siteBasePosition.y + 100);
        });
        
        // Update Y position for next device type group
        currentY += rows * (typeConfig.height + 60) + 40; // Add extra space between device type groups
      });
      
      // Process connections
      sortedDevices.forEach((device) => {
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
              data: {
                connectionType: 'standard'
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
                  data: {
                    connectionType: 'vpn',
                    isCrossSite,
                    vpnIndex,
                    sourceSite: site.id,
                    targetSite: targetSite.id
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#16a34a'
              },
              data: {
                connectionType: 'trunk',
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
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: '#ea580c'
              },
              data: {
                connectionType: 'san',
                sanIndex: sanIdx
              }
            });
          });
        }
      });
      
      // Calculate minimum dimensions for the site box based on device count
      const deviceSizes = sortedDevices.map(d => deviceTypeConfig[d.type] || deviceTypeConfig['server']);
      const minWidth = Math.max(800, Math.min(3, site.devices.length) * 
        (deviceSizes.reduce((sum, size) => sum + size.width, 0) / deviceSizes.length));
      const rows = Math.ceil(site.devices.length / maxDevicesPerRow);
      const minHeight = Math.max(400, rows * 300);
      
      // Add padding to site dimensions
      siteDimensions[site.id].width = Math.max(minWidth, siteDimensions[site.id].width + 200);
      siteDimensions[site.id].height = Math.max(minHeight, siteDimensions[site.id].height + 200);
      
      // Create a site background node (should be rendered first to be in the background)
      nodes.unshift({
        id: `site-${site.id}-bg`,
        position: { 
          x: siteBasePosition.x - 100, 
          y: siteBasePosition.y - 150
        },
        data: {
          label: '', // Empty label for the background
          siteId: site.id,
        },
        style: {
          width: siteDimensions[site.id].width,
          height: siteDimensions[site.id].height + 100,
          backgroundColor: site.id.startsWith('main') ? 'rgba(237, 242, 247, 0.7)' : 
                         site.id.startsWith('data') ? 'rgba(237, 247, 242, 0.7)' : 
                         'rgba(242, 238, 252, 0.7)',
          border: site.id.startsWith('main') ? '2px solid rgba(49, 130, 206, 0.5)' : 
                site.id.startsWith('data') ? '2px solid rgba(16, 185, 129, 0.5)' : 
                '2px solid rgba(124, 58, 237, 0.5)',
          borderRadius: '10px',
          zIndex: -1,
          opacity: 0.9,
        },
        type: 'group',
        draggable: false,
        selectable: false,
        className: 'site-background', // Apply the background pattern CSS
      });
      
      // Define colors for this site (without transparency)
      const mainColor = site.id.startsWith('main') ? '#2b6cb0' : 
                        site.id.startsWith('data') ? '#047857' : 
                        '#6d28d9'; // Distinct colors for each site

      const borderColor = site.id.startsWith('main') ? '#1e4e8c' : 
                         site.id.startsWith('data') ? '#065f46' : 
                         '#5b21b6'; // Darker border colors
        
      // Create location subtitle
      const locationText = site.location ? `${site.location}` : '';
        
      // Add a site tab as a horizontal header on top of the site box
      nodes.push({
        id: `site-${site.id}-header`,
        position: { 
          x: siteBasePosition.x + 100, // Position more centered
          y: siteBasePosition.y - 180  // Position it above the box
        },
        data: {
          label: site.name,  
          subtitle: locationText,
          isSiteHeader: true
        },
        style: {
          width: '280px',    
          height: '50px',    
          backgroundColor: mainColor,
          color: '#ffffff',
          border: `2px solid ${borderColor}`,
          borderRadius: '10px', 
          zIndex: 10,
          fontWeight: 900, 
          boxShadow: '0 3px 6px rgba(0, 0, 0, 0.2)', 
        },
        type: 'siteHeader', 
        draggable: false,
        selectable: false,
        connectable: false, 
      });
    });
    
    return { nodes, edges };
  } catch (error) {
    console.error('Failed to parse network configuration:', error);
    throw error;
  }
} 
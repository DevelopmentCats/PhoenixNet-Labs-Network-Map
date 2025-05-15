# Network Map Visualizer

A web application for visualizing computer network topologies defined in YAML format. This tool provides a graphical representation similar to what you might see in Cisco Packet Tracer, but focused on documentation and demonstration purposes.

## Features

- **YAML-based Network Definition**: Define your network topology in a simple YAML format
- **Interactive Network Visualization**: View your network with an interactive diagram
- **Custom Node Types**: Visualize different types of network components:
  - Routers
  - Switches
  - Firewalls
  - Servers
  - Hypervisors with virtual machines
  - VPN gateways
  - Storage devices
- **Site-based Layout**: Organize devices by site or location
- **Connection Visualization**: See how devices are connected within and between sites
- **VPN Tunnels**: Visualize VPN connectivity between sites
- **Admin Interface**: Protected editor for authorized users
- **Static Public View**: Public-facing view is read-only for security

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd network-map
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

### Admin Access

The application includes a protected admin interface for editing the network configuration:

1. Navigate to `/admin` or click the "Admin Login" button
2. Login with the following credentials (for demo purposes only):
   - Username: `admin`
   - Password: `network-admin`
3. Edit the YAML configuration and apply changes
4. In a production environment, implement proper authentication and secure storage

## YAML Network Definition Format

The application uses a structured YAML format to define network topologies. Here's an example:

```yaml
name: Corporate Network
description: Multi-site corporate network
sites:
  - id: site-id
    name: Site Name
    location: City
    devices:
      - id: device-id
        type: router|switch|firewall|server|hypervisor|vpn|storage
        name: Device Name
        ip: IP Address
        model: Model Name
        connections:
          - to: another-device-id
        # For VPN devices
        vpn_connections:
          - to_site: another-site-id
        # For hypervisors
        hypervisor_type: VMware ESXi
        virtual_machines:
          - name: VM Name
            ip: VM IP
            os: Operating System
```

## Deployment Considerations

For production use:

1. Implement proper authentication (OAuth, JWT, etc.)
2. Set up server-side storage for network configurations
3. Configure proper CORS and CSP settings
4. Consider using environment variables for configuration

## Technologies Used

- [Next.js](https://nextjs.org/) - React framework
- [React Flow](https://reactflow.dev/) - Library for building node-based UIs
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML parser for JavaScript
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by network documentation tools like Cisco Packet Tracer
- Built with modern web technologies for interactive visualization

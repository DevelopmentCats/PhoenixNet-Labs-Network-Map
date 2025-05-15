'use client';

import { useState, useEffect } from 'react';
import NetworkMap from './components/NetworkMap';

export default function Home() {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Load YAML on component mount
  useEffect(() => {
    const loadNetworkConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // In browser environment, fetch the file
        const response = await fetch('/sample-network.yaml');
        if (response.ok) {
          const content = await response.text();
          setYamlContent(content);
        } else {
          setError('Failed to load network configuration');
          console.error('Failed to load network YAML:', response.statusText);
        }
      } catch (error) {
        setError('Error loading network configuration');
        console.error('Error loading network YAML:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNetworkConfig();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-gray-500">Loading network diagram...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-screen">
      <NetworkMap yamlContent={yamlContent} isAdmin={false} />
    </div>
  );
}

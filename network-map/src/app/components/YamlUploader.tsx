'use client';

import { useState, ChangeEvent } from 'react';

interface YamlUploaderProps {
  onFileLoaded: (content: string) => void;
}

const YamlUploader = ({ onFileLoaded }: YamlUploaderProps) => {
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  
  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    setError(null);
    
    if (!file) {
      return;
    }
    
    // Validate file type
    if (!file.name.endsWith('.yaml') && !file.name.endsWith('.yml')) {
      setError('Please select a YAML file (.yaml or .yml)');
      return;
    }
    
    setFileName(file.name);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      onFileLoaded(content);
    };
    
    reader.onerror = () => {
      setError('Failed to read the file');
    };
    
    reader.readAsText(file);
  };
  
  return (
    <div className="mb-6 p-4 border rounded-md">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
        <label 
          htmlFor="yaml-upload" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded cursor-pointer transition-colors"
        >
          Upload Network YAML
        </label>
        <input
          id="yaml-upload"
          type="file"
          accept=".yaml,.yml"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {fileName && (
          <div className="text-sm text-gray-600">
            <span className="font-medium">Selected file:</span> {fileName}
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 text-red-500 text-sm">{error}</div>
      )}
      
      <div className="mt-4 text-sm text-gray-500">
        <p>Upload a YAML file containing your network configuration.</p>
        <p>The file should define sites, devices, and connections between them.</p>
      </div>
    </div>
  );
};

export default YamlUploader; 
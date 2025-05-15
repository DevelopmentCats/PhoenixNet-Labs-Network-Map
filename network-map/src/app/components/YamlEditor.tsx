'use client';

import { useState, useEffect } from 'react';

interface YamlEditorProps {
  value: string;
  onChange: (value: string) => void;
  onApply: () => void;
}

const YamlEditor = ({ value, onChange, onApply }: YamlEditorProps) => {
  const [height, setHeight] = useState('300px');
  
  // Auto-resize textarea based on content
  useEffect(() => {
    const calculateHeight = () => {
      const lineCount = (value.match(/\n/g) || []).length + 1;
      const newHeight = Math.max(300, Math.min(600, lineCount * 20)); // 20px per line, min 300px, max 600px
      setHeight(`${newHeight}px`);
    };
    
    calculateHeight();
  }, [value]);
  
  return (
    <div className="border rounded-md overflow-hidden mb-6">
      <div className="bg-gray-100 dark:bg-gray-800 p-2 border-b flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">YAML Editor</h3>
        <button
          onClick={onApply}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded text-sm transition-colors"
        >
          Update Preview
        </button>
      </div>
      
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-gray-100"
        style={{ 
          height, 
          resize: 'vertical',
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace'
        }}
        spellCheck={false}
        placeholder="Enter or paste your YAML network configuration here..."
      />
      
      <div className="bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-500 dark:text-gray-400 border-t">
        Define your network topology in YAML format. Click "Update Preview" to see your changes below.
      </div>
    </div>
  );
};

export default YamlEditor; 
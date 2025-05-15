'use client';

import { useState, useEffect } from 'react';
import YamlEditor from '../components/YamlEditor';
import NetworkMap from '../components/NetworkMap';
import Link from 'next/link';

export default function AdminPage() {
  const [yamlContent, setYamlContent] = useState<string>('');
  const [activeYamlContent, setActiveYamlContent] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(true);

  // Load YAML on component mount
  useEffect(() => {
    const loadSampleNetwork = async () => {
      try {
        const response = await fetch('/sample-network.yaml');
        if (response.ok) {
          const content = await response.text();
          setYamlContent(content);
          setActiveYamlContent(content);
        } else {
          console.error('Failed to load network YAML:', response.statusText);
        }
      } catch (error) {
        console.error('Error loading network YAML:', error);
      }
    };

    loadSampleNetwork();
  }, []);

  const handleApplyChanges = () => {
    setActiveYamlContent(yamlContent);
    setIsSaved(true);
  };

  const handleEditorChange = (newContent: string) => {
    setYamlContent(newContent);
    setIsSaved(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <svg className="h-8 w-8 text-blue-600 dark:text-blue-500 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Network Editor (Private)</h1>
            </div>
            
            <Link 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-800 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              View Public Map
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
                Edit Network Configuration
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Modify the YAML configuration below to update your network map preview.
                {!isSaved && (
                  <span className="text-amber-500 ml-2">
                    (You have unsaved changes)
                  </span>
                )}
              </p>
            </div>
            
            <YamlEditor 
              value={yamlContent}
              onChange={handleEditorChange}
              onApply={handleApplyChanges}
            />
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
              Network Map Preview
            </h2>
          </div>
          <div className="h-[600px]">
            <NetworkMap 
              yamlContent={activeYamlContent} 
              isAdmin={true}
            />
          </div>
        </div>
      </main>
    </div>
  );
} 
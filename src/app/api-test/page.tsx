'use client';

import { useState } from 'react';
import { testAPIConnection } from '@/app/utils/api';
import { connectSocket } from '@/app/utils/socket';

interface TestResult {
  test: string;
  result: unknown;
  timestamp: string;
}

export default function APITestPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);

  const addResult = (test: string, result: unknown) => {
    setTestResults(prev => [...prev, { test, result, timestamp: new Date().toISOString() }]);
  };

  const runAllTests = async () => {
    setLoading(true);
    setTestResults([]);

    // Test 1: Environment Variables
    addResult('Environment Variables', {
      NODE_ENV: process.env.NODE_ENV,
      NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
      NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL
    });

    // Test 2: API Health Check
    try {
      const healthResult = await testAPIConnection();
      addResult('API Health Check', healthResult);
    } catch (error) {
      addResult('API Health Check', { error: error });
    }

    // Test 3: Socket Connection
    try {
      const socket = connectSocket();
      addResult('Socket Connection', {
        socketId: socket?.id,
        connected: socket?.connected,
        url: process.env.NEXT_PUBLIC_SOCKET_URL
      });
    } catch (error) {
      addResult('Socket Connection', { error: error });
    }

    // Test 4: CORS Test (simple fetch)
    try {
      const corsTest = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const corsData = await corsTest.json();
      addResult('CORS Test (Fetch)', {
        status: corsTest.status,
        ok: corsTest.ok,
        data: corsData
      });
    } catch (error) {
      addResult('CORS Test (Fetch)', { error: error });
    }

    setLoading(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">API Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex gap-4 mb-6">
            <button
              onClick={runAllTests}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-md font-medium"
            >
              {loading ? 'Running Tests...' : 'Run All Tests'}
            </button>
            <button
              onClick={clearResults}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-md font-medium"
            >
              Clear Results
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div key={index} className="border rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-semibold text-gray-800">{result.test}</h3>
                  <span className="text-sm text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <pre className="bg-gray-800 text-green-400 p-3 rounded text-sm overflow-x-auto">
                  {JSON.stringify(result.result, null, 2)}
                </pre>
              </div>
            ))}
          </div>

          {testResults.length === 0 && !loading && (
            <div className="text-center text-gray-500 py-8">
              Click &quot;Run All Tests&quot; to check API connectivity
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-yellow-800 mb-3">How to Debug:</h2>
          <ul className="list-disc list-inside space-y-2 text-yellow-700">
            <li><strong>Open Browser DevTools</strong> (F12) and go to Console tab</li>
            <li><strong>Run the tests</strong> and watch both this page and console logs</li>
            <li><strong>Check Network tab</strong> in DevTools to see actual HTTP requests</li>
            <li><strong>Look for CORS errors</strong> in console (will show as red errors)</li>
            <li><strong>Backend logs</strong> will show in your Render deployment logs</li>
            <li><strong>If tests fail</strong>, check the error messages for clues</li>
          </ul>
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-800 mb-3">Expected Results:</h2>
          <ul className="list-disc list-inside space-y-2 text-blue-700">
            <li><strong>Environment Variables:</strong> Should show your Render backend URL</li>
            <li><strong>API Health Check:</strong> Should return {'{status: "OK", ...}'}</li>
            <li><strong>Socket Connection:</strong> Should show connected: true</li>
            <li><strong>CORS Test:</strong> Should return same as health check without errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
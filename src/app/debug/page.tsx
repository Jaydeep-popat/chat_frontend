'use client';

export default function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Information</h1>
      <div className="space-y-2">
        <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_API_URL || 'Not set'}</p>
        <p><strong>Socket URL:</strong> {process.env.NEXT_PUBLIC_SOCKET_URL || 'Not set'}</p>
        <p><strong>NODE_ENV:</strong> {process.env.NODE_ENV}</p>
      </div>
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <h2 className="font-bold">All NEXT_PUBLIC_ variables:</h2>
        <pre className="text-sm">
          {JSON.stringify(
            Object.fromEntries(
              Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
            ),
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
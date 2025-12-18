import { useEffect, useState } from 'react';

function App() {
  const [status, setStatus] = useState('Connecting...');

  useEffect(() => {
    fetch('http://localhost:5000/api/health')
      .then(res => res.json())
      .then(data => setStatus(data.message + " (PostGIS: " + data.postgis + ")"))
      .catch(err => setStatus('Backend Offline ❌'));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-xl text-center border-t-4 border-primary">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">MissingU Platform</h1>
        <p className="text-black font-medium text-lg">
          System Status: <span className="text-gray-600">{status}</span>
        </p>
        <div className="mt-6 px-4 py-2 bg-primary text-black rounded-full inline-block animate-pulse">
          Milestone 1: Ready to Build!
        </div>
      </div>
    </div>
  );
}

export default App;
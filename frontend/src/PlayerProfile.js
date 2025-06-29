import React, { useState, useEffect } from 'react';
import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Simple admin check (replace with your logic)
const ADMIN_EMAILS = ['inavator@hotmail.com']; // Add your admin emails here

function PlayerProfile({ appId = 'default-app-id', userId, onBack }) {
  const [stats, setStats] = useState(null);
  const [allStats, setAllStats] = useState([]);
  const [searchId, setSearchId] = useState(() => localStorage.getItem('lastPlayerId') || userId || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Simple admin check (optional, can be removed or replaced)
  const isAdmin = false; // No user context, so admin features are hidden by default

  // Fetch stats for a single player
  const fetchStats = async (uid) => {
    setLoading(true);
    setError('');
    try {
      const ref = doc(db, `artifacts/${appId}/public/data/playerStats`, uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setStats({ id: uid, ...snap.data() });
        localStorage.setItem('lastPlayerId', uid);
      } else {
        setStats(null);
        setError('No stats found for this player.');
      }
    } catch (err) {
      setError('Error fetching stats.');
    }
    setLoading(false);
  };

  // Fetch all player stats (admin only)
  const fetchAllStats = async () => {
    setLoading(true);
    setError('');
    try {
      const q = collection(db, `artifacts/${appId}/public/data/playerStats`);
      const snap = await getDocs(q);
      setAllStats(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      setError('Error fetching all player stats.');
    }
    setLoading(false);
  };

  // On mount, auto-fetch if searchId is present
  useEffect(() => {
    // If searchId is empty and userId is available, set searchId to userId
    if (!searchId && userId) {
      setSearchId(userId);
      return;
    }
    if (searchId) fetchStats(searchId);
    // eslint-disable-next-line
  }, [userId, searchId]);

  // Search for a specific player
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchId) fetchStats(searchId);
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white text-black rounded shadow-lg relative">
      {onBack && (
        <button
          className="mb-4 text-2xl text-gray-700 hover:text-black focus:outline-none flex items-center"
          onClick={onBack}
          aria-label="Back"
        >
          <span className="mr-2">\u2190</span> Back
        </button>
      )}
      <h2 className="text-2xl font-bold mb-4 text-center">Player Profile</h2>
      <form onSubmit={handleSearch} className="flex gap-2 mb-6">
        <input
          type="text"
          placeholder="Enter Player ID"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
          className="border px-2 py-1 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded">Search</button>
      </form>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-500">{error}</div>}
      {stats && (
        <div className="border rounded p-4 mb-4 bg-gray-50">
          <h3 className="font-semibold text-lg mb-2">{stats.name || stats.id}</h3>
          <ul className="space-y-1">
            <li><b>Games Played:</b> {stats.gamesPlayed || 0}</li>
            <li><b>Wins:</b> {stats.wins || 0}</li>
            <li><b>Rounds Played:</b> {stats.roundsPlayed || 0}</li>
            <li><b>Answers Submitted:</b> {stats.answersSubmitted || 0}</li>
            <li><b>Custom Answers Submitted:</b> {stats.customAnswersSubmitted || 0}</li>
            <li><b>Votes Received:</b> {stats.votesReceived || 0}</li>
            <li><b>Hearts Received:</b> {stats.heartsReceived || 0}</li>
            <li><b>Red Flags Received:</b> {stats.redFlagsReceived || 0}</li>
            <li><b>Last Played:</b> {stats.lastPlayed ? new Date(stats.lastPlayed.seconds * 1000).toLocaleString() : 'N/A'}</li>
          </ul>
        </div>
      )}
      {!loading && !stats && !error && <div>Enter your Player ID to view your stats.</div>}
      {isAdmin && (
        <div className="mt-6">
          <button onClick={fetchAllStats} className="text-sm underline">Show All Players</button>
        </div>
      )}
      {isAdmin && allStats.length > 0 && (
        <div>
          <h4 className="font-semibold mb-2">All Players</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-xs">
              <thead>
                <tr>
                  <th className="border px-2">Name</th>
                  <th className="border px-2">ID</th>
                  <th className="border px-2">Games</th>
                  <th className="border px-2">Wins</th>
                  <th className="border px-2">Rounds</th>
                  <th className="border px-2">Answers</th>
                  <th className="border px-2">Custom</th>
                  <th className="border px-2">Votes</th>
                  <th className="border px-2">Hearts</th>
                  <th className="border px-2">Red Flags</th>
                  <th className="border px-2">Last Played</th>
                </tr>
              </thead>
              <tbody>
                {allStats.map(p => (
                  <tr key={p.id}>
                    <td className="border px-2">{p.name || ''}</td>
                    <td className="border px-2">{p.id}</td>
                    <td className="border px-2">{p.gamesPlayed || 0}</td>
                    <td className="border px-2">{p.wins || 0}</td>
                    <td className="border px-2">{p.roundsPlayed || 0}</td>
                    <td className="border px-2">{p.answersSubmitted || 0}</td>
                    <td className="border px-2">{p.customAnswersSubmitted || 0}</td>
                    <td className="border px-2">{p.votesReceived || 0}</td>
                    <td className="border px-2">{p.heartsReceived || 0}</td>
                    <td className="border px-2">{p.redFlagsReceived || 0}</td>
                    <td className="border px-2">{p.lastPlayed ? new Date(p.lastPlayed.seconds * 1000).toLocaleString() : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default PlayerProfile; 
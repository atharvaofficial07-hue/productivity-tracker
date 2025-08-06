// App.tsx

import React, { useState, useEffect } from 'react';
import './index.css';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { motion } from 'framer-motion';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

type UserType = 'Vaishnavi' | 'Aleena' | 'Atharva';

export default function App() {
  const [user, setUser] = useState<UserType>('Vaishnavi');
  const [page, setPage] = useState<'dashboard' | 'calendar'>('dashboard');
  const [score, setScore] = useState<number>(0);
  const [todayScore, setTodayScore] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const dateKey = new Date().toISOString().split('T')[0];

  const saveScore = async () => {
    await setDoc(doc(db, user, dateKey), { date: dateKey, score });
    setTodayScore(score);
    fetchAllScores();
  };

  const fetchTodayScore = async () => {
    const docSnap = await getDoc(doc(db, user, dateKey));
    if (docSnap.exists()) setTodayScore(docSnap.data().score);
    else setTodayScore(null);
  };

  const fetchAllScores = async () => {
    const col = collection(db, user);
    const snaps = await getDocs(col);
    const entries: Record<string, number> = {};
    snaps.forEach(s => entries[s.id] = s.data().score);
    setValues(entries);
  };

  const getQuote = (s: number) => {
    const low = ["Every small step counts!", "Keep going, you'll get there!"];
    const med = ["Good work! Keep building momentum.", "You're doing great!"];
    const high = ["Amazing consistency! You're crushing it!", "Outstanding effort!"];
    const quotes = s <= 3 ? low : s <= 7 ? med : high;
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  useEffect(() => {
    fetchTodayScore();
    fetchAllScores();
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-100 text-black">
      <header className="p-4 bg-indigo-600 text-white flex justify-between items-center">
        <h1 className="text-xl">Productivity Tracker</h1>
        <select
          value={user}
          onChange={e => setUser(e.target.value as UserType)}
          className="text-black p-1 rounded"
        >
          <option>Vaishnavi</option>
          <option>Aleena</option>
          <option>Atharva</option>
        </select>
      </header>

      <nav className="p-4 space-x-4">
        <button onClick={() => setPage('dashboard')} className="btn">Dashboard</button>
        <button onClick={() => setPage('calendar')} className="btn">Calendar</button>
      </nav>

      <main className="p-4">
        {page === 'dashboard' && (
          <>
            <h2 className="text-lg mb-2">Hi {user}! 👋</h2>
            <label className="block mb-2">Enter today’s productivity score (0–10):</label>
            <input
              type="number"
              min={0}
              max={10}
              value={score}
              onChange={e => setScore(Number(e.target.value))}
              className="px-2 py-1 border rounded w-20"
            />
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={saveScore}
              className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded"
            >
              Save
            </motion.button>

            {todayScore !== null && (
              <div className="mt-4 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded">
                <p>Your score for today: <strong>{todayScore}</strong></p>
                <p className="mt-2 italic">“{getQuote(todayScore)}”</p>
              </div>
            )}
          </>
        )}

        {page === 'calendar' && (
          <>
            <Calendar
              onClickDay={d => setSelectedDate(d)}
              tileContent={({ date }) => {
                const key = date.toISOString().split('T')[0];
                return values[key] !== undefined ? <div className="dot" /> : null;
              }}
            />
            {selectedDate && (
              <div className="mt-4">
                <h3 className="text-lg">{selectedDate.toDateString()}</h3>
                <p>Score: {values[selectedDate.toISOString().split('T')[0]] ?? 'Not set'}</p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

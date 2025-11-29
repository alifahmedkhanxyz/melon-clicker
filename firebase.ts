import firebase from "firebase/app";
import "firebase/database";
import "firebase/auth";
import { LeaderboardEntry } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyB9VtW1YpDfM9UynxFQvv9-OSRtf-U7Z_k",
  authDomain: "redent-royal.firebaseapp.com",
  databaseURL: "https://redent-royal-default-rtdb.firebaseio.com",
  projectId: "redent-royal",
  storageBucket: "redent-royal.firebasestorage.app",
  messagingSenderId: "683092186570",
  appId: "1:683092186570:web:aa3985c9c7f07bc38eeb33",
  measurementId: "G-B9LLS9R4ZW"
};

// Initialize Firebase
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = firebase.database();

// Authenticate immediately to ensure read/write access
auth.signInAnonymously().catch((err) => {
  console.error("Anonymous auth failed:", err);
});

export const submitScore = async (name: string, score: number) => {
  try {
    // Ensure we are authenticated before writing
    if (!auth.currentUser) {
      await auth.signInAnonymously();
    }
    
    const scoresRef = db.ref('scores');
    await scoresRef.push({
      name,
      score,
      timestamp: Date.now()
    });
  } catch (e) {
    console.error("Error submitting score", e);
  }
};

export const subscribeToLeaderboard = (callback: (scores: LeaderboardEntry[]) => void) => {
  const scoresRef = db.ref('scores').orderByChild('score').limitToLast(10);
  
  const listener = scoresRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      const parsedScores: LeaderboardEntry[] = Object.entries(data).map(([key, value]: [string, any]) => ({
        id: key,
        name: value.name,
        score: value.score,
        timestamp: value.timestamp
      }));
      // Sort descending
      callback(parsedScores.sort((a, b) => b.score - a.score));
    } else {
      callback([]);
    }
  }, (error: any) => {
    console.error("Leaderboard subscription error:", error);
  });

  // Return unsubscribe function
  return () => {
    scoresRef.off('value', listener);
  };
};
import { UserProgress } from "../types";

const STORAGE_KEY_TOTAL = 'rodent_royal_total';
const STORAGE_KEY_PLAYS = 'rodent_royal_plays';
const STORAGE_KEY_DATE = 'rodent_royal_date';
const STORAGE_KEY_MINED = 'rodent_royal_mined';

export const getProgress = (): UserProgress => {
  const today = new Date().toDateString();
  const storedDate = localStorage.getItem(STORAGE_KEY_DATE);
  
  let plays = 3;
  let minedDate = localStorage.getItem(STORAGE_KEY_MINED) || '';

  // Reset daily plays if new day
  if (storedDate !== today) {
    localStorage.setItem(STORAGE_KEY_DATE, today);
    localStorage.setItem(STORAGE_KEY_PLAYS, '3');
  } else {
    plays = parseInt(localStorage.getItem(STORAGE_KEY_PLAYS) || '3', 10);
  }

  const totalScore = parseInt(localStorage.getItem(STORAGE_KEY_TOTAL) || '0', 10);

  return {
    totalScore,
    playsLeft: plays,
    lastPlayedDate: today,
    lastMinedDate: minedDate
  };
};

export const saveProgress = (scoreToAdd: number, playsDecrement: number) => {
  const currentTotal = parseInt(localStorage.getItem(STORAGE_KEY_TOTAL) || '0', 10);
  const currentPlays = parseInt(localStorage.getItem(STORAGE_KEY_PLAYS) || '3', 10);
  
  localStorage.setItem(STORAGE_KEY_TOTAL, (currentTotal + scoreToAdd).toString());
  localStorage.setItem(STORAGE_KEY_PLAYS, (currentPlays - playsDecrement).toString());
};

export const markMinedToday = (amount: number) => {
   const today = new Date().toDateString();
   const currentTotal = parseInt(localStorage.getItem(STORAGE_KEY_TOTAL) || '0', 10);
   localStorage.setItem(STORAGE_KEY_TOTAL, (currentTotal + amount).toString());
   localStorage.setItem(STORAGE_KEY_MINED, today);
};
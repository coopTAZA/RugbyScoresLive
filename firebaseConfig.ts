import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCE5t6Qhs00PUV4CcKsr4j3baR3x5JgETE",
  authDomain: "football-scores-live-3da9f.firebaseapp.com",
  databaseURL:
    "https://football-scores-live-3da9f-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "football-scores-live-3da9f",
  storageBucket: "football-scores-live-3da9f.firebasestorage.app",
  messagingSenderId: "827352768127",
  appId: "1:827352768127:web:ee180bce9db662d5c1294a",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);

export const realtimeDb = getDatabase(
  app,
  "https://football-scores-live-3da9f-default-rtdb.europe-west1.firebasedatabase.app"
);
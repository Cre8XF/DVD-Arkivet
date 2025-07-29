import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHoNIX-Pu58-faT0IV0QfSajvx0j9hABQ",
  authDomain: "dvd-arkivet.firebaseapp.com",
  projectId: "dvd-arkivet",
  storageBucket: "dvd-arkivet.appspot.com",
  messagingSenderId: "936877330102",
  appId: "1:936877330102:web:8444ad9e0743617ea22017"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const collectionRef = collection(db, "movies");

export async function saveMovieToFirestore(movie) {
  if (!movie.id) movie.id = Date.now();
  await setDoc(doc(collectionRef, movie.id.toString()), movie);
}

export async function deleteMovieFromFirestore(id) {
  await deleteDoc(doc(collectionRef, id.toString()));
}

export async function loadMoviesFromFirestore() {
  const snapshot = await getDocs(collectionRef);
  return snapshot.docs.map(doc => doc.data());
}

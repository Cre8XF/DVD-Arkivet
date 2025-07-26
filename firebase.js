
// firebase.js – håndterer Firebase og Firestore

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, setDoc, doc } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyAHoNIX-Pu58-faT0IV0QfSajvx0j9hABQ",
  authDomain: "dvd-arkivet.firebaseapp.com",
  projectId: "dvd-arkivet",
  storageBucket: "dvd-arkivet.appspot.com",
  messagingSenderId: "936877330102",
  appId: "1:936877330102:web:8444ad9e0743617ea22017"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export async function fetchCollection() {
  const querySnapshot = await getDocs(collection(db, "movies"));
  return querySnapshot.docs.map(doc => doc.data());
}

export async function addMovieToFirestore(movie) {
  const ref = doc(db, "movies", movie.id.toString());
  await setDoc(ref, movie);
}

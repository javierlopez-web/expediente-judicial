// Funciones de Firebase que usa la aplicación (js/firebase-service.js). Se empaquetan en vendor/firebase.bundle.js.
export { initializeApp } from 'firebase/app';
export {
  getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
  setPersistence, browserLocalPersistence, browserSessionPersistence, inMemoryPersistence,
  updatePassword, deleteUser,
} from 'firebase/auth';
export {
  getFirestore, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, collection, query, where, orderBy, limit,
  runTransaction, serverTimestamp, Timestamp, writeBatch, deleteField, onSnapshot,
} from 'firebase/firestore';

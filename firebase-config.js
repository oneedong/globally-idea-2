// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyDgjeE5uqHpN37TMYAqqNcGqP_OSnLNxZI",
  authDomain: "kb-globally-idea-board.firebaseapp.com",
  projectId: "kb-globally-idea-board",
  storageBucket: "kb-globally-idea-board.appspot.com",
  messagingSenderId: "1033954928959",
  appId: "1:1033954928959:web:6470b2c9bec46ae99fcb8a",
  measurementId: "G-QMSNX7GMJW"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase 서비스 참조
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// 익스포트
window.firebaseServices = {
  auth,
  db,
  storage
}; 
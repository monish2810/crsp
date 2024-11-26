import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  get,
  getDatabase,
  ref,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";
// Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR-API",
  authDomain: "YOUR-AUTHDOMAIN",
  databaseURL: "YOUR-DATABASEURL",
  projectId: "YOUR-PROJECT-ID",
  storageBucket: "YOUR-STORAGEBUCKET",
  messagingSenderId: "YOUR MESSAGINGSENDERID",
  appId: "YOUR APPID",
  measurementId: "YOUR MEASUREMENTID",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

onAuthStateChanged(auth, (user) => {
  if (user) {
    const userId = user.uid;
    const userRef = ref(db, `users/${userId}`);

    get(userRef)
      .then((snapshot) => {
        if (snapshot.exists()) {
          const userData = snapshot.val();
          const firstName = userData.firstName;
          document.getElementById(
            "userNameDisplay"
          ).textContent = `Hey, ${firstName}`;
          document.getElementById("userProfileName").textContent = firstName;
        } else {
          console.log("No user data found");
        }
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  } else {
    console.log("User not signed in");
  }
});

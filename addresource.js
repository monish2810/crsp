import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  getDatabase,
  ref,
  set,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

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

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

setPersistence(auth, browserLocalPersistence).catch((error) =>
  console.error("Error setting persistence:", error)
);

onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("User signed in:", user.email);
    currentUser = user;
  } else {
    console.log("No user signed in.");
    currentUser = null;
  }
});

const logoutButton = document.getElementById("logoutButton");
logoutButton.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      console.log("User signed out successfully");
      alert("You have been signed out.");
      window.location.href = "Login.html";
    })
    .catch((error) => {
      console.error("Error signing out:", error);
    });
});

const saveFormButton = document.getElementById("saveFormButton");
saveFormButton.addEventListener("click", async (event) => {
  event.preventDefault();

  if (!currentUser) {
    alert("Please sign in to add a resource.");
    window.location.href = "Login.html";
    return;
  }

  const name = document.getElementById("nameInput").value.trim();
  const category = document.getElementById("categorySelect").value;
  const description = document.getElementById("descriptionInput").value.trim();
  const imageFile = document.getElementById("imageInput").files[0];

  if (!name || !category || !description || !imageFile) {
    alert("All fields are required!");
    return;
  }
  const wordCount = description.split(/\s+/).filter(Boolean).length;
  if (wordCount > 50) {
    alert(
      "Description should not exceed 50 words. Please shorten your description."
    );
    return;
  }

  try {
    // Convert image file to Base64 string
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Image = reader.result;

      const resourceId = new Date().getTime();
      const resourceData = {
        name,
        category,
        description,
        imageBase64: base64Image, // Save Base64 string in the database
        createdAt: new Date().toISOString(),
        seller: currentUser.email,
      };

      await set(ref(db, `resources/${resourceId}`), resourceData);

      alert("Resource added successfully!");
      console.log("Resource added successfully", resourceData);
    };

    reader.readAsDataURL(imageFile); // Read the image file as a Base64 string
  } catch (error) {
    console.error("Error saving resource:", error);
    alert("Error saving resource. Please try again.");
  }
});

// Firebase Initialization
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  onAuthStateChanged,
  setPersistence,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
  get,
  getDatabase,
  onValue,
  ref,
  set,
  update,
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDn6vGYuT6S76C-MBSh3K5POXKOmVncI0U",
  authDomain: "crsp-b37ed.firebaseapp.com",
  databaseURL: "https://crsp-b37ed-default-rtdb.firebaseio.com",
  projectId: "crsp-b37ed",
  storageBucket: "crsp-b37ed.appspot.com",
  messagingSenderId: "359516608789",
  appId: "1:359516608789:web:d484b2e71c14d47242b11c",
  measurementId: "G-LJJWEXSF1X",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

let currentUser = null;

// Set Persistence for Authentication
setPersistence(auth, browserLocalPersistence).catch((error) =>
  console.error("Error setting persistence:", error)
);

// Monitor Authentication State
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log(`User signed in: ${user.email}`);
    currentUser = user;
  } else {
    console.log("No user signed in.");
    currentUser = null;
  }
});

// Logout Functionality
document.getElementById("logoutButton").addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      alert("Signed out successfully!");
      window.location.href = "login.html";
    })
    .catch((error) => console.error("Logout error:", error));
});

// Helper function to encode email
function encodeEmail(email) {
  return email.replace(/\./g, "_");
}

// Display Resources Function
function displayResource(resourceData, resourceId) {
  const resourceContainer = document.getElementById("resourceContainer");

  const card = document.createElement("div");
  card.className = "resource-card";

  const img = document.createElement("img");
  img.src = resourceData.imageBase64?.startsWith("data:image")
    ? resourceData.imageBase64
    : "./assets/pic-1.jpg";
  img.alt = resourceData.name || "Resource Image";

  img.addEventListener("click", () => {
    const modalImg = document.getElementById("fullscreenImage");
    modalImg.src = img.src;
    const modal = new bootstrap.Modal(document.getElementById("imageModal"));
    modal.show();
  });

  const content = document.createElement("div");
  content.className = "resource-card-content";

  const title = document.createElement("h3");
  title.className =
    "resource-card-title lead display-5 text-uppercase font-weight-bold";
  title.textContent = resourceData.name;

  const category = document.createElement("p");
  category.className = "resource-card-category lead display-7 font-weight-bold";
  category.textContent = `Category: ${resourceData.category}`;

  const description = document.createElement("p");
  description.className = "resource-card-description lead display-7";
  description.textContent = resourceData.description;

  const footer = document.createElement("div");
  footer.className = "resource-card-footer";

  const seller = document.createElement("span");
  seller.className = "resource-card-seller";
  seller.textContent = `SELLER: ${resourceData.seller || "Anonymous"}`;

  const buyButton = document.createElement("button");
  buyButton.className = "resource-card-buy font-weight-bold buy-button";
  buyButton.textContent = "Buy";
  buyButton.disabled = resourceData.seller === currentUser?.email;
  buyButton.dataset.resourceId = resourceId;

  footer.appendChild(seller);
  footer.appendChild(buyButton);
  content.appendChild(title);
  content.appendChild(category);
  content.appendChild(description);
  card.appendChild(img);
  card.appendChild(content);
  card.appendChild(footer);
  resourceContainer.appendChild(card);

  buyButton.addEventListener("click", handleBuyButtonClick);
}

// Fetch and Display Resources from Database
const resourcesRef = ref(db, "resources");
onValue(resourcesRef, (snapshot) => {
  const resourceContainer = document.getElementById("resourceContainer");
  resourceContainer.innerHTML = ""; // Clear existing cards

  snapshot.forEach((childSnapshot) => {
    const resourceData = childSnapshot.val();
    const resourceId = childSnapshot.key;
    resourceData.id = resourceId; // Add resource ID to data
    displayResource(resourceData, resourceId);
  });
});

// Handle Buy Button Click
async function handleBuyButtonClick(event) {
  const resourceId = event.target.dataset.resourceId;

  if (!resourceId) {
    console.error("Resource ID not found on the button.");
    alert("Failed to identify the resource. Please try again.");
    return;
  }

  try {
    const resourceRef = ref(db, `resources/${resourceId}`);
    const resourceSnapshot = await get(resourceRef);

    if (!resourceSnapshot.exists()) {
      alert("Resource not found.");
      return;
    }

    const resourceData = resourceSnapshot.val();

    if (resourceData.seller === currentUser?.email) {
      alert("You cannot buy your own resource.");
      return;
    }

    const encodedBuyerEmail = encodeEmail(currentUser.email);
    const encodedSellerEmail = encodeEmail(resourceData.seller);

    const transactionId = `${new Date().getTime()}_${encodedBuyerEmail}`;
    const transactionData = {
      buyer: currentUser.email,
      seller: resourceData.seller,
      resourceName: resourceData.name,
      resourceId: resourceId,
      status: "Pending",
    };

    // Add transaction to the database
    const transactionRef = ref(db, `pendingTransactions/${transactionId}`);
    await set(transactionRef, transactionData);

    // Add notification for the seller
    const sellerNotificationRef = ref(
      db,
      `notifications/${encodedSellerEmail}/${transactionId}`
    );
    await set(sellerNotificationRef, {
      buyer: currentUser.email,
      resourceName: resourceData.name,
      status: "Pending",
      resourceId,
    });

    // Add notification for the buyer
    const buyerNotificationRef = ref(
      db,
      `notifications/${encodedBuyerEmail}/${transactionId}`
    );
    await set(buyerNotificationRef, {
      seller: resourceData.seller,
      resourceName: resourceData.name,
      status: "Pending",
      resourceId,
    });

    alert(
      "Purchase request sent! You and the seller will receive notifications."
    );
  } catch (error) {
    console.error("Error processing the purchase:", error);
    alert("Failed to process the purchase request. Please try again.");
  }
}

// Fetch and Display Buyer Notifications
document
  .getElementById("notificationButton")
  .addEventListener("click", fetchBuyerNotifications);

async function fetchBuyerNotifications() {
  const resourceContainer = document.getElementById("resourceContainer");
  resourceContainer.style.display = "none";

  if (!currentUser) {
    alert("You need to be logged in to view notifications.");
    return;
  }

  const buyerEmailEncoded = encodeEmail(currentUser.email);
  const buyerNotificationsRef = ref(db, `notifications/${buyerEmailEncoded}`);

  try {
    const snapshot = await get(buyerNotificationsRef);

    if (snapshot.exists()) {
      const buyerNotifications = snapshot.val();
      displayNotifications(buyerNotifications);
    } else {
      document.getElementById("notifications").innerHTML =
        "<p>No notifications available</p>";
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
  }
}

// Display Notifications
function displayNotifications(notifications) {
  const container = document.getElementById("notificationContent");
  container.innerHTML = ""; // Clear previous notifications

  for (const [id, data] of Object.entries(notifications)) {
    const notificationElement = document.createElement("div");
    notificationElement.className = "notification-card mb-2 p-3";

    // Correctly display the seller's email for buyer notifications
    const participant = data.seller || data.buyer || "N/A";
    const participantLabel = data.seller ? "Seller" : "Buyer";

    notificationElement.innerHTML = `
      <div><strong>${participantLabel}:</strong> ${participant}</div>
      <div><strong>Resource:</strong> ${data.resourceName || "N/A"}</div>
      <div><strong>Status:</strong> ${data.status || "Pending"}</div>
      <div class="mt-2">
        <button class="btn btn-sm accept-btn" onclick="updateNotificationStatus('${id}', '${
      data.resourceId
    }', 'Accepted')">Accept</button>
        <button class="btn btn-sm reject-btn" onclick="updateNotificationStatus('${id}', '${
      data.resourceId
    }', 'Rejected')">Reject</button>
      </div>
    `;
    container.appendChild(notificationElement);
  }
}

// Update Notification Status (Accept/Reject)
window.updateNotificationStatus = async function updateNotificationStatus(
  notificationId,
  resourceId,
  status
) {
  const encodedEmail = encodeEmail(currentUser.email);

  try {
    // Update the notification status for the current user
    const notificationRef = ref(
      db,
      `notifications/${encodedEmail}/${notificationId}`
    );
    await update(notificationRef, { status });

    // Update the transaction status in `pendingTransactions`
    const transactionRef = ref(db, `pendingTransactions/${notificationId}`);
    const transactionSnapshot = await get(transactionRef);

    if (!transactionSnapshot.exists()) {
      alert("Transaction not found.");
      return;
    }

    const transactionData = transactionSnapshot.val();

    // Check if both buyer and seller have accepted
    const buyerAccepted =
      transactionData.buyer === currentUser.email && status === "Accepted";
    const sellerAccepted =
      transactionData.seller === currentUser.email && status === "Accepted";

    const updatedStatus = {
      ...transactionData,
      [`${
        currentUser.email === transactionData.buyer ? "buyer" : "seller"
      }Status`]: status,
    };

    await update(transactionRef, updatedStatus);

    if (
      updatedStatus.buyerStatus === "Accepted" &&
      updatedStatus.sellerStatus === "Accepted"
    ) {
      // Move transaction to history
      const historyRef = ref(db, `historyTransactions/${notificationId}`);
      await set(historyRef, { ...transactionData, status: "Completed" });

      await set(transactionRef, null);
      const encodedBuyerEmail = encodeEmail(transactionData.buyer);
      const encodedSellerEmail = encodeEmail(transactionData.seller);

      const buyerNotificationRef = ref(
        db,
        `notifications/${encodedBuyerEmail}/${notificationId}`
      );
      const sellerNotificationRef = ref(
        db,
        `notifications/${encodedSellerEmail}/${notificationId}`
      );

      await set(buyerNotificationRef, null);
      await set(sellerNotificationRef, null);
      const resourceRef = ref(db, `resources/${resourceId}`);
      await set(resourceRef, null);

      alert("Transaction completed and moved to history!");
    } else {
      alert(`Status updated to ${status}. Waiting for the other party.`);
    }
  } catch (error) {
    console.error("Error updating notification:", error);
    alert("Failed to update notification status.");
  }
};

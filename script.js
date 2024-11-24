document.addEventListener("DOMContentLoaded", () => {
  const profile = document.querySelector(".header-1 .flex .profile");
  const userBtn = document.getElementById("user-btn");
  const search = document.querySelector(".header-1 .flex .search-form");
  const searchBtn = document.getElementById("search-btn");

  const resourceModal = new bootstrap.Modal(
    document.getElementById("resourceForm")
  );
  document
    .getElementById("addResource")
    .addEventListener("click", function (event) {
      event.preventDefault();
      resourceModal.show();
    });

  const toggleClass = (element, className) => {
    if (element && className) {
      element.classList.toggle(className);
    } else {
      console.error("Element or className not provided.");
    }
  };

  if (userBtn && profile) {
    userBtn.addEventListener("click", () => {
      toggleClass(profile, "active");
      if (search.classList.contains("active")) {
        search.classList.remove("active");
      }
    });
  } else {
    console.error("User button or profile element not found.");
  }

  if (searchBtn && search) {
    searchBtn.addEventListener("click", () => {
      toggleClass(search, "active");
      if (profile.classList.contains("active")) {
        profile.classList.remove("active");
      }
    });
  } else {
    console.error("Search button or search form element not found.");
  }

  window.addEventListener("scroll", () => {
    if (profile && profile.classList.contains("active")) {
      profile.classList.remove("active");
    }
    if (search && search.classList.contains("active")) {
      search.classList.remove("active");
    }
  });

  const saveFormButton = document.getElementById("saveFormButton");
  saveFormButton.addEventListener("click", (event) => {
    event.preventDefault();

    const name = document.getElementById("nameInput").value;
    const category = document.getElementById("categorySelect").value;
    const description = document.getElementById("descriptionInput").value;

    if (!name || !category || !description) {
      alert("Please fill all required fields.");
      return;
    }

    console.log("Resource added successfully!");
    alert("Resource added successfully!");

    document.getElementById("nameInput").value = "";
    document.getElementById("categorySelect").value = "";
    document.getElementById("descriptionInput").value = "";
    resourceModal.hide();
  });
});

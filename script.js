// === Theme Toggle ===
const themeToggle = document.getElementById("theme-toggle");
themeToggle.addEventListener("click", () => {
  const currentTheme = document.documentElement.getAttribute("data-theme");
  if (currentTheme === "dark") {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "light");
  } else {
    document.documentElement.setAttribute("data-theme", "dark");
    localStorage.setItem("theme", "dark");
  }
});

// === Initialize on DOM Load ===
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  }

  loadBookData();
  loadBoardFromDate();
  setupGrid();
});

// === Modal Logic ===
const modal = document.getElementById("how-to-play");
const helpBtn = document.getElementById("help-btn");
const closeBtn = document.querySelector(".close-btn");

window.addEventListener("load", () => {
  modal.classList.remove("hidden");
});

helpBtn.addEventListener("click", () => {
  modal.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// === Book JSON Loader ===
let allBooks = [];
let acceptedTitles = [];

async function loadBookData() {
  try {
    const response = await fetch("books.json");
    allBooks = await response.json();
    acceptedTitles = allBooks.map(book => book.title.toLowerCase());
    console.log("Book titles loaded:", acceptedTitles);
  } catch (err) {
    console.error("Error loading books.json:", err);
  }
}

// === Board Loader (Stub) ===
function loadBoardFromDate() {
  const startDate = new Date("2025-05-05");
  const today = new Date();
  const diffDays = Math.floor((today - startDate) / (1000 * 60 * 60 * 24));
  const boardNumber = diffDays + 1;
  const boardPath = `boards/board-${boardNumber.toString().padStart(3, "0")}.json`;

  console.log("Would load board from:", boardPath);
}

// === Grid Setup: Input + Autocomplete Logic ===
function setupGrid() {
  const boxes = document.querySelectorAll(".grid-box");

  boxes.forEach(box => {
    const input = box.querySelector(".cell-input");
    const dropdown = box.querySelector(".autocomplete");
    let activeIndex = -1;

    // Click anywhere in the box to focus input
    box.addEventListener("click", () => {
      input.focus();
    });

    // Select all on focus
    input.addEventListener("focus", () => {
      input.select();
    });

    // Handle typing input
    input.addEventListener("input", () => {
      const value = input.value.toLowerCase().trim();
      dropdown.innerHTML = "";
      activeIndex = -1;

      if (value.length >= 1) {
        const matches = acceptedTitles
          .filter(title => title.includes(value))
          .slice(0, 5);

        if (matches.length > 0) {
          matches.forEach((match, index) => {
            const item = document.createElement("div");
            item.textContent = match;
            item.classList.add("autocomplete-item");

            // Click to select
            item.addEventListener("click", () => {
              input.value = match;
              dropdown.innerHTML = "";
              dropdown.style.display = "none";
              input.focus();
            });

            dropdown.appendChild(item);
          });

          dropdown.style.display = "block";
        } else {
          dropdown.style.display = "none";
        }
      } else {
        dropdown.style.display = "none";
      }
    });

    // Keyboard navigation
    input.addEventListener("keydown", (e) => {
      const items = dropdown.querySelectorAll(".autocomplete-item");

      if (dropdown.style.display === "block" && items.length > 0) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          activeIndex = (activeIndex + 1) % items.length;
          updateActive(items);
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          activeIndex = (activeIndex - 1 + items.length) % items.length;
          updateActive(items);
        } else if (e.key === "Enter") {
          e.preventDefault();
          if (activeIndex >= 0 && items[activeIndex]) {
            input.value = items[activeIndex].textContent;
            dropdown.innerHTML = "";
            dropdown.style.display = "none";
          }
        }
      }
    });

    // Hide on blur
    input.addEventListener("blur", () => {
      setTimeout(() => {
        dropdown.style.display = "none";
      }, 100);
    });

    function updateActive(items) {
      items.forEach((item, i) => {
        item.classList.toggle("active", i === activeIndex);
      });
    }
  });
}

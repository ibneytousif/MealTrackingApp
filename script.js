// Modular Firebase version
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getDatabase,
  ref,
  push,
  set,
  get,
  child,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import {
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "REPLACE_ME",
  authDomain: "REPLACE_ME.firebaseapp.com",
  databaseURL:
    "https://foodtackfinance-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "REPLACE_ME",
  storageBucket: "REPLACE_ME.appspot.com",
  messagingSenderId: "REPLACE_ME",
  appId: "REPLACE_ME",
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// Success Modal Functions
function showSuccessModal(title, message) {
  const modal = document.getElementById("success-modal");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");

  modalTitle.textContent = title;
  modalMessage.textContent = message;
  modal.style.display = "block";

  // Auto-close after 3 seconds
  setTimeout(() => {
    hideSuccessModal();
  }, 3000);
}

function hideSuccessModal() {
  const modal = document.getElementById("success-modal");
  modal.style.display = "none";
}

function initModal() {
  const modal = document.getElementById("success-modal");
  const closeBtn = document.querySelector(".close");
  const okBtn = document.getElementById("modal-ok-btn");

  // Close modal when clicking X
  closeBtn?.addEventListener("click", hideSuccessModal);

  // Close modal when clicking OK
  okBtn?.addEventListener("click", hideSuccessModal);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      hideSuccessModal();
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initModal();
  initMealTags();
  initMealChipInput();
  initUserCheckboxes();
  initDashboardFilters();
  bindForms();
  loadUsersIntoSelects();
  loadUsersIntoCheckboxes();
  initManageUsers();
  initExportButtons();
});

function initTabs() {
  const tabButtons = document.querySelectorAll(".tab-button");
  const tabContents = document.querySelectorAll(".tab-content");
  tabButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = btn.getAttribute("data-tab");
      const section = document.getElementById(target);
      if (section) section.classList.add("active");
    });
  });
}

function initMealTags() {
  const mealTags = document.querySelectorAll(".quick-add-btn");
  mealTags.forEach((tag) => {
    tag.addEventListener("click", () => {
      const mealName = tag.getAttribute("data-meal") || tag.textContent.trim();
      addMealChip(mealName);
    });
  });
}

// Meal chip input functionality
let mealChips = [];

function initMealChipInput() {
  const chipInput = document.getElementById("meal-chip-input");
  if (!chipInput) return;

  chipInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = chipInput.value.trim();
      if (value) {
        addMealChip(value);
        chipInput.value = "";
      }
    } else if (
      e.key === "Backspace" &&
      chipInput.value === "" &&
      mealChips.length > 0
    ) {
      // Remove last chip on backspace when input is empty
      removeMealChip(mealChips.length - 1);
    }
  });

  // Also allow comma to add chip
  chipInput.addEventListener("input", (e) => {
    const value = chipInput.value;
    if (value.includes(",")) {
      const meals = value
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean);
      meals.forEach((meal) => addMealChip(meal));
      chipInput.value = "";
    }
  });
}

function addMealChip(mealName) {
  if (!mealName || mealChips.includes(mealName)) return;

  mealChips.push(mealName);
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

function removeMealChip(index) {
  mealChips.splice(index, 1);
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

function updateMealCount() {
  const counter = document.getElementById("meal-count-inline");
  if (!counter) return;

  const count = mealChips.length;
  counter.textContent = count === 1 ? "1 meal" : `${count} meals`;
}

function updateSummaryCards() {
  // Update date summary
  const dateSummary = document.getElementById("date-summary-value");
  const dateInput = document.getElementById("meal-date");
  if (dateSummary && dateInput) {
    if (dateInput.value) {
      const date = new Date(dateInput.value + "T00:00:00");
      dateSummary.textContent = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } else {
      dateSummary.textContent = "Not selected";
    }
  }

  // Update users summary
  const usersSummary = document.getElementById("users-summary-value");
  const userCount = getSelectedUserIds().length;
  if (usersSummary) {
    usersSummary.textContent =
      userCount === 0
        ? "0 users"
        : userCount === 1
        ? "1 user"
        : `${userCount} users`;
  }

  // Update meals summary
  const mealsSummary = document.getElementById("meals-summary-value");
  const mealCount = mealChips.length;
  if (mealsSummary) {
    mealsSummary.textContent =
      mealCount === 0
        ? "0 meals"
        : mealCount === 1
        ? "1 meal"
        : `${mealCount} meals`;
  }
}

function renderMealChips() {
  const container = document.getElementById("meal-chips");
  if (!container) return;

  container.innerHTML = "";
  mealChips.forEach((meal, index) => {
    const chip = document.createElement("div");
    chip.className = "meal-chip";
    chip.innerHTML = `
			<span>${meal}</span>
			<span class="meal-chip-remove" data-index="${index}">×</span>
		`;
    chip.querySelector(".meal-chip-remove").addEventListener("click", () => {
      removeMealChip(index);
    });
    container.appendChild(chip);
  });
}

function clearMealChips() {
  mealChips = [];
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

// User checkbox functionality
function initUserCheckboxes() {
  const selectAllCheckbox = document.getElementById("select-all-users");
  const addUserBtn = document.getElementById("add-user-from-meal");
  const dateInput = document.getElementById("meal-date");

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener("change", (e) => {
      const checkboxes = document.querySelectorAll(
        '#user-checkbox-list input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => {
        cb.checked = e.target.checked;
      });
      updateUserSelectionCounter();
      updateEntryPreview();
      updateSummaryCards();
    });
  }

  if (addUserBtn) {
    addUserBtn.addEventListener("click", async () => {
      const name = prompt("Enter new user name");
      if (name && name.trim().length > 0) {
        try {
          const id = await createUser(name.trim());
          showSuccessModal(
            "User Created!",
            `Successfully created user "${name.trim()}"`
          );
          await loadUsersIntoCheckboxes(id);
          await loadUsersIntoSelects(id);
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }

  if (dateInput) {
    dateInput.addEventListener("change", () => {
      updateSummaryCards();
    });
  }

  // Delegate event for individual checkbox changes
  document.addEventListener("change", (e) => {
    if (e.target.matches('#user-checkbox-list input[type="checkbox"]')) {
      updateSelectAllState();
      updateUserSelectionCounter();
      updateEntryPreview();
      updateSummaryCards();
    }
  });
}

async function loadUsersIntoCheckboxes(selectUserIdToCheck) {
  const snap = await get(child(ref(db), "users"));
  const container = document.getElementById("user-checkbox-list");
  if (!container) return;

  container.innerHTML = "";

  if (snap.exists()) {
    const usersObj = snap.val();
    const users = Object.entries(usersObj)
      .filter(([_, data]) => data && data.active !== false)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    if (users.length === 0) {
      container.innerHTML =
        '<div class="loading-text">No active users found</div>';
      return;
    }

    users.forEach(({ id, name }) => {
      const item = document.createElement("div");
      item.className = "user-checkbox-item";
      item.innerHTML = `
				<label>
					<input type="checkbox" value="${id}" ${
        selectUserIdToCheck === id ? "checked" : ""
      } />
					<span class="checkbox-label">${name}</span>
				</label>
			`;
      container.appendChild(item);
    });
  } else {
    container.innerHTML = '<div class="loading-text">No users available</div>';
  }

  updateSelectAllState();
  updateUserSelectionCounter();
  updateEntryPreview();
  updateSummaryCards();
}

function updateSelectAllState() {
  const selectAllCheckbox = document.getElementById("select-all-users");
  const checkboxes = document.querySelectorAll(
    '#user-checkbox-list input[type="checkbox"]'
  );

  if (!selectAllCheckbox || checkboxes.length === 0) return;

  const checkedCount = [...checkboxes].filter((cb) => cb.checked).length;

  if (checkedCount === 0) {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = false;
  } else if (checkedCount === checkboxes.length) {
    selectAllCheckbox.checked = true;
    selectAllCheckbox.indeterminate = false;
  } else {
    selectAllCheckbox.checked = false;
    selectAllCheckbox.indeterminate = true;
  }
}

function updateUserSelectionCounter() {
  const counter = document.getElementById("user-selection-counter");
  const checkboxes = document.querySelectorAll(
    '#user-checkbox-list input[type="checkbox"]:checked'
  );

  if (!counter) return;

  const count = checkboxes.length;
  if (count === 0) {
    counter.textContent = "No users selected";
  } else if (count === 1) {
    counter.textContent = "1 user";
  } else {
    counter.textContent = `${count} users`;
  }
}

function getSelectedUserIds() {
  const checkboxes = document.querySelectorAll(
    '#user-checkbox-list input[type="checkbox"]:checked'
  );
  return [...checkboxes].map((cb) => cb.value);
}

function updateEntryPreview() {
  const preview = document.getElementById("entry-preview");
  if (!preview) return;

  const userCount = getSelectedUserIds().length;
  const mealCount = mealChips.length;
  const totalEntries = userCount * mealCount;

  const previewIcon = preview.querySelector(".preview-icon");
  const previewText = preview.querySelector(".preview-text");

  if (!previewIcon || !previewText) return;

  if (userCount === 0 && mealCount === 0) {
    previewIcon.textContent = "ℹ️";
    previewText.textContent = "Select date, users and add meals to begin";
    preview.className = "preview-box";
  } else if (userCount === 0) {
    previewIcon.textContent = "⚠️";
    previewText.textContent = "Please select at least one user to continue";
    preview.className = "preview-box error";
  } else if (mealCount === 0) {
    previewIcon.textContent = "⚠️";
    previewText.textContent = "Please add at least one meal to continue";
    preview.className = "preview-box error";
  } else if (totalEntries > 50) {
    previewIcon.textContent = "⚠️";
    previewText.textContent = `Large batch: ${totalEntries} entries will be created (${userCount} users × ${mealCount} meals)`;
    preview.className = "preview-box warning";
  } else {
    previewIcon.textContent = "✅";
    previewText.textContent = `Ready to create ${totalEntries} meal ${
      totalEntries === 1 ? "entry" : "entries"
    } (${userCount} ${userCount === 1 ? "user" : "users"} × ${mealCount} ${
      mealCount === 1 ? "meal" : "meals"
    })`;
    preview.className = "preview-box";
  }
}

function bindForms() {
  const revenueForm = document.getElementById("revenue-form");
  const expenseForm = document.getElementById("expense-form");
  const mealForm = document.getElementById("meal-form");
  // Add new user via special option logic
  document.addEventListener("change", (e) => {
    const target = e.target;
    if (
      target.classList?.contains("user-select") &&
      target.value === "__add_new__"
    ) {
      const name = prompt("Enter new user name");
      if (name && name.trim().length > 0) {
        createUser(name.trim())
          .then((id) => {
            showSuccessModal(
              "User Created!",
              `Successfully created user "${name.trim()}"`
            );
            loadUsersIntoSelects(id); // repopulate and select new user
          })
          .catch((err) => {
            alert(err.message);
            target.value = ""; // Reset select to empty
          });
      } else {
        target.value = "";
      }
    }
  });

  revenueForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("revenue-date").value;
    const user = document.getElementById("revenue-name").value;
    const amount = parseFloat(
      document.getElementById("revenue-amount").value || "0"
    );
    if (!date || !user || !amount) return alert("Fill all revenue fields.");

    try {
      if (user === "__all_users__") {
        // Add revenue for all active users
        const userIds = await getAllActiveUserIds();
        if (userIds.length === 0) return alert("No active users found.");

        const promises = userIds.map((userId) => {
          const newRef = push(ref(db, "revenue"));
          return set(newRef, { date, userId, amount, createdAt: Date.now() });
        });

        await Promise.all(promises);
        revenueForm.reset();
        showSuccessModal(
          "Revenue Saved!",
          `Successfully added revenue entry of BDT ${amount} for ${userIds.length} users on ${date}`
        );
      } else {
        // Add revenue for single user
        const newRef = push(ref(db, "revenue"));
        await set(newRef, {
          date,
          userId: user,
          amount,
          createdAt: Date.now(),
        });
        revenueForm.reset();
        showSuccessModal(
          "Revenue Saved!",
          `Successfully added revenue entry of BDT ${amount} for ${date}`
        );
      }
      updateDashboardTotals();
    } catch (err) {
      alert("Revenue error: " + err.message);
    }
  });

  expenseForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("expense-date").value;
    const user = document.getElementById("expense-user").value;
    const amount = parseFloat(
      document.getElementById("expense-amount").value || "0"
    );
    const receipt = document.getElementById("expense-receipt").value.trim();
    console.log("Expense form submission:", { date, user, amount, receipt });
    if (!date || !user || !amount) return alert("Fill all expense fields.");

    try {
      if (user === "__all_users__") {
        // Add expense for all active users
        const userIds = await getAllActiveUserIds();
        if (userIds.length === 0) return alert("No active users found.");

        const promises = userIds.map((userId) => {
          const newRef = push(ref(db, "expenses"));
          const dataToSave = {
            date,
            userId,
            amount,
            receipt,
            createdAt: Date.now(),
          };
          console.log("Saving expense data:", dataToSave);
          return set(newRef, dataToSave);
        });

        await Promise.all(promises);
        expenseForm.reset();
        showSuccessModal(
          "Expense Saved!",
          `Successfully added expense entry of BDT ${amount} for ${userIds.length} users on ${date}`
        );
      } else {
        // Add expense for single user
        const newRef = push(ref(db, "expenses"));
        const dataToSave = {
          date,
          userId: user,
          amount,
          receipt,
          createdAt: Date.now(),
        };
        console.log("Saving single expense data:", dataToSave);
        await set(newRef, dataToSave);
        expenseForm.reset();
        showSuccessModal(
          "Expense Saved!",
          `Successfully added expense entry of BDT ${amount} for ${date}`
        );
      }
      updateDashboardTotals();
    } catch (err) {
      alert("Expense error: " + err.message);
    }
  });

  mealForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const date = document.getElementById("meal-date").value;
    const selectedUserIds = getSelectedUserIds();
    const meals = [...mealChips];

    // Validation
    if (!date) {
      alert("Please select a date.");
      return;
    }
    if (selectedUserIds.length === 0) {
      alert("Please select at least one user.");
      return;
    }
    if (meals.length === 0) {
      alert("Please add at least one meal.");
      return;
    }

    const totalEntries = selectedUserIds.length * meals.length;

    // Confirmation for large batches
    if (totalEntries > 20) {
      const confirmed = confirm(
        `You are about to create ${totalEntries} meal entries (${selectedUserIds.length} users × ${meals.length} meals).\n\nDo you want to continue?`
      );
      if (!confirmed) return;
    }

    try {
      const promises = [];

      // Create meal entry for each user × meal combination
      selectedUserIds.forEach((userId) => {
        meals.forEach((mealName) => {
          const newRef = push(ref(db, "meals"));
          promises.push(
            set(newRef, {
              date,
              userId,
              mealName,
              tags: [],
              createdAt: Date.now(),
            })
          );
        });
      });

      await Promise.all(promises);

      // Reset form
      mealForm.reset();
      clearMealChips();
      const checkboxes = document.querySelectorAll(
        '#user-checkbox-list input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => (cb.checked = false));
      document.getElementById("select-all-users").checked = false;
      updateUserSelectionCounter();
      updateEntryPreview();
      updateSummaryCards();

      showSuccessModal(
        "Meals Saved!",
        `Successfully created ${totalEntries} meal entries for ${selectedUserIds.length} users on ${date}`
      );
      updateDashboardTotals();
    } catch (err) {
      alert("Meal error: " + err.message);
    }
  });
}

// ----- Users Handling -----
async function seedInitialUsers() {
  // Check if users exist
  const usersSnap = await get(child(ref(db), "users"));
  if (usersSnap.exists()) return; // already seeded
  const demo = [
    { name: "John Doe" },
    { name: "Jane Smith" },
    { name: "Alex Johnson" },
    { name: "Maria Garcia" },
  ];
  const base = ref(db, "users");
  const now = Date.now();
  for (const u of demo) {
    const newRef = push(base);
    await set(newRef, { name: u.name, createdAt: now, active: true });
  }
}

async function createUser(name) {
  // Prevent duplicate (case-insensitive) names
  const existingSnap = await get(child(ref(db), "users"));
  if (existingSnap.exists()) {
    const users = existingSnap.val();
    const match = Object.entries(users).find(
      ([_, u]) =>
        u && u.name && u.name.trim().toLowerCase() === name.trim().toLowerCase()
    );
    if (match) {
      // Don't create duplicate, throw error instead
      throw new Error(`User "${name}" already exists!`);
    }
  }
  const newRef = push(ref(db, "users"));
  await set(newRef, { name: name.trim(), createdAt: Date.now(), active: true });
  return newRef.key;
}

// Helper function to get all active user IDs
async function getAllActiveUserIds() {
  const snap = await get(child(ref(db), "users"));
  if (!snap.exists()) return [];
  const usersObj = snap.val();
  return Object.entries(usersObj)
    .filter(([_, data]) => data && data.active !== false)
    .map(([id, _]) => id);
}

async function loadUsersIntoSelects(selectUserIdToFocus) {
  const snap = await get(child(ref(db), "users"));
  const selects = document.querySelectorAll(".user-select");
  selects.forEach((sel) => {
    sel.innerHTML = "";
    const placeholder = document.createElement("option");
    placeholder.value = "";
    if (sel.id === "dash-user-filter" || sel.id === "export-user-filter") {
      placeholder.textContent = "All Users";
    } else {
      placeholder.textContent = "Select User";
    }
    sel.appendChild(placeholder);

    // Add "All Users" option for form selects (revenue, expense, meal)
    if (
      sel.id === "revenue-name" ||
      sel.id === "expense-user" ||
      sel.id === "meal-user"
    ) {
      const allUsersOpt = document.createElement("option");
      allUsersOpt.value = "__all_users__";
      allUsersOpt.textContent = "👥 All Users";
      sel.appendChild(allUsersOpt);
    }

    if (snap.exists()) {
      const usersObj = snap.val();
      Object.entries(usersObj).forEach(([id, data]) => {
        if (data && data.active !== false) {
          const opt = document.createElement("option");
          opt.value = id;
          opt.textContent = data.name;
          sel.appendChild(opt);
        }
      });
    }
    if (!(sel.id === "dash-user-filter" || sel.id === "export-user-filter")) {
      const addNew = document.createElement("option");
      addNew.value = "__add_new__";
      addNew.textContent = "+ Add New User";
      sel.appendChild(addNew);
    }
    if (selectUserIdToFocus) {
      sel.value = selectUserIdToFocus;
    }
  });
}

function initDashboardFilters() {
  const dashFilterButtons = document.querySelectorAll(
    ".filter-section .filter-btn"
  );
  const exportFilterButtons = document.querySelectorAll(
    ".export-section .filter-btn"
  );
  const dashUserSelect = document.getElementById("dash-user-filter");
  if (dashUserSelect) {
    dashUserSelect.addEventListener("change", () => updateDashboardTotals());
  }
  const applyBtn = document.getElementById("dash-apply-btn");
  applyBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    updateDashboardTotals();
  });

  dashFilterButtons.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (!btn.closest("#dashboard")) return;
      e.preventDefault();
      dashFilterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setDateRange("dash", btn.textContent.trim());
      updateDashboardTotals();
    })
  );

  exportFilterButtons.forEach((btn) =>
    btn.addEventListener("click", (e) => {
      if (!btn.closest(".export-section")) return;
      e.preventDefault();
      exportFilterButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      setDateRange("export", btn.textContent.trim());
    })
  );

  setDateRange("dash", "Today");
  setDateRange("export", "Today");
  updateDashboardTotals();
}

function setDateRange(prefix, filterType) {
  const today = new Date();
  const fromDateInput = document.getElementById(`${prefix}-from-date`);
  const toDateInput = document.getElementById(`${prefix}-to-date`);
  if (!fromDateInput || !toDateInput) return;
  let fromDate = today;
  const toDate = today;
  // Use LOCAL date components (avoid UTC toISOString day shift)
  const fmtLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };
  // Helper to clone date without mutating original
  const dClone = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  switch (filterType) {
    case "Today":
      fromDate = dClone(today);
      break;
    case "This Week": {
      // Monday as start of week
      const day = today.getDay(); // 0=Sun
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - diffToMonday
      );
      break;
    }
    case "This Month":
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case "This Year":
      fromDate = new Date(today.getFullYear(), 0, 1);
      break;
    case "Last 7 Days":
      fromDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 6
      );
      break; // include today + previous 6
    case "Last 30 Days":
      fromDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 29
      );
      break; // include today + previous 29
    case "Last 90 Days":
      fromDate = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate() - 89
      );
      break; // include today + previous 89
    default:
      return;
  }
  fromDateInput.value = fmtLocal(fromDate);
  toDateInput.value = fmtLocal(toDate);
}

// React to manual date edits (immediate refresh)
["dash-from-date", "dash-to-date"].forEach((id) => {
  const el = document.getElementById(id);
  el?.addEventListener("change", () => updateDashboardTotals());
});

function updateDashboardTotals() {
  const totalRevenueEl = document.querySelector(
    "#dashboard .stats-card.revenue .stats-value"
  );
  const totalExpensesEl = document.querySelector(
    "#dashboard .stats-card.expense .stats-value"
  );
  const totalMealsEl = document.querySelector(
    "#dashboard .stats-card.meals .stats-value"
  );
  if (!totalRevenueEl || !totalExpensesEl || !totalMealsEl) return;
  Promise.all([
    fetchRange("revenue"),
    fetchRange("expenses"),
    fetchRange("meals"),
  ])
    .then(([rev, exp, meals]) => {
      const userFilter =
        document.getElementById("dash-user-filter")?.value || "";
      let filteredRev = rev;
      let filteredExp = exp;
      let filteredMeals = meals;
      if (userFilter) {
        filteredRev = rev.filter((r) => r.userId === userFilter);
        filteredExp = exp.filter((r) => r.userId === userFilter);
        filteredMeals = meals.filter((r) => r.userId === userFilter);
      }
      const revSum = filteredRev.reduce(
        (s, r) => s + (parseFloat(r.amount) || 0),
        0
      );
      const expSum = filteredExp.reduce(
        (s, r) => s + (parseFloat(r.amount) || 0),
        0
      );
      totalRevenueEl.textContent = "BDT " + revSum.toFixed(2);
      totalExpensesEl.textContent = "BDT " + expSum.toFixed(2);
      totalMealsEl.textContent = filteredMeals.length.toString();
      renderDashboardTables(filteredRev, filteredExp, filteredMeals);
    })
    .catch((err) => console.error("Totals error", err));
}

function fetchRange(collection) {
  const root = ref(db);
  return get(child(root, collection)).then((snap) => {
    const data = snap.val() || {};
    const items = Object.values(data);
    const from = document.getElementById("dash-from-date")?.value;
    const to = document.getElementById("dash-to-date")?.value;
    if (from && to) {
      return items.filter((it) => it.date >= from && it.date <= to);
    }
    return items;
  });
}

// ---------- Dashboard Table Rendering -----------
function renderDashboardTables(revItems, expItems, mealItems) {
  renderGenericTable(
    "revenue-table-body",
    revItems,
    ["Date", "User", "Source", "Amount", "Notes"],
    (item) => [
      formatDate(item.date),
      lookupCachedUserName(item.userId),
      item.source || "-",
      formatCurrency(item.amount),
      item.notes || "-",
    ]
  );
  renderGenericTable(
    "expenses-table-body",
    expItems,
    ["Date", "User", "Receipt Info", "Amount", "Notes"],
    (item) => [
      formatDate(item.date),
      lookupCachedUserName(item.userId),
      item.receipt || "-",
      formatCurrency(item.amount),
      item.notes || "-",
    ]
  );
  renderGenericTable(
    "meals-table-body",
    mealItems,
    ["Date", "User", "Meal", "Tags", "Notes"],
    (item) => [
      formatDate(item.date),
      lookupCachedUserName(item.userId),
      item.mealName || "-",
      (item.tags || []).join(", ") || "-",
      item.notes || "-",
    ]
  );
}

function renderGenericTable(bodyId, items, headerLabels, mapFn) {
  const container = document.getElementById(bodyId);
  if (!container) return;
  container.innerHTML = "";

  // Header row
  const header = document.createElement("div");
  header.className = "table-row header";
  headerLabels.forEach((l) => {
    const span = document.createElement("span");
    span.textContent = l;
    header.appendChild(span);
  });
  container.appendChild(header);

  if (!items || !items.length) {
    const empty = document.createElement("div");
    empty.className = "empty-row";
    empty.textContent = "No records for selected range";
    container.appendChild(empty);
    return;
  }

  // Sort newest first by date then createdAt
  items.sort((a, b) => {
    if (a.date === b.date) return (b.createdAt || 0) - (a.createdAt || 0);
    return a.date < b.date ? 1 : -1;
  });

  items.slice(0, 50).forEach((item) => {
    const row = document.createElement("div");
    row.className = "table-row";
    const values = mapFn(item);
    values.forEach((v) => {
      const span = document.createElement("span");
      span.textContent = v;
      row.appendChild(span);
    });
    container.appendChild(row);
  });
}

// Helpers
const userNameCache = {};
function lookupCachedUserName(userId) {
  if (!userId) return "-";
  if (userNameCache[userId]) return userNameCache[userId];
  // attempt to resolve from selects
  const selects = document.querySelectorAll("select.user-select");
  for (const sel of selects) {
    const opt = [...sel.options].find((o) => o.value === userId);
    if (opt) {
      userNameCache[userId] = opt.textContent;
      return userNameCache[userId];
    }
  }
  return "Deleted User";
}

function formatDate(dateStr) {
  return dateStr || "-";
}
function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "BDT 0.00";
  return "BDT " + n.toFixed(2);
}

// -------------- Manage Users Tab --------------

async function renderUsersManagementTable() {
  const body = document.getElementById("users-table-body");
  if (!body) return;
  body.innerHTML = "";
  const snap = await get(child(ref(db), "users"));
  const header = document.createElement("div");
  header.className = "table-row header";
  ["Name", "Status", "Actions"].forEach((h) => {
    const s = document.createElement("span");
    s.textContent = h;
    header.appendChild(s);
  });
  body.appendChild(header);

  let users = [];
  if (snap.exists()) {
    const usersObj = snap.val();
    // Show individual users (no grouping)
    users = Object.entries(usersObj)
      .filter(([_, u]) => u && u.name)
      .map(([id, u]) => ({ id, ...u }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  // Single check for no users (whether from empty DB or no valid users)
  if (users.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-row";
    empty.textContent = "No users";
    body.appendChild(empty);
    return;
  }

  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "table-row";

    const nameSpan = document.createElement("span");
    nameSpan.textContent = u.name || "(Unnamed)";
    row.appendChild(nameSpan);

    const statusSpan = document.createElement("span");
    const statusBadge = document.createElement("span");
    const isActive = u.active !== false;
    statusBadge.className = "badge " + (isActive ? "active" : "inactive");
    statusBadge.textContent = isActive ? "ACTIVE" : "INACTIVE";
    statusSpan.appendChild(statusBadge);
    row.appendChild(statusSpan);

    const actionsSpan = document.createElement("span");
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "action-btns";

    const viewBtn = document.createElement("button");
    viewBtn.className = "mini-btn";
    viewBtn.textContent = "View";
    viewBtn.title = "View & edit entries";
    viewBtn.addEventListener("click", () => showUserView(u.id, u.name));
    actionsWrapper.appendChild(viewBtn);

    const toggleBtn = document.createElement("button");
    toggleBtn.className = "mini-btn " + (isActive ? "delete" : "restore");
    toggleBtn.textContent = isActive ? "Inactivate" : "Activate";
    toggleBtn.title = isActive ? "Set user inactive" : "Set user active";
    toggleBtn.addEventListener("click", async () => {
      await update(ref(db, "users/" + u.id), { active: !isActive });
      await loadUsersIntoSelects();
    });
    actionsWrapper.appendChild(toggleBtn);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "mini-btn delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Permanently delete user";
    deleteBtn.addEventListener("click", () => confirmDeleteUser(u.id, u.name));
    actionsWrapper.appendChild(deleteBtn);

    actionsSpan.appendChild(actionsWrapper);
    row.appendChild(actionsSpan);
    body.appendChild(row);
  });

  // Legend
  let legend = document.getElementById("users-legend");
  if (!legend) {
    legend = document.createElement("div");
    legend.id = "users-legend";
    legend.className = "legend-list";
    legend.innerHTML =
      '<div class="legend-item"><span class="badge active">ACTIVE</span> User selectable in forms</div><div class="legend-item"><span class="badge inactive">INACTIVE</span> Hidden from forms</div><div class="legend-item"><strong>Delete</strong> permanently removes user (optional cascade)</div>';
    body.parentElement.appendChild(legend);
  }
}

// Unified user view: shows entries with inline edit/delete and add new
async function showUserView(userId, userName) {
  const container = document.getElementById("user-detail");
  const header = document.getElementById("user-detail-header");
  const bodyDiv = document.getElementById("user-detail-body");
  if (!container || !header || !bodyDiv) return;
  container.style.display = "block";
  header.textContent = "User: " + userName;
  bodyDiv.innerHTML = "Loading...";
  // Fetch with keys
  const [revSnap, expSnap, mealSnap, userSnap] = await Promise.all([
    get(child(ref(db), "revenue")),
    get(child(ref(db), "expenses")),
    get(child(ref(db), "meals")),
    get(child(ref(db), "users/" + userId)),
  ]);
  const userData = userSnap.val() || {};
  const revItems = Object.entries(revSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, ...v }));
  const expItems = Object.entries(expSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, ...v }));
  const mealItems = Object.entries(mealSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, ...v }));

  // Raw expense data fetched from DB (no debug logs)

  const totalRevenue = revItems.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0
  );
  const totalExpenses = expItems.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0
  );
  const net = totalRevenue - totalExpenses;
  // Build rows
  const rows = [
    ...revItems.map((r) => ({
      type: "revenue",
      date: r.date,
      key: r.key,
      value: (parseFloat(r.amount) || 0).toFixed(2),
      receipt: "",
    })),
    ...expItems.map((r) => ({
      type: "expense",
      date: r.date,
      key: r.key,
      value: (parseFloat(r.amount) || 0).toFixed(2),
      receipt: r.receipt || "",
    })),
    ...mealItems.map((r) => ({
      type: "meal",
      date: r.date,
      key: r.key,
      value: r.mealName || "",
      receipt: "",
    })),
  ];

  // Expense rows prepared for rendering

  rows.sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  let html = "";
  html +=
    `<div style="display:flex;flex-wrap:wrap;gap:16px;margin-bottom:12px;">` +
    cardMetric("Revenue", formatCurrency(totalRevenue), "#28a745") +
    cardMetric("Expenses", formatCurrency(totalExpenses), "#dc3545") +
    cardMetric("Net", formatCurrency(net), net >= 0 ? "#28a745" : "#dc3545") +
    cardMetric("Meals", mealItems.length, "#ffc107") +
    `</div>`;
  html += `<div style="margin:4px 0 10px 0;font-size:0.7rem;">Status: <strong>${
    userData.active === false ? "INACTIVE" : "ACTIVE"
  }</strong> &nbsp; <button id="rename-user-btn" class="mini-btn" style="padding:4px 8px;">Rename User</button></div>`;
  html += `<div style="overflow:auto;max-height:420px;border:1px solid #e9ecef;border-radius:8px;">`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:0.72rem;">`;
  html +=
    `<thead><tr style="background:#f8f9fa;">` +
    `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #dee2e6;">Date</th>` +
    `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #dee2e6;">Type</th>` +
    `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #dee2e6;">Value</th>` +
    `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #dee2e6;">Receipt</th>` +
    `<th style="text-align:left;padding:6px 8px;border-bottom:1px solid #dee2e6;">Actions</th>` +
    `</tr></thead><tbody>`;
  if (!rows.length) {
    html += `<tr><td colspan="5" style="padding:10px;font-style:italic;color:#868e96;">No entries</td></tr>`;
  } else {
    rows.forEach((r) => {
      const receiptValue = (r.receipt || "").replace(/"/g, "&quot;");
      html +=
        `<tr data-key="${r.key}" data-kind="${r.type}">` +
        `<td style="padding:4px 6px;width:120px;"><input type="date" value="${r.date}" class="sheet-date" style="width:100%;padding:4px 6px;border:1px solid #ced4da;border-radius:4px;" /></td>` +
        `<td style="padding:4px 6px;text-transform:capitalize;">${r.type}</td>` +
        `<td style="padding:4px 6px;">${
          r.type === "meal"
            ? `<input type="text" value="${r.value.replace(
                /"/g,
                "&quot;"
              )}" class="sheet-value" style="width:100%;padding:4px 6px;border:1px solid #ced4da;border-radius:4px;" />`
            : `<input type="number" step="0.01" value="${r.value}" class="sheet-value" style="width:100%;padding:4px 6px;border:1px solid #ced4da;border-radius:4px;" />`
        }</td>` +
        `<td style="padding:4px 6px;">${
          r.type === "expense"
            ? `<input type="text" value="${receiptValue}" class="sheet-receipt" style="width:100%;padding:4px 6px;border:1px solid #ced4da;border-radius:4px;" placeholder="Receipt info..." />`
            : `<span style="color:#868e96;font-style:italic;">N/A</span>`
        }</td>` +
        `<td style="padding:4px 6px;white-space:nowrap;">` +
        `<button class="mini-btn" data-action="save" style="background:#228be6;color:#fff;">Save</button> ` +
        `<button class="mini-btn delete" data-action="delete">Delete</button>` +
        `</td>` +
        `</tr>`;
    });
  }
  html += `</tbody></table></div>`;
  // Add new entry
  html +=
    `<div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end;">` +
    `<div><label style="display:block;font-size:0.55rem;font-weight:600;margin-bottom:3px;">Date</label><input id="new-entry-date" type="date" style="padding:6px 8px;border:1px solid #ced4da;border-radius:4px;" /></div>` +
    `<div><label style="display:block;font-size:0.55rem;font-weight:600;margin-bottom:3px;">Type</label><select id="new-entry-type" style="padding:6px 8px;border:1px solid #ced4da;border-radius:4px;"><option value="revenue">Revenue</option><option value="expense">Expense</option><option value="meal">Meal</option></select></div>` +
    `<div><label style="display:block;font-size:0.55rem;font-weight:600;margin-bottom:3px;">Value / Meal Name</label><input id="new-entry-value" type="text" placeholder="Amount or Meal" style="padding:6px 8px;border:1px solid #ced4da;border-radius:4px;min-width:160px;" /></div>` +
    `<div><label style="display:block;font-size:0.55rem;font-weight:600;margin-bottom:3px;">Receipt Info (Expense)</label><input id="new-entry-receipt" type="text" placeholder="Receipt details..." style="padding:6px 8px;border:1px solid #ced4da;border-radius:4px;min-width:140px;" /></div>` +
    `<button id="add-entry-btn" class="mini-btn" style="background:#2f9e44;color:#fff;">Add Entry</button>` +
    `</div>`;
  html += `<p style="margin-top:8px;font-size:0.6rem;color:#868e96;">Edit cells then press Save. Delete removes the entry permanently.</p>`;
  bodyDiv.innerHTML = html;
  // Wire actions
  bodyDiv.querySelectorAll('button[data-action="save"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tr = btn.closest("tr");
      const key = tr.getAttribute("data-key");
      const kind = tr.getAttribute("data-kind");
      const date = tr.querySelector(".sheet-date").value;
      const valEl = tr.querySelector(".sheet-value");
      const raw = valEl.value.trim();
      const receiptEl = tr.querySelector(".sheet-receipt");
      const receipt = receiptEl ? receiptEl.value.trim() : "";
      await saveSheetRow(kind, key, date, raw, userId, receipt);
      showSuccessModal(
        "Entry Updated!",
        `Successfully updated ${kind} entry for ${date}`
      );
      showManageUserView(userId, userName);
      updateDashboardTotals();
    });
  });
  bodyDiv.querySelectorAll('button[data-action="delete"]').forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this entry?")) return;
      const tr = btn.closest("tr");
      const key = tr.getAttribute("data-key");
      const kind = tr.getAttribute("data-kind");
      await deleteSheetRow(kind, key);
      showSuccessModal("Entry Deleted!", `Successfully deleted ${kind} entry`);
      showManageUserView(userId, userName);
      updateDashboardTotals();
    });
  });
  document
    .getElementById("add-entry-btn")
    ?.addEventListener("click", async () => {
      const d = document.getElementById("new-entry-date").value;
      const t = document.getElementById("new-entry-type").value;
      const v = document.getElementById("new-entry-value").value.trim();
      const r = document.getElementById("new-entry-receipt").value.trim();
      if (!d || !v) return alert("Provide date & value");
      await addSheetEntry(t, d, v, userId, r);
      showManageUserView(userId, userName);
      updateDashboardTotals();
    });
  document
    .getElementById("rename-user-btn")
    ?.addEventListener("click", async () => {
      const newName = prompt("Enter new name", userName);
      if (newName && newName.trim() && newName.trim() !== userName) {
        await update(ref(db, "users/" + userId), { name: newName.trim() });
        await loadUsersIntoSelects(userId);
        showManageUserView(userId, newName.trim());
      }
    });
}

function cardMetric(label, value, color) {
  return (
    `<div style="flex:1 1 180px;background:#fff;border:1px solid #e9ecef;border-left:5px solid ${color};padding:12px 15px;border-radius:10px;min-width:160px;">` +
    `<div style="font-size:0.7rem;font-weight:600;color:#495057;text-transform:uppercase;letter-spacing:.5px;">${label}</div>` +
    `<div style="font-size:1.3rem;font-weight:700;margin-top:4px;color:#2c3e50;">${value}</div>` +
    `</div>`
  );
}
function sectionList(title, items, mapFn) {
  const sorted = [...items]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 10);
  if (!sorted.length)
    return `<div style="margin-bottom:10px;"><h4 style="font-size:0.85rem;margin:8px 0;color:#495057;">${title}</h4><div style="font-size:0.7rem;color:#868e96;font-style:italic;">No records</div></div>`;
  return (
    `<div style="margin-bottom:10px;"><h4 style="font-size:0.85rem;margin:8px 0;color:#495057;">${title}</h4>` +
    `<ul style="list-style:none;padding:0;margin:0;font-size:0.7rem;line-height:1.4;">${sorted
      .map(
        (i) =>
          `<li style=\"padding:2px 0;border-bottom:1px dashed #f1f3f5;\">${mapFn(
            i
          )}</li>`
      )
      .join("")}</ul></div>`
  );
}

// --- Sheet helper functions ---
async function saveSheetRow(kind, key, date, rawValue, userId, receipt = "") {
  if (!key) return;
  let path;
  if (kind === "revenue") path = "revenue";
  else if (kind === "expense") path = "expenses";
  else if (kind === "meal") path = "meals";
  else return;
  const base = { date, userId };
  if (kind === "meal") {
    base.mealName = rawValue;
  } else if (kind === "expense") {
    base.amount = parseFloat(rawValue) || 0;
    base.receipt = receipt;
  } else {
    base.amount = parseFloat(rawValue) || 0;
  }
  await update(ref(db, `${path}/${key}`), base);
}
async function deleteSheetRow(kind, key) {
  if (!key) return;
  let path;
  if (kind === "revenue") path = "revenue";
  else if (kind === "expense") path = "expenses";
  else if (kind === "meal") path = "meals";
  else return;
  await remove(ref(db, `${path}/${key}`));
}
async function addSheetEntry(kind, date, rawValue, userId, receipt = "") {
  let path;
  if (kind === "revenue") path = "revenue";
  else if (kind === "expense") path = "expenses";
  else if (kind === "meal") path = "meals";
  else return;
  const newRef = push(ref(db, path));
  const base = { date, userId, createdAt: Date.now() };
  if (kind === "meal") {
    base.mealName = rawValue;
  } else if (kind === "expense") {
    base.amount = parseFloat(rawValue) || 0;
    base.receipt = receipt;
  } else {
    base.amount = parseFloat(rawValue) || 0;
  }
  await set(newRef, base);
}

async function confirmDeleteUser(userId, name) {
  const [revSnap, expSnap, mealSnap] = await Promise.all([
    get(child(ref(db), "revenue")),
    get(child(ref(db), "expenses")),
    get(child(ref(db), "meals")),
  ]);
  const revEntries = Object.entries(revSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const expEntries = Object.entries(expSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const mealEntries = Object.entries(mealSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const summary = `User: ${name}\nRevenue: ${revEntries.length}\nExpenses: ${expEntries.length}\nMeals: ${mealEntries.length}`;
  if (!confirm("Delete this user permanently?\n" + summary)) return;
  const cascade =
    revEntries.length + expEntries.length + mealEntries.length > 0
      ? confirm(
          "Cascade delete ALL their entries? (OK = delete entries, Cancel = keep entries)"
        )
      : false;
  await remove(ref(db, "users/" + userId));
  if (cascade) {
    for (const [k] of revEntries) await remove(ref(db, "revenue/" + k));
    for (const [k] of expEntries) await remove(ref(db, "expenses/" + k));
    for (const [k] of mealEntries) await remove(ref(db, "meals/" + k));
  }
  const detail = document.getElementById("user-detail");
  if (
    detail &&
    detail.style.display !== "none" &&
    document.getElementById("user-detail-header")?.textContent.includes(name)
  ) {
    detail.style.display = "none";
  }
  await loadUsersIntoSelects();
  alert(
    "User deleted" +
      (cascade
        ? " with all entries."
        : ". Entries retained (will show as Deleted User).")
  );
}

// -------------- Manage Users Tab --------------
function initManageUsers() {
  const addBtn = document.getElementById("add-new-user-btn");
  if (addBtn) {
    addBtn.addEventListener("click", async () => {
      const name = prompt("Enter new user name");
      if (name && name.trim()) {
        try {
          const id = await createUser(name.trim());
          showSuccessModal(
            "User Created!",
            `Successfully created user "${name.trim()}"`
          );
          await loadUsersIntoSelects(id);
          renderManageUsersTable();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
  renderManageUsersTable();
}

async function renderManageUsersTable() {
  const body = document.getElementById("manage-users-table-body");
  if (!body) return;
  body.innerHTML = "";

  const snap = await get(child(ref(db), "users"));
  const header = document.createElement("div");
  header.className = "table-row header";
  ["Name", "Status", "Created", "Actions"].forEach((h) => {
    const s = document.createElement("span");
    s.textContent = h;
    header.appendChild(s);
  });
  body.appendChild(header);

  let users = [];
  if (snap.exists()) {
    const usersObj = snap.val();
    users = Object.entries(usersObj)
      .filter(([_, u]) => u && u.name)
      .map(([id, u]) => ({ id, ...u }))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  }

  if (users.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-row";
    empty.textContent = "No users in database";
    body.appendChild(empty);
    return;
  }

  users.forEach((u) => {
    const row = document.createElement("div");
    row.className = "table-row";

    // Name
    const nameSpan = document.createElement("span");
    nameSpan.textContent = u.name || "(Unnamed)";
    row.appendChild(nameSpan);

    // Status
    const statusSpan = document.createElement("span");
    const statusBadge = document.createElement("span");
    const isActive = u.active !== false;
    statusBadge.className = "badge " + (isActive ? "active" : "inactive");
    statusBadge.textContent = isActive ? "ACTIVE" : "INACTIVE";
    statusSpan.appendChild(statusBadge);
    row.appendChild(statusSpan);

    // Created date
    const createdSpan = document.createElement("span");
    const createdDate = u.createdAt
      ? new Date(u.createdAt).toLocaleDateString()
      : "Unknown";
    createdSpan.textContent = createdDate;
    createdSpan.style.fontSize = "0.8rem";
    createdSpan.style.color = "#6c757d";
    row.appendChild(createdSpan);

    // Actions
    const actionsSpan = document.createElement("span");
    const actionsWrapper = document.createElement("div");
    actionsWrapper.className = "action-btns";

    // View button
    const viewBtn = document.createElement("button");
    viewBtn.className = "mini-btn";
    viewBtn.textContent = "View";
    viewBtn.title = "View & manage all user data";
    viewBtn.addEventListener("click", () => showManageUserView(u.id, u.name));
    actionsWrapper.appendChild(viewBtn);

    // Active/Inactive toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.className = "mini-btn " + (isActive ? "delete" : "restore");
    toggleBtn.textContent = isActive ? "Deactivate" : "Activate";
    toggleBtn.title = isActive ? "Set user inactive" : "Set user active";
    toggleBtn.addEventListener("click", async () => {
      await update(ref(db, "users/" + u.id), { active: !isActive });
      showSuccessModal(
        isActive ? "User Deactivated!" : "User Activated!",
        `User "${u.name}" is now ${isActive ? "inactive" : "active"}`
      );
      await loadUsersIntoSelects();
      renderManageUsersTable();
    });
    actionsWrapper.appendChild(toggleBtn);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "mini-btn delete";
    deleteBtn.textContent = "Delete";
    deleteBtn.title = "Permanently delete user";
    deleteBtn.addEventListener("click", () =>
      confirmManageUserDelete(u.id, u.name)
    );
    actionsWrapper.appendChild(deleteBtn);

    actionsSpan.appendChild(actionsWrapper);
    row.appendChild(actionsSpan);
    body.appendChild(row);
  });
}

async function showManageUserView(userId, userName) {
  const container = document.getElementById("manage-user-detail");
  const header = document.getElementById("manage-user-detail-header");
  const bodyDiv = document.getElementById("manage-user-detail-body");
  if (!container || !header || !bodyDiv) return;

  container.style.display = "block";
  header.textContent = `Managing: ${userName}`;
  bodyDiv.innerHTML = "Loading user data...";

  // Fetch all user data
  const [revSnap, expSnap, mealSnap, userSnap] = await Promise.all([
    get(child(ref(db), "revenue")),
    get(child(ref(db), "expenses")),
    get(child(ref(db), "meals")),
    get(child(ref(db), "users/" + userId)),
  ]);

  const userData = userSnap.val() || {};
  const revItems = Object.entries(revSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, type: "revenue", ...v }));
  const expItems = Object.entries(expSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, type: "expense", ...v }));
  const mealItems = Object.entries(mealSnap.val() || {})
    .filter(([_, v]) => v.userId === userId)
    .map(([k, v]) => ({ key: k, type: "meal", ...v }));

  const allItems = [...revItems, ...expItems, ...mealItems].sort((a, b) =>
    b.date.localeCompare(a.date)
  ); // Most recent first

  const totalRevenue = revItems.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0
  );
  const totalExpenses = expItems.reduce(
    (s, r) => s + (parseFloat(r.amount) || 0),
    0
  );
  const net = totalRevenue - totalExpenses;

  let html = "";

  // User info and stats
  html += `<div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">`;
  html += `<h4 style="margin:0 0 10px 0;color:#495057;">User Information</h4>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px;">`;
  html += `<div><strong>Name:</strong> ${userData.name || "N/A"}</div>`;
  html += `<div><strong>Status:</strong> <span class="badge ${
    userData.active !== false ? "active" : "inactive"
  }">${userData.active !== false ? "ACTIVE" : "INACTIVE"}</span></div>`;
  html += `<div><strong>Created:</strong> ${
    userData.createdAt
      ? new Date(userData.createdAt).toLocaleDateString()
      : "Unknown"
  }</div>`;
  html += `<div><strong>Total Entries:</strong> ${allItems.length}</div>`;
  html += `</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">`;
  html += `<div style="text-align:center;padding:8px;background:#28a745;color:white;border-radius:4px;"><div style="font-size:0.8rem;">Revenue</div><div style="font-weight:bold;">${formatCurrency(
    totalRevenue
  )}</div></div>`;
  html += `<div style="text-align:center;padding:8px;background:#dc3545;color:white;border-radius:4px;"><div style="font-size:0.8rem;">Expenses</div><div style="font-weight:bold;">${formatCurrency(
    totalExpenses
  )}</div></div>`;
  html += `<div style="text-align:center;padding:8px;background:${
    net >= 0 ? "#28a745" : "#dc3545"
  };color:white;border-radius:4px;"><div style="font-size:0.8rem;">Net</div><div style="font-weight:bold;">${formatCurrency(
    net
  )}</div></div>`;
  html += `<div style="text-align:center;padding:8px;background:#ffc107;color:#212529;border-radius:4px;"><div style="font-size:0.8rem;">Meals</div><div style="font-weight:bold;">${mealItems.length}</div></div>`;
  html += `</div></div>`;

  // --- Debug: show raw receipts for this user (temporary) ---
  const receiptsPresent = expItems.filter(
    (e) => e.receipt && String(e.receipt).trim().length > 0
  );
  if (receiptsPresent.length > 0) {
    html += `<div style="margin-bottom:10px;padding:10px;border:1px dashed #c3e6cb;background:#f1fdf6;border-radius:6px;">`;
    html += `<strong>Receipts detected for this user (${receiptsPresent.length}) — (temporary debug view):</strong><ul style="margin:6px 0 0 16px;font-size:0.85rem;">`;
    receiptsPresent.forEach((r) => {
      const safe = String(r.receipt)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      html += `<li style="margin-bottom:3px;"><em>${r.date}</em>: ${safe}</li>`;
    });
    html += `</ul></div>`;
  } else {
    html += `<div style="margin-bottom:10px;padding:10px;border:1px dashed #f8d7da;background:#fff5f5;border-radius:6px;color:#842029;font-size:0.9rem;">No receipts detected for this user.</div>`;
  }

  // All user data table
  html += `<h4 style="margin:0 0 10px 0;color:#495057;">All User Data</h4>`;
  html += `<div style="overflow:auto;max-height:400px;border:1px solid #e9ecef;border-radius:8px;">`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:0.85rem;">`;
  html += `<thead><tr style="background:#f8f9fa;position:sticky;top:0;">`;
  html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Date</th>`;
  html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Type</th>`;
  html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Details</th>`;
  html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Amount</th>`;
  html += `<th style="text-align:center;padding:8px;border-bottom:1px solid #dee2e6;">Actions</th>`;
  html += `</tr></thead><tbody>`;

  if (allItems.length === 0) {
    html += `<tr><td colspan="5" style="padding:20px;text-align:center;font-style:italic;color:#868e96;">No data entries found</td></tr>`;
  } else {
    allItems.forEach((item) => {
      const typeColor =
        item.type === "revenue"
          ? "#28a745"
          : item.type === "expense"
          ? "#dc3545"
          : "#ffc107";
      const detailsRaw =
        item.type === "meal"
          ? item.mealName || "N/A"
          : item.type === "revenue"
          ? item.source || "Revenue"
          : item.receipt || "Expense";
      // Escape HTML to ensure raw receipt text is visible
      const details = String(detailsRaw)
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
      const amount =
        item.type === "meal"
          ? "-"
          : formatCurrency(parseFloat(item.amount) || 0);

      html += `<tr data-key="${item.key}" data-type="${item.type}">`;
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">${item.date}</td>`;
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;"><span style="color:${typeColor};font-weight:600;text-transform:capitalize;">${item.type}</span></td>`;
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">${details}</td>`;
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;font-weight:600;">${amount}</td>`;
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;text-align:center;">`;
      html += `<button class="mini-btn delete" onclick="deleteUserDataEntry('${item.key}', '${item.type}', '${userId}', '${userName}')" style="font-size:0.7rem;padding:4px 8px;">Delete</button>`;
      html += `</td></tr>`;
    });
  }

  html += `</tbody></table></div>`;
  html += `<div style="margin-top:15px;padding:10px;background:#fff3cd;border:1px solid #ffeaa7;border-radius:4px;font-size:0.8rem;color:#856404;">`;
  html += `<strong>⚠️ Warning:</strong> Deleting data entries is permanent and cannot be undone.`;
  html += `</div>`;

  bodyDiv.innerHTML = html;
}

// Global function to delete user data entries
window.deleteUserDataEntry = async function (
  entryKey,
  entryType,
  userId,
  userName
) {
  if (!confirm(`Delete this ${entryType} entry permanently?`)) return;

  try {
    let path;
    if (entryType === "revenue") path = "revenue";
    else if (entryType === "expense") path = "expenses";
    else if (entryType === "meal") path = "meals";
    else return;

    await remove(ref(db, `${path}/${entryKey}`));
    showSuccessModal(
      "Entry Deleted!",
      `Successfully deleted ${entryType} entry`
    );

    // Refresh the user view and dashboard
    showManageUserView(userId, userName);
    updateDashboardTotals();
    renderManageUsersTable();
  } catch (error) {
    alert("Error deleting entry: " + error.message);
  }
};

async function confirmManageUserDelete(userId, name) {
  const [revSnap, expSnap, mealSnap] = await Promise.all([
    get(child(ref(db), "revenue")),
    get(child(ref(db), "expenses")),
    get(child(ref(db), "meals")),
  ]);

  const revEntries = Object.entries(revSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const expEntries = Object.entries(expSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const mealEntries = Object.entries(mealSnap.val() || {}).filter(
    ([_, v]) => v.userId === userId
  );
  const totalEntries =
    revEntries.length + expEntries.length + mealEntries.length;

  const summary = `User: ${name}\nRevenue entries: ${revEntries.length}\nExpense entries: ${expEntries.length}\nMeal entries: ${mealEntries.length}\nTotal entries: ${totalEntries}`;

  if (
    !confirm(
      "⚠️ DELETE USER PERMANENTLY?\n\n" +
        summary +
        "\n\nThis action cannot be undone!"
    )
  )
    return;

  const cascade =
    totalEntries > 0
      ? confirm(
          `Delete ALL ${totalEntries} data entries too?\n\nOK = Delete everything\nCancel = Keep data entries (will show as "Deleted User")`
        )
      : false;

  try {
    // Delete user
    await remove(ref(db, "users/" + userId));

    // Delete all entries if cascade chosen
    if (cascade) {
      const deletePromises = [
        ...revEntries.map(([k]) => remove(ref(db, "revenue/" + k))),
        ...expEntries.map(([k]) => remove(ref(db, "expenses/" + k))),
        ...mealEntries.map(([k]) => remove(ref(db, "meals/" + k))),
      ];
      await Promise.all(deletePromises);
    }

    // Hide detail view if showing this user
    const detail = document.getElementById("manage-user-detail");
    if (
      detail &&
      detail.style.display !== "none" &&
      document
        .getElementById("manage-user-detail-header")
        ?.textContent.includes(name)
    ) {
      detail.style.display = "none";
    }

    // Refresh UI
    await loadUsersIntoSelects();
    renderManageUsersTable();
    updateDashboardTotals();

    showSuccessModal(
      "User Deleted!",
      `User "${name}" deleted${
        cascade ? " with all data entries" : " (data entries retained)"
      }`
    );
  } catch (error) {
    alert("Error deleting user: " + error.message);
  }
}

// Export functionality
function initExportButtons() {
  const exportFilteredBtn = document.getElementById("export-filtered-btn");
  const exportAllBtn = document.getElementById("export-all-btn");

  exportFilteredBtn?.addEventListener("click", () => exportFilteredData());
  exportAllBtn?.addEventListener("click", () => exportAllTimeData());
}

async function exportData(type) {
  const fromDate = document.getElementById("export-from-date")?.value;
  const toDate = document.getElementById("export-to-date")?.value;
  const userFilter = document.getElementById("export-user-filter")?.value || "";

  if (!fromDate || !toDate) {
    alert("Please select export date range first");
    return;
  }

  try {
    let data = [];
    let filename = "";

    if (type === "revenue" || type === "all") {
      const revData = await fetchExportRange(
        "revenue",
        fromDate,
        toDate,
        userFilter
      );
      if (type === "revenue") {
        data = revData.map((r) => ({
          Date: r.date,
          User: lookupCachedUserName(r.userId),
          Amount: r.amount || 0,
          Source: r.source || "",
          Receipt_Full: "",
        }));
        filename = "revenue_export.csv";
      } else {
        data.push(
          ...revData.map((r) => ({
            Type: "Revenue",
            Date: r.date,
            User: lookupCachedUserName(r.userId),
            Amount: r.amount || 0,
            Details: r.source || "",
          }))
        );
      }
    }

    if (type === "expenses" || type === "all") {
      const expData = await fetchExportRange(
        "expenses",
        fromDate,
        toDate,
        userFilter
      );
      console.log(
        "CSV Export - Expense data:",
        expData.map((e) => ({
          date: e.date,
          amount: e.amount,
          receipt: e.receipt,
        }))
      );

      if (type === "expenses") {
        data = expData.map((e) => ({
          Date: e.date,
          User: lookupCachedUserName(e.userId),
          Amount: e.amount || 0,
          Details: e.receipt || "",
          Receipt_Full: e.receipt || "",
        }));
        filename = "expenses_export.csv";
      } else {
        data.push(
          ...expData.map((e) => ({
            Type: "Expense",
            Date: e.date,
            User: lookupCachedUserName(e.userId),
            Amount: e.amount || 0,
            Details: e.receipt || "",
            Receipt_Full: e.receipt || "",
          }))
        );
      }
    }

    if (type === "meals" || type === "all") {
      const mealData = await fetchExportRange(
        "meals",
        fromDate,
        toDate,
        userFilter
      );
      if (type === "meals") {
        data = mealData.map((m) => ({
          Date: m.date,
          User: lookupCachedUserName(m.userId),
          MealName: m.mealName || "",
          Tags: (m.tags || []).join(", "),
          Receipt_Full: "",
        }));
        filename = "meals_export.csv";
      } else {
        data.push(
          ...mealData.map((m) => ({
            Type: "Meal",
            Date: m.date,
            User: lookupCachedUserName(m.userId),
            Amount: "",
            Details: m.mealName || "",
          }))
        );
      }
    }

    if (type === "all") {
      filename = "all_data_export.csv";
      data.sort((a, b) => a.Date.localeCompare(b.Date));
    }

    if (data.length === 0) {
      alert("No data found for selected criteria");
      return;
    }

    downloadCSV(data, filename);
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  }
}

async function fetchExportRange(collection, fromDate, toDate, userFilter) {
  const snap = await get(child(ref(db), collection));
  if (!snap.exists()) return [];

  let items = Object.values(snap.val());
  console.log(`fetchExportRange - ${collection} raw items:`, items.slice(0, 3)); // Show first 3 items

  // Filter by date range
  items = items.filter((item) => item.date >= fromDate && item.date <= toDate);

  // Filter by user if specified
  if (userFilter) {
    items = items.filter((item) => item.userId === userFilter);
  }

  console.log(
    `fetchExportRange - ${collection} filtered items:`,
    items.slice(0, 3)
  ); // Show first 3 filtered items
  return items;
}

function downloadCSV(data, filename) {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const cell = row[header] || "";
          // Always quote string fields to preserve commas/newlines in CSV cells
          if (typeof cell === "string") {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  // Use an anchor click with object URL to force a download without navigating away
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  // Try msSaveBlob for IE/Edge legacy
  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename);
  } else {
    link.click();
  }
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

// receipts are included by default in exports when present

// Simplified export functions
async function exportFilteredData() {
  let fromDate = document.getElementById("export-from-date")?.value;
  let toDate = document.getElementById("export-to-date")?.value;
  let userFilter = document.getElementById("export-user-filter")?.value || "";
  const dataType = document.getElementById("export-data-type")?.value || "all";

  // If export filters are empty, fall back to dashboard filters so download matches visible data
  if (!fromDate || !toDate) {
    fromDate = document.getElementById("dash-from-date")?.value;
    toDate = document.getElementById("dash-to-date")?.value;
    userFilter =
      document.getElementById("dash-user-filter")?.value || userFilter;
  }

  if (!fromDate || !toDate) {
    alert("Please select export date range first");
    return;
  }

  try {
    let data = [];
    let filename = "filtered_data_export.csv";
    // receipts included by default

    if (dataType === "revenue" || dataType === "all") {
      const revData = await fetchExportRange(
        "revenue",
        fromDate,
        toDate,
        userFilter
      );
      data.push(
        ...revData.map((r) => ({
          Type: "Revenue",
          Date: r.date,
          User: lookupCachedUserName(r.userId),
          Amount: r.amount || 0,
          Details: r.source || "",
          Notes: r.notes || "",
        }))
      );
    }

    if (dataType === "expenses" || dataType === "all") {
      const expData = await fetchExportRange(
        "expenses",
        fromDate,
        toDate,
        userFilter
      );
      data.push(
        ...expData.map((e) => ({
          Type: "Expense",
          Date: e.date,
          User: lookupCachedUserName(e.userId),
          Amount: e.amount || 0,
          Details: e.receipt || "",
        }))
      );
    }

    if (dataType === "meals" || dataType === "all") {
      const mealData = await fetchExportRange(
        "meals",
        fromDate,
        toDate,
        userFilter
      );
      data.push(
        ...mealData.map((m) => ({
          Type: "Meal",
          Date: m.date,
          User: lookupCachedUserName(m.userId),
          Amount: "",
          Details: m.mealName || "",
          Notes: (m.tags || []).join(", "),
        }))
      );
    }

    if (data.length === 0) {
      alert("No data found for selected filters");
      return;
    }

    data.sort((a, b) => a.Date.localeCompare(b.Date));
    console.debug(
      "Filtered export payload sample (first 5 rows):",
      data.slice(0, 5)
    );
    console.debug(
      "Filtered export Details sample:",
      data
        .filter((d) => d.Details)
        .slice(0, 5)
        .map((d) => d.Details)
    );
    downloadCSV(data, filename);
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  }
}

async function exportAllTimeData() {
  try {
    let data = [];
    const filename = "all_time_data_export.csv";
    // receipts included by default

    // Get all data without date filtering
    const [revSnap, expSnap, mealSnap] = await Promise.all([
      get(child(ref(db), "revenue")),
      get(child(ref(db), "expenses")),
      get(child(ref(db), "meals")),
    ]);

    if (revSnap.exists()) {
      const revData = Object.values(revSnap.val());
      data.push(
        ...revData.map((r) => ({
          Type: "Revenue",
          Date: r.date,
          User: lookupCachedUserName(r.userId),
          Amount: r.amount || 0,
          Details: r.source || "",
          Notes: r.notes || "",
        }))
      );
    }

    if (expSnap.exists()) {
      const expData = Object.values(expSnap.val());
      data.push(
        ...expData.map((e) => ({
          Type: "Expense",
          Date: e.date,
          User: lookupCachedUserName(e.userId),
          Amount: e.amount || 0,
          Details: e.receipt || "",
        }))
      );
    }

    if (mealSnap.exists()) {
      const mealData = Object.values(mealSnap.val());
      data.push(
        ...mealData.map((m) => ({
          Type: "Meal",
          Date: m.date,
          User: lookupCachedUserName(m.userId),
          Amount: "",
          Details: m.mealName || "",
          Notes: (m.tags || []).join(", "),
        }))
      );
    }

    if (data.length === 0) {
      alert("No data found in database");
      return;
    }

    data.sort((a, b) => a.Date.localeCompare(b.Date));
    console.debug(
      "All-time export payload sample (first 5 rows):",
      data.slice(0, 5)
    );
    console.debug(
      "All-time export Details sample:",
      data
        .filter((d) => d.Details)
        .slice(0, 5)
        .map((d) => d.Details)
    );
    downloadCSV(data, filename);
  } catch (error) {
    console.error("Export error:", error);
    alert("Export failed: " + error.message);
  }
}

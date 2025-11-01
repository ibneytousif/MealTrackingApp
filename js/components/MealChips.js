/**
 * Meal Chips Component
 * Multi-select meal input with chip display
 */

// Internal state
let mealChips = [];

/**
 * Get current meal chips
 * @returns {Array} Array of meal names
 */
export function getMealChips() {
  return [...mealChips];
}

/**
 * Get meal chips count
 * @returns {number} Number of meals
 */
export function getMealChipsCount() {
  return mealChips.length;
}

/**
 * Set meal chips
 * @param {Array} chips - Array of meal names
 */
export function setMealChips(chips) {
  mealChips = [...chips];
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

// Expose getMealChipsCount globally for other modules
window.getMealChipsCount = getMealChipsCount;

/**
 * Initialize meal chip input
 */
export function initMealChipInput() {
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

/**
 * Initialize quick add meal tags
 */
export function initMealTags() {
  const mealTags = document.querySelectorAll(".quick-add-btn");
  mealTags.forEach((tag) => {
    tag.addEventListener("click", () => {
      const mealName = tag.getAttribute("data-meal") || tag.textContent.trim();
      addMealChip(mealName);
    });
  });
}

/**
 * Add a meal chip
 * @param {string} mealName - Meal name to add
 */
export function addMealChip(mealName) {
  if (!mealName || mealChips.includes(mealName)) return;

  mealChips.push(mealName);
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

/**
 * Remove a meal chip by index
 * @param {number} index - Index of chip to remove
 */
export function removeMealChip(index) {
  mealChips.splice(index, 1);
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

/**
 * Clear all meal chips
 */
export function clearMealChips() {
  mealChips = [];
  renderMealChips();
  updateEntryPreview();
  updateMealCount();
  updateSummaryCards();
}

/**
 * Render meal chips to DOM
 */
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

/**
 * Update meal count display
 */
function updateMealCount() {
  const counter = document.getElementById("meal-count-inline");
  if (!counter) return;

  const count = mealChips.length;
  counter.textContent = count === 1 ? "1 meal" : `${count} meals`;
}

/**
 * Update summary cards with current selections
 */
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

/**
 * Update entry preview (to be implemented by caller)
 * This is a placeholder that can be overridden
 */
function updateEntryPreview() {
  // Dispatch custom event for other modules to listen to
  const event = new CustomEvent("mealchips:changed", {
    detail: { meals: mealChips }
  });
  document.dispatchEvent(event);
}

/**
 * Get selected user IDs (from UserCheckboxes component)
 * This is a helper function that other modules should provide
 */
function getSelectedUserIds() {
  const checkboxes = document.querySelectorAll('input[name="user-ids"]:checked');
  return Array.from(checkboxes).map(cb => cb.value);
}

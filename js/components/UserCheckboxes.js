/**
 * User Checkboxes Component
 * Multi-select user checkboxes for meal tracking
 */

import { getUsers } from '../services/database.js';
import { db } from '../config/firebase.js';
import { ref, get, child } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

/**
 * Initialize user checkboxes
 */
export function initUserCheckboxes() {
  const selectAllCheckbox = document.getElementById('select-all-users');
  const dateInput = document.getElementById('meal-date');

  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
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

  if (dateInput) {
    dateInput.addEventListener('change', () => {
      updateSummaryCards();
    });
  }

  // Delegate event for individual checkbox changes
  document.addEventListener('change', (e) => {
    if (e.target.matches('#user-checkbox-list input[type="checkbox"]')) {
      updateSelectAllState();
      updateUserSelectionCounter();
      updateEntryPreview();
      updateSummaryCards();
    }
  });
}

/**
 * Load users into checkboxes
 */
export async function loadUsersIntoCheckboxes(selectUserIdToCheck) {
  const snap = await get(child(ref(db), 'users'));
  const container = document.getElementById('user-checkbox-list');
  if (!container) return;

  container.innerHTML = '';

  if (snap.exists()) {
    const usersObj = snap.val();
    const users = Object.entries(usersObj)
      .filter(([_, data]) => data && data.active !== false)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    if (users.length === 0) {
      container.innerHTML =
        '<div class="loading-text">No active users found</div>';
      return;
    }

    users.forEach(({ id, name }) => {
      const item = document.createElement('div');
      item.className = 'user-checkbox-item';
      item.innerHTML = `
        <label>
          <input type="checkbox" value="${id}" ${
        selectUserIdToCheck === id ? 'checked' : ''
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

/**
 * Update select all checkbox state
 */
function updateSelectAllState() {
  const selectAllCheckbox = document.getElementById('select-all-users');
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

/**
 * Update user selection counter
 */
function updateUserSelectionCounter() {
  const counter = document.getElementById('user-selection-counter');
  const checkboxes = document.querySelectorAll(
    '#user-checkbox-list input[type="checkbox"]:checked'
  );

  if (!counter) return;

  const count = checkboxes.length;
  if (count === 0) {
    counter.textContent = 'No users selected';
  } else if (count === 1) {
    counter.textContent = '1 user';
  } else {
    counter.textContent = `${count} users`;
  }
}

/**
 * Get selected user IDs
 */
export function getSelectedUserIds() {
  const checkboxes = document.querySelectorAll(
    '#user-checkbox-list input[type="checkbox"]:checked'
  );
  return [...checkboxes].map((cb) => cb.value);
}

/**
 * Update entry preview
 */
function updateEntryPreview() {
  const preview = document.getElementById('entry-preview');
  if (!preview) return;

  const userCount = getSelectedUserIds().length;
  const mealCount = window.getMealChipsCount ? window.getMealChipsCount() : 0;
  const totalEntries = userCount * mealCount;

  if (totalEntries === 0) {
    preview.innerHTML = `
      <div class="preview-icon">ℹ️</div>
      <div class="preview-text">
        Select date, users and add meals to begin
      </div>
    `;
  } else {
    preview.innerHTML = `
      <div class="preview-icon">✅</div>
      <div class="preview-text">
        Ready to create <strong>${totalEntries} meal ${totalEntries === 1 ? 'entry' : 'entries'}</strong>
        <br>
        <span style="font-size:0.85em;color:#6c757d;">
          ${userCount} user${userCount !== 1 ? 's' : ''} × ${mealCount} meal${mealCount !== 1 ? 's' : ''}
        </span>
      </div>
    `;
  }
}

/**
 * Update summary cards
 */
function updateSummaryCards() {
  // Update date summary
  const dateSummary = document.getElementById('date-summary-value');
  const dateInput = document.getElementById('meal-date');
  if (dateSummary && dateInput) {
    if (dateInput.value) {
      const date = new Date(dateInput.value + 'T00:00:00');
      dateSummary.textContent = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } else {
      dateSummary.textContent = 'Not selected';
    }
  }

  // Update users summary
  const usersSummary = document.getElementById('users-summary-value');
  const userCount = getSelectedUserIds().length;
  if (usersSummary) {
    usersSummary.textContent =
      userCount === 0
        ? '0 users'
        : userCount === 1
        ? '1 user'
        : `${userCount} users`;
  }

  // Update meals summary
  const mealsSummary = document.getElementById('meals-summary-value');
  const mealCount = window.getMealChipsCount ? window.getMealChipsCount() : 0;
  if (mealsSummary) {
    mealsSummary.textContent =
      mealCount === 0
        ? '0 meals'
        : mealCount === 1
        ? '1 meal'
        : `${mealCount} meals`;
  }
}

// Expose functions for use by other modules
window.updateEntryPreview = updateEntryPreview;
window.updateSummaryCards = updateSummaryCards;

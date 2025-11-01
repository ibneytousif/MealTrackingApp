/**
 * Meal Tracking Feature
 * Handle meal form submission and batch meal creation
 */

import { addMealsBatch } from '../services/database.js';
import { showSuccessModal } from '../components/Modal.js';
import { getMealChips, clearMealChips } from '../components/MealChips.js';
import { getSelectedUserIds } from '../components/UserCheckboxes.js';
import { db } from '../config/firebase.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

/**
 * Initialize meal form
 */
export function initMealForm() {
  const mealForm = document.getElementById('meal-form');
  
  if (!mealForm) {
    console.warn('Meal form not found');
    return;
  }

  mealForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('meal-date').value;
    const selectedUserIds = getSelectedUserIds();
    const meals = getMealChips();

    // Validation
    if (!date) {
      alert('Please select a date.');
      return;
    }
    if (selectedUserIds.length === 0) {
      alert('Please select at least one user.');
      return;
    }
    if (meals.length === 0) {
      alert('Please add at least one meal.');
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
          const newRef = push(ref(db, 'meals'));
          promises.push(
            set(newRef, {
              date,
              userId,
              mealName,
              tags: '',
              createdAt: Date.now(),
            })
          );
        });
      });

      await Promise.all(promises);

      // Reset form
      mealForm.reset();
      clearMealChips();
      
      // Uncheck all user checkboxes
      const checkboxes = document.querySelectorAll(
        '#user-checkbox-list input[type="checkbox"]'
      );
      checkboxes.forEach((cb) => (cb.checked = false));
      
      // Uncheck select all
      const selectAllCheckbox = document.getElementById('select-all-users');
      if (selectAllCheckbox) {
        selectAllCheckbox.checked = false;
        selectAllCheckbox.indeterminate = false;
      }
      
      // Update UI
      if (window.updateUserSelectionCounter) window.updateUserSelectionCounter();
      if (window.updateEntryPreview) window.updateEntryPreview();
      if (window.updateSummaryCards) window.updateSummaryCards();

      showSuccessModal(
        'Meals Saved!',
        `Successfully created ${totalEntries} meal ${totalEntries === 1 ? 'entry' : 'entries'} for ${selectedUserIds.length} user${selectedUserIds.length === 1 ? '' : 's'} on ${date}`
      );
      
      // Update dashboard if available
      if (window.updateDashboard) {
        window.updateDashboard();
      }
    } catch (err) {
      console.error('Meal error:', err);
      alert('Meal error: ' + err.message);
    }
  });
}

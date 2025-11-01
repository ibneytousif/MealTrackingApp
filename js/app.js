/**
 * Main Application Entry Point
 * Initializes all features and components
 */

import { initModal } from './components/Modal.js';
import { initTabs } from './components/Tabs.js';
import { initMealChipInput, initMealTags } from './components/MealChips.js';
import { initUserCheckboxes, loadUsersIntoCheckboxes } from './components/UserCheckboxes.js';
import { initDashboard, updateDashboard } from './features/DashboardFeature.js';
import { initManageUsers, loadUsersIntoSelects } from './features/UserManagement.js';
import { initMealForm } from './features/MealFeature.js';
import { initRevenueForm } from './features/RevenueFeature.js';
import { initExpenseForm } from './features/ExpenseFeature.js';

/**
 * Initialize application
 */
async function initApp() {
  try {
    // Initialize components
    initModal();
    initTabs();
    initMealChipInput();
    initMealTags();
    initUserCheckboxes();
    
    // Load users into all select dropdowns and checkboxes
    await loadUsersIntoSelects();
    await loadUsersIntoCheckboxes();
    
    // Initialize features
    await initManageUsers();
    await initDashboard();
    initMealForm();
    initRevenueForm();
    initExpenseForm();
    
    // Expose updateDashboard globally for other modules
    window.updateDashboard = updateDashboard;
    
    console.log('✅ Application initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing application:', error);
  }
}

// Start app when DOM is ready
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Expense Feature Module
 * Handles expense form submission and data management
 */

import { db } from '../config/firebase.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { showSuccessModal } from '../components/Modal.js';
import { getUsers } from '../services/database.js';

/**
 * Initialize expense form
 */
export function initExpenseForm() {
  const expenseForm = document.getElementById('expense-form');
  
  if (!expenseForm) {
    console.warn('Expense form not found');
    return;
  }
  
  expenseForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('expense-date').value;
    const userId = document.getElementById('expense-user').value;
    const amount = parseFloat(document.getElementById('expense-amount').value || '0');
    const receipt = document.getElementById('expense-receipt')?.value.trim() || '';
    const notes = document.getElementById('expense-notes')?.value.trim() || '';
    
    // Validation
    if (!date) {
      alert('Please select a date.');
      return;
    }
    
    if (!userId) {
      alert('Please select a user.');
      return;
    }
    
    if (!amount || amount <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    
    try {
      if (userId === '__all_users__') {
        // Add expense for all active users
        const allUsers = await getUsers();
        const activeUsers = allUsers.filter(u => u.active);
        
        if (activeUsers.length === 0) {
          alert('No active users found.');
          return;
        }
        
        // Confirm batch operation
        const confirmMsg = `Are you sure you want to add BDT ${amount} expense for ${activeUsers.length} users?`;
        if (!confirm(confirmMsg)) {
          return;
        }
        
        // Create expense entries for all active users
        const promises = activeUsers.map(user => {
          const newRef = push(ref(db, 'expenses'));
          return set(newRef, {
            date,
            userId: user.id,
            amount,
            receipt,
            notes,
            createdAt: Date.now()
          });
        });
        
        await Promise.all(promises);
        
        expenseForm.reset();
        showSuccessModal(
          'Expense Saved!',
          `Successfully added expense of BDT ${amount} for ${activeUsers.length} users on ${date}`
        );
      } else {
        // Add expense for single user
        const newRef = push(ref(db, 'expenses'));
        await set(newRef, {
          date,
          userId,
          amount,
          receipt,
          notes,
          createdAt: Date.now()
        });
        
        expenseForm.reset();
        showSuccessModal(
          'Expense Saved!',
          `Successfully added expense of BDT ${amount} on ${date}`
        );
      }
      
      // Update dashboard if available
      if (window.updateDashboard) {
        window.updateDashboard();
      }
      
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense: ' + error.message);
    }
  });
}

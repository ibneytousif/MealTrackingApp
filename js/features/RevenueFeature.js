/**
 * Revenue Feature Module
 * Handles revenue form submission and data management
 */

import { db } from '../config/firebase.js';
import { ref, push, set } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { showSuccessModal } from '../components/Modal.js';
import { getUsers } from '../services/database.js';

/**
 * Initialize revenue form
 */
export function initRevenueForm() {
  const revenueForm = document.getElementById('revenue-form');
  
  if (!revenueForm) {
    console.warn('Revenue form not found');
    return;
  }
  
  revenueForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const date = document.getElementById('revenue-date').value;
    const userId = document.getElementById('revenue-name').value;
    const amount = parseFloat(document.getElementById('revenue-amount').value || '0');
    const source = document.getElementById('revenue-source')?.value.trim() || '';
    const notes = document.getElementById('revenue-notes')?.value.trim() || '';
    
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
        // Add revenue for all active users
        const allUsers = await getUsers();
        const activeUsers = allUsers.filter(u => u.active);
        
        if (activeUsers.length === 0) {
          alert('No active users found.');
          return;
        }
        
        // Confirm batch operation
        const confirmMsg = `Are you sure you want to add BDT ${amount} revenue for ${activeUsers.length} users?`;
        if (!confirm(confirmMsg)) {
          return;
        }
        
        // Create revenue entries for all active users
        const promises = activeUsers.map(user => {
          const newRef = push(ref(db, 'revenue'));
          return set(newRef, {
            date,
            userId: user.id,
            amount,
            source,
            notes,
            createdAt: Date.now()
          });
        });
        
        await Promise.all(promises);
        
        revenueForm.reset();
        showSuccessModal(
          'Revenue Saved!',
          `Successfully added revenue of BDT ${amount} for ${activeUsers.length} users on ${date}`
        );
      } else {
        // Add revenue for single user
        const newRef = push(ref(db, 'revenue'));
        await set(newRef, {
          date,
          userId,
          amount,
          source,
          notes,
          createdAt: Date.now()
        });
        
        revenueForm.reset();
        showSuccessModal(
          'Revenue Saved!',
          `Successfully added revenue of BDT ${amount} on ${date}`
        );
      }
      
      // Update dashboard if available
      if (window.updateDashboard) {
        window.updateDashboard();
      }
      
    } catch (error) {
      console.error('Error saving revenue:', error);
      alert('Error saving revenue: ' + error.message);
    }
  });
}

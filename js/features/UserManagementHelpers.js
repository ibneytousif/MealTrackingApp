/**
 * User Management Helper Functions
 * Filtering and inline editing for user data
 */

import { formatDate, formatCurrency } from '../utils/helpers.js';
import { showSuccessModal } from '../components/Modal.js';
import { db } from '../config/firebase.js';
import { ref, update } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';

/**
 * Render user data table with optional filtering and inline editing
 */
export function renderUserDataTable(items, userId, userName, filterType = 'all') {
  // Filter items based on type
  let filteredItems = items;
  if (filterType !== 'all') {
    filteredItems = items.filter(item => item.type === filterType);
  }
  
  let html = `<h4 style="margin:0 0 10px 0;color:#495057;">`;
  html += filterType === 'all' ? 'All User Data' : 
          filterType === 'revenue' ? 'Revenue Entries' :
          filterType === 'expense' ? 'Expense Entries' : 'Meal Entries';
  html += ` <span style="font-weight:normal;color:#6c757d;">(${filteredItems.length} ${filteredItems.length === 1 ? 'entry' : 'entries'})</span>`;
  html += `</h4>`;
  
  html += `<div style="overflow:auto;max-height:400px;border:1px solid #e9ecef;border-radius:8px;">`;
  html += `<table style="border-collapse:collapse;width:100%;font-size:0.85rem;">`;
  html += `<thead><tr style="background:#f8f9fa;position:sticky;top:0;z-index:10;">`;
  html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Date</th>`;
  
  if (filterType === 'all') {
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Type</th>`;
  }
  
  // Dynamic column headers based on type
  if (filterType === 'revenue') {
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Source</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Amount</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Notes</th>`;
  } else if (filterType === 'expense') {
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Receipt Info</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Amount</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Notes</th>`;
  } else if (filterType === 'meal') {
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Meal Name</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Tags</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Notes</th>`;
  } else {
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Details</th>`;
    html += `<th style="text-align:left;padding:8px;border-bottom:1px solid #dee2e6;">Amount</th>`;
  }
  
  html += `<th style="text-align:center;padding:8px;border-bottom:1px solid #dee2e6;">Actions</th>`;
  html += `</tr></thead><tbody>`;
  
  if (filteredItems.length === 0) {
    const colSpan = filterType === 'all' ? 5 : filterType === 'meal' ? 5 : 6;
    html += `<tr><td colspan="${colSpan}" style="padding:20px;text-align:center;font-style:italic;color:#868e96;">No ${filterType === 'all' ? '' : filterType} entries found</td></tr>`;
  } else {
    filteredItems.forEach(item => {
      const typeColor = item.type === 'revenue' ? '#28a745' : item.type === 'expense' ? '#dc3545' : '#ffc107';
      
      html += `<tr data-entry-id="${item.key}" data-entry-type="${item.type}">`;
      
      // Date column (editable)
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
      html += `<span class="view-mode view-date-${item.key}" onclick="window.editUserEntry('${item.key}', 'date')" style="cursor:pointer;text-decoration:underline dotted;">${formatDate(item.date)}</span>`;
      html += `<input type="date" class="edit-mode edit-date-${item.key}" value="${item.date}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'date', this.value, '${userId}', '${userName}')">`;
      html += `</td>`;
      
      // Type column (only for 'all' filter)
      if (filterType === 'all') {
        html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;"><span style="color:${typeColor};font-weight:600;text-transform:capitalize;">${item.type}</span></td>`;
      }
      
      // Type-specific columns with inline editing
      if (item.type === 'revenue') {
        html += renderRevenueFields(item, userId, userName, filterType);
      } else if (item.type === 'expense') {
        html += renderExpenseFields(item, userId, userName, filterType);
      } else if (item.type === 'meal') {
        html += renderMealFields(item, userId, userName, filterType);
      }
      
      // Actions column
      html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;text-align:center;">`;
      html += `<button class="mini-btn delete" onclick="window.deleteUserDataEntry('${item.key}', '${item.type}', '${userId}', '${userName}')" style="font-size:0.7rem;padding:4px 8px;">🗑️</button>`;
      html += `</td></tr>`;
    });
  }
  
  html += `</tbody></table></div>`;
  html += `<div style="margin-top:15px;padding:10px;background:#d1ecf1;border:1px solid #bee5eb;border-radius:4px;font-size:0.8rem;color:#0c5460;">`;
  html += `<strong>💡 Tip:</strong> Click on any field (underlined) to edit it inline. Changes save automatically.`;
  html += `</div>`;
  
  return html;
}

function renderRevenueFields(item, userId, userName, filterType) {
  let html = '';
  
  // Source
  html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
  html += `<span class="view-mode view-source-${item.key}" onclick="window.editUserEntry('${item.key}', 'source')" style="cursor:pointer;text-decoration:underline dotted;">${item.source || '-'}</span>`;
  html += `<input type="text" class="edit-mode edit-source-${item.key}" value="${(item.source || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'source', this.value, '${userId}', '${userName}')">`;
  html += `</td>`;
  
  // Amount
  html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
  html += `<span class="view-mode view-amount-${item.key}" onclick="window.editUserEntry('${item.key}', 'amount')" style="cursor:pointer;text-decoration:underline dotted;font-weight:600;">${formatCurrency(item.amount)}</span>`;
  html += `<input type="number" class="edit-mode edit-amount-${item.key}" value="${item.amount}" step="0.01" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'amount', this.value, '${userId}', '${userName}')">`;
  html += `</td>`;
  
  if (filterType !== 'all') {
    // Notes
    html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
    html += `<span class="view-mode view-notes-${item.key}" onclick="window.editUserEntry('${item.key}', 'notes')" style="cursor:pointer;text-decoration:underline dotted;">${item.notes || '-'}</span>`;
    html += `<input type="text" class="edit-mode edit-notes-${item.key}" value="${(item.notes || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'notes', this.value, '${userId}', '${userName}')">`;
    html += `</td>`;
  }
  
  return html;
}

function renderExpenseFields(item, userId, userName, filterType) {
  let html = '';
  
  // Receipt
  html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
  html += `<span class="view-mode view-receipt-${item.key}" onclick="window.editUserEntry('${item.key}', 'receipt')" style="cursor:pointer;text-decoration:underline dotted;">${item.receipt || '-'}</span>`;
  html += `<input type="text" class="edit-mode edit-receipt-${item.key}" value="${(item.receipt || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'receipt', this.value, '${userId}', '${userName}')">`;
  html += `</td>`;
  
  // Amount
  html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
  html += `<span class="view-mode view-amount-${item.key}" onclick="window.editUserEntry('${item.key}', 'amount')" style="cursor:pointer;text-decoration:underline dotted;font-weight:600;">${formatCurrency(item.amount)}</span>`;
  html += `<input type="number" class="edit-mode edit-amount-${item.key}" value="${item.amount}" step="0.01" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'amount', this.value, '${userId}', '${userName}')">`;
  html += `</td>`;
  
  if (filterType !== 'all') {
    // Notes
    html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
    html += `<span class="view-mode view-notes-${item.key}" onclick="window.editUserEntry('${item.key}', 'notes')" style="cursor:pointer;text-decoration:underline dotted;">${item.notes || '-'}</span>`;
    html += `<input type="text" class="edit-mode edit-notes-${item.key}" value="${(item.notes || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'notes', this.value, '${userId}', '${userName}')">`;
    html += `</td>`;
  }
  
  return html;
}

function renderMealFields(item, userId, userName, filterType) {
  let html = '';
  
  // Meal Name
  html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
  html += `<span class="view-mode view-mealName-${item.key}" onclick="window.editUserEntry('${item.key}', 'mealName')" style="cursor:pointer;text-decoration:underline dotted;">${item.mealName || '-'}</span>`;
  html += `<input type="text" class="edit-mode edit-mealName-${item.key}" value="${(item.mealName || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'mealName', this.value, '${userId}', '${userName}')">`;
  html += `</td>`;
  
  if (filterType !== 'all') {
    // Tags
    html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
    html += `<span class="view-mode view-tags-${item.key}" onclick="window.editUserEntry('${item.key}', 'tags')" style="cursor:pointer;text-decoration:underline dotted;">${item.tags || '-'}</span>`;
    html += `<input type="text" class="edit-mode edit-tags-${item.key}" value="${(item.tags || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'tags', this.value, '${userId}', '${userName}')">`;
    html += `</td>`;
    
    // Notes
    html += `<td style="padding:8px;border-bottom:1px solid #f1f3f4;">`;
    html += `<span class="view-mode view-notes-${item.key}" onclick="window.editUserEntry('${item.key}', 'notes')" style="cursor:pointer;text-decoration:underline dotted;">${item.notes || '-'}</span>`;
    html += `<input type="text" class="edit-mode edit-notes-${item.key}" value="${(item.notes || '').replace(/"/g, '&quot;')}" style="display:none;width:100%;padding:4px;border:2px solid #667eea;border-radius:4px;" onblur="window.saveUserEntry('${item.key}', '${item.type}', 'notes', this.value, '${userId}', '${userName}')">`;
    html += `</td>`;
  }
  
  return html;
}

/**
 * Setup global functions for inline editing
 */
export function setupGlobalEditFunctions() {
  /**
   * Filter user data by type
   */
  window.filterUserData = function(userId, userName, filterType) {
    if (!window.currentUserData) return;
    
    const { allItems } = window.currentUserData;
    const container = document.getElementById('user-data-table-container');
    if (!container) return;
    
    // Update active filter highlight
    document.querySelectorAll('.user-stat-card').forEach(card => {
      const cardFilter = card.getAttribute('data-filter');
      if (cardFilter === filterType) {
        card.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
        card.style.transform = 'scale(1.05)';
      } else {
        card.style.boxShadow = 'none';
        card.style.transform = 'scale(1)';
      }
    });
    
    // Re-render table with filter
    container.innerHTML = renderUserDataTable(allItems, userId, userName, filterType);
  };

  /**
   * Edit user entry field
   */
  window.editUserEntry = function(entryKey, fieldName) {
    const viewEl = document.querySelector(`.view-${fieldName}-${entryKey}`);
    const editEl = document.querySelector(`.edit-${fieldName}-${entryKey}`);
    
    if (viewEl && editEl) {
      viewEl.style.display = 'none';
      editEl.style.display = 'block';
      editEl.focus();
      editEl.select();
    }
  };

  /**
   * Save user entry field
   */
  window.saveUserEntry = async function(entryKey, entryType, fieldName, newValue, userId, userName) {
    const viewEl = document.querySelector(`.view-${fieldName}-${entryKey}`);
    const editEl = document.querySelector(`.edit-${fieldName}-${entryKey}`);
    
    try {
      // Determine the database path
      let path;
      if (entryType === 'revenue') path = 'revenue';
      else if (entryType === 'expense') path = 'expenses';
      else if (entryType === 'meal') path = 'meals';
      else return;
      
      // Prepare update data
      const updateData = {};
      
      // Handle different field types
      if (fieldName === 'amount') {
        updateData[fieldName] = parseFloat(newValue) || 0;
      } else {
        updateData[fieldName] = newValue;
      }
      
      // Update in Firebase
      await update(ref(db, `${path}/${entryKey}`), updateData);
      
      // Update view mode display
      if (viewEl) {
        if (fieldName === 'amount') {
          viewEl.textContent = formatCurrency(parseFloat(newValue) || 0);
        } else if (fieldName === 'date') {
          viewEl.textContent = formatDate(newValue);
        } else {
          viewEl.textContent = newValue || '-';
        }
      }
      
      // Switch back to view mode
      if (viewEl && editEl) {
        viewEl.style.display = 'inline';
        editEl.style.display = 'none';
      }
      
      // Show success feedback
      showSuccessModal('Updated!', `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} updated successfully`);
      
      // Refresh the view to update totals after a brief delay
      setTimeout(() => {
        const activeFilter = document.querySelector('.user-stat-card[style*="scale(1.05)"]');
        const filterType = activeFilter ? activeFilter.getAttribute('data-filter') : 'all';
        
        // Re-render user view
        if (window.showManageUserView) {
          window.showManageUserView(userId, userName);
          setTimeout(() => {
            if (filterType !== 'all') {
              window.filterUserData(userId, userName, filterType);
            }
          }, 100);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error saving entry:', error);
      alert('Error saving changes: ' + error.message);
      
      // Revert to view mode
      if (viewEl && editEl) {
        viewEl.style.display = 'inline';
        editEl.style.display = 'none';
      }
    }
  };
}

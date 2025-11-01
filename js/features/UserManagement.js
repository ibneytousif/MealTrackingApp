/**
 * User Management Feature
 * Manage users, view their data, and perform CRUD operations
 */

import { getUsers, createUser, updateUser, deleteUser, getRevenue, getExpenses, getMeals } from '../services/database.js';
import { showSuccessModal } from '../components/Modal.js';
import { formatDate, formatCurrency } from '../utils/helpers.js';
import { db } from '../config/firebase.js';
import { ref, get, child, remove } from 'https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js';
import { renderUserDataTable, setupGlobalEditFunctions } from './UserManagementHelpers.js';

/**
 * Initialize user management
 */
export async function initManageUsers() {
  // Setup global edit functions
  setupGlobalEditFunctions();
  
  const addBtn = document.getElementById('add-new-user-btn');
  if (addBtn) {
    addBtn.addEventListener('click', async () => {
      const name = prompt('Enter new user name');
      if (name && name.trim()) {
        try {
          const id = await createUser(name.trim());
          showSuccessModal(
            'User Created!',
            `Successfully created user "${name.trim()}"`
          );
          await loadUsersIntoSelects(id);
          await renderManageUsersTable();
        } catch (err) {
          alert(err.message);
        }
      }
    });
  }
  await renderManageUsersTable();
}

/**
 * Load users into select dropdowns
 */
export async function loadUsersIntoSelects(selectUserIdToFocus) {
  try {
    const users = await getUsers();
    const activeUsers = users.filter(u => u.active);
    
    // Get all user select elements
    const selects = document.querySelectorAll('.user-select');
    
    selects.forEach(select => {
      const currentValue = select.value;
      select.innerHTML = '<option value="">Select User</option>';
      
      activeUsers.forEach(user => {
        const option = document.createElement('option');
        option.value = user.id;
        option.textContent = user.name;
        select.appendChild(option);
      });
      
      // Restore or set focus value
      if (selectUserIdToFocus) {
        select.value = selectUserIdToFocus;
      } else if (currentValue) {
        select.value = currentValue;
      }
    });
  } catch (error) {
    console.error('Error loading users into selects:', error);
  }
}

/**
 * Render users management table
 */
async function renderManageUsersTable() {
  const body = document.getElementById('manage-users-table-body');
  if (!body) return;
  
  body.innerHTML = '';
  
  try {
    const snap = await get(child(ref(db), 'users'));
    
    // Create header
    const header = document.createElement('div');
    header.className = 'table-row header';
    ['Name', 'Status', 'Created', 'Actions'].forEach(h => {
      const s = document.createElement('span');
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
        .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    
    if (users.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-row';
      empty.textContent = 'No users in database';
      body.appendChild(empty);
      return;
    }
    
    users.forEach(u => {
      const row = document.createElement('div');
      row.className = 'table-row';
      
      // Name
      const nameSpan = document.createElement('span');
      nameSpan.textContent = u.name || '(Unnamed)';
      row.appendChild(nameSpan);
      
      // Status
      const statusSpan = document.createElement('span');
      const statusBadge = document.createElement('span');
      const isActive = u.active !== false;
      statusBadge.className = 'badge ' + (isActive ? 'active' : 'inactive');
      statusBadge.textContent = isActive ? 'ACTIVE' : 'INACTIVE';
      statusSpan.appendChild(statusBadge);
      row.appendChild(statusSpan);
      
      // Created date
      const createdSpan = document.createElement('span');
      const createdDate = u.createdAt
        ? new Date(u.createdAt).toLocaleDateString()
        : 'Unknown';
      createdSpan.textContent = createdDate;
      createdSpan.style.fontSize = '0.8rem';
      createdSpan.style.color = '#6c757d';
      row.appendChild(createdSpan);
      
      // Actions
      const actionsSpan = document.createElement('span');
      const actionsWrapper = document.createElement('div');
      actionsWrapper.className = 'action-btns';
      
      // View button
      const viewBtn = document.createElement('button');
      viewBtn.className = 'mini-btn';
      viewBtn.textContent = 'View';
      viewBtn.title = 'View & manage all user data';
      viewBtn.addEventListener('click', () => showManageUserView(u.id, u.name));
      actionsWrapper.appendChild(viewBtn);
      
      // Active/Inactive toggle
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'mini-btn ' + (isActive ? 'delete' : 'restore');
      toggleBtn.textContent = isActive ? 'Deactivate' : 'Activate';
      toggleBtn.title = isActive ? 'Set user inactive' : 'Set user active';
      toggleBtn.addEventListener('click', async () => {
        await updateUser(u.id, { active: !isActive });
        showSuccessModal(
          isActive ? 'User Deactivated!' : 'User Activated!',
          `User "${u.name}" is now ${isActive ? 'inactive' : 'active'}`
        );
        await loadUsersIntoSelects();
        await renderManageUsersTable();
      });
      actionsWrapper.appendChild(toggleBtn);
      
      // Delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'mini-btn delete';
      deleteBtn.textContent = 'Delete';
      deleteBtn.title = 'Permanently delete user';
      deleteBtn.addEventListener('click', () => confirmManageUserDelete(u.id, u.name));
      actionsWrapper.appendChild(deleteBtn);
      
      actionsSpan.appendChild(actionsWrapper);
      row.appendChild(actionsSpan);
      body.appendChild(row);
    });
  } catch (error) {
    console.error('Error rendering users table:', error);
    body.innerHTML = '<div class="empty-row">Error loading users</div>';
  }
}

/**
 * Show detailed user view
 */
async function showManageUserView(userId, userName) {
  const container = document.getElementById('manage-user-detail');
  const header = document.getElementById('manage-user-detail-header');
  const bodyDiv = document.getElementById('manage-user-detail-body');
  
  if (!container || !header || !bodyDiv) return;
  
  container.style.display = 'block';
  header.textContent = `Managing: ${userName}`;
  bodyDiv.innerHTML = 'Loading user data...';
  
  try {
    // Fetch all user data
    const [revSnap, expSnap, mealSnap, userSnap] = await Promise.all([
      get(child(ref(db), 'revenue')),
      get(child(ref(db), 'expenses')),
      get(child(ref(db), 'meals')),
      get(child(ref(db), 'users/' + userId))
    ]);
    
    const userData = userSnap.val() || {};
    const revItems = Object.entries(revSnap.val() || {})
      .filter(([_, v]) => v.userId === userId)
      .map(([k, v]) => ({ key: k, type: 'revenue', ...v }));
    const expItems = Object.entries(expSnap.val() || {})
      .filter(([_, v]) => v.userId === userId)
      .map(([k, v]) => ({ key: k, type: 'expense', ...v }));
    const mealItems = Object.entries(mealSnap.val() || {})
      .filter(([_, v]) => v.userId === userId)
      .map(([k, v]) => ({ key: k, type: 'meal', ...v }));
    
    const allItems = [...revItems, ...expItems, ...mealItems]
      .sort((a, b) => b.date.localeCompare(a.date));
    
    const totalRevenue = revItems.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const totalExpenses = expItems.reduce((s, r) => s + (parseFloat(r.amount) || 0), 0);
    const net = totalRevenue - totalExpenses;
    
    let html = '';
    
    // User info and stats
    html += `<div style="background:#f8f9fa;padding:15px;border-radius:8px;margin-bottom:15px;">`;
    html += `<h4 style="margin:0 0 10px 0;color:#495057;">User Information</h4>`;
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:10px;">`;
    html += `<div><strong>Name:</strong> ${userData.name || 'N/A'}</div>`;
    html += `<div><strong>Status:</strong> <span class="badge ${userData.active !== false ? 'active' : 'inactive'}">${userData.active !== false ? 'ACTIVE' : 'INACTIVE'}</span></div>`;
    html += `<div><strong>Created:</strong> ${userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'Unknown'}</div>`;
    html += `<div><strong>Total Entries:</strong> ${allItems.length}</div>`;
    html += `</div>`;
    
    // Stats cards with clickable filters
    html += `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;">`;
    html += `<div class="user-stat-card" data-filter="all" style="text-align:center;padding:8px;background:#6c757d;color:white;border-radius:4px;cursor:pointer;transition:transform 0.2s;" onclick="window.filterUserData('${userId}', '${userName}', 'all')"><div style="font-size:0.8rem;">All Data</div><div style="font-weight:bold;">${allItems.length}</div></div>`;
    html += `<div class="user-stat-card" data-filter="revenue" style="text-align:center;padding:8px;background:#28a745;color:white;border-radius:4px;cursor:pointer;transition:transform 0.2s;" onclick="window.filterUserData('${userId}', '${userName}', 'revenue')"><div style="font-size:0.8rem;">Revenue</div><div style="font-weight:bold;">${formatCurrency(totalRevenue)}</div></div>`;
    html += `<div class="user-stat-card" data-filter="expense" style="text-align:center;padding:8px;background:#dc3545;color:white;border-radius:4px;cursor:pointer;transition:transform 0.2s;" onclick="window.filterUserData('${userId}', '${userName}', 'expense')"><div style="font-size:0.8rem;">Expenses</div><div style="font-weight:bold;">${formatCurrency(totalExpenses)}</div></div>`;
    html += `<div class="user-stat-card" data-filter="meal" style="text-align:center;padding:8px;background:#ffc107;color:#212529;border-radius:4px;cursor:pointer;transition:transform 0.2s;" onclick="window.filterUserData('${userId}', '${userName}', 'meal')"><div style="font-size:0.8rem;">Meals</div><div style="font-weight:bold;">${mealItems.length}</div></div>`;
    html += `</div></div>`;
    
    // All user data table (will be filtered)
    html += `<div id="user-data-table-container">`;
    html += renderUserDataTable(allItems, userId, userName, 'all');
    html += `</div>`;
    
    bodyDiv.innerHTML = html;
    
    // Store data for filtering
    window.currentUserData = {
      userId,
      userName,
      allItems,
      revItems,
      expItems,
      mealItems
    };
    
    // Expose showManageUserView globally for re-rendering
    window.showManageUserView = showManageUserView;
  } catch (error) {
    console.error('Error showing user view:', error);
    bodyDiv.innerHTML = '<div style="padding:20px;color:#dc3545;">Error loading user data</div>';
  }
}

/**
 * Delete user data entry (global function)
 */
window.deleteUserDataEntry = async function(entryKey, entryType, userId, userName) {
  if (!confirm(`Delete this ${entryType} entry permanently?`)) return;
  
  try {
    let path;
    if (entryType === 'revenue') path = 'revenue';
    else if (entryType === 'expense') path = 'expenses';
    else if (entryType === 'meal') path = 'meals';
    else return;
    
    await remove(ref(db, `${path}/${entryKey}`));
    showSuccessModal('Entry Deleted!', `Successfully deleted ${entryType} entry`);
    
    // Refresh the user view
    showManageUserView(userId, userName);
    
    // Trigger dashboard update if available
    if (window.updateDashboard) {
      window.updateDashboard();
    }
  } catch (error) {
    alert('Error deleting entry: ' + error.message);
  }
};

/**
 * Confirm and delete user
 */
async function confirmManageUserDelete(userId, name) {
  try {
    const [revSnap, expSnap, mealSnap] = await Promise.all([
      get(child(ref(db), 'revenue')),
      get(child(ref(db), 'expenses')),
      get(child(ref(db), 'meals'))
    ]);
    
    const revEntries = Object.entries(revSnap.val() || {}).filter(([_, v]) => v.userId === userId);
    const expEntries = Object.entries(expSnap.val() || {}).filter(([_, v]) => v.userId === userId);
    const mealEntries = Object.entries(mealSnap.val() || {}).filter(([_, v]) => v.userId === userId);
    const totalEntries = revEntries.length + expEntries.length + mealEntries.length;
    
    const summary = `User: ${name}\nRevenue entries: ${revEntries.length}\nExpense entries: ${expEntries.length}\nMeal entries: ${mealEntries.length}\nTotal entries: ${totalEntries}`;
    
    if (!confirm('⚠️ DELETE USER PERMANENTLY?\n\n' + summary + '\n\nThis action cannot be undone!')) return;
    
    const cascade = totalEntries > 0
      ? confirm(`Delete ALL ${totalEntries} data entries too?\n\nOK = Delete everything\nCancel = Keep data entries (will show as "Deleted User")`)
      : false;
    
    // Delete user
    await remove(ref(db, 'users/' + userId));
    
    // Delete all entries if cascade chosen
    if (cascade) {
      const deletePromises = [
        ...revEntries.map(([k]) => remove(ref(db, 'revenue/' + k))),
        ...expEntries.map(([k]) => remove(ref(db, 'expenses/' + k))),
        ...mealEntries.map(([k]) => remove(ref(db, 'meals/' + k)))
      ];
      await Promise.all(deletePromises);
    }
    
    // Hide detail view if showing this user
    const detail = document.getElementById('manage-user-detail');
    if (detail && detail.style.display !== 'none' && 
        document.getElementById('manage-user-detail-header')?.textContent.includes(name)) {
      detail.style.display = 'none';
    }
    
    // Refresh UI
    await loadUsersIntoSelects();
    await renderManageUsersTable();
    
    // Trigger dashboard update if available
    if (window.updateDashboard) {
      window.updateDashboard();
    }
    
    showSuccessModal(
      'User Deleted!',
      `User "${name}" deleted${cascade ? ' with all data entries' : ' (data entries retained)'}`
    );
  } catch (error) {
    alert('Error deleting user: ' + error.message);
  }
}

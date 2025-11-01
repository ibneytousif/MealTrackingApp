/**
 * Database Service
 * All Firebase Realtime Database operations
 */

import { db } from '../config/firebase.js';
import {
  ref,
  push,
  set,
  get,
  child,
  update,
  remove,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ==================== USER OPERATIONS ====================

/**
 * Create a new user
 * @param {string} name - User name
 * @returns {Promise<string>} User ID
 */
export async function createUser(name) {
  if (!name || name.trim().length === 0) {
    throw new Error("User name cannot be empty");
  }
  
  const newRef = push(ref(db, "users"));
  await set(newRef, {
    name: name.trim(),
    active: true,
    createdAt: Date.now(),
  });
  
  return newRef.key;
}

/**
 * Get all users
 * @param {boolean} activeOnly - Get only active users
 * @returns {Promise<Array>} Array of user objects
 */
export async function getUsers(activeOnly = false) {
  const snap = await get(child(ref(db), "users"));
  
  if (!snap.exists()) {
    return [];
  }
  
  const usersObj = snap.val();
  let users = Object.entries(usersObj)
    .filter(([_, data]) => data && data.name)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  
  if (activeOnly) {
    users = users.filter(u => u.active !== false);
  }
  
  return users;
}

/**
 * Get all active user IDs
 * @returns {Promise<Array<string>>} Array of user IDs
 */
export async function getAllActiveUserIds() {
  const users = await getUsers(true);
  return users.map(u => u.id);
}

/**
 * Update user data
 * @param {string} userId - User ID
 * @param {Object} data - Data to update
 */
export async function updateUser(userId, data) {
  await update(ref(db, `users/${userId}`), data);
}

/**
 * Delete user and optionally cascade delete their entries
 * @param {string} userId - User ID
 * @param {boolean} cascadeDelete - Delete user's entries
 */
export async function deleteUser(userId, cascadeDelete = false) {
  if (cascadeDelete) {
    // Get all entries for this user
    const [revSnap, expSnap, mealSnap] = await Promise.all([
      get(child(ref(db), "revenue")),
      get(child(ref(db), "expenses")),
      get(child(ref(db), "meals")),
    ]);
    
    // Delete entries
    const deletePromises = [];
    
    if (revSnap.exists()) {
      Object.entries(revSnap.val()).forEach(([key, val]) => {
        if (val.userId === userId) {
          deletePromises.push(remove(ref(db, `revenue/${key}`)));
        }
      });
    }
    
    if (expSnap.exists()) {
      Object.entries(expSnap.val()).forEach(([key, val]) => {
        if (val.userId === userId) {
          deletePromises.push(remove(ref(db, `expenses/${key}`)));
        }
      });
    }
    
    if (mealSnap.exists()) {
      Object.entries(mealSnap.val()).forEach(([key, val]) => {
        if (val.userId === userId) {
          deletePromises.push(remove(ref(db, `meals/${key}`)));
        }
      });
    }
    
    await Promise.all(deletePromises);
  }
  
  // Delete user
  await remove(ref(db, `users/${userId}`));
}

// ==================== REVENUE OPERATIONS ====================

/**
 * Add revenue entry
 * @param {Object} data - Revenue data {date, userId, amount}
 * @returns {Promise<string>} Entry ID
 */
export async function addRevenue(data) {
  const { date, userId, amount } = data;
  
  if (!date || !userId || !amount) {
    throw new Error("Missing required revenue fields");
  }
  
  const newRef = push(ref(db, "revenue"));
  await set(newRef, {
    date,
    userId,
    amount: parseFloat(amount),
    createdAt: Date.now(),
  });
  
  return newRef.key;
}

/**
 * Add revenue for all active users
 * @param {string} date - Date string
 * @param {number} amount - Amount
 */
export async function addRevenueForAllUsers(date, amount) {
  const userIds = await getAllActiveUserIds();
  
  if (userIds.length === 0) {
    throw new Error("No active users found");
  }
  
  const promises = userIds.map(userId => 
    addRevenue({ date, userId, amount })
  );
  
  await Promise.all(promises);
  return userIds.length;
}

/**
 * Get revenue entries
 * @param {Object} filters - Optional filters {fromDate, toDate, userId}
 * @returns {Promise<Array>} Array of revenue entries
 */
export async function getRevenue(filters = {}) {
  const snap = await get(child(ref(db), "revenue"));
  
  if (!snap.exists()) {
    return [];
  }
  
  let items = Object.entries(snap.val())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  
  // Apply filters
  if (filters.fromDate) {
    items = items.filter(item => item.date >= filters.fromDate);
  }
  
  if (filters.toDate) {
    items = items.filter(item => item.date <= filters.toDate);
  }
  
  if (filters.userId) {
    items = items.filter(item => item.userId === filters.userId);
  }
  
  return items;
}

/**
 * Update revenue entry
 * @param {string} key - Entry key
 * @param {Object} data - Data to update
 */
export async function updateRevenue(key, data) {
  await update(ref(db, `revenue/${key}`), data);
}

/**
 * Delete revenue entry
 * @param {string} key - Entry key
 */
export async function deleteRevenue(key) {
  await remove(ref(db, `revenue/${key}`));
}

// ==================== EXPENSE OPERATIONS ====================

/**
 * Add expense entry
 * @param {Object} data - Expense data {date, userId, amount, receipt}
 * @returns {Promise<string>} Entry ID
 */
export async function addExpense(data) {
  const { date, userId, amount, receipt = '' } = data;
  
  if (!date || !userId || !amount) {
    throw new Error("Missing required expense fields");
  }
  
  const newRef = push(ref(db, "expenses"));
  await set(newRef, {
    date,
    userId,
    amount: parseFloat(amount),
    receipt,
    createdAt: Date.now(),
  });
  
  return newRef.key;
}

/**
 * Add expense for all active users
 * @param {string} date - Date string
 * @param {number} amount - Amount
 * @param {string} receipt - Receipt info
 */
export async function addExpenseForAllUsers(date, amount, receipt = '') {
  const userIds = await getAllActiveUserIds();
  
  if (userIds.length === 0) {
    throw new Error("No active users found");
  }
  
  const promises = userIds.map(userId => 
    addExpense({ date, userId, amount, receipt })
  );
  
  await Promise.all(promises);
  return userIds.length;
}

/**
 * Get expense entries
 * @param {Object} filters - Optional filters {fromDate, toDate, userId}
 * @returns {Promise<Array>} Array of expense entries
 */
export async function getExpenses(filters = {}) {
  const snap = await get(child(ref(db), "expenses"));
  
  if (!snap.exists()) {
    return [];
  }
  
  let items = Object.entries(snap.val())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  
  // Apply filters
  if (filters.fromDate) {
    items = items.filter(item => item.date >= filters.fromDate);
  }
  
  if (filters.toDate) {
    items = items.filter(item => item.date <= filters.toDate);
  }
  
  if (filters.userId) {
    items = items.filter(item => item.userId === filters.userId);
  }
  
  return items;
}

/**
 * Update expense entry
 * @param {string} key - Entry key
 * @param {Object} data - Data to update
 */
export async function updateExpense(key, data) {
  await update(ref(db, `expenses/${key}`), data);
}

/**
 * Delete expense entry
 * @param {string} key - Entry key
 */
export async function deleteExpense(key) {
  await remove(ref(db, `expenses/${key}`));
}

// ==================== MEAL OPERATIONS ====================

/**
 * Add meal entry
 * @param {Object} data - Meal data {date, userId, mealName}
 * @returns {Promise<string>} Entry ID
 */
export async function addMeal(data) {
  const { date, userId, mealName } = data;
  
  if (!date || !userId || !mealName) {
    throw new Error("Missing required meal fields");
  }
  
  const newRef = push(ref(db, "meals"));
  await set(newRef, {
    date,
    userId,
    mealName,
    createdAt: Date.now(),
  });
  
  return newRef.key;
}

/**
 * Add meals in batch (multiple users and meals)
 * @param {string} date - Date string
 * @param {Array<string>} userIds - Array of user IDs
 * @param {Array<string>} mealNames - Array of meal names
 */
export async function addMealsBatch(date, userIds, mealNames) {
  if (!date || !userIds.length || !mealNames.length) {
    throw new Error("Missing required fields for batch meal add");
  }
  
  const promises = [];
  
  userIds.forEach(userId => {
    mealNames.forEach(mealName => {
      promises.push(addMeal({ date, userId, mealName }));
    });
  });
  
  await Promise.all(promises);
  return promises.length;
}

/**
 * Get meal entries
 * @param {Object} filters - Optional filters {fromDate, toDate, userId}
 * @returns {Promise<Array>} Array of meal entries
 */
export async function getMeals(filters = {}) {
  const snap = await get(child(ref(db), "meals"));
  
  if (!snap.exists()) {
    return [];
  }
  
  let items = Object.entries(snap.val())
    .map(([key, val]) => ({ key, ...val }))
    .sort((a, b) => (a.date === b.date ? 0 : a.date < b.date ? 1 : -1));
  
  // Apply filters
  if (filters.fromDate) {
    items = items.filter(item => item.date >= filters.fromDate);
  }
  
  if (filters.toDate) {
    items = items.filter(item => item.date <= filters.toDate);
  }
  
  if (filters.userId) {
    items = items.filter(item => item.userId === filters.userId);
  }
  
  return items;
}

/**
 * Update meal entry
 * @param {string} key - Entry key
 * @param {Object} data - Data to update
 */
export async function updateMeal(key, data) {
  await update(ref(db, `meals/${key}`), data);
}

/**
 * Delete meal entry
 * @param {string} key - Entry key
 */
export async function deleteMeal(key) {
  await remove(ref(db, `meals/${key}`));
}

// ==================== AGGREGATE OPERATIONS ====================

/**
 * Get all data for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Object containing revenue, expenses, meals arrays
 */
export async function getUserData(userId) {
  const [revenue, expenses, meals, userSnap] = await Promise.all([
    getRevenue({ userId }),
    getExpenses({ userId }),
    getMeals({ userId }),
    get(child(ref(db), `users/${userId}`)),
  ]);
  
  return {
    user: userSnap.val() || {},
    revenue,
    expenses,
    meals,
  };
}

/**
 * Calculate user totals
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Totals object
 */
export async function getUserTotals(userId) {
  const { revenue, expenses, meals } = await getUserData(userId);
  
  const totalRevenue = revenue.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
  const mealCount = meals.length;
  const net = totalRevenue - totalExpenses;
  
  return {
    totalRevenue,
    totalExpenses,
    net,
    mealCount,
  };
}

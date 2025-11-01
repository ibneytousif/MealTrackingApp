/**
 * Utility Functions
 * Helper functions for formatting, validation, and common operations
 */

// ==================== FORMATTERS ====================

/**
 * Format date string
 * @param {string} dateStr - Date string (YYYY-MM-DD)
 * @returns {string} Formatted date or "-"
 */
export function formatDate(dateStr) {
  if (!dateStr) return "-";
  
  try {
    const date = new Date(dateStr + "T00:00:00");
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (e) {
    return dateStr;
  }
}

/**
 * Format currency value
 * @param {number|string} val - Value to format
 * @returns {string} Formatted currency (BDT X.XX)
 */
export function formatCurrency(val) {
  const n = parseFloat(val);
  if (isNaN(n)) return "BDT 0.00";
  return "BDT " + n.toFixed(2);
}

/**
 * Format number with thousands separator
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 */
export function formatNumber(num) {
  return num.toLocaleString();
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns {string} Today's date
 */
export function getTodayDate() {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Get date range (from and to dates)
 * @param {string} rangeType - 'today', 'week', 'month', 'year'
 * @returns {Object} {fromDate, toDate}
 */
export function getDateRange(rangeType) {
  const today = new Date();
  const toDate = today.toISOString().split('T')[0];
  let fromDate = toDate;
  
  switch (rangeType) {
    case 'today':
      fromDate = toDate;
      break;
    case 'week':
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      fromDate = weekAgo.toISOString().split('T')[0];
      break;
    case 'month':
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      fromDate = monthAgo.toISOString().split('T')[0];
      break;
    case 'year':
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      fromDate = yearAgo.toISOString().split('T')[0];
      break;
    default:
      fromDate = toDate;
  }
  
  return { fromDate, toDate };
}

/**
 * Get month start and end dates
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @returns {Object} {fromDate, toDate}
 */
export function getMonthRange(year, month) {
  const fromDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const toDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  
  return { fromDate, toDate };
}

// ==================== VALIDATORS ====================

/**
 * Check if value is empty
 * @param {*} value - Value to check
 * @returns {boolean} True if empty
 */
export function isEmpty(value) {
  return value === null || value === undefined || value === '' || 
         (typeof value === 'string' && value.trim() === '');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Validate number
 * @param {*} value - Value to check
 * @returns {boolean} True if valid number
 */
export function isValidNumber(value) {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Validate positive number
 * @param {*} value - Value to check
 * @returns {boolean} True if positive number
 */
export function isPositiveNumber(value) {
  return isValidNumber(value) && parseFloat(value) > 0;
}

/**
 * Validate date format (YYYY-MM-DD)
 * @param {string} dateStr - Date string
 * @returns {boolean} True if valid
 */
export function isValidDate(dateStr) {
  if (!dateStr) return false;
  const re = /^\d{4}-\d{2}-\d{2}$/;
  if (!re.test(dateStr)) return false;
  
  const date = new Date(dateStr + "T00:00:00");
  return !isNaN(date.getTime());
}

// ==================== DOM HELPERS ====================

/**
 * Query selector helper
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {Element|null} Selected element
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * Query selector all helper
 * @param {string} selector - CSS selector
 * @param {Element} context - Context element (default: document)
 * @returns {NodeList} Selected elements
 */
export function $$(selector, context = document) {
  return context.querySelectorAll(selector);
}

/**
 * Create element with attributes
 * @param {string} tag - Tag name
 * @param {Object} attrs - Attributes object
 * @param {string} content - Text content
 * @returns {Element} Created element
 */
export function createElement(tag, attrs = {}, content = '') {
  const el = document.createElement(tag);
  
  Object.entries(attrs).forEach(([key, value]) => {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'textContent') {
      el.textContent = value;
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (key.startsWith('data')) {
      const dataKey = key.replace('data', '').toLowerCase();
      el.dataset[dataKey] = value;
    } else {
      el.setAttribute(key, value);
    }
  });
  
  if (content) {
    el.textContent = content;
  }
  
  return el;
}

/**
 * Add event listener with delegation support
 * @param {Element} element - Target element
 * @param {string} event - Event name
 * @param {string} selector - Selector for delegation (optional)
 * @param {Function} handler - Event handler
 */
export function on(element, event, selector, handler) {
  if (typeof selector === 'function') {
    // No delegation
    handler = selector;
    element.addEventListener(event, handler);
  } else {
    // With delegation
    element.addEventListener(event, (e) => {
      if (e.target.matches(selector)) {
        handler.call(e.target, e);
      }
    });
  }
}

/**
 * Remove all children from element
 * @param {Element} element - Target element
 */
export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}

/**
 * Show element
 * @param {Element} element - Target element
 */
export function show(element) {
  if (element) {
    element.style.display = '';
    element.classList.remove('hidden');
  }
}

/**
 * Hide element
 * @param {Element} element - Target element
 */
export function hide(element) {
  if (element) {
    element.style.display = 'none';
  }
}

/**
 * Toggle element visibility
 * @param {Element} element - Target element
 */
export function toggle(element) {
  if (element) {
    if (element.style.display === 'none') {
      show(element);
    } else {
      hide(element);
    }
  }
}

// ==================== ARRAY HELPERS ====================

/**
 * Group array by property
 * @param {Array} arr - Array to group
 * @param {string} key - Property key
 * @returns {Object} Grouped object
 */
export function groupBy(arr, key) {
  return arr.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
}

/**
 * Sum array values by property
 * @param {Array} arr - Array to sum
 * @param {string} key - Property key
 * @returns {number} Sum
 */
export function sumBy(arr, key) {
  return arr.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

/**
 * Sort array by property
 * @param {Array} arr - Array to sort
 * @param {string} key - Property key
 * @param {boolean} desc - Descending order
 * @returns {Array} Sorted array
 */
export function sortBy(arr, key, desc = false) {
  return [...arr].sort((a, b) => {
    if (a[key] < b[key]) return desc ? 1 : -1;
    if (a[key] > b[key]) return desc ? -1 : 1;
    return 0;
  });
}

/**
 * Get unique values from array
 * @param {Array} arr - Input array
 * @returns {Array} Unique values
 */
export function unique(arr) {
  return [...new Set(arr)];
}

// ==================== DEBOUNCE/THROTTLE ====================

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit = 300) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// ==================== EXPORT HELPERS ====================

/**
 * Convert array of objects to CSV
 * @param {Array} data - Array of objects
 * @param {Array} headers - Column headers
 * @returns {string} CSV string
 */
export function arrayToCSV(data, headers = null) {
  if (!data || data.length === 0) return '';
  
  // Get headers from first object if not provided
  if (!headers) {
    headers = Object.keys(data[0]);
  }
  
  const csvRows = [];
  
  // Add header row
  csvRows.push(headers.join(','));
  
  // Add data rows
  data.forEach(row => {
    const values = headers.map(header => {
      const value = row[header];
      // Escape values containing comma or quotes
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  });
  
  return csvRows.join('\n');
}

/**
 * Download CSV file
 * @param {string} csv - CSV content
 * @param {string} filename - File name
 */
export function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

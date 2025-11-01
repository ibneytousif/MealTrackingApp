/**
 * Dashboard Feature
 * Enhanced dashboard with comprehensive filtering and user detail views
 */

import { getRevenue, getExpenses, getMeals, getUserData, getUsers } from '../services/database.js';
import { formatDate, formatCurrency, groupBy, sumBy, sortBy } from '../utils/helpers.js';

// State
let currentFilters = {
  fromDate: null,
  toDate: null,
  userId: '',
  dataType: 'all',
  searchQuery: ''
};

let allData = {
  revenue: [],
  expenses: [],
  meals: [],
  users: []
};

let previousPeriodData = {
  revenue: [],
  expenses: [],
  meals: []
};

let userNameCache = {};

/**
 * Initialize dashboard
 */
export async function initDashboard() {
  await loadUsers();
  initDashboardFilters();
  initDashboardSearch();
  initUserDetailView();
  setDateRange('Today');
  await updateDashboard();
}

/**
 * Load all users for filtering
 */
async function loadUsers() {
  try {
    const users = await getUsers();
    allData.users = users;
    
    // Build user name cache
    userNameCache = {};
    users.forEach(user => {
      userNameCache[user.id] = user.name;
    });
    
    // Populate user filter dropdown
    const userFilter = document.getElementById('dash-user-filter');
    if (userFilter) {
      userFilter.innerHTML = '<option value="">All Users</option>';
      users
        .filter(u => u.active)
        .forEach(user => {
          const option = document.createElement('option');
          option.value = user.id;
          option.textContent = user.name;
          userFilter.appendChild(option);
        });
    }
  } catch (error) {
    console.error('Error loading users:', error);
  }
}

/**
 * Initialize dashboard filters
 */
function initDashboardFilters() {
  // Show filter section
  const filterSection = document.querySelector('#dashboard .filter-section');
  if (filterSection) {
    filterSection.style.display = 'block';
  }
  
  // Filter buttons
  const filterButtons = document.querySelectorAll('#dashboard .filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      setDateRange(btn.textContent.trim());
      updateDashboard();
    });
  });
  
  // Date inputs
  const fromDate = document.getElementById('dash-from-date');
  const toDate = document.getElementById('dash-to-date');
  
  if (fromDate) {
    fromDate.addEventListener('change', () => {
      currentFilters.fromDate = fromDate.value;
      updateDashboard();
    });
  }
  
  if (toDate) {
    toDate.addEventListener('change', () => {
      currentFilters.toDate = toDate.value;
      updateDashboard();
    });
  }
  
  // User filter
  const userFilter = document.getElementById('dash-user-filter');
  if (userFilter) {
    userFilter.addEventListener('change', () => {
      currentFilters.userId = userFilter.value;
      updateDashboard();
    });
  }
  
  // Apply button
  const applyBtn = document.getElementById('dash-apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', (e) => {
      e.preventDefault();
      updateDashboard();
    });
  }
}

/**
 * Initialize search functionality
 */
function initDashboardSearch() {
  // Create search input if it doesn't exist
  const filterSection = document.querySelector('#dashboard .filter-section');
  if (!filterSection) return;
  
  let searchRow = filterSection.querySelector('.search-row');
  if (!searchRow) {
    searchRow = document.createElement('div');
    searchRow.className = 'filter-row search-row';
    searchRow.style.marginTop = '15px';
    searchRow.innerHTML = `
      <div class="filter-group" style="flex: 1;">
        <label>🔍 Search in data</label>
        <input 
          type="text" 
          id="dash-search-input" 
          class="form-control" 
          placeholder="Search by name, amount, notes, meal name..."
        />
      </div>
      <button id="dash-clear-btn" class="btn" style="height: fit-content; background: #6c757d;">
        Clear All Filters
      </button>
    `;
    filterSection.appendChild(searchRow);
  }
  
  const searchInput = document.getElementById('dash-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentFilters.searchQuery = e.target.value.toLowerCase();
      updateDashboard();
    });
  }
  
  const clearBtn = document.getElementById('dash-clear-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      resetFilters();
      updateDashboard();
    });
  }
}

/**
 * Initialize user detail view
 */
function initUserDetailView() {
  // Create user detail section if it doesn't exist
  const dashboard = document.getElementById('dashboard');
  if (!dashboard) return;
  
  let userDetailSection = document.getElementById('user-detail-section');
  if (!userDetailSection) {
    userDetailSection = document.createElement('div');
    userDetailSection.id = 'user-detail-section';
    userDetailSection.style.display = 'none';
    userDetailSection.style.marginTop = '30px';
    
    const tablesSection = document.getElementById('dashboard-data-tables');
    if (tablesSection) {
      tablesSection.parentNode.insertBefore(userDetailSection, tablesSection);
    }
  }
}

/**
 * Set date range based on preset
 */
function setDateRange(filterType) {
  const today = new Date();
  const fromDateInput = document.getElementById('dash-from-date');
  const toDateInput = document.getElementById('dash-to-date');
  
  if (!fromDateInput || !toDateInput) return;
  
  const formatLocal = (d) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };
  
  let fromDate = new Date(today);
  const toDate = new Date(today);
  
  switch (filterType) {
    case 'Today':
      fromDate = new Date(today);
      break;
    case 'This Week': {
      const day = today.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diffToMonday);
      break;
    }
    case 'This Month':
      fromDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'This Year':
      fromDate = new Date(today.getFullYear(), 0, 1);
      break;
    case 'Last 7 Days':
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6);
      break;
    case 'Last 30 Days':
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 29);
      break;
    case 'Last 90 Days':
      fromDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 89);
      break;
    default:
      return;
  }
  
  fromDateInput.value = formatLocal(fromDate);
  toDateInput.value = formatLocal(toDate);
  currentFilters.fromDate = formatLocal(fromDate);
  currentFilters.toDate = formatLocal(toDate);
}

/**
 * Reset all filters
 */
function resetFilters() {
  currentFilters = {
    fromDate: null,
    toDate: null,
    userId: '',
    dataType: 'all',
    searchQuery: ''
  };
  
  const fromDateInput = document.getElementById('dash-from-date');
  const toDateInput = document.getElementById('dash-to-date');
  const userFilter = document.getElementById('dash-user-filter');
  const searchInput = document.getElementById('dash-search-input');
  
  if (fromDateInput) fromDateInput.value = '';
  if (toDateInput) toDateInput.value = '';
  if (userFilter) userFilter.value = '';
  if (searchInput) searchInput.value = '';
  
  // Reset filter buttons
  const filterButtons = document.querySelectorAll('#dashboard .filter-btn');
  filterButtons.forEach(b => b.classList.remove('active'));
  
  setDateRange('Today');
}

/**
 * Update dashboard with current filters
 */
export async function updateDashboard() {
  try {
    // Load all data
    const [revenue, expenses, meals] = await Promise.all([
      getRevenue(),
      getExpenses(),
      getMeals()
    ]);
    
    allData.revenue = revenue;
    allData.expenses = expenses;
    allData.meals = meals;
    
    // Apply filters
    const filteredData = applyFilters(allData);
    
    // Load previous period data for comparison
    await loadPreviousPeriodData();
    
    // Update stats cards
    updateStatsCards(filteredData);
    
    // Update quick insights
    updateQuickInsights(filteredData);
    
    // Update charts
    updateCharts(filteredData);
    
    // Update top performers
    updateTopPerformers(filteredData);
    
    // Update tables
    updateDataTables(filteredData);
    
    // Update user breakdown
    updateUserBreakdown(filteredData);
    
  } catch (error) {
    console.error('Error updating dashboard:', error);
  }
}

/**
 * Apply all filters to data
 */
function applyFilters(data) {
  let filtered = {
    revenue: [...data.revenue],
    expenses: [...data.expenses],
    meals: [...data.meals]
  };
  
  // Date filter
  if (currentFilters.fromDate && currentFilters.toDate) {
    filtered.revenue = filtered.revenue.filter(item => 
      item.date >= currentFilters.fromDate && item.date <= currentFilters.toDate
    );
    filtered.expenses = filtered.expenses.filter(item => 
      item.date >= currentFilters.fromDate && item.date <= currentFilters.toDate
    );
    filtered.meals = filtered.meals.filter(item => 
      item.date >= currentFilters.fromDate && item.date <= currentFilters.toDate
    );
  }
  
  // User filter
  if (currentFilters.userId) {
    filtered.revenue = filtered.revenue.filter(item => item.userId === currentFilters.userId);
    filtered.expenses = filtered.expenses.filter(item => item.userId === currentFilters.userId);
    filtered.meals = filtered.meals.filter(item => item.userId === currentFilters.userId);
  }
  
  // Search filter
  if (currentFilters.searchQuery) {
    const query = currentFilters.searchQuery;
    
    filtered.revenue = filtered.revenue.filter(item => 
      (item.source && item.source.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query)) ||
      (item.amount && item.amount.toString().includes(query)) ||
      (userNameCache[item.userId] && userNameCache[item.userId].toLowerCase().includes(query))
    );
    
    filtered.expenses = filtered.expenses.filter(item => 
      (item.receipt && item.receipt.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query)) ||
      (item.amount && item.amount.toString().includes(query)) ||
      (userNameCache[item.userId] && userNameCache[item.userId].toLowerCase().includes(query))
    );
    
    filtered.meals = filtered.meals.filter(item => 
      (item.mealName && item.mealName.toLowerCase().includes(query)) ||
      (item.notes && item.notes.toLowerCase().includes(query)) ||
      (item.tags && item.tags.toLowerCase().includes(query)) ||
      (userNameCache[item.userId] && userNameCache[item.userId].toLowerCase().includes(query))
    );
  }
  
  return filtered;
}

/**
 * Load previous period data for comparison
 */
async function loadPreviousPeriodData() {
  if (!currentFilters.fromDate || !currentFilters.toDate) {
    previousPeriodData = { revenue: [], expenses: [], meals: [] };
    return;
  }
  
  try {
    const from = new Date(currentFilters.fromDate);
    const to = new Date(currentFilters.toDate);
    const rangeDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    // Calculate previous period
    const prevTo = new Date(from);
    prevTo.setDate(prevTo.getDate() - 1);
    const prevFrom = new Date(prevTo);
    prevFrom.setDate(prevFrom.getDate() - rangeDays + 1);
    
    const formatLocal = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };
    
    const prevFromStr = formatLocal(prevFrom);
    const prevToStr = formatLocal(prevTo);
    
    // Filter previous period data
    previousPeriodData.revenue = allData.revenue.filter(item => 
      item.date >= prevFromStr && item.date <= prevToStr
    );
    previousPeriodData.expenses = allData.expenses.filter(item => 
      item.date >= prevFromStr && item.date <= prevToStr
    );
    previousPeriodData.meals = allData.meals.filter(item => 
      item.date >= prevFromStr && item.date <= prevToStr
    );
    
    // Apply user filter to previous period
    if (currentFilters.userId) {
      previousPeriodData.revenue = previousPeriodData.revenue.filter(item => item.userId === currentFilters.userId);
      previousPeriodData.expenses = previousPeriodData.expenses.filter(item => item.userId === currentFilters.userId);
      previousPeriodData.meals = previousPeriodData.meals.filter(item => item.userId === currentFilters.userId);
    }
  } catch (error) {
    console.error('Error loading previous period:', error);
    previousPeriodData = { revenue: [], expenses: [], meals: [] };
  }
}

/**
 * Update stats cards with enhanced info
 */
function updateStatsCards(data) {
  const totalRevenueEl = document.querySelector('#dashboard .stats-card.revenue .stats-value');
  const totalExpensesEl = document.querySelector('#dashboard .stats-card.expense .stats-value');
  const totalMealsEl = document.querySelector('#dashboard .stats-card.meals .stats-value');
  
  const currentRevenue = sumBy(data.revenue, 'amount');
  const currentExpenses = sumBy(data.expenses, 'amount');
  const currentMeals = data.meals.length;
  
  const prevRevenue = sumBy(previousPeriodData.revenue, 'amount');
  const prevExpenses = sumBy(previousPeriodData.expenses, 'amount');
  const prevMeals = previousPeriodData.meals.length;
  
  if (totalRevenueEl) {
    const change = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : 0;
    const trend = change > 0 ? '↗' : change < 0 ? '↘' : '→';
    const trendClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    totalRevenueEl.innerHTML = `
      ${formatCurrency(currentRevenue)}
      ${prevRevenue > 0 ? `<span class="trend ${trendClass}">${trend} ${Math.abs(change)}%</span>` : ''}
    `;
  }
  
  if (totalExpensesEl) {
    const change = prevExpenses > 0 ? ((currentExpenses - prevExpenses) / prevExpenses * 100).toFixed(1) : 0;
    const trend = change > 0 ? '↗' : change < 0 ? '↘' : '→';
    const trendClass = change > 0 ? 'negative' : change < 0 ? 'positive' : 'neutral';
    totalExpensesEl.innerHTML = `
      ${formatCurrency(currentExpenses)}
      ${prevExpenses > 0 ? `<span class="trend ${trendClass}">${trend} ${Math.abs(change)}%</span>` : ''}
    `;
  }
  
  if (totalMealsEl) {
    const change = prevMeals > 0 ? ((currentMeals - prevMeals) / prevMeals * 100).toFixed(1) : 0;
    const trend = change > 0 ? '↗' : change < 0 ? '↘' : '→';
    const trendClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    totalMealsEl.innerHTML = `
      ${currentMeals}
      ${prevMeals > 0 ? `<span class="trend ${trendClass}">${trend} ${Math.abs(change)}%</span>` : ''}
    `;
  }
  
  // Add net profit card if not exists
  addNetProfitCard(currentRevenue, currentExpenses, prevRevenue, prevExpenses);
}

/**
 * Add net profit card to dashboard
 */
function addNetProfitCard(currentRevenue, currentExpenses, prevRevenue, prevExpenses) {
  const dashboardSection = document.querySelector('#dashboard .dashboard-section');
  if (!dashboardSection) return;
  
  let profitCard = dashboardSection.querySelector('.stats-card.profit');
  if (!profitCard) {
    profitCard = document.createElement('div');
    profitCard.className = 'stats-card profit';
    profitCard.innerHTML = '<h3>Net Profit</h3><div class="stats-value">$0.00</div>';
    dashboardSection.appendChild(profitCard);
  }
  
  const netProfit = currentRevenue - currentExpenses;
  const prevNetProfit = prevRevenue - prevExpenses;
  const change = prevNetProfit !== 0 ? ((netProfit - prevNetProfit) / Math.abs(prevNetProfit) * 100).toFixed(1) : 0;
  const trend = change > 0 ? '↗' : change < 0 ? '↘' : '→';
  const trendClass = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
  
  const valueEl = profitCard.querySelector('.stats-value');
  if (valueEl) {
    valueEl.innerHTML = `
      ${formatCurrency(netProfit)}
      ${prevNetProfit !== 0 ? `<span class="trend ${trendClass}">${trend} ${Math.abs(change)}%</span>` : ''}
    `;
  }
}

/**
 * Update quick insights section
 */
function updateQuickInsights(data) {
  let insightsSection = document.getElementById('quick-insights');
  if (!insightsSection) {
    // Create insights section
    const dashboard = document.getElementById('dashboard');
    const statsSection = dashboard.querySelector('.dashboard-section');
    if (!statsSection) return;
    
    insightsSection = document.createElement('div');
    insightsSection.id = 'quick-insights';
    insightsSection.className = 'insights-section';
    statsSection.after(insightsSection);
  }
  
  const insights = generateInsights(data);
  
  let html = '<h3 style="margin-bottom: 15px; color: #2c3e50;">💡 Quick Insights</h3>';
  html += '<div class="insights-grid">';
  
  insights.forEach(insight => {
    html += `
      <div class="insight-card ${insight.type}">
        <div class="insight-icon">${insight.icon}</div>
        <div class="insight-content">
          <div class="insight-title">${insight.title}</div>
          <div class="insight-value">${insight.value}</div>
        </div>
      </div>
    `;
  });
  
  html += '</div>';
  insightsSection.innerHTML = html;
}

/**
 * Generate insights from data
 */
function generateInsights(data) {
  const insights = [];
  
  const totalRevenue = sumBy(data.revenue, 'amount');
  const totalExpenses = sumBy(data.expenses, 'amount');
  const totalMeals = data.meals.length;
  
  // Average daily revenue
  if (currentFilters.fromDate && currentFilters.toDate) {
    const from = new Date(currentFilters.fromDate);
    const to = new Date(currentFilters.toDate);
    const days = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
    
    const avgRevenue = totalRevenue / days;
    insights.push({
      icon: '💰',
      title: 'Avg Daily Revenue',
      value: formatCurrency(avgRevenue),
      type: 'info'
    });
    
    const avgExpenses = totalExpenses / days;
    insights.push({
      icon: '💳',
      title: 'Avg Daily Expenses',
      value: formatCurrency(avgExpenses),
      type: 'info'
    });
    
    const avgMeals = totalMeals / days;
    insights.push({
      icon: '🍽️',
      title: 'Avg Daily Meals',
      value: avgMeals.toFixed(1),
      type: 'info'
    });
  }
  
  // Profit margin
  if (totalRevenue > 0) {
    const margin = ((totalRevenue - totalExpenses) / totalRevenue * 100).toFixed(1);
    insights.push({
      icon: '📊',
      title: 'Profit Margin',
      value: `${margin}%`,
      type: margin > 0 ? 'success' : 'warning'
    });
  }
  
  // Transaction count
  const totalTransactions = data.revenue.length + data.expenses.length;
  insights.push({
    icon: '📝',
    title: 'Total Transactions',
    value: totalTransactions.toString(),
    type: 'info'
  });
  
  // Active users
  const activeUsers = new Set([
    ...data.revenue.map(r => r.userId),
    ...data.expenses.map(e => e.userId),
    ...data.meals.map(m => m.userId)
  ]).size;
  
  insights.push({
    icon: '👥',
    title: 'Active Users',
    value: activeUsers.toString(),
    type: 'info'
  });
  
  return insights;
}

/**
 * Update charts
 */
function updateCharts(data) {
  let chartsSection = document.getElementById('dashboard-charts');
  if (!chartsSection) {
    const dashboard = document.getElementById('dashboard');
    const insightsSection = document.getElementById('quick-insights');
    if (!insightsSection) return;
    
    chartsSection = document.createElement('div');
    chartsSection.id = 'dashboard-charts';
    chartsSection.className = 'charts-section';
    insightsSection.after(chartsSection);
  }
  
  // Group data by date
  const revenueByDate = groupBy(data.revenue, 'date');
  const expensesByDate = groupBy(data.expenses, 'date');
  const mealsByDate = groupBy(data.meals, 'date');
  
  // Get all unique dates and sort
  const allDates = new Set([
    ...Object.keys(revenueByDate),
    ...Object.keys(expensesByDate),
    ...Object.keys(mealsByDate)
  ]);
  const sortedDates = Array.from(allDates).sort();
  
  // Limit to last 30 days for chart
  const displayDates = sortedDates.slice(-30);
  
  // Prepare chart data
  const chartData = displayDates.map(date => ({
    date,
    revenue: sumBy(revenueByDate[date] || [], 'amount'),
    expenses: sumBy(expensesByDate[date] || [], 'amount'),
    meals: (mealsByDate[date] || []).length
  }));
  
  let html = '<h3 style="margin-bottom: 15px; color: #2c3e50;">📈 Trends & Analytics</h3>';
  html += '<div class="charts-grid">';
  
  // Meals Chart
  html += '<div class="chart-card">';
  html += '<h4>Meals Logged Over Time</h4>';
  html += renderLineChart(chartData, 'meals');
  html += '</div>';
  
  html += '</div>';
  chartsSection.innerHTML = html;
}

/**
 * Render simple bar chart
 */
function renderBarChart(data, keys) {
  if (data.length === 0) return '<div class="no-data">No data to display</div>';
  
  const maxValue = Math.max(...data.flatMap(d => keys.map(k => d[k])));
  const chartHeight = 200;
  
  let html = '<div class="bar-chart">';
  
  data.forEach(item => {
    const label = formatDate(item.date);
    const shortLabel = label.split('/').slice(0, 2).join('/');
    
    html += '<div class="bar-group">';
    html += '<div class="bars">';
    
    keys.forEach((key, idx) => {
      const value = item[key];
      const height = maxValue > 0 ? (value / maxValue * chartHeight) : 0;
      const color = key === 'revenue' ? '#10b981' : '#ef4444';
      
      html += `
        <div class="bar" style="height: ${height}px; background: ${color};" title="${formatCurrency(value)}">
          ${value > 0 ? `<span class="bar-value">${formatCurrency(value)}</span>` : ''}
        </div>
      `;
    });
    
    html += '</div>';
    html += `<div class="bar-label">${shortLabel}</div>`;
    html += '</div>';
  });
  
  html += '</div>';
  
  // Legend
  html += '<div class="chart-legend">';
  html += '<span class="legend-item"><span class="legend-dot" style="background: #10b981;"></span> Revenue</span>';
  html += '<span class="legend-item"><span class="legend-dot" style="background: #ef4444;"></span> Expenses</span>';
  html += '</div>';
  
  return html;
}

/**
 * Render simple line chart
 */
function renderLineChart(data, key) {
  if (data.length === 0) return '<div class="no-data">No data to display</div>';
  
  const maxValue = Math.max(...data.map(d => d[key]));
  const chartHeight = 200;
  
  let html = '<div class="line-chart">';
  
  data.forEach((item, idx) => {
    const value = item[key];
    const height = maxValue > 0 ? (value / maxValue * chartHeight) : 0;
    const label = formatDate(item.date);
    const shortLabel = label.split('/').slice(0, 2).join('/');
    
    html += `
      <div class="line-point-group">
        <div class="line-point" style="bottom: ${height}px;" title="${value} meals">
          <div class="point-dot"></div>
          ${value > 0 ? `<span class="point-value">${value}</span>` : ''}
        </div>
        <div class="line-label">${shortLabel}</div>
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

/**
 * Update top performers section
 */
function updateTopPerformers(data) {
  let performersSection = document.getElementById('top-performers');
  if (!performersSection) {
    const dashboard = document.getElementById('dashboard');
    const chartsSection = document.getElementById('dashboard-charts');
    if (!chartsSection) return;
    
    performersSection = document.createElement('div');
    performersSection.id = 'top-performers';
    performersSection.className = 'performers-section';
    chartsSection.after(performersSection);
  }
  
  // Group by user
  const revenueByUser = groupBy(data.revenue, 'userId');
  const expensesByUser = groupBy(data.expenses, 'userId');
  const mealsByUser = groupBy(data.meals, 'userId');
  
  // Calculate user stats
  const userStats = Object.keys({...revenueByUser, ...expensesByUser, ...mealsByUser}).map(userId => ({
    userId,
    name: userNameCache[userId] || 'Unknown',
    revenue: sumBy(revenueByUser[userId] || [], 'amount'),
    expenses: sumBy(expensesByUser[userId] || [], 'amount'),
    meals: (mealsByUser[userId] || []).length
  }));
  
  // Sort and get top 5
  const topRevenue = [...userStats].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topExpenses = [...userStats].sort((a, b) => b.expenses - a.expenses).slice(0, 5);
  const topMeals = [...userStats].sort((a, b) => b.meals - a.meals).slice(0, 5);
  
  let html = '<h3 style="margin-bottom: 15px; color: #2c3e50;">🏆 Top Performers</h3>';
  html += '<div class="performers-grid">';
  
  // Top Revenue
  html += '<div class="performer-card">';
  html += '<h4>💰 Top Revenue</h4>';
  html += '<div class="performer-list">';
  topRevenue.forEach((user, idx) => {
    if (user.revenue > 0) {
      html += `
        <div class="performer-item">
          <span class="rank">${idx + 1}</span>
          <span class="name">${user.name}</span>
          <span class="value">${formatCurrency(user.revenue)}</span>
        </div>
      `;
    }
  });
  if (topRevenue.every(u => u.revenue === 0)) {
    html += '<div class="no-data-small">No revenue data</div>';
  }
  html += '</div></div>';
  
  // Top Expenses
  html += '<div class="performer-card">';
  html += '<h4>💳 Top Expenses</h4>';
  html += '<div class="performer-list">';
  topExpenses.forEach((user, idx) => {
    if (user.expenses > 0) {
      html += `
        <div class="performer-item">
          <span class="rank">${idx + 1}</span>
          <span class="name">${user.name}</span>
          <span class="value">${formatCurrency(user.expenses)}</span>
        </div>
      `;
    }
  });
  if (topExpenses.every(u => u.expenses === 0)) {
    html += '<div class="no-data-small">No expense data</div>';
  }
  html += '</div></div>';
  
  // Top Meals
  html += '<div class="performer-card">';
  html += '<h4>🍽️ Most Meals Logged</h4>';
  html += '<div class="performer-list">';
  topMeals.forEach((user, idx) => {
    if (user.meals > 0) {
      html += `
        <div class="performer-item">
          <span class="rank">${idx + 1}</span>
          <span class="name">${user.name}</span>
          <span class="value">${user.meals} meals</span>
        </div>
      `;
    }
  });
  if (topMeals.every(u => u.meals === 0)) {
    html += '<div class="no-data-small">No meal data</div>';
  }
  html += '</div></div>';
  
  html += '</div>';
  performersSection.innerHTML = html;
}

/**
 * Update stats cards
 */
function updateStatsCards_OLD(data) {
  const totalRevenueEl = document.querySelector('#dashboard .stats-card.revenue .stats-value');
  const totalExpensesEl = document.querySelector('#dashboard .stats-card.expense .stats-value');
  const totalMealsEl = document.querySelector('#dashboard .stats-card.meals .stats-value');
  
  if (totalRevenueEl) {
    const revSum = sumBy(data.revenue, 'amount');
    totalRevenueEl.textContent = formatCurrency(revSum);
  }
  
  if (totalExpensesEl) {
    const expSum = sumBy(data.expenses, 'amount');
    totalExpensesEl.textContent = formatCurrency(expSum);
  }
  
  if (totalMealsEl) {
    totalMealsEl.textContent = data.meals.length.toString();
  }
}

/**
 * Update data tables
 */
function updateDataTables(data) {
  // Revenue table
  renderTable('revenue-table-body', data.revenue, [
    'Date',
    'User',
    'Source',
    'Amount',
    'Notes'
  ], (item) => [
    formatDate(item.date),
    userNameCache[item.userId] || 'Unknown',
    item.source || '-',
    formatCurrency(item.amount),
    item.notes || '-'
  ]);
  
  // Expenses table
  renderTable('expenses-table-body', data.expenses, [
    'Date',
    'User',
    'Receipt Info',
    'Amount',
    'Notes'
  ], (item) => [
    formatDate(item.date),
    userNameCache[item.userId] || 'Unknown',
    item.receipt || '-',
    formatCurrency(item.amount),
    item.notes || '-'
  ]);
  
  // Meals table
  renderTable('meals-table-body', data.meals, [
    'Date',
    'User',
    'Meal',
    'Tags',
    'Notes'
  ], (item) => [
    formatDate(item.date),
    userNameCache[item.userId] || 'Unknown',
    item.mealName || '-',
    item.tags || '-',
    item.notes || '-'
  ]);
}

/**
 * Render a table
 */
function renderTable(containerId, items, headers, rowMapper) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-data">No data available for the selected filters</div>';
    return;
  }
  
  let html = '<table><thead><tr>';
  headers.forEach(header => {
    html += `<th>${header}</th>`;
  });
  html += '</tr></thead><tbody>';
  
  // Sort by date (newest first)
  const sorted = sortBy(items, 'date', true);
  
  sorted.forEach(item => {
    const cells = rowMapper(item);
    html += '<tr>';
    cells.forEach(cell => {
      html += `<td>${cell}</td>`;
    });
    html += '</tr>';
  });
  
  html += '</tbody></table>';
  container.innerHTML = html;
}

/**
 * Update user breakdown section
 */
function updateUserBreakdown(data) {
  const userDetailSection = document.getElementById('user-detail-section');
  if (!userDetailSection) return;
  
  // Group data by user
  const revenueByUser = groupBy(data.revenue, 'userId');
  const expensesByUser = groupBy(data.expenses, 'userId');
  const mealsByUser = groupBy(data.meals, 'userId');
  
  // Get all unique user IDs
  const userIds = new Set([
    ...Object.keys(revenueByUser),
    ...Object.keys(expensesByUser),
    ...Object.keys(mealsByUser)
  ]);
  
  if (userIds.size === 0) {
    userDetailSection.style.display = 'none';
    return;
  }
  
  // Build user breakdown
  const userBreakdown = Array.from(userIds).map(userId => {
    const revenue = revenueByUser[userId] || [];
    const expenses = expensesByUser[userId] || [];
    const meals = mealsByUser[userId] || [];
    
    return {
      userId,
      name: userNameCache[userId] || 'Unknown',
      totalRevenue: sumBy(revenue, 'amount'),
      totalExpenses: sumBy(expenses, 'amount'),
      totalMeals: meals.length,
      revenueCount: revenue.length,
      expenseCount: expenses.length,
      balance: sumBy(revenue, 'amount') - sumBy(expenses, 'amount'),
      revenue,
      expenses,
      meals
    };
  });
  
  // Sort by total revenue (descending)
  userBreakdown.sort((a, b) => b.totalRevenue - a.totalRevenue);
  
  // Render user breakdown
  let html = `
    <div class="data-table">
      <div class="table-header">
        📊 User Breakdown & Details
        <span style="font-size: 0.85em; font-weight: normal; margin-left: 15px; color: #6c757d;">
          (${userBreakdown.length} user${userBreakdown.length !== 1 ? 's' : ''})
        </span>
      </div>
      <div class="table-content">
  `;
  
  userBreakdown.forEach(user => {
    html += `
      <div class="user-breakdown-card">
        <div class="user-breakdown-header" onclick="toggleUserDetails('${user.userId}')">
          <div class="user-info">
            <span class="user-icon">👤</span>
            <span class="user-name">${user.name}</span>
          </div>
          <div class="user-stats-summary">
            <span class="stat-badge revenue">
              💰 ${formatCurrency(user.totalRevenue)}
            </span>
            <span class="stat-badge expense">
              💳 ${formatCurrency(user.totalExpenses)}
            </span>
            <span class="stat-badge meals">
              🍽️ ${user.totalMeals} meal${user.totalMeals !== 1 ? 's' : ''}
            </span>
            <span class="stat-badge balance ${user.balance >= 0 ? 'positive' : 'negative'}">
              ${user.balance >= 0 ? '↗' : '↘'} ${formatCurrency(Math.abs(user.balance))}
            </span>
          </div>
          <span class="toggle-icon" id="toggle-${user.userId}">▼</span>
        </div>
        <div class="user-breakdown-details" id="details-${user.userId}" style="display: none;">
          ${renderUserDetails(user)}
        </div>
      </div>
    `;
  });
  
  html += '</div></div>';
  
  userDetailSection.innerHTML = html;
  userDetailSection.style.display = 'block';
  
  // Add toggle function to window
  window.toggleUserDetails = function(userId) {
    const details = document.getElementById(`details-${userId}`);
    const toggle = document.getElementById(`toggle-${userId}`);
    
    if (details.style.display === 'none') {
      details.style.display = 'block';
      toggle.textContent = '▲';
    } else {
      details.style.display = 'none';
      toggle.textContent = '▼';
    }
  };
}

/**
 * Render user details
 */
function renderUserDetails(user) {
  let html = '<div class="user-details-grid">';
  
  // Revenue section
  html += '<div class="detail-section">';
  html += `<h4>💰 Revenue (${user.revenueCount} entries)</h4>`;
  if (user.revenue.length > 0) {
    html += '<div class="detail-table">';
    user.revenue.forEach(item => {
      html += `
        <div class="detail-row">
          <span class="detail-date">${formatDate(item.date)}</span>
          <span class="detail-desc">${item.source || 'Revenue'}</span>
          <span class="detail-amount positive">${formatCurrency(item.amount)}</span>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="no-data-small">No revenue entries</div>';
  }
  html += '</div>';
  
  // Expenses section
  html += '<div class="detail-section">';
  html += `<h4>💳 Expenses (${user.expenseCount} entries)</h4>`;
  if (user.expenses.length > 0) {
    html += '<div class="detail-table">';
    user.expenses.forEach(item => {
      html += `
        <div class="detail-row">
          <span class="detail-date">${formatDate(item.date)}</span>
          <span class="detail-desc">${item.receipt || 'Expense'}</span>
          <span class="detail-amount negative">${formatCurrency(item.amount)}</span>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="no-data-small">No expense entries</div>';
  }
  html += '</div>';
  
  // Meals section
  html += '<div class="detail-section">';
  html += `<h4>🍽️ Meals (${user.totalMeals} entries)</h4>`;
  if (user.meals.length > 0) {
    html += '<div class="detail-table">';
    user.meals.forEach(item => {
      html += `
        <div class="detail-row">
          <span class="detail-date">${formatDate(item.date)}</span>
          <span class="detail-desc">${item.mealName || 'Meal'}</span>
          <span class="detail-tags">${item.tags || '-'}</span>
        </div>
      `;
    });
    html += '</div>';
  } else {
    html += '<div class="no-data-small">No meal entries</div>';
  }
  html += '</div>';
  
  html += '</div>';
  return html;
}

/**
 * Export current filtered data
 */
export function exportFilteredData() {
  const filteredData = applyFilters(allData);
  
  // Combine all data
  const exportData = [];
  
  filteredData.revenue.forEach(item => {
    exportData.push({
      Type: 'Revenue',
      Date: item.date,
      User: userNameCache[item.userId] || 'Unknown',
      Description: item.source || '',
      Amount: item.amount,
      Notes: item.notes || ''
    });
  });
  
  filteredData.expenses.forEach(item => {
    exportData.push({
      Type: 'Expense',
      Date: item.date,
      User: userNameCache[item.userId] || 'Unknown',
      Description: item.receipt || '',
      Amount: item.amount,
      Notes: item.notes || ''
    });
  });
  
  filteredData.meals.forEach(item => {
    exportData.push({
      Type: 'Meal',
      Date: item.date,
      User: userNameCache[item.userId] || 'Unknown',
      Description: item.mealName || '',
      Amount: '',
      Notes: item.notes || ''
    });
  });
  
  return exportData;
}

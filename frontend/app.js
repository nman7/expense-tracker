const API = 'http://localhost:8000/api';

// storing expenses and categories globally so we dont fetch again and again
let allExpenses = [];
let categories = [];
let categoryChart = null;
let trendChart = null;

// one helper to handle all fetch, no need to repeat try catch everywhere
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Something went wrong (${res.status})`);
  }
  // 204 means delete success, no body will come
  if (res.status === 204) return null;
  return res.json();
}

// all API methods in one place
const api = {
  getExpenses: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return fetchJSON(`${API}/expenses/${query ? '?' + query : ''}`);
  },
  createExpense: (data) =>
    fetchJSON(`${API}/expenses/`, { method: 'POST', body: JSON.stringify(data) }),
  updateExpense: (id, data) =>
    fetchJSON(`${API}/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteExpense: (id) =>
    fetchJSON(`${API}/expenses/${id}`, { method: 'DELETE' }),
  getCategories: () => fetchJSON(`${API}/categories/`),
};

// shows red banner when server is down or something goes badly wrong
function showErrorBanner(msg) {
  let banner = document.getElementById('errorBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'errorBanner';
    banner.setAttribute('role', 'alert');
    document.querySelector('.main').prepend(banner);
  }
  banner.textContent = msg;
  banner.classList.add('visible');
}

// hide the banner once things are back to normal
function hideErrorBanner() {
  const banner = document.getElementById('errorBanner');
  if (banner) banner.classList.remove('visible');
}

// small toast for success messages, auto disappear after 3 seconds
function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
}

// opens modal, if expense passed then it prefill the form for editing
function openModal(expense = null) {
  const overlay = document.getElementById('modalOverlay');
  const titleEl = document.getElementById('modalTitle');
  const form = document.getElementById('expenseForm');

  // reset form first otherwise old data will still showing
  form.reset();
  clearFormErrors();
  document.getElementById('expenseId').value = '';

  if (expense) {
    titleEl.textContent = 'Edit Expense';
    document.getElementById('expenseId').value = expense.id;
    document.getElementById('title').value = expense.title;
    document.getElementById('amount').value = expense.amount;
    document.getElementById('date').value = expense.date;
    document.getElementById('category').value = expense.category_id;
    document.getElementById('description').value = expense.description || '';
  } else {
    titleEl.textContent = 'Add Expense';
    // default to todays date so user dont have to select everytime
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
  }

  overlay.classList.add('open');
  // focus first field for keyboard accessibility
  document.getElementById('title').focus();
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
}

// marks field as invalid and show error message below it
function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + 'Error');
  field.classList.add('invalid');
  if (errEl) {
    errEl.textContent = message;
    errEl.style.display = 'block';
  }
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const errEl = document.getElementById(fieldId + 'Error');
  field.classList.remove('invalid');
  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }
}

// clear all field errors at once before revalidating
function clearFormErrors() {
  ['title', 'amount', 'date', 'category'].forEach(clearFieldError);
}

// validate form before saving, returns false if any field is wrong
function validateForm(data) {
  let valid = true;
  clearFormErrors();

  if (!data.title || data.title.length < 2) {
    setFieldError('title', 'Title must be at least 2 characters.');
    valid = false;
  } else if (data.title.length > 100) {
    setFieldError('title', 'Title cannot exceed 100 characters.');
    valid = false;
  }

  if (!data.amount || isNaN(data.amount) || data.amount <= 0) {
    setFieldError('amount', 'Enter a valid amount greater than 0.');
    valid = false;
  }

  if (!data.date) {
    setFieldError('date', 'Please pick a date.');
    valid = false;
  }

  if (!data.category_id) {
    setFieldError('category', 'Please select a category.');
    valid = false;
  }

  return valid;
}

// escape HTML before rendering user input, prevent XSS attack
function escapeHTML(str) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// renders all expense items in the list
function renderExpenses(expenses) {
  const list = document.getElementById('expenseList');

  if (!expenses.length) {
    list.innerHTML = '<p class="empty-state">No expenses found.</p>';
    return;
  }

  list.innerHTML = expenses.map(exp => `
    <div class="expense-item" data-id="${exp.id}">
      <span class="category-dot" style="background:${escapeHTML(exp.category_color)}" aria-hidden="true"></span>
      <div class="expense-info">
        <div class="expense-title">${escapeHTML(exp.title)}</div>
        <div class="expense-meta">${escapeHTML(exp.category_name)} &middot; ${formatDate(exp.date)}</div>
        ${exp.description ? `<div class="expense-meta">${escapeHTML(exp.description)}</div>` : ''}
      </div>
      <span class="expense-amount">$${parseFloat(exp.amount).toFixed(2)}</span>
      <div class="expense-actions">
        <button class="btn-icon" onclick="handleEdit(${exp.id})" aria-label="Edit ${escapeHTML(exp.title)}">✏️</button>
        <button class="btn-icon danger" onclick="handleDeleteClick(this, ${exp.id})" aria-label="Delete ${escapeHTML(exp.title)}">🗑️</button>
      </div>
    </div>
  `).join('');
}

// calculates and renders the 4 summary cards on top
function renderSummary(expenses) {
  const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // this month means current month not last 30 days
  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthTotal = expenses
    .filter(e => e.date.startsWith(thisMonth))
    .reduce((sum, e) => sum + parseFloat(e.amount), 0);

  // finding which category user is spending most on
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category_name] = (catTotals[e.category_name] || 0) + parseFloat(e.amount);
  });
  const topCat = Object.entries(catTotals).sort((a, b) => b[1] - a[1])[0];

  document.getElementById('summaryCards').innerHTML = `
    <div class="summary-card">
      <div class="label">Total Spent</div>
      <div class="value">$${total.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">This Month</div>
      <div class="value">$${monthTotal.toFixed(2)}</div>
    </div>
    <div class="summary-card">
      <div class="label">Top Category</div>
      <div class="value" style="font-size:1.1rem">${topCat ? escapeHTML(topCat[0]) : '—'}</div>
    </div>
    <div class="summary-card">
      <div class="label">Transactions</div>
      <div class="value">${expenses.length}</div>
    </div>
  `;
}

// render both charts together
function renderCharts(expenses) {
  renderCategoryChart(expenses);
  renderTrendChart(expenses);
}

function renderCategoryChart(expenses) {
  const catTotals = {};
  const catColors = {};
  expenses.forEach(e => {
    catTotals[e.category_name] = (catTotals[e.category_name] || 0) + parseFloat(e.amount);
    catColors[e.category_name] = e.category_color;
  });

  const labels = Object.keys(catTotals);
  const data = labels.map(l => catTotals[l].toFixed(2));
  const colors = labels.map(l => catColors[l]);

  // must destroy old chart first otherwise chart.js will throw error silently
  if (categoryChart) categoryChart.destroy();
  categoryChart = new Chart(document.getElementById('categoryChart'), {
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors, borderWidth: 2 }] },
    options: {
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } } },
      cutout: '60%',
    },
  });
}

function renderTrendChart(expenses) {
  // grouping expenses by month for the trend bar chart
  const monthTotals = {};
  expenses.forEach(e => {
    const month = e.date.slice(0, 7);
    monthTotals[month] = (monthTotals[month] || 0) + parseFloat(e.amount);
  });

  // sort months so bars show in correct order left to right
  const sorted = Object.keys(monthTotals).sort();
  const labels = sorted.map(m => {
    const [y, mo] = m.split('-');
    return new Date(y, mo - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  });
  const data = sorted.map(m => monthTotals[m].toFixed(2));

  // same destroy pattern as category chart
  if (trendChart) trendChart.destroy();
  trendChart = new Chart(document.getElementById('trendChart'), {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending ($)',
        data,
        backgroundColor: '#5b5fef',
        borderRadius: 6,
      }],
    },
    options: {
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, ticks: { font: { size: 11 } } },
        x: { ticks: { font: { size: 11 } } },
      },
    },
  });
}

// populate both category dropdowns, one in filter and one in the form
function populateCategoryDropdowns() {
  const filterSelect = document.getElementById('filterCategory');
  const formSelect = document.getElementById('category');

  const options = categories.map(c =>
    `<option value="${c.id}">${escapeHTML(c.name)}</option>`
  ).join('');

  filterSelect.innerHTML = '<option value="">All Categories</option>' + options;
  formSelect.innerHTML = '<option value="">Select a category</option>' + options;
}

// fetch expenses from server based on current filter values
async function loadExpenses() {
  const categoryId = document.getElementById('filterCategory').value;
  const month = document.getElementById('filterMonth').value;

  const params = {};
  if (categoryId) params.category_id = categoryId;
  if (month) params.month = month;

  // show loading while waiting for the server response
  document.getElementById('expenseList').innerHTML = '<p class="loading-state">Loading...</p>';

  try {
    allExpenses = await api.getExpenses(params);
    hideErrorBanner();
    renderExpenses(allExpenses);
    renderSummary(allExpenses);
    renderCharts(allExpenses);
  } catch (e) {
    showErrorBanner('Could not load expenses. Make sure the server is running.');
    document.getElementById('expenseList').innerHTML = '';
  }
}

// find expense in local array and open modal with its data
function handleEdit(id) {
  const expense = allExpenses.find(e => e.id === id);
  if (expense) openModal(expense);
}

// inline confirmation instead of using ugly browser confirm popup
function handleDeleteClick(btn, id) {
  // dont show another confirm if one is already open for this item
  const item = btn.closest('.expense-item');
  if (item.querySelector('.delete-confirm')) return;

  const confirm = document.createElement('div');
  confirm.className = 'delete-confirm';
  confirm.innerHTML = `
    <span>Delete this expense?</span>
    <button class="btn-confirm-yes" aria-label="Confirm delete">Yes</button>
    <button class="btn-confirm-no" aria-label="Cancel delete">No</button>
  `;

  confirm.querySelector('.btn-confirm-yes').addEventListener('click', async () => {
    try {
      await api.deleteExpense(id);
      showToast('Expense deleted');
      loadExpenses();
    } catch (e) {
      showToast('Failed to delete. Try again.');
    }
  });

  // no button just remove the row, nothing is deleted
  confirm.querySelector('.btn-confirm-no').addEventListener('click', () => {
    confirm.remove();
  });

  item.appendChild(confirm);
  // auto focus yes button so user can press enter to confirm
  confirm.querySelector('.btn-confirm-yes').focus();
}

// handles both add new and edit existing expense
document.getElementById('expenseForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const id = document.getElementById('expenseId').value;
  const data = {
    title: document.getElementById('title').value.trim(),
    amount: parseFloat(document.getElementById('amount').value),
    date: document.getElementById('date').value,
    category_id: parseInt(document.getElementById('category').value) || null,
    description: document.getElementById('description').value.trim() || null,
  };

  // dont send request if validation is fail
  if (!validateForm(data)) return;

  const submitBtn = document.getElementById('submitBtn');
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving...';

  try {
    if (id) {
      await api.updateExpense(id, data);
      showToast('Expense updated');
    } else {
      await api.createExpense(data);
      showToast('Expense added');
    }
    closeModal();
    loadExpenses();
  } catch (e) {
    showToast(e.message || 'Something went wrong.');
  } finally {
    // re-enable button no matter what happen
    submitBtn.disabled = false;
    submitBtn.textContent = 'Save';
  }
});

// all the button click listeners
document.getElementById('openFormBtn').addEventListener('click', () => openModal());
document.getElementById('closeModalBtn').addEventListener('click', closeModal);
document.getElementById('cancelBtn').addEventListener('click', closeModal);

// click outside modal to close it
document.getElementById('modalOverlay').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

document.getElementById('filterCategory').addEventListener('change', loadExpenses);
document.getElementById('filterMonth').addEventListener('change', loadExpenses);

// clear button reset both filters and reload all expenses
document.getElementById('clearFilters').addEventListener('click', () => {
  document.getElementById('filterCategory').value = '';
  document.getElementById('filterMonth').value = '';
  loadExpenses();
});

// escape key should close the modal
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// clear error as soon as user start typing in that field
['title', 'amount', 'date', 'category'].forEach(id => {
  document.getElementById(id).addEventListener('input', () => clearFieldError(id));
  document.getElementById(id).addEventListener('change', () => clearFieldError(id));
});

// format date from YYYY-MM-DD to readable format like 5 Apr 2026
function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return new Date(y, m - 1, d).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// init function, categories must load first before expenses
async function init() {
  try {
    categories = await api.getCategories();
    populateCategoryDropdowns();
    loadExpenses();
  } catch (e) {
    showErrorBanner('Cannot connect to server. Please make sure the backend is running.');
  }
}

init();

// ==================== DATA MANAGEMENT ====================
class ExpenseManager {
    constructor() {
        this.expenses = [];
        this.categories = [];
        this.currentFilter = 'month';
        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setDefaultDate();
        this.renderCategories();
        this.renderExpenses();
        this.updateSummary();
        this.populateFilterCategories();
    }

    loadData() {
        // Load expenses from localStorage
        const savedExpenses = localStorage.getItem('expenses');
        this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

        // Load categories from localStorage
        const savedCategories = localStorage.getItem('categories');
        this.categories = savedCategories ? JSON.parse(savedCategories) : this.getDefaultCategories();
    }

    saveData() {
        localStorage.setItem('expenses', JSON.stringify(this.expenses));
        localStorage.setItem('categories', JSON.stringify(this.categories));
    }

    getDefaultCategories() {
        return [
            { id: 'food', name: 'Food & Dining', color: '#EF4444' },
            { id: 'transport', name: 'Transportation', color: '#3B82F6' },
            { id: 'utilities', name: 'Utilities', color: '#F59E0B' },
            { id: 'entertainment', name: 'Entertainment', color: '#8B5CF6' },
            { id: 'healthcare', name: 'Healthcare', color: '#10B981' },
            { id: 'insurance', name: 'Insurance', color: '#6366F1' },
            { id: 'shopping', name: 'Shopping', color: '#EC4899' },
            { id: 'other', name: 'Other', color: '#6B7280' }
        ];
    }

    // ==================== EVENT LISTENERS ====================
    setupEventListeners() {
        // Form submission
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        // Auto date button
        document.getElementById('autoDateBtn').addEventListener('click', () => {
            this.setDefaultDate();
        });

        // Category form
        document.getElementById('newCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToExcel();
        });

        // Time range buttons
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimeRange(e.target.dataset.range);
            });
        });

        // Search input
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderExpenses(e.target.value);
        });

        // Filter category
        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.renderExpenses(document.getElementById('searchInput').value, e.target.value);
        });
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('date').value = formattedDate;
    }

    // ==================== EXPENSE OPERATIONS ====================
    addExpense() {
        const amount = parseFloat(document.getElementById('amount').value);
        const categoryId = document.getElementById('category').value;
        const date = document.getElementById('date').value || new Date().toISOString().split('T')[0];
        const note = document.getElementById('note').value.trim();

        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }

        if (!categoryId) {
            this.showToast('Please select a category', 'error');
            return;
        }

        const expense = {
            id: Date.now().toString(),
            amount: amount,
            categoryId: categoryId,
            date: date,
            note: note,
            createdAt: new Date().toISOString()
        };

        this.expenses.unshift(expense);
        this.saveData();
        this.renderExpenses();
        this.updateSummary();

        // Reset form
        document.getElementById('expenseForm').reset();
        this.setDefaultDate();
        document.getElementById('amount').focus();

        this.showToast('Expense added successfully!', 'success');
    }

    deleteExpense(id) {
        if (confirm('Are you sure you want to delete this expense?')) {
            this.expenses = this.expenses.filter(expense => expense.id !== id);
            this.saveData();
            this.renderExpenses();
            this.updateSummary();
            this.showToast('Expense deleted', 'success');
        }
    }

    editExpense(id) {
        const expense = this.expenses.find(exp => exp.id === id);
        if (!expense) return;

        // Fill form with expense data
        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.categoryId;
        document.getElementById('date').value = expense.date;
        document.getElementById('note').value = expense.note;

        // Change form button to update mode
        const submitBtn = document.querySelector('.btn-add-expense');
        submitBtn.textContent = 'Update Expense';
        submitBtn.dataset.editId = id;

        // Scroll to form
        document.querySelector('.quick-add-card').scrollIntoView({ behavior: 'smooth' });

        // Override form submission for editing
        const form = document.getElementById('expenseForm');
        form.onsubmit = (e) => {
            e.preventDefault();
            this.updateExpense(id);
            form.onsubmit = null;
            submitBtn.textContent = 'Add Expense';
            delete submitBtn.dataset.editId;
        };
    }

    updateExpense(id) {
        const amount = parseFloat(document.getElementById('amount').value);
        const categoryId = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const note = document.getElementById('note').value.trim();

        const expenseIndex = this.expenses.findIndex(exp => exp.id === id);
        if (expenseIndex !== -1) {
            this.expenses[expenseIndex] = {
                ...this.expenses[expenseIndex],
                amount: amount,
                categoryId: categoryId,
                date: date,
                note: note
            };

            this.saveData();
            this.renderExpenses();
            this.updateSummary();
            this.showToast('Expense updated successfully!', 'success');

            // Reset form
            document.getElementById('expenseForm').reset();
            this.setDefaultDate();
        }
    }

    // ==================== CATEGORY OPERATIONS ====================
    addCategory() {
        const name = document.getElementById('newCategoryName').value.trim();
        const color = document.getElementById('newCategoryColor').value;

        if (!name) {
            this.showToast('Please enter a category name', 'error');
            return;
        }

        const category = {
            id: name.toLowerCase().replace(/\s+/g, '-'),
            name: name,
            color: color
        };

        // Check for duplicates
        if (this.categories.some(cat => cat.id === category.id)) {
            this.showToast('Category already exists', 'error');
            return;
        }

        this.categories.push(category);
        this.saveData();
        this.renderCategories();
        this.populateFilterCategories();
        this.updateCategorySelect();

        // Reset form
        document.getElementById('newCategoryForm').reset();
        document.getElementById('newCategoryColor').value = '#4F46E5';

        this.showToast('Category added successfully!', 'success');
    }

    deleteCategory(id) {
        // Check if category has expenses
        const hasExpenses = this.expenses.some(expense => expense.categoryId === id);
        
        if (hasExpenses) {
            if (!confirm('This category has expenses. Deleting it will not delete the expenses. Continue?')) {
                return;
            }
        }

        this.categories = this.categories.filter(cat => cat.id !== id);
        this.saveData();
        this.renderCategories();
        this.populateFilterCategories();
        this.updateCategorySelect();
        this.renderExpenses();
        
        this.showToast('Category deleted', 'success');
    }

    // ==================== RENDERING ====================
    renderCategories() {
        const categoryList = document.getElementById('categoryList');
        categoryList.innerHTML = '';

        this.categories.forEach(category => {
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-item';
            categoryElement.style.backgroundColor = category.color + '20';
            categoryElement.style.color = category.color;
            
            categoryElement.innerHTML = `
                <span>${category.name}</span>
                <span class="delete-category" onclick="manager.deleteCategory('${category.id}')">×</span>
            `;
            
            // Make entire category clickable for editing
            categoryElement.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-category')) {
                    this.editCategory(category.id);
                }
            });
            
            categoryList.appendChild(categoryElement);
        });
    }

    editCategory(id) {
        const category = this.categories.find(cat => cat.id === id);
        if (!category) return;

        const newName = prompt('Edit category name:', category.name);
        if (newName && newName.trim()) {
            category.name = newName.trim();
            category.id = newName.trim().toLowerCase().replace(/\s+/g, '-');
            
            // Update expenses with old category id
            this.expenses.forEach(expense => {
                if (expense.categoryId === id) {
                    expense.categoryId = category.id;
                }
            });

            this.saveData();
            this.renderCategories();
            this.updateCategorySelect();
            this.populateFilterCategories();
            this.renderExpenses();
            this.showToast('Category updated', 'success');
        }
    }

    updateCategorySelect() {
        const select = document.getElementById('category');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">Select Category</option>';
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            select.appendChild(option);
        });
        
        select.value = currentValue;
    }

    populateFilterCategories() {
        const filterSelect = document.getElementById('filterCategory');
        filterSelect.innerHTML = '<option value="all">All Categories</option>';
        
        this.categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.name;
            filterSelect.appendChild(option);
        });
    }

    renderExpenses(searchTerm = '', filterCategory = 'all') {
        const tableBody = document.getElementById('expensesTableBody');
        const emptyState = document.getElementById('emptyState');
        const table = document.getElementById('expensesTable');
        
        let filteredExpenses = this.filterExpensesByTimeRange(this.expenses, this.currentFilter);
        
        // Apply search filter
        if (searchTerm) {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                this.getCategoryName(expense.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply category filter
        if (filterCategory !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.categoryId === filterCategory
            );
        }

        // Sort by date (newest first)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        tableBody.innerHTML = '';

        if (filteredExpenses.length === 0) {
            emptyState.style.display = 'block';
            table.style.display = 'none';
            return;
        }

        emptyState.style.display = 'none';
        table.style.display = 'table';

        filteredExpenses.forEach(expense => {
            const row = document.createElement('tr');
            const category = this.categories.find(cat => cat.id === expense.categoryId);
            const categoryColor = category ? category.color : '#6B7280';
            const categoryName = category ? category.name : expense.categoryId;

            row.innerHTML = `
                <td>${this.formatDate(expense.date)}</td>
                <td>
                    <span class="category-badge" style="background-color: ${categoryColor}">
                        ${categoryName}
                    </span>
                </td>
                <td>${expense.note || '-'}</td>
                <td class="amount-cell">$${expense.amount.toFixed(2)}</td>
                <td>
                    <button class="action-btn edit" onclick="manager.editExpense('${expense.id}')">
                        Edit
                    </button>
                    <button class="action-btn delete" onclick="manager.deleteExpense('${expense.id}')">
                        Delete
                    </button>
                </td>
            `;

            tableBody.appendChild(row);
        });
    }

    updateSummary() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        // Calculate today's total
        const todayExpenses = this.expenses.filter(expense => expense.date === todayStr);
        document.getElementById('todayTotal').textContent = 
            `$${this.calculateTotal(todayExpenses).toFixed(2)}`;

        // Calculate this month's total
        const monthExpenses = this.filterExpensesByTimeRange(this.expenses, 'month');
        document.getElementById('monthTotal').textContent = 
            `$${this.calculateTotal(monthExpenses).toFixed(2)}`;

        // Calculate last month's total
        const lastMonthExpenses = this.getLastMonthExpenses();
        document.getElementById('lastMonthTotal').textContent = 
            `$${this.calculateTotal(lastMonthExpenses).toFixed(2)}`;

        // Calculate this year's total
        const yearExpenses = this.filterExpensesByTimeRange(this.expenses, 'year');
        document.getElementById('yearTotal').textContent = 
            `$${this.calculateTotal(yearExpenses).toFixed(2)}`;
    }

    // ==================== FILTERING ====================
    setTimeRange(range) {
        this.currentFilter = range;
        
        // Update button states
        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-range="${range}"]`).classList.add('active');
        
        this.renderExpenses(
            document.getElementById('searchInput').value,
            document.getElementById('filterCategory').value
        );
    }

    filterExpensesByTimeRange(expenses, range) {
        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        switch(range) {
            case 'month':
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
                    .toISOString().split('T')[0];
                return expenses.filter(expense => 
                    expense.date >= monthStart && expense.date <= todayStr
                );
            
            case 'quarter':
                const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
                const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
                    .toISOString().split('T')[0];
                return expenses.filter(expense => 
                    expense.date >= quarterStart && expense.date <= todayStr
                );
            
            case 'year':
                const yearStart = new Date(now.getFullYear(), 0, 1)
                    .toISOString().split('T')[0];
                return expenses.filter(expense => 
                    expense.date >= yearStart && expense.date <= todayStr
                );
            
            case 'all':
                return expenses;
            
            default:
                return expenses;
        }
    }

    getLastMonthExpenses() {
        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        const lastMonthStartStr = lastMonth.toISOString().split('T')[0];
        const lastMonthEndStr = lastMonthEnd.toISOString().split('T')[0];
        
        return this.expenses.filter(expense => 
            expense.date >= lastMonthStartStr && expense.date <= lastMonthEndStr
        );
    }

    // ==================== UTILITIES ====================
    calculateTotal(expenses) {
        return expenses.reduce((total, expense) => total + expense.amount, 0);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    getCategoryName(categoryId) {
        const category = this.categories.find(cat => cat.id === categoryId);
        return category ? category.name : categoryId;
    }

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const toastMessage = document.getElementById('toastMessage');
        
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        
        // Show toast
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        // Hide toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==================== EXCEL EXPORT ====================
    exportToExcel() {
        try {
            // Create workbook
            const wb = XLSX.utils.book_new();
            
            // Prepare summary data
            const summaryData = this.prepareSummaryData();
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Style summary sheet
            summaryWs['!cols'] = [
                { wch: 20 },
                { wch: 15 },
                { wch: 20 }
            ];
            
            // Add summary sheet
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');
            
            // Prepare expenses data
            const expensesData = this.prepareExpensesData();
            const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
            
            // Style expenses sheet
            expensesWs['!cols'] = [
                { wch: 15 }, // Date
                { wch: 20 }, // Category
                { wch: 40 }, // Note
                { wch: 15 }, // Amount
                { wch: 25 }  // Created At
            ];
            
            // Add expenses sheet
            XLSX.utils.book_append_sheet(wb, expensesWs, 'Expenses');
            
            // Prepare category summary
            const categoryData = this.prepareCategorySummaryData();
            const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
            
            // Style category sheet
            categoryWs['!cols'] = [
                { wch: 20 }, // Category
                { wch: 15 }, // Total Amount
                { wch: 15 }, // Count
                { wch: 20 }  // Percentage
            ];
            
            // Add category sheet
            XLSX.utils.book_append_sheet(wb, categoryWs, 'Category Summary');
            
            // Generate filename with date
            const date = new Date();
            const filename = `expense_report_${date.toISOString().split('T')[0]}.xlsx`;
            
            // Save file
            XLSX.writeFile(wb, filename);
            
            this.showToast('Excel file exported successfully!', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting Excel file', 'error');
        }
    }

    prepareSummaryData() {
        const data = [
            ['Expense Report Summary'],
            ['Generated:', new Date().toLocaleString()],
            [''],
            ['Period', 'Total Amount', 'Number of Expenses'],
            ['Today', `$${this.calculateTotal(this.filterExpensesByTimeRange(this.expenses, 'month')).toFixed(2)}`, 
             this.filterExpensesByTimeRange(this.expenses, 'month').length],
            ['This Month', `$${this.calculateTotal(this.filterExpensesByTimeRange(this.expenses, 'month')).toFixed(2)}`, 
             this.filterExpensesByTimeRange(this.expenses, 'month').length],
            ['Last Month', `$${this.calculateTotal(this.getLastMonthExpenses()).toFixed(2)}`, 
             this.getLastMonthExpenses().length],
            ['This Year', `$${this.calculateTotal(this.filterExpensesByTimeRange(this.expenses, 'year')).toFixed(2)}`, 
             this.filterExpensesByTimeRange(this.expenses, 'year').length],
            ['All Time', `$${this.calculateTotal(this.expenses).toFixed(2)}`, 
             this.expenses.length]
        ];
        
        return data;
    }

    prepareExpensesData() {
        const data = [
            ['Date', 'Category', 'Note', 'Amount', 'Created At']
        ];
        
        // Sort expenses by date
        const sortedExpenses = [...this.expenses].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedExpenses.forEach(expense => {
            data.push([
                expense.date,
                this.getCategoryName(expense.categoryId),
                expense.note || '',
                expense.amount.toFixed(2),
                new Date(expense.createdAt).toLocaleString()
            ]);
        });
        
        return data;
    }

    prepareCategorySummaryData() {
        const data = [
            ['Category', 'Total Amount', 'Number of Expenses', 'Percentage']
        ];
        
        const totalExpenses = this.calculateTotal(this.expenses);
        
        this.categories.forEach(category => {
            const categoryExpenses = this.expenses.filter(expense => 
                expense.categoryId === category.id
            );
            
            if (categoryExpenses.length > 0) {
                const categoryTotal = this.calculateTotal(categoryExpenses);
                const percentage = (categoryTotal / totalExpenses * 100).toFixed(1);
                
                data.push([
                    category.name,
                    `$${categoryTotal.toFixed(2)}`,
                    categoryExpenses.length,
                    `${percentage}%`
                ]);
            }
        });
        
        return data;
    }
}

// ==================== INITIALIZATION ====================
let manager;

document.addEventListener('DOMContentLoaded', () => {
    manager = new ExpenseManager();
});

// Export for global access
window.manager = manager;

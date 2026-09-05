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
        this.updateCategorySelect();
    }

    loadData() {
        // Load expenses from localStorage
        const savedExpenses = localStorage.getItem('expenses');
        this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

        // Load categories from localStorage
        const savedCategories = localStorage.getItem('categories');
        this.categories = savedCategories ? JSON.parse(savedCategories) : this.getDefaultCategories();
        
        // Save default categories if none exist
        if (!savedCategories) {
            this.saveData();
        }
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
            this.renderExpenses(e.target.value, document.getElementById('filterCategory').value);
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
            const oldId = category.id;
            category.name = newName.trim();
            category.id = newName.trim().toLowerCase().replace(/\s+/g, '-');
            
            // Update expenses with old category id
            this.expenses.forEach(expense => {
                if (expense.categoryId === oldId) {
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

    // ==================== ENHANCED EXCEL EXPORT ====================
    exportToExcel() {
        try {
            const wb = XLSX.utils.book_new();
            
            // ==================== 1. SUMMARY SHEET ====================
            const summaryData = this.prepareEnhancedSummaryData();
            const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
            
            // Set column widths
            summaryWs['!cols'] = [
                { wch: 30 },
                { wch: 20 },
                { wch: 20 },
                { wch: 20 }
            ];
            
            // Style title
            summaryWs['A1'].s = {
                font: { bold: true, size: 18, color: { rgb: "4F46E5" } },
                fill: { fgColor: { rgb: "EEF2FF" } },
                alignment: { horizontal: "center", vertical: "center" }
            };
            
            // Merge title cells
            summaryWs['!merges'] = [
                { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }
            ];
            
            // Style header row (row 4)
            for (let col = 0; col < 4; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 3, c: col });
                if (summaryWs[cellRef]) {
                    summaryWs[cellRef].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
                        fill: { fgColor: { rgb: "4F46E5" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            top: { style: "thin", color: { rgb: "4F46E5" } },
                            bottom: { style: "thin", color: { rgb: "4F46E5" } }
                        }
                    };
                }
            }
            
            // Style data rows
            for (let row = 4; row < summaryData.length; row++) {
                for (let col = 0; col < 4; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (summaryWs[cellRef]) {
                        summaryWs[cellRef].s = {
                            alignment: { horizontal: col === 0 ? "left" : "center" },
                            border: {
                                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
                            }
                        };
                        if (col === 1 || col === 2 || col === 3) {
                            summaryWs[cellRef].s.font = { bold: true };
                        }
                    }
                }
            }
            
            XLSX.utils.book_append_sheet(wb, summaryWs, '📊 Summary');
            
            // ==================== 2. EXPENSES SHEET ====================
            const expensesData = this.prepareEnhancedExpensesData();
            const expensesWs = XLSX.utils.aoa_to_sheet(expensesData);
            
            expensesWs['!cols'] = [
                { wch: 15 },
                { wch: 20 },
                { wch: 35 },
                { wch: 15 },
                { wch: 15 },
                { wch: 25 }
            ];
            
            // Style header row
            for (let col = 0; col < 6; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                if (expensesWs[cellRef]) {
                    expensesWs[cellRef].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
                        fill: { fgColor: { rgb: "4F46E5" } },
                        alignment: { horizontal: "center", vertical: "center" },
                        border: {
                            bottom: { style: "medium", color: { rgb: "4F46E5" } }
                        }
                    };
                }
            }
            
            // Style data rows with category colors
            for (let row = 1; row < expensesData.length; row++) {
                const categoryName = expensesData[row][1];
                const category = this.categories.find(cat => cat.name === categoryName);
                
                // Alternate row colors
                const rowColor = row % 2 === 0 ? "F9FAFB" : "FFFFFF";
                
                for (let col = 0; col < 6; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (expensesWs[cellRef]) {
                        expensesWs[cellRef].s = {
                            fill: { fgColor: { rgb: rowColor } },
                            border: {
                                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
                            }
                        };
                        
                        // Style category cell with color
                        if (col === 1 && category) {
                            expensesWs[cellRef].s = {
                                fill: { fgColor: { rgb: category.color.replace('#', '') } },
                                font: { color: { rgb: "FFFFFF" }, bold: true },
                                alignment: { horizontal: "center" }
                            };
                        }
                        
                        // Style amount cell
                        if (col === 3) {
                            expensesWs[cellRef].s.alignment = { horizontal: "right" };
                            expensesWs[cellRef].s.font = { bold: true };
                        }
                    }
                }
            }
            
            // Freeze header row
            expensesWs['!freeze'] = { xSplit: 0, ySplit: 1 };
            
            XLSX.utils.book_append_sheet(wb, expensesWs, '💰 Expenses');
            
            // ==================== 3. CATEGORY SUMMARY SHEET ====================
            const categoryData = this.prepareEnhancedCategoryData();
            const categoryWs = XLSX.utils.aoa_to_sheet(categoryData);
            
            categoryWs['!cols'] = [
                { wch: 20 },
                { wch: 20 },
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
                { wch: 30 }
            ];
            
            // Style header row
            for (let col = 0; col < 6; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                if (categoryWs[cellRef]) {
                    categoryWs[cellRef].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
                        fill: { fgColor: { rgb: "4F46E5" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
            }
            
            // Style category rows
            for (let row = 1; row < categoryData.length; row++) {
                const categoryName = categoryData[row][0];
                const category = this.categories.find(cat => cat.name === categoryName);
                
                for (let col = 0; col < 6; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (categoryWs[cellRef]) {
                        if (col === 0 && category) {
                            categoryWs[cellRef].s = {
                                fill: { fgColor: { rgb: category.color.replace('#', '') } },
                                font: { color: { rgb: "FFFFFF" }, bold: true }
                            };
                        } else {
                            categoryWs[cellRef].s = {
                                alignment: { horizontal: col === 5 ? "left" : "center" },
                                border: {
                                    bottom: { style: "thin", color: { rgb: "E5E7EB" } }
                                }
                            };
                        }
                    }
                }
            }
            
            XLSX.utils.book_append_sheet(wb, categoryWs, '📁 Categories');
            
            // ==================== 4. MONTHLY BREAKDOWN SHEET ====================
            const monthlyData = this.prepareMonthlyBreakdownData();
            const monthlyWs = XLSX.utils.aoa_to_sheet(monthlyData);
            
            monthlyWs['!cols'] = [
                { wch: 15 },
                { wch: 20 },
                { wch: 15 },
                { wch: 20 },
                { wch: 40 }
            ];
            
            // Style header row
            for (let col = 0; col < 5; col++) {
                const cellRef = XLSX.utils.encode_cell({ r: 0, c: col });
                if (monthlyWs[cellRef]) {
                    monthlyWs[cellRef].s = {
                        font: { bold: true, color: { rgb: "FFFFFF" }, size: 12 },
                        fill: { fgColor: { rgb: "4F46E5" } },
                        alignment: { horizontal: "center", vertical: "center" }
                    };
                }
            }
            
            // Style monthly data
            for (let row = 1; row < monthlyData.length; row++) {
                for (let col = 0; col < 5; col++) {
                    const cellRef = XLSX.utils.encode_cell({ r: row, c: col });
                    if (monthlyWs[cellRef]) {
                        monthlyWs[cellRef].s = {
                            border: {
                                bottom: { style: "thin", color: { rgb: "E5E7EB" } }
                            },
                            alignment: { horizontal: col === 4 ? "left" : "center" }
                        };
                        if (col === 1) {
                            monthlyWs[cellRef].s.font = { bold: true };
                        }
                    }
                }
            }
            
            XLSX.utils.book_append_sheet(wb, monthlyWs, '📅 Monthly');
            
            // Generate filename
            const date = new Date();
            const filename = `Expense_Report_${date.toISOString().split('T')[0]}.xlsx`;
            
            // Save file
            XLSX.writeFile(wb, filename);
            
            this.showToast('Professional Excel report exported! 📊', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting Excel file', 'error');
        }
    }

    prepareEnhancedSummaryData() {
        const allExpenses = this.expenses;
        const monthExpenses = this.filterExpensesByTimeRange(allExpenses, 'month');
        const yearExpenses = this.filterExpensesByTimeRange(allExpenses, 'year');
        const lastMonthExpenses = this.getLastMonthExpenses();
        
        const totalAll = this.calculateTotal(allExpenses);
        const totalMonth = this.calculateTotal(monthExpenses);
        const totalYear = this.calculateTotal(yearExpenses);
        const totalLastMonth = this.calculateTotal(lastMonthExpenses);
        
        const avgPerDay = totalMonth / new Date().getDate();
        const avgPerTransaction = allExpenses.length > 0 ? totalAll / allExpenses.length : 0;
        
        // Find highest spending day
        const dailyTotals = {};
        allExpenses.forEach(expense => {
            dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + expense.amount;
        });
        const highestDay = Object.entries(dailyTotals).sort((a, b) => b[1] - a[1])[0];
        
        // Find most used category
        const categoryUsage = {};
        allExpenses.forEach(expense => {
            categoryUsage[expense.categoryId] = (categoryUsage[expense.categoryId] || 0) + 1;
        });
        const mostUsedCategory = Object.entries(categoryUsage).sort((a, b) => b[1] - a[1])[0];
        
        return [
            ['📊 EXPENSE REPORT SUMMARY'],
            ['Generated:', new Date().toLocaleString(), '', ''],
            ['', '', '', ''],
            ['Period', 'Total Amount', 'Transactions', 'Average'],
            ['Today', `$${this.calculateTotal(allExpenses.filter(e => e.date === new Date().toISOString().split('T')[0])).toFixed(2)}`, 
             allExpenses.filter(e => e.date === new Date().toISOString().split('T')[0]).length, 
             `$${(this.calculateTotal(allExpenses.filter(e => e.date === new Date().toISOString().split('T')[0])) / Math.max(allExpenses.filter(e => e.date === new Date().toISOString().split('T')[0]).length, 1)).toFixed(2)}`],
            ['This Month', `$${totalMonth.toFixed(2)}`, monthExpenses.length, `$${(totalMonth / Math.max(monthExpenses.length, 1)).toFixed(2)}`],
            ['Last Month', `$${totalLastMonth.toFixed(2)}`, lastMonthExpenses.length, `$${(totalLastMonth / Math.max(lastMonthExpenses.length, 1)).toFixed(2)}`],
            ['This Year', `$${totalYear.toFixed(2)}`, yearExpenses.length, `$${(totalYear / Math.max(yearExpenses.length, 1)).toFixed(2)}`],
            ['All Time', `$${totalAll.toFixed(2)}`, allExpenses.length, `$${avgPerTransaction.toFixed(2)}`],
            ['', '', '', ''],
            ['📈 KEY STATISTICS', '', '', ''],
            ['Daily Average (This Month)', `$${avgPerDay.toFixed(2)}`, '', ''],
            ['Highest Spending Day', highestDay ? `${highestDay[0]} ($${highestDay[1].toFixed(2)})` : 'N/A', '', ''],
            ['Most Used Category', mostUsedCategory ? this.getCategoryName(mostUsedCategory[0]) : 'N/A', '', ''],
            ['Total Categories', this.categories.length, '', ''],
            ['Active Days', Object.keys(dailyTotals).length, '', '']
        ];
    }

    prepareEnhancedExpensesData() {
        const data = [
            ['Date', 'Category', 'Note', 'Amount', 'Day of Week', 'Created At']
        ];
        
        const sortedExpenses = [...this.expenses].sort((a, b) => 
            new Date(b.date) - new Date(a.date)
        );
        
        sortedExpenses.forEach(expense => {
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayOfWeek = days[new Date(expense.date).getDay()];
            
            data.push([
                expense.date,
                this.getCategoryName(expense.categoryId),
                expense.note || '-',
                `$${expense.amount.toFixed(2)}`,
                dayOfWeek,
                new Date(expense.createdAt).toLocaleString()
            ]);
        });
        
        return data;
    }

    prepareEnhancedCategoryData() {
        const data = [
            ['Category', 'Total Amount', 'Transactions', 'Average', 'Percentage', 'Visual']
        ];
        
        const totalExpenses = this.calculateTotal(this.expenses);
        
        // Sort categories by total amount
        const categoryStats = this.categories
            .map(category => {
                const categoryExpenses = this.expenses.filter(expense => 
                    expense.categoryId === category.id
                );
                const total = this.calculateTotal(categoryExpenses);
                return {
                    category,
                    total,
                    count: categoryExpenses.length,
                    average: categoryExpenses.length > 0 ? total / categoryExpenses.length : 0,
                    percentage: totalExpenses > 0 ? (total / totalExpenses) * 100 : 0
                };
            })
            .filter(stat => stat.count > 0)
            .sort((a, b) => b.total - a.total);
        
        categoryStats.forEach(stat => {
            const barLength = Math.round(stat.percentage / 5); // 20 blocks max
            const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
            
            data.push([
                stat.category.name,
                `$${stat.total.toFixed(2)}`,
                stat.count,
                `$${stat.average.toFixed(2)}`,
                `${stat.percentage.toFixed(1)}%`,
                bar
            ]);
        });
        
        // Add total row
        data.push([
            'TOTAL',
            `$${totalExpenses.toFixed(2)}`,
            this.expenses.length,
            `$${(totalExpenses / Math.max(this.expenses.length, 1)).toFixed(2)}`,
            '100%',
            '█'.repeat(20)
        ]);
        
        return data;
    }

    prepareMonthlyBreakdownData() {
        const data = [
            ['Month', 'Total', 'Transactions', 'Average', 'Trend']
        ];
        
        // Get last 12 months
        const monthlyStats = {};
        const now = new Date();
        
        for (let i = 11; i >= 0; i--) {
            const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthKey = monthDate.toISOString().split('T')[0].substring(0, 7);
            const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            const monthExpenses = this.expenses.filter(expense => 
                expense.date.startsWith(monthKey)
            );
            
            monthlyStats[monthKey] = {
                name: monthName,
                total: this.calculateTotal(monthExpenses),
                count: monthExpenses.length
            };
        }
        
        // Find max total for scaling
        const maxTotal = Math.max(...Object.values(monthlyStats).map(stat => stat.total), 1);
        
        Object.values(monthlyStats).forEach(stat => {
            const barLength = Math.round((stat.total / maxTotal) * 30);
            const bar = '█'.repeat(barLength);
            
            data.push([
                stat.name,
                `$${stat.total.toFixed(2)}`,
                stat.count,
                `$${(stat.total / Math.max(stat.count, 1)).toFixed(2)}`,
                bar
            ]);
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

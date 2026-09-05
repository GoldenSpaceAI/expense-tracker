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
        const savedExpenses = localStorage.getItem('expenses');
        this.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

        const savedCategories = localStorage.getItem('categories');
        this.categories = savedCategories ? JSON.parse(savedCategories) : this.getDefaultCategories();
        
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

    setupEventListeners() {
        document.getElementById('expenseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addExpense();
        });

        document.getElementById('autoDateBtn').addEventListener('click', () => {
            this.setDefaultDate();
        });

        document.getElementById('newCategoryForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addCategory();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportToExcel();
        });

        document.querySelectorAll('.time-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.setTimeRange(e.target.dataset.range);
            });
        });

        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.renderExpenses(e.target.value, document.getElementById('filterCategory').value);
        });

        document.getElementById('filterCategory').addEventListener('change', (e) => {
            this.renderExpenses(document.getElementById('searchInput').value, e.target.value);
        });
    }

    setDefaultDate() {
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        document.getElementById('date').value = formattedDate;
    }

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

        document.getElementById('amount').value = expense.amount;
        document.getElementById('category').value = expense.categoryId;
        document.getElementById('date').value = expense.date;
        document.getElementById('note').value = expense.note;

        const submitBtn = document.querySelector('.btn-add-expense');
        submitBtn.textContent = 'Update Expense';
        submitBtn.dataset.editId = id;

        document.querySelector('.quick-add-card').scrollIntoView({ behavior: 'smooth' });

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

            document.getElementById('expenseForm').reset();
            this.setDefaultDate();
        }
    }

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

        if (this.categories.some(cat => cat.id === category.id)) {
            this.showToast('Category already exists', 'error');
            return;
        }

        this.categories.push(category);
        this.saveData();
        this.renderCategories();
        this.populateFilterCategories();
        this.updateCategorySelect();

        document.getElementById('newCategoryForm').reset();
        document.getElementById('newCategoryColor').value = '#4F46E5';

        this.showToast('Category added successfully!', 'success');
    }

    deleteCategory(id) {
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
        
        if (searchTerm) {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
                this.getCategoryName(expense.categoryId).toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (filterCategory !== 'all') {
            filteredExpenses = filteredExpenses.filter(expense => 
                expense.categoryId === filterCategory
            );
        }

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
        
        const todayExpenses = this.expenses.filter(expense => expense.date === todayStr);
        document.getElementById('todayTotal').textContent = 
            `$${this.calculateTotal(todayExpenses).toFixed(2)}`;

        const monthExpenses = this.filterExpensesByTimeRange(this.expenses, 'month');
        document.getElementById('monthTotal').textContent = 
            `$${this.calculateTotal(monthExpenses).toFixed(2)}`;

        const lastMonthExpenses = this.getLastMonthExpenses();
        document.getElementById('lastMonthTotal').textContent = 
            `$${this.calculateTotal(lastMonthExpenses).toFixed(2)}`;

        const yearExpenses = this.filterExpensesByTimeRange(this.expenses, 'year');
        document.getElementById('yearTotal').textContent = 
            `$${this.calculateTotal(yearExpenses).toFixed(2)}`;
    }

    setTimeRange(range) {
        this.currentFilter = range;
        
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
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    // ==================== ULTIMATE EXCEL EXPORT ====================
    async exportToExcel() {
        try {
            const workbook = new ExcelJS.Workbook();
            workbook.creator = 'ExpenseTracker Pro';
            workbook.created = new Date();
            
            // ==================== 1. DASHBOARD SHEET ====================
            const dashboardSheet = workbook.addWorksheet('Dashboard', {
                views: [{ state: 'frozen', ySplit: 0 }]
            });
            
            // Set column widths
            dashboardSheet.columns = [
                { width: 30 },
                { width: 20 },
                { width: 20 },
                { width: 20 }
            ];
            
            // Title
            dashboardSheet.mergeCells('A1:D1');
            const titleCell = dashboardSheet.getCell('A1');
            titleCell.value = '💰 EXPENSE TRACKER - FINANCIAL REPORT';
            titleCell.font = { bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
            titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
            titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
            dashboardSheet.getRow(1).height = 50;
            
            // Subtitle
            dashboardSheet.mergeCells('A2:D2');
            const subtitleCell = dashboardSheet.getCell('A2');
            subtitleCell.value = `Generated on ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`;
            subtitleCell.font = { italic: true, size: 11, color: { argb: 'FF6B7280' } };
            subtitleCell.alignment = { horizontal: 'center' };
            
            // Summary Cards Row
            const stats = this.getStatistics();
            const cardData = [
                ['Today', stats.today, 'success'],
                ['This Month', stats.month, 'primary'],
                ['Last Month', stats.lastMonth, 'warning'],
                ['This Year', stats.year, 'info']
            ];
            
            let row = 4;
            cardData.forEach(([label, value, color]) => {
                dashboardSheet.mergeCells(`A${row}:D${row}`);
                const cell = dashboardSheet.getCell(`A${row}`);
                cell.value = `${label}: $${value.toFixed(2)}`;
                cell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
                
                const colors = {
                    success: 'FF10B981',
                    primary: 'FF4F46E5',
                    warning: 'FFF59E0B',
                    info: 'FF3B82F6'
                };
                
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors[color] } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                dashboardSheet.getRow(row).height = 35;
                row++;
            });
            
            // Key Statistics
            row += 1;
            dashboardSheet.mergeCells(`A${row}:D${row}`);
            dashboardSheet.getCell(`A${row}`).value = '📊 KEY STATISTICS';
            dashboardSheet.getCell(`A${row}`).font = { bold: true, size: 16, color: { argb: 'FF4F46E5' } };
            row++;
            
            const keyStats = [
                ['Total Transactions', stats.totalTransactions],
                ['Daily Average (This Month)', `$${stats.dailyAverage.toFixed(2)}`],
                ['Average per Transaction', `$${stats.avgPerTransaction.toFixed(2)}`],
                ['Highest Spending Day', stats.highestDay ? `${stats.highestDay.date} ($${stats.highestDay.amount.toFixed(2)})` : 'N/A'],
                ['Most Used Category', stats.mostUsedCategory || 'N/A'],
                ['Active Days', stats.activeDays]
            ];
            
            keyStats.forEach(([label, value]) => {
                dashboardSheet.getCell(`A${row}`).value = label;
                dashboardSheet.getCell(`A${row}`).font = { bold: true };
                dashboardSheet.getCell(`B${row}`).value = value;
                dashboardSheet.mergeCells(`B${row}:D${row}`);
                row++;
            });
            
            // ==================== 2. EXPENSES SHEET ====================
            const expensesSheet = workbook.addWorksheet('Expenses', {
                views: [{ state: 'frozen', ySplit: 1 }]
            });
            
            expensesSheet.columns = [
                { header: 'Date', key: 'date', width: 15 },
                { header: 'Category', key: 'category', width: 20 },
                { header: 'Note', key: 'note', width: 35 },
                { header: 'Amount', key: 'amount', width: 15 },
                { header: 'Day of Week', key: 'day', width: 15 },
                { header: 'Created At', key: 'created', width: 25 }
            ];
            
            // Style header row
            const headerRow = expensesSheet.getRow(1);
            headerRow.height = 30;
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
                cell.border = {
                    bottom: { style: 'thick', color: { argb: 'FF312E81' } }
                };
            });
            
            // Add auto filter
            expensesSheet.autoFilter = {
                from: 'A1',
                to: 'F1'
            };
            
            // Add data
            const sortedExpenses = [...this.expenses].sort((a, b) => new Date(b.date) - new Date(a.date));
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            
            sortedExpenses.forEach((expense, index) => {
                const category = this.categories.find(cat => cat.id === expense.categoryId);
                const rowNum = index + 2;
                
                expensesSheet.addRow({
                    date: expense.date,
                    category: category ? category.name : expense.categoryId,
                    note: expense.note || '-',
                    amount: expense.amount,
                    day: days[new Date(expense.date).getDay()],
                    created: new Date(expense.createdAt).toLocaleString()
                });
                
                const row = expensesSheet.getRow(rowNum);
                
                // Alternate row colors
                if (index % 2 === 0) {
                    row.eachCell((cell) => {
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                    });
                }
                
                // Style category cell with color
                if (category) {
                    const categoryCell = row.getCell(2);
                    categoryCell.fill = { 
                        type: 'pattern', 
                        pattern: 'solid', 
                        fgColor: { argb: 'FF' + category.color.replace('#', '') } 
                    };
                    categoryCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                    categoryCell.alignment = { horizontal: 'center' };
                }
                
                // Style amount cell
                const amountCell = row.getCell(4);
                amountCell.numFmt = '"$"#,##0.00';
                amountCell.font = { bold: true };
                amountCell.alignment = { horizontal: 'right' };
            });
            
            // ==================== 3. CATEGORY SUMMARY SHEET ====================
            const categorySheet = workbook.addWorksheet('Category Summary', {
                views: [{ state: 'frozen', ySplit: 1 }]
            });
            
            categorySheet.columns = [
                { header: 'Category', key: 'category', width: 25 },
                { header: 'Total Amount', key: 'total', width: 18 },
                { header: 'Transactions', key: 'count', width: 15 },
                { header: 'Average', key: 'average', width: 15 },
                { header: 'Percentage', key: 'percentage', width: 15 },
                { header: 'Distribution', key: 'distribution', width: 40 }
            ];
            
            // Style header
            const catHeaderRow = categorySheet.getRow(1);
            catHeaderRow.height = 30;
            catHeaderRow.eachCell((cell) => {
                cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
            
            const totalExpenses = this.calculateTotal(this.expenses);
            
            const categoryStats = this.categories
                .map(category => {
                    const categoryExpenses = this.expenses.filter(expense => expense.categoryId === category.id);
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
            
            categoryStats.forEach((stat, index) => {
                const rowNum = index + 2;
                const row = categorySheet.addRow({
                    category: stat.category.name,
                    total: stat.total,
                    count: stat.count,
                    average: stat.average,
                    percentage: stat.percentage / 100,
                    distribution: ''
                });
                
                // Style category name cell
                const categoryCell = row.getCell(1);
                categoryCell.fill = {
                    type: 'pattern',
                    pattern: 'solid',
                    fgColor: { argb: 'FF' + stat.category.color.replace('#', '') }
                };
                categoryCell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                
                // Format numbers
                row.getCell(2).numFmt = '"$"#,##0.00';
                row.getCell(4).numFmt = '"$"#,##0.00';
                row.getCell(5).numFmt = '0.0%';
                
                // Add visual bar using cell fill
                const barCell = row.getCell(6);
                const barLength = Math.round(stat.percentage / 5);
                barCell.value = '█'.repeat(barLength);
                barCell.font = { color: { argb: 'FF' + stat.category.color.replace('#', '') }, bold: true };
                
                row.height = 25;
            });
            
            // Add total row
            const totalRow = categorySheet.addRow({
                category: 'TOTAL',
                total: totalExpenses,
                count: this.expenses.length,
                average: totalExpenses / Math.max(this.expenses.length, 1),
                percentage: 1,
                distribution: '█'.repeat(20)
            });
            
            totalRow.eachCell((cell) => {
                cell.font = { bold: true, size: 12 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
                cell.border = { top: { style: 'double', color: { argb: 'FF4F46E5' } } };
            });
            totalRow.getCell(2).numFmt = '"$"#,##0.00';
            totalRow.getCell(4).numFmt = '"$"#,##0.00';
            totalRow.getCell(5).numFmt = '0.0%';
            
            // ==================== 4. MONTHLY TRENDS SHEET ====================
            const monthlySheet = workbook.addWorksheet('Monthly Trends', {
                views: [{ state: 'frozen', ySplit: 1 }]
            });
            
            monthlySheet.columns = [
                { header: 'Month', key: 'month', width: 20 },
                { header: 'Total', key: 'total', width: 15 },
                { header: 'Transactions', key: 'count', width: 15 },
                { header: 'Average', key: 'average', width: 15 },
                { header: 'Trend', key: 'trend', width: 40 }
            ];
            
            // Style header
            const monthlyHeader = monthlySheet.getRow(1);
            monthlyHeader.height = 30;
            monthlyHeader.eachCell((cell) => {
                cell.font = { bold: true, size: 12, color: { argb: 'FFFFFFFF' } };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
                cell.alignment = { horizontal: 'center', vertical: 'middle' };
            });
            
            // Get last 12 months
            const monthlyData = [];
            const now = new Date();
            
            for (let i = 11; i >= 0; i--) {
                const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const monthKey = monthDate.toISOString().split('T')[0].substring(0, 7);
                const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
                
                const monthExpenses = this.expenses.filter(expense => expense.date.startsWith(monthKey));
                monthlyData.push({
                    name: monthName,
                    total: this.calculateTotal(monthExpenses),
                    count: monthExpenses.length
                });
            }
            
            const maxMonthlyTotal = Math.max(...monthlyData.map(d => d.total), 1);
            
            monthlyData.forEach((data, index) => {
                const rowNum = index + 2;
                const row = monthlySheet.addRow({
                    month: data.name,
                    total: data.total,
                    count: data.count,
                    average: data.count > 0 ? data.total / data.count : 0,
                    trend: ''
                });
                
                // Format numbers
                row.getCell(2).numFmt = '"$"#,##0.00';
                row.getCell(3).alignment = { horizontal: 'center' };
                row.getCell(4).numFmt = '"$"#,##0.00';
                
                // Add trend bar
                const barLength = Math.round((data.total / maxMonthlyTotal) * 30);
                const barCell = row.getCell(5);
                barCell.value = '█'.repeat(barLength);
                barCell.font = { color: { argb: 'FF4F46E5' }, bold: true };
                
                // Alternate colors
                if (index % 2 === 0) {
                    row.eachCell((cell) => {
                        if (cell.col !== 5) {
                            cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF9FAFB' } };
                        }
                    });
                }
                
                row.height = 22;
            });
            
            // ==================== 5. CHARTS SHEET ====================
            const chartSheet = workbook.addWorksheet('Charts');
            
            // Pie Chart for Category Distribution
            const pieChart = workbook.addWorksheet('Category Chart', {
                views: [{ showGridLines: false }]
            });
            
            // Add data for pie chart
            pieChart.addRow(['Category', 'Amount']);
            categoryStats.forEach(stat => {
                pieChart.addRow([stat.category.name, stat.total]);
            });
            
            // Create pie chart
            const pieChartObj = pieChart.addChart('pie', {
                title: 'Expense Distribution by Category',
                data: [
                    {
                        reference: 'A1:B' + (categoryStats.length + 1),
                        categories: 'A2:A' + (categoryStats.length + 1),
                        values: 'B2:B' + (categoryStats.length + 1)
                    }
                ],
                options: {
                    legend: { position: 'right' },
                    colors: categoryStats.map(stat => stat.category.color.replace('#', ''))
                }
            });
            
            // Bar Chart for Monthly Trends
            const barChartSheet = workbook.addWorksheet('Monthly Chart', {
                views: [{ showGridLines: false }]
            });
            
            barChartSheet.addRow(['Month', 'Total']);
            monthlyData.forEach(data => {
                barChartSheet.addRow([data.name, data.total]);
            });
            
            const barChartObj = barChartSheet.addChart('bar', {
                title: 'Monthly Spending Trends',
                data: [
                    {
                        reference: 'A1:B' + (monthlyData.length + 1),
                        categories: 'A2:A' + (monthlyData.length + 1),
                        values: 'B2:B' + (monthlyData.length + 1)
                    }
                ],
                options: {
                    legend: { position: 'none' },
                    colors: ['4F46E5']
                }
            });
            
            // ==================== SAVE FILE ====================
            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `Expense_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
            link.click();
            
            URL.revokeObjectURL(link.href);
            
            this.showToast('Professional Excel report with charts exported! 📊', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showToast('Error exporting Excel file: ' + error.message, 'error');
        }
    }

    getStatistics() {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        const todayExpenses = this.expenses.filter(e => e.date === todayStr);
        const monthExpenses = this.filterExpensesByTimeRange(this.expenses, 'month');
        const lastMonthExpenses = this.getLastMonthExpenses();
        const yearExpenses = this.filterExpensesByTimeRange(this.expenses, 'year');
        
        // Daily totals for highest spending day
        const dailyTotals = {};
        this.expenses.forEach(expense => {
            dailyTotals[expense.date] = (dailyTotals[expense.date] || 0) + expense.amount;
        });
        
        const highestDay = Object.entries(dailyTotals)
            .sort((a, b) => b[1] - a[1])[0];
        
        // Most used category
        const categoryUsage = {};
        this.expenses.forEach(expense => {
            categoryUsage[expense.categoryId] = (categoryUsage[expense.categoryId] || 0) + 1;
        });
        
        const mostUsedCategory = Object.entries(categoryUsage)
            .sort((a, b) => b[1] - a[1])[0];
        
        const totalAll = this.calculateTotal(this.expenses);
        
        return {
            today: this.calculateTotal(todayExpenses),
            month: this.calculateTotal(monthExpenses),
            lastMonth: this.calculateTotal(lastMonthExpenses),
            year: this.calculateTotal(yearExpenses),
            totalTransactions: this.expenses.length,
            dailyAverage: this.calculateTotal(monthExpenses) / new Date().getDate(),
            avgPerTransaction: totalAll / Math.max(this.expenses.length, 1),
            highestDay: highestDay ? { date: highestDay[0], amount: highestDay[1] } : null,
            mostUsedCategory: mostUsedCategory ? this.getCategoryName(mostUsedCategory[0]) : null,
            activeDays: Object.keys(dailyTotals).length
        };
    }
}

// ==================== INITIALIZATION ====================
let manager;

document.addEventListener('DOMContentLoaded', () => {
    manager = new ExpenseManager();
});

window.manager = manager;

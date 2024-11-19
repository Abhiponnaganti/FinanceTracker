document.addEventListener('DOMContentLoaded', function() {
    const transactionForm = document.getElementById('transactionForm');
    const transactionsList = document.getElementById('transactionsList');
    let expenseChart;

    transactionForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(transactionForm);
        
        fetch('/add_transaction', {
            method: 'POST',
            body: formData
        }).then(response => {
            if (response.ok) {
                transactionForm.reset();
                updateTransactions();
                updateSummary();
            }
        });
    });

    function updateTransactions() {
        fetch('/get_transactions')
            .then(response => response.json())
            .then(transactions => {
                transactionsList.innerHTML = '';
                transactions.forEach(t => {
                    const li = document.createElement('li');
                    li.classList.add('transaction-item');
                    
                    // Display the transaction information
                    const transactionText = document.createElement('span');
                    transactionText.textContent = `${t.date} - ${t.category}: $${t.amount} (${t.type})`;
                    li.appendChild(transactionText);

                    // Create the Edit button (initially hidden, shows on hover)
                    const editButton = document.createElement('button');
                    editButton.textContent = 'Edit';
                    editButton.classList.add('edit-btn');
                    editButton.style.display = 'none'; // Hidden by default
                    li.appendChild(editButton);

                    // Create the Delete button
                    const deleteButton = document.createElement('button');
                    deleteButton.textContent = 'Delete';
                    deleteButton.classList.add('delete-btn');
                    deleteButton.style.display = 'none'; // Hidden by default
                    li.appendChild(deleteButton);

                    // Show the Edit and Delete buttons on hover
                    li.addEventListener('mouseover', function() {
                        editButton.style.display = 'inline-block';
                        deleteButton.style.display = 'inline-block';
                    });
                    li.addEventListener('mouseout', function() {
                        editButton.style.display = 'none';
                        deleteButton.style.display = 'none';
                    });

                    // Handle Edit button click to display editable fields
                    editButton.addEventListener('click', function() {
                        transactionText.style.display = 'none'; // Hide the text

                        // Create input fields for editing
                        const dateInput = document.createElement('input');
                        dateInput.type = 'date';
                        dateInput.value = t.date;

                        const categoryInput = document.createElement('input');
                        categoryInput.type = 'text';
                        categoryInput.value = t.category;

                        const amountInput = document.createElement('input');
                        amountInput.type = 'number';
                        amountInput.value = t.amount;

                        const typeSelect = document.createElement('select');
                        const optionIncome = document.createElement('option');
                        optionIncome.value = 'income';
                        optionIncome.textContent = 'Income';
                        const optionExpense = document.createElement('option');
                        optionExpense.value = 'expense';
                        optionExpense.textContent = 'Expense';
                        typeSelect.appendChild(optionIncome);
                        typeSelect.appendChild(optionExpense);
                        typeSelect.value = t.type;

                        // Append inputs to the list item
                        li.appendChild(dateInput);
                        li.appendChild(categoryInput);
                        li.appendChild(amountInput);
                        li.appendChild(typeSelect);

                        // Create the Save button
                        const saveButton = document.createElement('button');
                        saveButton.textContent = 'Save';
                        saveButton.addEventListener('click', function() {
                            const updatedTransaction = {
                                id: t.id,
                                date: dateInput.value,
                                category: categoryInput.value,
                                amount: amountInput.value,
                                type: typeSelect.value
                            };
                            
                            // Send updated transaction to the server
                            fetch(`/update_transaction/${t.id}`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(updatedTransaction)
                            }).then(response => {
                                if (response.ok) {
                                    updateTransactions();
                                    updateSummary();
                                }
                            });
                        });
                        li.appendChild(saveButton);

                        // Hide edit button after showing inputs
                        editButton.style.display = 'none';
                    });

                    // Handle Delete button click
                    deleteButton.addEventListener('click', function() {
                        fetch(`/delete_transaction/${t.id}`, {
                            method: 'DELETE'
                        }).then(response => {
                            if (response.ok) {
                                updateTransactions();
                                updateSummary();
                            }
                        });
                    });

                    // Append the transaction item to the list
                    transactionsList.appendChild(li);
                });
            });
    }

    function updateSummary() {
        fetch('/get_summary')
            .then(response => response.json())
            .then(summary => {
                document.getElementById('income').textContent = summary.income.toFixed(2);
                document.getElementById('expenses').textContent = summary.expenses.toFixed(2);
                document.getElementById('balance').textContent = summary.balance.toFixed(2);
                
                updateExpenseChart(summary.category_expenses);
            });
    }

    function updateExpenseChart(categoryExpenses) {
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        if (expenseChart) {
            expenseChart.destroy();
        }
        
        expenseChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(categoryExpenses),
                datasets: [{
                    data: Object.values(categoryExpenses),
                    backgroundColor: [
                        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
                    ]
                }]
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Expense Categories'
                }
            }
        });
    }

    updateTransactions();
    updateSummary();
});
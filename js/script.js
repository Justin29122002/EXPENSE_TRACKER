function loadPage(page) {
  fetch(`pages/${page}`)
    .then(res => res.text())
    .then(data => {
      document.getElementById("content").innerHTML = data;

      if (page === "add-expense.html") initExpenseTable();

      if (page === "view.html") {
        showDateInputForView(currentView); // ✅ call here
        updateView();
      }

     if (page === "report.html") {
  fetchAllExpenses().then(data => {
    drawCategoryChart(data); // default chart
    loadReportInsights(data);
  });
}
    });
}

window.onload = () => loadPage('home.html');

// ==== Expense Table ====
let rowCount = 6;

function initExpenseTable() {
  const tbody = document.getElementById("expense-rows");

  // Delegate for date input change
  tbody.addEventListener("change", function (e) {
    if (e.target && e.target.type === "date") {
      const row = e.target.closest("tr");
      const dayInput = row.querySelector('input[name^="day"]');
      if (!row || !dayInput || !e.target.value) return;

      const date = new Date(e.target.value);
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      dayInput.value = days[date.getDay()];

      checkAndAddRow(row.id);
    }
  });

  // Delegate for all required inputs
  tbody.addEventListener("input", checkAllInputsFilled);
  
  tbody.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    const row = e.target.closest("tr");
    if (row) {
      const inputs = row.querySelectorAll("input[required], select");
      const allFilled = [...inputs].every(input => input.value.trim() !== "");
      const rowNum = parseInt(row.id.split("-")[1]);
      if (allFilled && rowNum === rowCount) {
        e.preventDefault(); // Prevent form submission or default behavior
        addNewRow();
      }
    }
  }
});
}


function handleDateChange(e) {
  if (e.target && e.target.type === "date") {
    const row = e.target.closest("tr");
    const dayInput = row.querySelector('input[name^="day"]');
    if (!row || !dayInput || !e.target.value) return;

    const date = new Date(e.target.value);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    dayInput.value = days[date.getDay()];

    checkAndAddRow(row.id);
  }
}

function checkAndAddRow(rowId) {
  const rowNum = parseInt(rowId.split("-")[1]);
  const inputs = document.querySelectorAll(`#${rowId} input, #${rowId} select`);
  const allFilled = [...inputs].every(input => input.value.trim() !== "");

  if (allFilled && rowNum === rowCount) {
    addNewRow();
  }
}


function addNewRow() {
  rowCount++;
  const tbody = document.getElementById("expense-rows");

  const row = document.createElement("tr");
  row.id = `row-${rowCount}`;

  row.innerHTML = `
    <td>${rowCount}</td>
    <td><input type="date" name="date${rowCount}" onchange="fillDay(this, 'day${rowCount}')" required /></td>
    <td><input type="text" name="day${rowCount}" id="day${rowCount}" readonly /></td>
    <td>
      <select name="category${rowCount}">
        <option value="Food">Food / Groceries</option>
        <option value="Transport">Transport / Travel</option>
        <option value="Utilities">Utilities (Electricity, Water, Gas)</option>
        <option value="Rent">Rent / Mortgage</option>
        <option value="Internet">Mobile / Internet</option>
        <option value="Medical">Medical / Healthcare</option>
        <option value="Insurance">Insurance</option>
        <option value="Shopping">Shopping / Clothing</option>
        <option value="Entertainment">Entertainment / Subscriptions</option>
        <option value="Dining">Dining Out / Restaurants</option>
        <option value="Fitness">Fitness / Gym</option>
        <option value="Grooming">Beauty / Grooming</option>
        <option value="Gifts">Gifts & Donations</option>
        <option value="Tuition">Tuition Fees</option>
        <option value="Books">Books / Courses</option>
        <option value="Stationery">Stationery / Supplies</option>
        <option value="Office">Office Supplies</option>
        <option value="Client">Client Meetings</option>
        <option value="BusinessTravel">Business Travel</option>
        <option value="Fuel">Fuel</option>
        <option value="VehicleRepair">Vehicle Maintenance / Repairs</option>
        <option value="Toll">Parking / Toll</option>
        <option value="Loan">Loan Repayment</option>
        <option value="CreditCard">Credit Card Payment</option>
        <option value="Savings">Savings / Investments</option>
        <option value="EMI">EMI</option>
        <option value="Pets">Pets</option>
        <option value="Events">Events / Celebrations</option>
        <option value="Emergency">Emergency</option>
        <option value="Other">Other</option>
      </select>
    </td>
    <td><input type="number" name="quantity${rowCount}" min="1" value="1" /></td>
    <td><input type="number" name="amount${rowCount}" /></td>
    <td><input type="text" name="note${rowCount}" /></td>
  `;

  tbody.appendChild(row);
}


function checkAllInputsFilled() {
  const rows = document.querySelectorAll("#expense-rows tr");
  let allFilled = true;

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input[required], select");
    inputs.forEach(input => {
      if (input.value.trim() === "") allFilled = false;
    });
  });

  document.getElementById("submit-btn").disabled = !allFilled;
}

function saveExpensesToFirebase() {
  const rows = document.querySelectorAll("#expense-rows tr");

  rows.forEach(async (row) => {
    const inputs = row.querySelectorAll("input, select");
    const data = {};

    inputs.forEach(input => {
      const name = input.name.replace(/[0-9]/g, '');
      data[name] = input.value;
    });

    if (data.date && data.amount) {
      try {
        await db.collection("expenses").add({
          ...data,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        console.log("Saved:", data);
      } catch (err) {
        console.error("Error saving:", err);
      }
    }
  });

  alert("Expenses saved to Firebase!");
}

function fillDay(dateInput, dayFieldId) {
  if (!dateInput.value) return;

  const date = new Date(dateInput.value);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayField = document.getElementById(dayFieldId);
  
  if (dayField) {
    dayField.value = dayName;
  }
}


// ==== View Page ====
let currentView = 'all'; 
let currentChart = 'table';

function loadView(viewType) {
  currentView = viewType;
  showDateInputForView(viewType);
  updateView(); // this will fetch & render data based on filter
}


function changeChart(chartType) {
  currentChart = chartType;
  updateView();
}

function updateView() {
  const selected = document.getElementById("filter-input").value;
  const title = `${capitalize(currentView)} - ${capitalize(currentChart)} View`;
  document.getElementById("chart-title").textContent = title;

  const table = document.getElementById("data-table");
  const canvas = document.getElementById("chart-canvas");

  if (!table || !canvas) return;

  table.style.display = currentChart === "table" ? "table" : "none";
  canvas.style.display = currentChart === "table" ? "none" : "block";

  fetchAllExpenses().then(data => {
    const filtered = filterByViewType(data, currentView, selected);
    currentChart === "table" ? renderTable(filtered) : renderChart(currentChart, filtered);
  });
}


function renderTable(data) {
  const tbody = document.getElementById("table-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  let total = 0;
  data.forEach(entry => {
    total += parseFloat(entry.amount || 0);
    tbody.innerHTML += `
      <tr>
        <td>${entry.date || '-'}</td>
        <td>${entry.category || '-'}</td>
        <td>${entry.amount || 0}</td>
        <td>${entry.note || '-'}</td>
      </tr>
    `;
  });

  tbody.innerHTML += `
    <tr style="font-weight: bold; background: #f0f0f0;">
      <td colspan="2">Total</td>
      <td colspan="2">₹${total}</td>
    </tr>`;
}

function renderChart(type, data) {
  const ctx = document.getElementById("chart-canvas").getContext("2d");
  if (window.myChart) window.myChart.destroy();

  const totals = {};
  data.forEach(item => {
    const cat = item.category || 'Other';
    totals[cat] = (totals[cat] || 0) + parseFloat(item.amount || 0);
  });

  window.myChart = new Chart(ctx, {
    type: type,
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Expenses",
        data: Object.values(totals),
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#81C784', '#BA68C8'],
        borderColor: "#333",
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function showDateInputForView(view) {
  const input = document.getElementById("filter-input");
  const label = document.getElementById("filter-label");

  if (!input) return;

  switch (view) {
    case 'daily':
      input.type = 'date';
      label.textContent = 'Select Date:';
      break;
    case 'weekly':
      input.type = 'date';
      label.textContent = 'Select Week Start Date:';
      break;
    case 'monthly':
      input.type = 'month';
      label.textContent = 'Select Month:';
      break;
    case 'yearly':
      input.type = 'number';
      input.min = "2000";
      input.max = new Date().getFullYear();
      label.textContent = 'Select Year:';
      break;
    default:
      input.type = 'hidden';
      label.textContent = '';
  }
}

function applyFilter() {
  const inputVal = document.getElementById("filter-input").value;

  fetchAllExpenses().then(data => {
    let filtered = [];

    if (!inputVal || currentView === 'all') {
      filtered = data;
    } else if (currentView === 'daily') {
      filtered = data.filter(e => e.date === inputVal);
    } else if (currentView === 'weekly') {
      const start = new Date(inputVal);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    } else if (currentView === 'monthly') {
      const [year, month] = inputVal.split('-');
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() == year && (d.getMonth() + 1) == parseInt(month);
      });
    } else if (currentView === 'yearly') {
      const year = parseInt(inputVal);
      filtered = data.filter(e => new Date(e.date).getFullYear() === year);
    }

    renderTable(filtered);           // ✅ update table
    if (currentChart !== "table") {
      renderChart(currentChart, filtered); // ✅ update chart too
    }
  });
}

function updateView() {
  document.getElementById("chart-title").textContent = `${capitalize(currentView)} - ${capitalize(currentChart)} View`;

  const table = document.getElementById("data-table");
  const canvas = document.getElementById("chart-canvas");

  if (!table || !canvas) return;

  // Toggle table or chart visibility
  if (currentChart === "table") {
    table.style.display = "table";
    canvas.style.display = "none";
  } else {
    table.style.display = "none";
    canvas.style.display = "block";
  }

  // ✅ Apply filter after UI ready
  applyFilter();
}

function changeChart(type) {
  currentChart = type;
  updateView();
}

// ==== Firebase Helper ====
function fetchAllExpenses() {
  return db.collection("expenses")
    .orderBy("createdAt", "desc")
    .get()
    .then(snapshot => snapshot.docs.map(doc => doc.data()))
    .catch(err => {
      console.error("Failed to fetch expenses:", err);
      return [];
    });
}

function loadView(viewType) {
  currentView = viewType;
  updateFilterInput();
  updateView(); // will call applyFilter()
}

function updateFilterInput() {
  const label = document.getElementById("filter-label");
  const input = document.getElementById("filter-input");

  if (currentView === "daily") {
    label.textContent = "Select Date:";
    input.type = "date";
  } else if (currentView === "weekly") {
    label.textContent = "Select Start of Week:";
    input.type = "date"; // week input is not universally supported, use date for now
  } else if (currentView === "monthly") {
    label.textContent = "Select Month:";
    input.type = "month";
  } else if (currentView === "yearly") {
    label.textContent = "Select Year:";
    input.type = "number";
    input.min = 2000;
    input.max = new Date().getFullYear();
    input.step = 1;
  } else {
    label.textContent = "Select Filter:";
    input.type = "text";
  }

  input.value = ""; // clear previous input
}

function applyFilter() {
  const inputVal = document.getElementById("filter-input").value;

  fetchAllExpenses().then(data => {
    let filtered = [];

    if (!inputVal || currentView === 'all') {
      filtered = data;
    } else if (currentView === 'daily') {
      filtered = data.filter(e => e.date === inputVal);
    } else if (currentView === 'weekly') {
      const start = new Date(inputVal);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
      });
    } else if (currentView === 'monthly') {
      const [year, month] = inputVal.split('-');
      filtered = data.filter(e => {
        const d = new Date(e.date);
        return d.getFullYear() == year && (d.getMonth() + 1) == parseInt(month);
      });
    } else if (currentView === 'yearly') {
      const year = parseInt(inputVal);
      filtered = data.filter(e => new Date(e.date).getFullYear() === year);
    }

    renderTable(filtered);
    if (currentChart !== "table") {
      renderChart(currentChart, filtered);
    }
  });
}


// ==== Report Page ====
function calculateBudget() {
  const input = document.getElementById("budget-input");
  const result = document.getElementById("budget-result");

  fetchAllExpenses().then(data => {
    const budget = parseFloat(input.value);
    const total = data.reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

    if (isNaN(budget)) {
      result.textContent = `Total Spent: ₹${total}`;
    } else {
      const diff = budget - total;
      result.textContent = `Total Spent: ₹${total}\n${diff >= 0 ? `Remaining: ₹${diff}` : `Over Budget by ₹${-diff}`}`;
    }
  });
}

function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  doc.text("Expense Report", 10, 10);

  fetchAllExpenses().then(data => {
    data.forEach((item, i) => {
      doc.text(`${item.date} - ${item.category} - ₹${item.amount}`, 10, 20 + i * 10);
    });

    doc.save("report.pdf");
  });
}

function downloadExcel() {
  fetchAllExpenses().then(data => {
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Report");
    XLSX.writeFile(book, "report.xlsx");
  });
}

function drawChart(data) {
  const ctx = document.getElementById("report-chart")?.getContext("2d");
  if (!ctx) return;
  if (window.reportChart) window.reportChart.destroy();

  const totals = {};
  data.forEach(item => {
    totals[item.category] = (totals[item.category] || 0) + parseFloat(item.amount || 0);
  });

  window.reportChart = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(totals),
      datasets: [{
        label: "Expense Distribution",
        data: Object.values(totals),
        backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#81C784", "#BA68C8"],
        borderColor: "#fff",
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

function loadReportInsights(data) {
  const lastMonth = 800;
  const thisMonth = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const diff = thisMonth - lastMonth;
  document.getElementById("comparison-insights").textContent =
    `This month is ${diff >= 0 ? '↑ ₹' + diff + ' more' : '↓ ₹' + Math.abs(diff) + ' less'} than last month.`;
}

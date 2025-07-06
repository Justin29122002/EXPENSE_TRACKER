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

// ==== Report Filter Logic ====
function updateCustomReport() {
  const type = document.getElementById("report-type").value;
  fetchAllExpenses().then(data => {
    switch (type) {
      case 'category': drawCategoryChart(data); break;
      case 'month': drawMonthlyChart(data); break;
      case 'date': drawDateChart(data); break;
      case 'year': drawYearlyChart(data); break;
    }
  });
}

// ==== Chart Drawing ====
function drawCategoryChart(data) {
  const totals = {};
  data.forEach(item => {
    const cat = item.category || 'Other';
    totals[cat] = (totals[cat] || 0) + parseFloat(item.amount || 0);
  });
  drawChart('pie', Object.keys(totals), Object.values(totals), 'Category-wise Expenses');
}

function drawMonthlyChart(data) {
  const totals = {};
  data.forEach(item => {
    const date = new Date(item.date);
    const month = date.toLocaleString('default', { month: 'short', year: 'numeric' });
    totals[month] = (totals[month] || 0) + parseFloat(item.amount || 0);
  });
  drawChart('bar', Object.keys(totals), Object.values(totals), 'Monthly Expenses');
}

function drawDateChart(data) {
  const totals = {};
  data.forEach(item => {
    const date = item.date;
    totals[date] = (totals[date] || 0) + parseFloat(item.amount || 0);
  });
  const sorted = Object.keys(totals).sort();
  drawChart('line', sorted, sorted.map(d => totals[d]), 'Date-wise Expenses');
}

function drawYearlyChart(data) {
  const totals = {};
  data.forEach(item => {
    const year = new Date(item.date).getFullYear();
    totals[year] = (totals[year] || 0) + parseFloat(item.amount || 0);
  });
  drawChart('bar', Object.keys(totals), Object.values(totals), 'Yearly Expenses');
}

function drawChart(type, labels, values, title) {
  const ctx = document.getElementById("report-chart")?.getContext("2d");
  if (!ctx) return;

  // Destroy previous chart
  if (window.reportChart) {
    window.reportChart.destroy();
  }

  const commonDataset = {
    label: title,
    data: values,
    backgroundColor: [
      '#FF6384', '#36A2EB', '#FFCE56', '#81C784', '#BA68C8',
      '#9575CD', '#4BC0C0', '#FF9F40', '#F06292', '#4DB6AC'
    ],
    borderColor: '#fff',
    borderWidth: 2,
    hoverOffset: 10
  };

  const config = {
    type,
    data: {
      labels,
      datasets: [commonDataset]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: title,
          font: { size: 16 }
        },
        tooltip: {
          enabled: true
        },
        legend: {
          display: true,
          position: 'right'
        }
      },
      scales: (type === 'pie' || type === 'doughnut') ? {} : {
        y: {
          beginAtZero: true,
          ticks: {
            callback: value => `₹${value}`
          }
        }
      }
    }
  };

  window.reportChart = new Chart(ctx, config);
}

// ==== Budget Calculation ====
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

// ==== Insight Box ====
function loadReportInsights(data) {
  const lastMonthTotal = 800; // Placeholder, replace with dynamic calc if needed
  const thisMonthTotal = data.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
  const diff = thisMonthTotal - lastMonthTotal;

  document.getElementById("comparison-insights").textContent =
    `This month is ${diff >= 0 ? '↑ ₹' + diff + ' more' : '↓ ₹' + Math.abs(diff) + ' less'} than last month.`;
}

// ==== Download PDF ====
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

// ==== Download Excel ====
function downloadExcel() {
  fetchAllExpenses().then(data => {
    const sheet = XLSX.utils.json_to_sheet(data);
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Report");
    XLSX.writeFile(book, "report.xlsx");
  });
}

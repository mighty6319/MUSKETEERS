// ============================================================
// STORAGE
// ============================================================

const usersStorageKey = "users";
const activeUserStorageKey = "activeUserId";


// ============================================================
// DATABASE-CONFIRMED USER CHECK
// ============================================================

const storedUsers =
    localStorage.getItem(
        usersStorageKey
    );


try {

    const users =
        JSON.parse(
            storedUsers || "[]"
        );


    const activeUserId =
        localStorage.getItem(
            activeUserStorageKey
        );


    const userData =
        users.find(
            user =>
                user.id ===
                activeUserId
        );


    // --------------------------------------------------------
    // MAIN PAGE CANNOT BE OPENED WITHOUT ACTIVE USER
    // --------------------------------------------------------

    if (
        !userData?.id ||
        userData.status !== "pass"
    ) {

        window.location.href =
            "../START/start.html";
    }

} catch {

    window.location.href =
        "../START/start.html";
}


// ============================================================
// DASHBOARD NAVIGATION
// ============================================================

const logoutButton =
    document.querySelector(
        'button[type="logout"]'
    );


const menuItems =
    document.querySelectorAll(
        ".menu-item[data-panel]"
    );


const dashboardPanels =
    document.querySelectorAll(
        ".dashboard-block"
    );


menuItems.forEach(
    menuItem => {

        menuItem.addEventListener(
            "click",
            () => {

                const selectedPanel =
                    document.querySelector(
                        `#${menuItem.dataset.panel}`
                    );


                menuItems.forEach(
                    item => {

                        item.classList.toggle(
                            "active",
                            item === menuItem
                        );
                    }
                );


                dashboardPanels.forEach(
                    panel => {

                        panel.classList.toggle(
                            "is-selected",
                            panel === selectedPanel
                        );
                    }
                );
            }
        );
    }
);


// ============================================================
// LOGOUT
// ============================================================

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        () => {

            // Only active session is removed.
            // Other users remain in localStorage.

            localStorage.removeItem(
                activeUserStorageKey
            );


            window.location.href =
                "../START/start.html";
        }
    );
}


const startSimulationBtn =
    document.getElementById("startSimulationBtn");
const monthOneStartPanel = document.getElementById("monthOneStartPanel");
const playMonthOneButton = document.getElementById("playMonthOneButton");
const closeMonthOneStartButton = document.getElementById("closeMonthOneStartButton");


if (startSimulationBtn) {

    startSimulationBtn.addEventListener("click", () => {

        monthOneStartPanel.hidden = false;
        monthOneStartPanel.setAttribute("aria-hidden", "false");
        monthOneStartPanel.classList.add("is-open");

    });
}

playMonthOneButton?.addEventListener("click", () => {
    window.location.href = "../SIMULATION/simulation.html";
});

closeMonthOneStartButton?.addEventListener("click", () => {
    monthOneStartPanel.classList.remove("is-open");
    monthOneStartPanel.setAttribute("aria-hidden", "true");
    window.setTimeout(() => {
        monthOneStartPanel.hidden = true;
    }, 220);
});

// ============================================================
// LIVE MONTHLY SIMULATION DASHBOARD
// Reads the reusable Month I ledger written by SIMULATION.
// ============================================================
(function loadSimulationFinancialState(){
    const activeId = localStorage.getItem(activeUserStorageKey);
    const startButton = document.getElementById('startSimulationBtn');
    const incomeMetric = document.getElementById('incomeMetric');
    const expenseMetric = document.getElementById('expenseMetric');
    const expenseChart = document.getElementById('expenseChart');
    const monthlyChart = document.getElementById('monthlyExpenditureChart');
    const pieChart = document.getElementById('monthOnePieChart');
    const pieLegend = document.getElementById('monthOnePieLegend');
    const money = value => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(Math.round(Number(value)||0));

    if (!activeId) {
        if (startButton) startButton.textContent = 'START';
        if (incomeMetric) incomeMetric.textContent = 'MONEY AVAILABLE: INR 50,000';
        if (expenseMetric) expenseMetric.textContent = 'MONTH I NOT PLAYED';
        return;
    }

    let state = null;
    try {
        state = JSON.parse(localStorage.getItem(`knowE_month1_${activeId}`) || 'null');
    } catch {
        state = null;
    }
    if (!state) {
        if (startButton) startButton.textContent = 'START';
        if (incomeMetric) incomeMetric.textContent = 'MONEY AVAILABLE: INR 50,000';
        if (expenseMetric) expenseMetric.textContent = 'MONTH I NOT PLAYED';
        if (expenseChart) expenseChart.innerHTML = '<p>PLAY MONTH 1 TO SEE YOUR EXPENSES.</p>';
        if (monthlyChart) monthlyChart.innerHTML = '<p>PLAY MONTH 1 TO SEE YOUR MONTH I GRAPH.</p>';
        if (pieLegend) pieLegend.innerHTML = '<span>MONTH I DATA WILL APPEAR AFTER PLAYING.</span>';
        return;
    }

    if (startButton) startButton.textContent = 'START';

    const goalsBox = document.getElementById('goalsDashboard');
    const debtBox = document.getElementById('debtDashboard');
    const emiBox = document.getElementById('emiDashboard');

    const transactions = Array.isArray(state.transactions) ? state.transactions.filter(t => t.month === 1) : [];
    const expenses = transactions.filter(t => t.type === 'expense');
    const sums = {};
    expenses.forEach(t => sums[t.category] = (sums[t.category] || 0) + Number(t.amount || 0));
    const max = Math.max(1, ...Object.values(sums));

    if (incomeMetric) incomeMetric.textContent = `MONEY IN HAND: ${money(state.balance)}`;
    if (expenseMetric) expenseMetric.textContent = `MONTH I USED: ${money(Object.values(sums).reduce((a,b)=>a+b,0))}`;

    if (expenseChart) {
        expenseChart.innerHTML = Object.entries(sums).map(([category,value]) => `
            <div class="simulation-usage-row">
                <strong>${category}</strong>
                <div class="simulation-usage-track"><div class="simulation-usage-fill" style="width:${Math.max(3,value/max*100)}%"></div></div>
                <span>${money(value)}</span>
            </div>
        `).join('') || '<p>No simulation spending recorded yet.</p>';
    }

    if (monthlyChart) {
        const categories = [...new Set(expenses.map(t=>t.category))];
        const months = [1];
        const totals = {};
        categories.forEach(c => months.forEach(m => totals[`${c}-${m}`] = transactions.filter(t=>t.type==='expense' && t.category===c && t.month===m).reduce((a,t)=>a+Number(t.amount||0),0)));
        const overallMax = Math.max(1,...Object.values(totals));
        monthlyChart.innerHTML = categories.map(category => `
            <div class="monthly-row">
                <span class="monthly-row-label">${category}</span>
                ${months.map(m=>{const v=totals[`${category}-${m}`]||0;return `<div class="monthly-month-cell"><span class="monthly-month-label">M${m}</span><div class="monthly-bar-track"><div class="monthly-bar-fill" style="width:${v?Math.max(4,v/overallMax*100):0}%"></div></div></div>`}).join('')}
            </div>
        `).join('') || '<p>No monthly simulation expenditure recorded yet.</p>';
    }

    const pieColors = ['#f6bd60','#84a59d','#f28482','#5e60ce','#90be6d','#577590'];
    const totalExpenses = expenses.reduce((total, transaction) => total + Number(transaction.amount || 0), 0);
    let offset = 0;
    const segments = [];
    if (pieLegend) pieLegend.replaceChildren();
    Object.entries(sums).forEach(([category, value], index) => {
        const percentage = totalExpenses ? value / totalExpenses * 100 : 0;
        segments.push(`${pieColors[index % pieColors.length]} ${offset}% ${offset + percentage}%`);
        offset += percentage;
        if (pieLegend) {
            const item = document.createElement('span');
            item.textContent = `${category}: ${money(value)}`;
            item.style.setProperty('--legend-color', pieColors[index % pieColors.length]);
            pieLegend.appendChild(item);
        }
    });
    if (pieChart) pieChart.style.background = segments.length ? `conic-gradient(${segments.join(',')})` : 'none';

    if (goalsBox) {
        const goals = Array.isArray(state.goals) ? state.goals : [];
        goalsBox.innerHTML = goals.length ? goals.map(g=>`<div class="goal-entry"><strong>${g.name}</strong><br>${money(g.saved)} / ${money(g.target)}</div>`).join('') : 'GOALS: NONE';
    }
    if (debtBox) debtBox.textContent = `DEBT: ${money(state.debt || 0)}`;
    if (emiBox) emiBox.textContent = `EMI PENDING: ${money(state.emiPending || 0)}`;
})();

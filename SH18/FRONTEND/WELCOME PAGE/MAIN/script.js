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


if (startSimulationBtn) {

    startSimulationBtn.addEventListener("click", () => {

        startSimulationBtn.disabled = true;

        // START THE ANIMATION
        document.body.classList.add(
            "simulation-starting"
        );

        // BLACK TAKES OVER
        setTimeout(() => {

            document.body.classList.add(
                "simulation-black"
            );

        }, 1100);

        // GO TO SIMULATION
        setTimeout(() => {

            window.location.href =
                "../SIMULATION/simulation.html";

        }, 2100);

    });
}

// ============================================================
// LIVE MONTHLY SIMULATION DASHBOARD
// Reads the reusable Month I ledger written by SIMULATION.
// ============================================================
(function loadSimulationFinancialState(){
    const activeId = localStorage.getItem(activeUserStorageKey);
    if (!activeId) return;

    let state = null;
    try {
        state = JSON.parse(localStorage.getItem(`knowE_month1_${activeId}`) || 'null');
    } catch {
        state = null;
    }
    if (!state) return;

    const money = value => new Intl.NumberFormat('en-IN', {
        style:'currency', currency:'INR', maximumFractionDigits:0
    }).format(Math.round(Number(value)||0));

    const incomeMetric = document.getElementById('incomeMetric');
    const expenseMetric = document.getElementById('expenseMetric');
    const expenseChart = document.getElementById('expenseChart');
    const monthlyChart = document.getElementById('monthlyExpenditureChart');
    const goalsBox = document.getElementById('goalsDashboard');
    const debtBox = document.getElementById('debtDashboard');
    const emiBox = document.getElementById('emiDashboard');

    const transactions = Array.isArray(state.transactions) ? state.transactions : [];
    const expenses = transactions.filter(t => t.month === 1 && t.type === 'expense');
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
        const categories = [...new Set(transactions.filter(t=>t.type==='expense').map(t=>t.category))];
        const months = [1,2,3];
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

    if (goalsBox) {
        const goals = Array.isArray(state.goals) ? state.goals : [];
        goalsBox.innerHTML = goals.length ? goals.map(g=>`<div class="goal-entry"><strong>${g.name}</strong><br>${money(g.saved)} / ${money(g.target)}</div>`).join('') : 'GOALS: NONE';
    }
    if (debtBox) debtBox.textContent = `DEBT: ${money(state.debt || 0)}`;
    if (emiBox) emiBox.textContent = `EMI PENDING: ${money(state.emiPending || 0)}`;
})();

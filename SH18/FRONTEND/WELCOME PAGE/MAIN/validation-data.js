const profileUsersStorageKey = "users";
const profileActiveUserStorageKey = "activeUserId";
const profileAuthDataApiUrl = "http://127.0.0.1:8000/api/auth-data";

const profileUsername = document.querySelector("#profileUsername");
const profileStatus = document.querySelector("#profileStatus");
const profileData = document.querySelector("#profileData");
const incomeMetric = document.querySelector("#incomeMetric");
const expenseMetric = document.querySelector("#expenseMetric");
const expenseChart = document.querySelector("#expenseChart");
const expensePieChart = document.querySelector("#expensePieChart");
const expensePieLegend = document.querySelector("#expensePieLegend");
const expenseColors = ["#ff6b6b", "#ffb84d", "#55d6be", "#6ea8fe", "#c084fc", "#f472b6"];

function saveConfirmedUser(confirmedData) {
    const users = JSON.parse(localStorage.getItem(profileUsersStorageKey) || "[]");
    const confirmedUser = {
        ...confirmedData.userdata,
    };
    const existingIndex = users.findIndex((user) => user.id === confirmedUser.id);

    if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...confirmedUser };
    } else {
        users.push(confirmedUser);
    }

    localStorage.setItem(profileUsersStorageKey, JSON.stringify(users));
    localStorage.setItem(profileActiveUserStorageKey, confirmedUser.id);
    return confirmedUser;
}

function addProfileField(label, value) {
    const field = document.createElement("div");
    field.className = "profile-data-field";

    const fieldLabel = document.createElement("span");
    fieldLabel.textContent = label;

    const fieldValue = document.createElement("strong");
    fieldValue.textContent = value;

    field.append(fieldLabel, fieldValue);
    profileData.appendChild(field);
}

function renderIncomeAndExpenses(profile) {
    const expenses = Array.isArray(profile.expenses)
        ? [...profile.expenses].sort((first, second) => Number(second.percentage) - Number(first.percentage))
        : [];
    const totalExpenses = expenses.reduce((total, expense) => total + Number(expense.amount), 0);
    const salary = Number(profile.salary);

    incomeMetric.textContent = `INCOME: INR ${salary.toLocaleString()}`;
    expenseMetric.textContent = `EXPENSES: INR ${totalExpenses.toLocaleString()}`;
    expenseChart.replaceChildren();

    expenses.forEach((expense, index) => {
        const row = document.createElement("div");
        row.className = "expense-row-chart";
        row.style.setProperty("--expense-color", expenseColors[index % expenseColors.length]);
        row.setAttribute("title", `${expense.category}: ${Number(expense.percentage).toFixed(1)}% of salary`);

        const label = document.createElement("span");
        label.className = "expense-label";
        label.innerHTML = `<span class="expense-rank">${String(index + 1).padStart(2, "0")}</span>${expense.category}`;

        const track = document.createElement("div");
        track.className = "expense-track";

        const bar = document.createElement("div");
        bar.className = "expense-bar";
        bar.style.width = `${Math.min(Math.max(Number(expense.percentage), 0), 100)}%`;
        bar.setAttribute("aria-label", `${expense.category} uses ${Number(expense.percentage).toFixed(1)} percent of salary`);

        const amount = document.createElement("strong");
        amount.textContent = `${Number(expense.percentage).toFixed(1)}% | INR ${Number(expense.amount).toLocaleString()}`;

        track.appendChild(bar);
        row.append(label, track, amount);
        expenseChart.appendChild(row);
    });

    const pieSegments = [];
    let currentPercentage = 0;
    expensePieLegend.replaceChildren();

    expenses.forEach((expense, index) => {
        const percentage = Math.max(Number(expense.percentage), 0);
        const endPercentage = currentPercentage + percentage;
        pieSegments.push(`${expenseColors[index % expenseColors.length]} ${currentPercentage}% ${endPercentage}%`);
        currentPercentage = endPercentage;

        const legendItem = document.createElement("div");
        legendItem.className = "expense-pie-legend-item";

        const swatch = document.createElement("span");
        swatch.className = "expense-pie-swatch";
        swatch.style.backgroundColor = expenseColors[index % expenseColors.length];

        const label = document.createElement("span");
        label.textContent = `${expense.category} ${percentage.toFixed(1)}%`;

        legendItem.append(swatch, label);
        expensePieLegend.appendChild(legendItem);
    });

    expensePieChart.style.background = `conic-gradient(${pieSegments.join(", ")})`;
}

async function loadConfirmedProfile() {
    const users = JSON.parse(localStorage.getItem(profileUsersStorageKey) || "[]");
    const activeUserId = localStorage.getItem(profileActiveUserStorageKey);
    const cachedUser = users.find((user) => user.id === activeUserId);

    if (!cachedUser?.username) {
        window.location.href = "../START/start.HTML";
        return;
    }

    try {
        const response = await fetch(`${profileAuthDataApiUrl}?username=${encodeURIComponent(cachedUser.username)}&id=${encodeURIComponent(cachedUser.id)}`);
        if (!response.ok) {
            throw new Error("The database could not confirm this user.");
        }

        const confirmedData = await response.json();
        const user = saveConfirmedUser(confirmedData);
        const profile = confirmedData.profile;

        profileUsername.textContent = user.username;
        profileStatus.textContent = "DATABASE CONFIRMED";
        profileData.replaceChildren();
        addProfileField("Age", profile.age);
        addProfileField("Income", profile.income);
        addProfileField("Gender", profile.gender);
        addProfileField("Nature", profile.nature);
        addProfileField("Spending preference", profile.city);
        addProfileField("Monthly salary", `INR ${Number(profile.salary).toLocaleString()}`);
        renderIncomeAndExpenses(profile);
    } catch {
        localStorage.removeItem(profileActiveUserStorageKey);
        window.location.href = "../START/start.HTML";
    }
}

loadConfirmedProfile();

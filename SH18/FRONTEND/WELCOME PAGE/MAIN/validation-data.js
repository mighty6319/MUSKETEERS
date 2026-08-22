// ============================================================
// STORAGE
// ============================================================

const profileUsersStorageKey = "users";
const profileActiveUserStorageKey = "activeUserId";


// ============================================================
// API
// ============================================================

const profileAuthDataApiUrl =
    "http://127.0.0.1:8000/api/auth-data";


// ============================================================
// DOM
// ============================================================

const profileUsername =
    document.querySelector("#profileUsername");

const profileStatus =
    document.querySelector("#profileStatus");

const profileData =
    document.querySelector("#profileData");

const incomeMetric =
    document.querySelector("#incomeMetric");

const expenseMetric =
    document.querySelector("#expenseMetric");

const expenseChart =
    document.querySelector("#expenseChart");

const expensePieChart =
    document.querySelector("#expensePieChart");

const expensePieLegend =
    document.querySelector("#expensePieLegend");


// ============================================================
// CHART COLORS
// ============================================================

const expenseColors = [
    "#ff7a18",
    "#ff9f43",
    "#ffd166",
    "#55d6be",
    "#6ea8fe",
    "#c084fc"
];


// ============================================================
// SAFE LOCAL STORAGE
// ============================================================

function getStoredUsers() {

    try {

        const users =
            JSON.parse(
                localStorage.getItem(
                    profileUsersStorageKey
                ) || "[]"
            );

        return Array.isArray(users)
            ? users
            : [];

    } catch {

        return [];
    }
}


// ============================================================
// SAVE CONFIRMED USER
// ============================================================

function saveConfirmedUser(
    confirmedData
) {

    const users =
        getStoredUsers();

    const confirmedUser =
        {
            username:
                confirmedData.userdata.username,

            id:
                confirmedData.userdata.id,

            status:
                confirmedData.userdata.status
        };


    const existingIndex =
        users.findIndex(
            user =>
                user.id ===
                confirmedUser.id
        );


    if (existingIndex >= 0) {

        users[existingIndex] = {
            ...users[existingIndex],
            ...confirmedUser
        };

    } else {

        users.push(
            confirmedUser
        );
    }


    localStorage.setItem(
        profileUsersStorageKey,
        JSON.stringify(users)
    );


    localStorage.setItem(
        profileActiveUserStorageKey,
        confirmedUser.id
    );


    return confirmedUser;
}


// ============================================================
// PROFILE FIELD
// ============================================================

function addProfileField(
    label,
    value
) {

    const field =
        document.createElement("div");

    field.className =
        "profile-data-field";


    const fieldLabel =
        document.createElement("span");

    fieldLabel.textContent =
        label;


    const fieldValue =
        document.createElement("strong");

    fieldValue.textContent =
        value;


    field.append(
        fieldLabel,
        fieldValue
    );


    profileData.appendChild(field);
}


// ============================================================
// INCOME + EXPENSES
// ============================================================

function renderIncomeAndExpenses(
    profile
) {

    const expenses =
        Array.isArray(profile.expenses)

            ? [...profile.expenses].sort(
                (first, second) =>
                    Number(second.percentage) -
                    Number(first.percentage)
            )

            : [];


    const totalExpenses =
        expenses.reduce(
            (total, expense) =>
                total +
                Number(expense.amount),

            0
        );


    const salary =
        Number(profile.salary);


    // ========================================================
    // METRICS
    // ========================================================

    incomeMetric.textContent =
        `INCOME: INR ${salary.toLocaleString()}`;

    expenseMetric.textContent =
        `EXPENSES: INR ${totalExpenses.toLocaleString()}`;


    // ========================================================
    // BAR CHART
    // ========================================================

    expenseChart.replaceChildren();


    expenses.forEach(
        (expense, index) => {

            const row =
                document.createElement("div");

            row.className =
                "expense-row-chart";


            row.style.setProperty(
                "--expense-color",
                expenseColors[
                    index %
                    expenseColors.length
                ]
            );


            row.setAttribute(
                "title",
                `${expense.category}: ${Number(
                    expense.percentage
                ).toFixed(1)}% of salary`
            );


            const label =
                document.createElement("span");

            label.className =
                "expense-label";


            const rank =
                document.createElement("span");

            rank.className =
                "expense-rank";

            rank.textContent =
                String(index + 1).padStart(
                    2,
                    "0"
                );


            label.appendChild(rank);


            const category =
                document.createTextNode(
                    expense.category
                );

            label.appendChild(category);


            const track =
                document.createElement("div");

            track.className =
                "expense-track";


            const bar =
                document.createElement("div");

            bar.className =
                "expense-bar";


            const percentage =
                Math.min(
                    Math.max(
                        Number(
                            expense.percentage
                        ),
                        0
                    ),
                    100
                );


            bar.style.width =
                `${percentage}%`;


            bar.setAttribute(
                "aria-label",
                `${expense.category} uses ${percentage.toFixed(1)} percent of salary`
            );


            const amount =
                document.createElement("strong");


            amount.textContent =
                `${percentage.toFixed(1)}% | INR ${Number(
                    expense.amount
                ).toLocaleString()}`;


            track.appendChild(bar);


            row.append(
                label,
                track,
                amount
            );


            expenseChart.appendChild(row);
        }
    );


    // ========================================================
    // PIE CHART
    // ========================================================

    const pieSegments = [];

    let currentPercentage = 0;


    expensePieLegend.replaceChildren();


    expenses.forEach(
        (expense, index) => {

            const percentage =
                Math.max(
                    Number(
                        expense.percentage
                    ),
                    0
                );


            const endPercentage =
                currentPercentage +
                percentage;


            pieSegments.push(
                `${expenseColors[
                    index %
                    expenseColors.length
                ]} ${currentPercentage}% ${endPercentage}%`
            );


            currentPercentage =
                endPercentage;


            // ------------------------------------------------
            // LEGEND
            // ------------------------------------------------

            const legendItem =
                document.createElement("div");

            legendItem.className =
                "expense-pie-legend-item";


            const swatch =
                document.createElement("span");

            swatch.className =
                "expense-pie-swatch";


            swatch.style.backgroundColor =
                expenseColors[
                    index %
                    expenseColors.length
                ];


            const label =
                document.createElement("span");


            label.textContent =
                `${expense.category} ${percentage.toFixed(1)}%`;


            legendItem.append(
                swatch,
                label
            );


            expensePieLegend.appendChild(
                legendItem
            );
        }
    );


    if (pieSegments.length > 0) {

        expensePieChart.style.background =
            `conic-gradient(${pieSegments.join(", ")})`;

    } else {

        expensePieChart.style.background =
            "none";
    }
}


// ============================================================
// LOAD DATABASE-CONFIRMED PROFILE
// ============================================================

async function loadConfirmedProfile() {

    const users =
        getStoredUsers();


    const activeUserId =
        localStorage.getItem(
            profileActiveUserStorageKey
        );


    // --------------------------------------------------------
    // FIND ACTIVE USER
    // --------------------------------------------------------

    const cachedUser =
        users.find(
            user =>
                user.id ===
                activeUserId
        );


    if (
        !cachedUser?.id ||
        !cachedUser?.username
    ) {

        window.location.href =
            "../START/start.html";

        return;
    }


    try {

        // ----------------------------------------------------
        // DATABASE FINAL CONFIRMATION
        // ----------------------------------------------------

        const response =
            await fetch(
                `${profileAuthDataApiUrl}?username=${encodeURIComponent(
                    cachedUser.username
                )}&id=${encodeURIComponent(
                    cachedUser.id
                )}`
            );


        if (!response.ok) {

            throw new Error(
                "The database could not confirm this user."
            );
        }


        const confirmedData =
            await response.json();


        // ----------------------------------------------------
        // UPDATE LOCAL STORAGE WITH DB CONFIRMED DATA
        // ----------------------------------------------------

        const user =
            saveConfirmedUser(
                confirmedData
            );


        const profile =
            confirmedData.profile;


        // ====================================================
        // DISPLAY
        // ====================================================

        profileUsername.textContent =
            user.username;


        profileStatus.textContent =
            "DATABASE CONFIRMED";


        profileData.replaceChildren();


        addProfileField(
            "Age",
            profile.age
        );


        addProfileField(
            "Income Type",
            profile.income_type
        );


        addProfileField(
            "Gender",
            profile.gender
        );


        addProfileField(
            "Nature",
            profile.nature
        );


        addProfileField(
            "City",
            profile.city
        );


        addProfileField(
            "Monthly Salary",
            `INR ${Number(
                profile.salary
            ).toLocaleString()}`
        );


        renderIncomeAndExpenses(
            profile
        );

    } catch (error) {

        console.error(
            "Profile verification failed:",
            error
        );


        localStorage.removeItem(
            profileActiveUserStorageKey
        );


        window.location.href =
            "../START/start.html";
    }
}


loadConfirmedProfile();
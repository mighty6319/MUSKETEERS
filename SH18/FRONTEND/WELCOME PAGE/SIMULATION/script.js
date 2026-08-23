/* =========================================================
   KNOW'E LEDGER — FINANCIAL LIFE SIMULATION
   Complete cinematic sequence + dynamic housing + balance
========================================================= */

const simulation = document.querySelector(".simulation");

const scenes = {
    zero: document.querySelector(".scene-zero"),
    two: document.querySelector(".scene-two"),
    three: document.querySelector(".scene-three"),
    four: document.querySelector(".scene-four"),
    six: document.querySelector(".scene-six")
};

const trainHorn = document.getElementById("trainHorn");
const cutsceneOverlay = document.getElementById("cutsceneOverlay");
const cutsceneText = document.getElementById("cutsceneText");
const monthTitle = document.querySelector(".month-title");
const houseSearchOverlay = document.getElementById("houseSearchOverlay");
const searchHomeButton = document.getElementById("searchHomeButton");
const searchNotification = document.getElementById("searchNotification");
const homePanel = document.querySelector(".home-panel");
const closePanel = document.querySelector(".close-panel");
const availableSavings = document.getElementById("availableSavings");
const starterRent = document.getElementById("starterRent");
const comfortRent = document.getElementById("comfortRent");
const premiumRent = document.getElementById("premiumRent");
const slideNavs = document.querySelectorAll(".slide-nav");
const homeSlides = document.querySelectorAll(".home-slide");
const slideButtons = document.querySelectorAll(".slide-button");
const notificationLayer = document.getElementById("notificationLayer");
const weekLaterSequence = document.getElementById("weekLaterSequence");

/* =========================================================
   TIMING — deliberately uneven for cinematic pacing
========================================================= */
const LOADING_TIME = 5000;
const SCENE_TWO_TIME = 7000;
const HORN_TIME_FROM_END = 1000;
const SCENE_THREE_TIME = 3000;
const SCENE_FOUR_TIME = 2500;
const NEXT_DAY_TIME = 2000;
const VIDEO_PLAY_TIME = 5000;
const CURTAIN_TIME = 3000;
const MONTH_DELAY_AFTER_CURTAIN = 1000;
const MONTH_VISIBLE_TIME = 4000;
const WEEK_TAB_TIME = 2000;
const WEEK_IMAGE_ONE_TIME = 4500;
const WEEK_IMAGE_TWO_TIME = 3000;

const STARTING_SAVINGS = 50000;
const WELCOME_BONUS = 25000;
const API_BASE = "http://127.0.0.1:8000";
const ACTIVE_USER_KEY = "activeUserId";
const USERS_KEY = "users";
const BALANCE_KEY = "knowE_ledger_balance";
const HOME_KEY = "knowE_selected_home";

let simulationBalance = STARTING_SAVINGS;
let homeRentData = {
    starter: 0,
    comfort: 0,
    premium: 0
};
let profileLoaded = false;
let userData = null;

/* =========================================================
   HELPERS
========================================================= */
function wait(milliseconds) {
    return new Promise(resolve => window.setTimeout(resolve, milliseconds));
}

function money(value) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0
    }).format(Math.round(value));
}

function showScene(scene) {
    Object.values(scenes).forEach(currentScene => {
        currentScene?.classList.remove("active");
    });
    scene?.classList.add("active");
}

function updateBalanceUI() {
    if (availableSavings) {
        availableSavings.textContent = money(simulationBalance);
    }
}

function playTrainHorn(volume = 1) {
    if (!trainHorn) return;
    trainHorn.pause();
    trainHorn.currentTime = 0;
    trainHorn.volume = volume;
    trainHorn.play().catch(() => {});
}

function fadeTrainHorn(duration = 1800) {
    if (!trainHorn) return;
    const startVolume = trainHorn.volume;
    const startTime = performance.now();

    function fade(now) {
        const progress = Math.min((now - startTime) / duration, 1);
        trainHorn.volume = startVolume * (1 - progress);
        if (progress < 1) {
            requestAnimationFrame(fade);
        } else {
            trainHorn.pause();
            trainHorn.currentTime = 0;
            trainHorn.volume = 1;
        }
    }
    requestAnimationFrame(fade);
}

/* =========================================================
   REUSABLE CUTSCENE TAB
========================================================= */
async function showCutscene(text, duration) {
    if (!cutsceneOverlay || !cutsceneText) return;

    cutsceneText.textContent = text;
    cutsceneOverlay.classList.add("visible");
    cutsceneOverlay.setAttribute("aria-hidden", "false");

    await wait(duration);

    cutsceneOverlay.classList.remove("visible");
    cutsceneOverlay.setAttribute("aria-hidden", "true");
    await wait(500);
}

/* =========================================================
   REUSABLE APPLE-LIKE NOTIFICATION
   This can be called by future simulations too.
========================================================= */
async function showNotification({ app = "KNOW'E LEDGER", title, message, duration = 2200 }) {
    if (!notificationLayer) return;

    const notification = document.createElement("div");
    notification.className = "floating-notification";
    notification.innerHTML = `
        <div class="floating-notification-topline">
            <div class="floating-app-icon">⌂</div>
            <span>${app}</span>
            <small>NOW</small>
        </div>
        ${title ? `<strong>${title}</strong>` : ""}
        ${message ? `<p>${message}</p>` : ""}
    `;

    notificationLayer.appendChild(notification);
    requestAnimationFrame(() => notification.classList.add("visible"));
    await wait(duration);
    notification.classList.remove("visible");
    await wait(550);
    notification.remove();
}

/* =========================================================
   PROFILE / DATABASE DATA
========================================================= */
function getActiveUser() {
    const activeId = localStorage.getItem(ACTIVE_USER_KEY);
    if (!activeId) return null;

    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return users.find(user => String(user.id) === String(activeId)) || null;
    } catch {
        return null;
    }
}

async function loadUserProfile() {
    const localUser = getActiveUser();

    if (!localUser?.id || !localUser?.username) {
        console.warn("No active user found. Using fallback housing data.");
        applyHousingRent(10000);
        return;
    }

    try {
        const response = await fetch(
            `${API_BASE}/api/auth-data?username=${encodeURIComponent(localUser.username)}&id=${encodeURIComponent(localUser.id)}`
        );

        if (!response.ok) throw new Error("Could not load user profile.");

        const data = await response.json();
        userData = data;
        profileLoaded = true;

        const salary = Number(data.profile?.salary || 0);
        const expenses = Array.isArray(data.profile?.expenses)
            ? data.profile.expenses
            : [];

        const housingExpense = expenses.find(expense =>
            String(expense.category).trim().toUpperCase() === "HOUSING"
        );

        /*
            Backend stores each expense as an actual amount.
            Therefore the user's real housing amount is:
            salary × HOUSING percentage / 100,
            already returned as housingExpense.amount.
        */
        let baseRent = Number(housingExpense?.amount || 0);

        if (!baseRent && salary) {
            const percentage = Number(housingExpense?.percentage || 0);
            baseRent = salary * percentage / 100;
        }

        if (!baseRent) {
            baseRent = 10000;
        }

        applyHousingRent(baseRent);
    } catch (error) {
        console.error("Profile loading failed:", error);
        applyHousingRent(10000);
    }
}

function applyHousingRent(baseRent) {
    homeRentData = {
        starter: Math.round(baseRent),
        comfort: Math.round(baseRent * 1.3),
        premium: Math.round(baseRent * 0.5)
    };

    if (starterRent) starterRent.textContent = `${money(homeRentData.starter)} / MONTH`;
    if (comfortRent) comfortRent.textContent = `${money(homeRentData.comfort)} / MONTH`;
    if (premiumRent) premiumRent.textContent = `${money(homeRentData.premium)} / MONTH`;
}

/* =========================================================
   BALANCE
========================================================= */
function initializeBalance() {
    /* Every new simulation starts from fixed ₹50K. */
    simulationBalance = STARTING_SAVINGS;
    localStorage.setItem(BALANCE_KEY, String(simulationBalance));
    updateBalanceUI();
}

function saveBalance() {
    localStorage.setItem(BALANCE_KEY, String(simulationBalance));
}

function selectHome(homeType) {
    const rent = Number(homeRentData[homeType] || 0);

    if (!rent) {
        alert("Home rent is not available yet. Please wait a moment and try again.");
        return;
    }

    if (rent > simulationBalance) {
        showNotification({
            app: "KNOW'E LEDGER",
            title: "Not enough savings",
            message: `${money(rent)} cannot be paid from your current ${money(simulationBalance)} savings.`,
            duration: 2800
        });
        return;
    }

    simulationBalance -= rent;
    saveBalance();
    updateBalanceUI();

    localStorage.setItem(HOME_KEY, JSON.stringify({
        homeType,
        rent,
        remainingSavings: simulationBalance,
        selectedAt: new Date().toISOString()
    }));

    console.log("HOME SELECTED:", homeType);
    console.log("RENT DEDUCTED:", rent);
    console.log("REMAINING SAVINGS:", simulationBalance);

    closeHomePanel();

    showNotification({
        app: "KNOW'E LEDGER",
        title: "Home selected",
        message: `${money(rent)} deducted. Remaining savings: ${money(simulationBalance)}.`,
        duration: 2400
    });

    /* Continue into the next story beat after the selection. */
    window.setTimeout(() => {
        startWeekLaterSequence();
    }, 2600);
}

function addWelcomeBonus() {
    simulationBalance += WELCOME_BONUS;
    saveBalance();
    updateBalanceUI();
    console.log("WELCOME BONUS +₹25,000. BALANCE:", simulationBalance);
}

/* =========================================================
   HOME PANEL
========================================================= */
function openHomePanel() {
    houseSearchOverlay?.classList.remove("visible");
    homePanel?.classList.add("visible");
    updateBalanceUI();
}

function closeHomePanel() {
    homePanel?.classList.remove("visible");
}

/* =========================================================
   SLIDES
========================================================= */
function activateSlide(index) {
    homeSlides.forEach((slide, slideIndex) => {
        slide.classList.toggle("active", slideIndex === index);
    });

    slideNavs.forEach((nav, navIndex) => {
        nav.classList.toggle("active", navIndex === index);
    });
}

slideNavs.forEach(nav => {
    nav.addEventListener("click", () => {
        const index = Number(nav.dataset.slide);
        if (!Number.isNaN(index)) activateSlide(index);
    });
});

slideButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectHome(button.dataset.home);
    });
});

closePanel?.addEventListener("click", closeHomePanel);
searchHomeButton?.addEventListener("click", openHomePanel);

/* =========================================================
    WEEK LATER — TAB -> IMG1 -> IMG2 + NOTIFICATIONS
========================================================= */
async function startWeekLaterSequence() {
    if (!weekLaterSequence) return;

    simulation.classList.add("sequence-ended");
    weekLaterSequence.classList.add("visible");
    weekLaterSequence.setAttribute("aria-hidden", "false");

    const imageOne = weekLaterSequence.querySelector(".timeline-image-one");
    const imageTwo = weekLaterSequence.querySelector(".timeline-image-two");
    const weekCutscene = weekLaterSequence.querySelector(".week-cutscene");

    weekCutscene?.classList.add("visible");
    await wait(WEEK_TAB_TIME);
    weekCutscene?.classList.remove("visible");

    imageOne?.classList.add("visible");
    await wait(WEEK_IMAGE_ONE_TIME);
    imageOne?.classList.remove("visible");

    imageTwo?.classList.add("visible", "vibrate");

    /*
        The image itself is stable after the short vibration.
        Notifications enter one after another like Apple alerts.
    */
    await wait(650);

    await showNotification({
        app: "KNOW'E LEDGER • OFFICE",
        title: "WELCOME BONUS",
        message: "You received your welcome bonus.",
        duration: 1900
    });

    addWelcomeBonus();

    await wait(250);

    await showNotification({
        app: "YOUR BANK",
        title: "₹25,000 CREDITED",
        message: `Your account has been credited. Available balance: ${money(simulationBalance)}.`,
        duration: 2300
    });

    await wait(Math.max(0, WEEK_IMAGE_TWO_TIME - 650 - 1900 - 250 - 2300));

    imageTwo?.classList.remove("vibrate");
    weekLaterSequence.classList.remove("visible");
    weekLaterSequence.setAttribute("aria-hidden", "true");
}

/* =========================================================
   SCENE 6
========================================================= */
async function startSceneSix() {
    if (!scenes.six) return;

    showScene(scenes.six);
    scenes.six.currentTime = 0;
    scenes.six.muted = true;

    /* Curtain begins at the exact moment the video begins. */
    simulation.classList.remove("curtains-open");
    requestAnimationFrame(() => simulation.classList.add("curtains-open"));

    scenes.six.play().catch(() => {});

    /* Curtain finishes after 3 seconds, then MONTH I after 1 second. */
    await wait(CURTAIN_TIME + MONTH_DELAY_AFTER_CURTAIN);
    monthTitle?.classList.add("visible");

    /* Video itself plays only 5 seconds and then freezes. */
    window.setTimeout(() => {
        scenes.six.pause();
    }, VIDEO_PLAY_TIME);

    /* MONTH I stays for 4 seconds. */
    await wait(MONTH_VISIBLE_TIME);
    monthTitle?.classList.remove("visible");

    /* Frozen last frame remains behind this blurred notification. */
    houseSearchOverlay?.classList.add("visible");
}

/* =========================================================
   MAIN SEQUENCE
========================================================= */
async function startSimulation() {
    if (!simulation) return;

    initializeBalance();
    loadUserProfile();

    showScene(scenes.zero);

    /* Load everything during the 5-second loading screen. */
    const preloadPromise = Promise.all([
        ...[
            "../../assets/scene2.jpeg",
            "../../assets/scene3.jpeg",
            "../../assets/scene4.jpeg",
            "../../assets/IMG1.jpeg",
            "../../assets/IMG2.jpeg",
            "../../assets/house1.jpeg",
            "../../assets/house2.jpeg",
            "../../assets/house3.jpeg"
        ].map(src => new Promise(resolve => {
            const img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = src;
        }))
    ]);

    scenes.six?.load();

    await Promise.all([preloadPromise, wait(LOADING_TIME)]);

    simulation.classList.add("loading-complete");
    simulation.classList.add("curtains-open");

    /* ================= SCENE 2 — 7 SEC ================= */
    showScene(scenes.two);
    window.setTimeout(() => playTrainHorn(1), SCENE_TWO_TIME - HORN_TIME_FROM_END);
    await wait(SCENE_TWO_TIME);

    /* ================= SCENE 3 — 3 SEC ================= */
    showScene(scenes.three);
    await wait(SCENE_THREE_TIME);

    /* ================= SCENE 4 — 2.5 SEC ================= */
    showScene(scenes.four);
    playTrainHorn(0.18);
    fadeTrainHorn(SCENE_FOUR_TIME);
    await wait(SCENE_FOUR_TIME);

    /* ================= NEXT DAY TAB — 2 SEC ================= */
    await showCutscene("NEXT DAY", NEXT_DAY_TIME);

    /* ================= SCENE 6 ================= */
    await startSceneSix();
}

/* =========================================================
   START
========================================================= */
startSimulation();

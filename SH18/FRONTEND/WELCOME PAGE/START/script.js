// ================= MUSIC =================

const music = document.querySelector("#bgMusic");
const muteBtn = document.querySelector("#muteBtn");

music.volume = 0.1;

music.play();

muteBtn.addEventListener("click", (event) => {

    event.stopPropagation();

    if (music.paused) {
        music.play();
        muteBtn.textContent = "🔊";
    } else {
        music.pause();
        muteBtn.textContent = "▶️";
    }
});


// ================= LOGIN =================

const login = document.querySelector("#login");
const header = document.querySelector("header");
const startButton = document.querySelector('#start');
const side=document.querySelector(".side");
const playButton = document.querySelector("#playButton");
const usernameInput = document.querySelector("#username");
const userIdInput = document.querySelector("#userId");
const loginForm = document.querySelector("#loginForm");
const createProfile = document.querySelector("#createProfile");
const createProfileButton = document.querySelector("#createProfileButton");
const profileMessage = document.querySelector("#profileMessage");
const profileBlock = document.querySelector("#profileBlock");
const profileForm = document.querySelector("#profileForm");
const profileUsername = document.querySelector("#profileUsername");
const editUsername = document.querySelector("#editUsername");
const profileError = document.querySelector("#profileError");
const backToLogin = document.querySelector("#backToLogin");
const expenseChoices = document.querySelectorAll(".expense-choice");
const natureChoices = document.querySelectorAll('input[name="nature"]');
const salaryInput = document.querySelector("#salary");
const surveyDataUrl = "http://127.0.0.1:8000/api/survey-data";
const userDataApiUrl = "http://127.0.0.1:8000/api/user-data";
const authDataApiUrl = "http://127.0.0.1:8000/api/auth-data";
const usernameCheckApiUrl = "http://127.0.0.1:8000/api/username-check";


// START BUTTON

startButton.addEventListener("click", (event) => {

    event.stopPropagation();
    /* ========================================================================== *
     * START PAGE CONTROLLER
     * Sections: element references, music, login navigation, profile helpers,
     * profile field listeners, reset, and profile submission.
     * ========================================================================== */

    // ================= ELEMENT REFERENCES =================
    startButton.hidden = true;
    header.hidden = true;
    side.hidden=true;
    login.hidden = false;

});


// CLOSE LOGIN WHEN CLICKING OUTSIDE

document.addEventListener("click", (event) => {

    if (!login.hidden && !event.target.closest("#login")) {

        login.hidden = true;
        startButton.hidden = false;
        header.hidden = false;
        side.hidden=false;

    }

});


// ================= PLAY =================

playButton.addEventListener("click", async (event) => {

    event.stopPropagation();

    const username = usernameInput.value.trim();
    const status = validateProfile(username);

    if (status === "fail") {
        profileMessage.textContent = "Enter a username before continuing.";
        createProfile.hidden = false;
        return;
    }

    const localUser = readUserData(username);
    if (!localUser) {
        playButton.disabled = true;
        try {
            const response = await fetch(`${usernameCheckApiUrl}?username=${encodeURIComponent(username)}`);
            if (!response.ok) {
                throw new Error("The database could not check this username.");
            }

            const result = await response.json();
            if (result.exists) {
                profileMessage.classList.add("profile-warning");
                if (!userIdInput.value.trim()) {
                    profileMessage.textContent = "This username already exists. Enter the User ID to access it instead of creating a duplicate profile.";
                    userIdInput.hidden = false;
                    createProfile.hidden = false;
                    return;
                }
            } else {
                profileMessage.textContent = "Username is available. Select CREATE PROFILE to continue.";
                profileMessage.classList.remove("profile-warning");
                userIdInput.value = "";
                userIdInput.hidden = true;
                createProfile.hidden = false;
                return;
            }
        } catch (error) {
            profileMessage.textContent = `${error.message} Please try again.`;
            createProfile.hidden = false;
        } finally {
            playButton.disabled = false;
        }
        return;
    }

    if (!userIdInput.value.trim()) {
        userIdInput.hidden = false;
        userIdInput.focus();
        profileMessage.textContent = localUser?.status === "pass"
            ? "Local account found. Enter your User ID to confirm it with the database."
            : "Enter your User ID to verify this username with the database.";
        profileMessage.classList.remove("profile-warning");
        createProfile.hidden = false;
        return;
    }

    playButton.disabled = true;
    try {
        const response = await fetch(`${authDataApiUrl}?username=${encodeURIComponent(username)}&id=${encodeURIComponent(userIdInput.value.trim())}`);
        if (!response.ok) {
            throw new Error(response.status === 404
                ? "This username is not confirmed in the database. Create a profile first."
                : "The database could not confirm this username.");
        }

        const confirmedData = await response.json();
        saveUserData(username, "pass", confirmedData.userdata);
        profileMessage.classList.remove("profile-warning");
        window.location.href = "../MAIN/main.html";
    } catch (error) {
        profileMessage.textContent = `${error.message} Please try again.`;
        createProfile.hidden = false;
    } finally {
        playButton.disabled = false;
    }
});

createProfileButton.addEventListener("click", async (event) => {
    event.stopPropagation();

    const username = usernameInput.value.trim();
    const status = validateProfile(username);

    if (status === "fail") {
        profileMessage.textContent = "Enter a username before creating your profile.";
        return;
    }

    if (readUserData(username)) {
        profileMessage.textContent = "This username already exists locally. Use PLAY and provide the User ID instead.";
        profileMessage.classList.add("profile-warning");
        return;
    }

    createProfileButton.disabled = true;
    try {
        const response = await fetch(`${usernameCheckApiUrl}?username=${encodeURIComponent(username)}`);
        if (!response.ok) {
            throw new Error("The database could not check this username.");
        }

        const result = await response.json();
        if (result.exists) {
            profileMessage.textContent = "This username already exists in the database. Use PLAY and provide the User ID instead.";
            profileMessage.classList.add("profile-warning");
            userIdInput.hidden = false;
            return;
        }
    } catch (error) {
        profileMessage.textContent = `${error.message} Please try again.`;
        profileMessage.classList.add("profile-warning");
        return;
    } finally {
        createProfileButton.disabled = false;
    }

    profileUsername.value = username;
    profileMessage.classList.remove("profile-warning");
    login.hidden = true;
    profileBlock.hidden = false;
});

backToLogin.addEventListener("click", (event) => {
    event.stopPropagation();
    backToLogin.classList.remove("arrow-moving");
    void backToLogin.offsetWidth;
    backToLogin.classList.add("arrow-moving");

    window.setTimeout(() => {
        localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
        profileBlock.hidden = true;
        login.hidden = false;
        header.hidden = true;
        side.hidden = true;
        startButton.hidden = true;
        userIdInput.value = "";
        userIdInput.hidden = true;
    }, 180);
});

editUsername.addEventListener("click", () => {
    profileUsername.readOnly = false;
    profileUsername.focus();
    profileUsername.select();
});

profileUsername.addEventListener("blur", () => {
    profileUsername.value = profileUsername.value.trim();
});

function clearRequiredState(element) {
    const target = element.closest(".profile-field");

    if (target) {
        target.classList.remove("required-missing");
    }
}

function validateRequiredFields() {
    const missingFields = [];
    const usernameField = profileUsername.closest(".profile-field");
    const ageField = document.querySelector("#age").closest(".profile-field");
    const incomeField = document.querySelector("#income").closest(".profile-field");
    const genderField = document.querySelector('input[name="gender"]').closest("fieldset");
    const natureField = document.querySelector('input[name="nature"]').closest("fieldset");
    const expenseField = document.querySelector(".expense-field");

    document.querySelectorAll(".required-missing").forEach((field) => {
        field.classList.remove("required-missing");
    });

    if (!profileUsername.value.trim()) {
        usernameField.classList.add("required-missing");
        missingFields.push(usernameField);
    }

    if (!document.querySelector("#age").value) {
        ageField.classList.add("required-missing");
        missingFields.push(ageField);
    }

    if (!document.querySelector("#income").value) {
        incomeField.classList.add("required-missing");
        missingFields.push(incomeField);
    }

    if (!document.querySelector('input[name="gender"]:checked')) {
        genderField.classList.add("required-missing");
        missingFields.push(genderField);
    }

    if (!document.querySelector('input[name="nature"]:checked')) {
        natureField.classList.add("required-missing");
        missingFields.push(natureField);
    }

    if (!document.querySelector(".expense-choice.selected")) {
        expenseField.classList.add("required-missing");
        missingFields.push(expenseField);
    }

    return missingFields;
}

function updateSalaryControls() {
    const requiredFieldsComplete = validateRequiredFields().length === 0;
    salaryInput.disabled = !requiredFieldsComplete;
}

function getIncomeRange(income) {
    const ranges = {
        less: { label: "LOW", displayLabel: "LOW", minimum: 10000, maximum: 25000 },
        average: { label: "AVERAGE", displayLabel: "MODERATE", minimum: 25000, maximum: 83000 },
        high: { label: "HIGH", displayLabel: "HIGH", minimum: 83000, maximum: 200000 }
    };

    return ranges[income];
}

function getProfileData() {
    const nature = document.querySelector('input[name="nature"]:checked').value;
    const city = document.querySelector(".expense-choice.selected").dataset.expense === "expensive"
        ? "expensive"
        : "less expensive";

    return {
        age: document.querySelector("#age").value,
        income: document.querySelector("#income").value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        nature: nature.toUpperCase(),
        city
    };
}

async function setSalaryAndExpenses() {
    const income = document.querySelector("#income").value;
    const incomeRange = getIncomeRange(income);
    const salary = Number(salaryInput.value);

    if (validateRequiredFields().length > 0 || !incomeRange) {
        profileError.textContent = "Complete every profile choice before entering your salary.";
        profileError.hidden = false;
        return false;
    }

    if (!Number.isInteger(salary) || salary < incomeRange.minimum || salary > incomeRange.maximum) {
        profileError.textContent = `Salary must be between INR ${incomeRange.minimum.toLocaleString()} and INR ${incomeRange.maximum.toLocaleString()} for ${incomeRange.displayLabel.toLowerCase()} income.`;
        profileError.hidden = false;
        salaryInput.focus();
        return false;
    }

    try {
        const response = await fetch(surveyDataUrl);
        if (!response.ok) {
            throw new Error("Survey data could not be loaded.");
        }

        const surveyData = await response.json();
        const profileData = getProfileData();
        const matchingProfile = surveyData.profiles.find((profile) =>
            profile.gender === profileData.gender.toUpperCase() &&
            profile.income_level === incomeRange.label &&
            profile.city_level.toLowerCase() === profileData.city
        );

        if (!matchingProfile) {
            throw new Error("No matching budget was found for this profile.");
        }

        const profile = {
            ...profileData,
            salary,
            Expenses: matchingProfile.budget
        };
        profileError.textContent = "Salary and expense budget saved.";
        profileError.hidden = false;
        return profile;
    } catch (error) {
        throw new Error(`Unable to load profile data: ${error.message}`);
    }
}

async function sendUserDataToServer(userdata, profile) {
    const payload = {
        userdata,
        profile
    };

    const response = await fetch(userDataApiUrl, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    if (!response.ok) {
        throw new Error("Profile data could not be saved to the server.");
    }

    return response.json();
}

profileUsername.addEventListener("input", () => {
    clearRequiredState(profileUsername);
    updateSalaryControls();
});
document.querySelector("#age").addEventListener("change", (event) => {
    clearRequiredState(event.target);
    updateSalaryControls();
});
document.querySelector("#income").addEventListener("change", (event) => {
    clearRequiredState(event.target);
    updateSalaryControls();
});
document.querySelectorAll('input[name="gender"]').forEach((choice) => {
    choice.addEventListener("change", () => {
        clearRequiredState(choice);
        updateSalaryControls();
    });
});

natureChoices.forEach((choice) => {
    choice.addEventListener("change", () => {
        if (choice.checked) {
            natureChoices.forEach((otherChoice) => {
                if (otherChoice !== choice) {
                    otherChoice.checked = false;
                }
            });
            clearRequiredState(choice);
        }
        updateSalaryControls();
    });
});

expenseChoices.forEach((choice) => {
    choice.addEventListener("click", () => {
        expenseChoices.forEach((otherChoice) => {
            const isSelected = otherChoice === choice;
            otherChoice.classList.toggle("selected", isSelected);
            otherChoice.disabled = isSelected;
        });
        clearRequiredState(choice);
        updateSalaryControls();
    });
});

profileForm.addEventListener("reset", () => {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);

    window.setTimeout(() => {
        profileUsername.value = usernameInput.value.trim();
        profileUsername.readOnly = true;
        profileError.hidden = true;
        document.querySelectorAll(".required-missing").forEach((field) => {
            field.classList.remove("required-missing");
        });

        expenseChoices.forEach((choice) => {
            choice.disabled = false;
            choice.classList.remove("selected");
        });
        salaryInput.value = "";
        salaryInput.disabled = true;
    }, 0);
});

profileForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = profileUsername.value.trim();
    const nature = document.querySelector('input[name="nature"]:checked')?.value;
    const expense = document.querySelector(".expense-choice.selected")?.dataset.expense;
    const missingFields = validateRequiredFields();

    if (missingFields.length > 0 || !username || !nature || !expense) {
        profileError.textContent = "Complete every profile choice before creating your profile.";
        profileError.hidden = false;
        window.alert("Please complete all required profile details.");
        return;
    }

    const existingUserData = readUserData(username);
    const userdata = createUserData(username, "pending", existingUserData);

    try {
        const profile = await setSalaryAndExpenses();
        if (!profile) {
            return;
        }

        const serverResponse = await sendUserDataToServer(userdata, profile);
        if (serverResponse.status !== "success") {
            throw new Error("The server did not confirm the profile.");
        }

        saveUserData(username, "pass", userdata);
        console.log("Server response:", serverResponse);
        window.location.href = "../MAIN/main.html";
    } catch (error) {
        saveValidationState(username, "failed", userdata);
        profileBlock.hidden = true;
        login.hidden = false;
        usernameInput.value = "";
        profileMessage.textContent = `An error occurred while saving your profile: ${error.message} Please try again.`;
        createProfile.hidden = false;
    }
});

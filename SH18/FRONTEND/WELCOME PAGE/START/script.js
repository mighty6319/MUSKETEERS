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


// START BUTTON

startButton.addEventListener("click", (event) => {

    event.stopPropagation();

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

playButton.addEventListener("click", (event) => {

    event.stopPropagation();

    if (!createProfile.hidden) {
        window.alert("CREATE PROFILE");
        return;
    }

    const username = usernameInput.value.trim();
    const status = validateProfile(username);
    const storedUserData = readUserData();

    if (
        status === "pass" &&
        storedUserData?.id &&
        storedUserData.status === "pass"
    ) {
        saveUserData(username, status, storedUserData);
        window.location.href = "../MAIN/main.html";
        return;
    }

    saveValidationState(username, "fail", storedUserData);

    profileMessage.textContent = status === "fail"
        ? "Enter a username before creating your profile."
        : "Create your profile once to continue.";
    createProfile.hidden = false;
});

createProfileButton.addEventListener("click", (event) => {
    event.stopPropagation();

    const username = usernameInput.value.trim();
    const status = validateProfile(username);

    if (status === "fail") {
        profileMessage.textContent = "Enter a username before creating your profile.";
        return;
    }

    profileUsername.value = username;
    login.hidden = true;
    profileBlock.hidden = false;
});

backToLogin.addEventListener("click", (event) => {
    event.stopPropagation();
    backToLogin.classList.remove("arrow-moving");
    void backToLogin.offsetWidth;
    backToLogin.classList.add("arrow-moving");

    window.setTimeout(() => {
        localStorage.clear();
        profileBlock.hidden = true;
        login.hidden = false;
        header.hidden = true;
        side.hidden = true;
        startButton.hidden = true;
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

profileUsername.addEventListener("input", () => clearRequiredState(profileUsername));
document.querySelector("#age").addEventListener("change", (event) => clearRequiredState(event.target));
document.querySelector("#income").addEventListener("change", (event) => clearRequiredState(event.target));
document.querySelectorAll('input[name="gender"]').forEach((choice) => {
    choice.addEventListener("change", () => clearRequiredState(choice));
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
    });
});

profileForm.addEventListener("reset", () => {
    localStorage.clear();

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
    }, 0);
});

profileForm.addEventListener("submit", (event) => {
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

    const profileData = {
        age: document.querySelector("#age").value,
        income: document.querySelector("#income").value,
        gender: document.querySelector('input[name="gender"]:checked').value,
        nature,
        spendingPreference: expense
    };
    const profileStore = JSON.parse(localStorage.getItem("userProfile") || "{}");

    profileStore[username] = profileData;
    localStorage.setItem("userProfile", JSON.stringify(profileStore));

    const userData = saveUserData(username, "pass", readUserData());
    localStorage.setItem("userdata", JSON.stringify({
        ...userData,
        username,
        status: "pass"
    }));

    window.location.href = "../MAIN/main.html";
});

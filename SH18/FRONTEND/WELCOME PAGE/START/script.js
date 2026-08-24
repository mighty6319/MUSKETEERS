// ============================================================
// MUSIC
// ============================================================

const music = document.querySelector("#bgMusic");
const muteBtn = document.querySelector("#muteBtn");

music.volume = 1;

music.play().catch(() => {});


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


// ============================================================
// LOGIN ELEMENTS
// ============================================================

const login = document.querySelector("#login");
const header = document.querySelector("header");
const startButton = document.querySelector("#start");
const side = document.querySelector(".side");

const playButton = document.querySelector("#playButton");

const usernameInput =
    document.querySelector("#username");

const userIdInput =
    document.querySelector("#userId");

const loginForm =
    document.querySelector("#loginForm");

const createProfile =
    document.querySelector("#createProfile");

const createProfileButton =
    document.querySelector("#createProfileButton");

const profileMessage =
    document.querySelector("#profileMessage");


// ============================================================
// PROFILE ELEMENTS
// ============================================================

const profileBlock =
    document.querySelector("#profileBlock");

const profileForm =
    document.querySelector("#profileForm");

const profileUsername =
    document.querySelector("#profileUsername");

const editUsername =
    document.querySelector("#editUsername");

const profileError =
    document.querySelector("#profileError");

const backToLogin =
    document.querySelector("#backToLogin");

const expenseChoices =
    document.querySelectorAll(".expense-choice");

const natureChoices =
    document.querySelectorAll('input[name="nature"]');

const salaryInput =
    document.querySelector("#salary");


// ============================================================
// API URLS
// ============================================================

const surveyDataUrl =
    "http://127.0.0.1:8000/api/survey-data";

const userDataApiUrl =
    "http://127.0.0.1:8000/api/user-data";

const authDataApiUrl =
    "http://127.0.0.1:8000/api/auth-data";

const usernameCheckApiUrl =
    "http://127.0.0.1:8000/api/username-check";


// ============================================================
// START BUTTON
// ============================================================

startButton.addEventListener("click", (event) => {

    event.stopPropagation();

    startButton.hidden = true;
    header.hidden = true;
    side.hidden = true;

    login.hidden = false;

    login.classList.remove("is-closing");
    login.classList.add("is-open");
});


// ============================================================
// CLOSE LOGIN WHEN CLICKING OUTSIDE
// ============================================================

document.addEventListener("click", (event) => {

    if (
        !login.hidden &&
        !event.target.closest("#login")
    ) {

        closeLogin();
    }
});


// ============================================================
// PLAY
//
// FLOW:
//
// 1. Validate username
// 2. Check localStorage
// 3. Check username in DB
// 4. If username doesn't exist -> CREATE PROFILE
// 5. If username exists -> require ID
// 6. Check username + ID together in DB
// 7. Check status
// 8. DB confirmed -> save locally
// 9. Redirect MAIN
// ============================================================

playButton.addEventListener("click", async (event) => {

    event.stopPropagation();

    const username =
        usernameInput.value.trim();

    const validation =
        validateProfile(username);


    // --------------------------------------------------------
    // STEP 1: USERNAME VALIDATION
    // --------------------------------------------------------

    if (validation === "fail") {

        profileMessage.textContent =
            "Enter a username before continuing.";

        createProfile.hidden = false;

        return;
    }


    playButton.disabled = true;


    try {

        // ----------------------------------------------------
        // STEP 2:
        // CHECK LOCAL STORAGE ONLY FOR INFORMATION
        // DO NOT TRUST IT AS FINAL AUTHENTICATION
        // ----------------------------------------------------

        const localUser =
            readUserData(username);


        // ----------------------------------------------------
        // STEP 3:
        // CHECK DATABASE USERNAME
        // ----------------------------------------------------

        const usernameResponse =
            await fetch(
                `${usernameCheckApiUrl}?username=${encodeURIComponent(username)}`
            );


        if (!usernameResponse.ok) {

            throw new Error(
                "The database could not check this username."
            );
        }


        const usernameResult =
            await usernameResponse.json();


        // ----------------------------------------------------
        // USER DOES NOT EXIST IN DB
        // ----------------------------------------------------

        if (!usernameResult.exists) {

            userIdInput.value = "";
            userIdInput.hidden = true;

            profileMessage.textContent =
                "No account was found. Select CREATE PROFILE to make one.";

            createProfile.hidden = false;

            return;
        }


        // ----------------------------------------------------
        // USER EXISTS IN DB
        //
        // ID IS REQUIRED.
        // EVEN IF LOCAL STORAGE HAS THE USER,
        // DB MUST CONFIRM THE ID.
        // ----------------------------------------------------

        const userId =
            userIdInput.value.trim();


        if (!userId) {

            userIdInput.hidden = false;

            // If localStorage already knows the ID,
            // put it in the field for convenience.
            // This DOES NOT bypass DB verification.

            if (localUser?.id) {

                userIdInput.value =
                    localUser.id;
            }

            userIdInput.focus();

            profileMessage.textContent =
                "Account found. Verify your User ID to continue.";

            createProfile.hidden = false;

            return;
        }


        // ----------------------------------------------------
        // STEP 4:
        // FINAL DATABASE CONFIRMATION
        // ----------------------------------------------------

        const response =
            await fetch(
                `${authDataApiUrl}?username=${encodeURIComponent(username)}&id=${encodeURIComponent(userId)}`
            );


        if (!response.ok) {

            if (response.status === 404) {

                throw new Error(
                    "The username and User ID do not match."
                );
            }

            if (response.status === 403) {

                throw new Error(
                    "This account is not confirmed."
                );
            }

            throw new Error(
                "The database could not confirm this user."
            );
        }


        const confirmedData =
            await response.json();


        // ----------------------------------------------------
        // STEP 5:
        // DATABASE CONFIRMED
        //
        // IMPORTANT:
        // USE THE DATABASE'S ID + USERNAME.
        // ----------------------------------------------------

        const confirmedUser =
            confirmedData.userdata;


        // ----------------------------------------------------
        // STEP 6:
        // SAVE TO LOCAL STORAGE
        //
        // If user wasn't previously stored locally,
        // it is added now.
        //
        // If it already existed,
        // it is updated.
        // ----------------------------------------------------

        saveUserData(
            confirmedUser.username,
            "pass",
            confirmedUser
        );


        profileMessage.classList.remove(
            "profile-warning"
        );


        // ----------------------------------------------------
        // STEP 7:
        // ONLY NOW REDIRECT
        // ----------------------------------------------------

        window.location.href =
            "../MAIN/main.HTML";

    } catch (error) {

        profileMessage.textContent =
            `${error.message} Please try again.`;

        profileMessage.classList.add(
            "profile-warning"
        );

        createProfile.hidden = false;

    } finally {

        playButton.disabled = false;
    }
});


// ============================================================
// CLOSE LOGIN
// ============================================================

function closeLogin() {

    login.classList.remove("is-open");
    login.classList.add("is-closing");

    window.setTimeout(() => {

        login.hidden = true;

        login.classList.remove("is-closing");

        startButton.hidden = false;
        header.hidden = false;
        side.hidden = false;

        usernameInput.value = "";
        userIdInput.value = "";
        userIdInput.hidden = true;

        createProfile.hidden = true;

        profileMessage.textContent =
            "Complete your profile to continue.";

    }, 240);
}


// ============================================================
// CREATE PROFILE
//
// Username MUST NOT already exist in DB.
// A NEW profile gets a NEW ID.
// ============================================================

createProfileButton.addEventListener(
    "click",
    async (event) => {

        event.stopPropagation();

        const username =
            usernameInput.value.trim();

        if (
            validateProfile(username) === "fail"
        ) {

            profileMessage.textContent =
                "Enter a username before creating your profile.";

            return;
        }


        createProfileButton.disabled = true;


        try {

            // ------------------------------------------------
            // CHECK DATABASE
            // ------------------------------------------------

            const response =
                await fetch(
                    `${usernameCheckApiUrl}?username=${encodeURIComponent(username)}`
                );


            if (!response.ok) {

                throw new Error(
                    "The database could not check this username."
                );
            }


            const result =
                await response.json();


            // ------------------------------------------------
            // USERNAME ALREADY EXISTS
            // ------------------------------------------------

            if (result.exists) {

                profileMessage.textContent =
                    "This username already exists. Use PLAY and verify the User ID instead.";

                profileMessage.classList.add(
                    "profile-warning"
                );

                userIdInput.hidden = false;

                return;
            }


            // ------------------------------------------------
            // NEW USERNAME
            // ------------------------------------------------

            profileUsername.value =
                username;

            profileUsername.readOnly = true;


            profileMessage.classList.remove(
                "profile-warning"
            );

            login.hidden = true;

            profileBlock.hidden = false;

            profileBlock.classList.remove(
                "is-closing"
            );

            profileBlock.classList.add(
                "is-open"
            );

        } catch (error) {

            profileMessage.textContent =
                `${error.message} Please try again.`;

            profileMessage.classList.add(
                "profile-warning"
            );

        } finally {

            createProfileButton.disabled = false;
        }
    }
);


// ============================================================
// BACK TO LOGIN
// ============================================================

backToLogin.addEventListener(
    "click",
    (event) => {

        event.stopPropagation();

        backToLogin.classList.remove(
            "arrow-moving"
        );

        void backToLogin.offsetWidth;

        backToLogin.classList.add(
            "arrow-moving"
        );

        profileBlock.classList.remove(
            "is-open"
        );

        profileBlock.classList.add(
            "is-closing"
        );


        window.setTimeout(() => {

            profileBlock.hidden = true;

            profileBlock.classList.remove(
                "is-closing"
            );

            login.hidden = false;

            login.classList.add(
                "is-open"
            );

            header.hidden = true;
            side.hidden = true;
            startButton.hidden = true;

            userIdInput.value = "";
            userIdInput.hidden = true;

        }, 180);
    }
);


// ============================================================
// EDIT USERNAME
// ============================================================

editUsername.addEventListener(
    "click",
    () => {

        profileUsername.readOnly = false;

        profileUsername.focus();

        profileUsername.select();
    }
);


profileUsername.addEventListener(
    "blur",
    () => {

        profileUsername.value =
            profileUsername.value.trim();
    }
);


// ============================================================
// REQUIRED FIELD STATE
// ============================================================

function clearRequiredState(element) {

    const target =
        element.closest(".profile-field");

    if (target) {

        target.classList.remove(
            "required-missing"
        );
    }
}


// ============================================================
// VALIDATE PROFILE
// ============================================================

function validateRequiredFields() {

    const missingFields = [];


    const usernameField =
        profileUsername.closest(".profile-field");

    const ageField =
        document
            .querySelector("#age")
            .closest(".profile-field");

    const incomeField =
        document
            .querySelector("#income")
            .closest(".profile-field");

    const genderField =
        document
            .querySelector('input[name="gender"]')
            .closest("fieldset");

    const natureField =
        document
            .querySelector('input[name="nature"]')
            .closest("fieldset");

    const expenseField =
        document
            .querySelector(".expense-field");


    document
        .querySelectorAll(".required-missing")
        .forEach(field => {

            field.classList.remove(
                "required-missing"
            );
        });


    if (!profileUsername.value.trim()) {

        usernameField.classList.add(
            "required-missing"
        );

        missingFields.push(usernameField);
    }


    if (!document.querySelector("#age").value) {

        ageField.classList.add(
            "required-missing"
        );

        missingFields.push(ageField);
    }


    if (!document.querySelector("#income").value) {

        incomeField.classList.add(
            "required-missing"
        );

        missingFields.push(incomeField);
    }


    if (
        !document.querySelector(
            'input[name="gender"]:checked'
        )
    ) {

        genderField.classList.add(
            "required-missing"
        );

        missingFields.push(genderField);
    }


    if (
        !document.querySelector(
            'input[name="nature"]:checked'
        )
    ) {

        natureField.classList.add(
            "required-missing"
        );

        missingFields.push(natureField);
    }


    if (
        !document.querySelector(
            ".expense-choice.selected"
        )
    ) {

        expenseField.classList.add(
            "required-missing"
        );

        missingFields.push(expenseField);
    }


    return missingFields;
}


// ============================================================
// SALARY CONTROL
// ============================================================

function updateSalaryControls() {

    const complete =
        validateRequiredFields().length === 0;

    salaryInput.disabled =
        !complete;
}


// ============================================================
// INCOME RANGE
// ============================================================

function getIncomeRange(incomeType) {

    const ranges = {

        less: {
            label: "LOW",
            displayLabel: "LOW",
            minimum: 10000,
            maximum: 25000
        },

        average: {
            label: "AVERAGE",
            displayLabel: "MODERATE",
            minimum: 25000,
            maximum: 83000
        },

        high: {
            label: "HIGH",
            displayLabel: "HIGH",
            minimum: 83000,
            maximum: 200000
        }
    };


    return ranges[incomeType];
}


// ============================================================
// GET PROFILE DATA
// ============================================================

function getProfileData() {

    const nature =
        document
            .querySelector(
                'input[name="nature"]:checked'
            )
            .value;


    const city =
        document
            .querySelector(
                ".expense-choice.selected"
            )
            .dataset.expense;


    return {

        age: Number(
            document.querySelector("#age").value
        ),

        income_type:
            document.querySelector("#income").value,

        gender:
            document
                .querySelector(
                    'input[name="gender"]:checked'
                )
                .value,

        nature:
            nature.toUpperCase(),

        city:
            city === "expensive"
                ? "expensive"
                : "less expensive"
    };
}


// ============================================================
// SALARY + EXPENSES
// ============================================================

async function setSalaryAndExpenses() {

    const incomeType =
        document.querySelector("#income").value;

    const incomeRange =
        getIncomeRange(incomeType);

    const salary =
        Number(salaryInput.value);


    if (
        validateRequiredFields().length > 0 ||
        !incomeRange
    ) {

        profileError.textContent =
            "Complete every profile choice before entering your salary.";

        profileError.hidden = false;

        return false;
    }


    if (
        !Number.isInteger(salary) ||
        salary < incomeRange.minimum ||
        salary > incomeRange.maximum
    ) {

        profileError.textContent =
            `Salary must be between INR ${incomeRange.minimum.toLocaleString()} and INR ${incomeRange.maximum.toLocaleString()} for ${incomeRange.displayLabel.toLowerCase()} income.`;

        profileError.hidden = false;

        salaryInput.focus();

        return false;
    }


    try {

        const response =
            await fetch(surveyDataUrl);


        if (!response.ok) {

            throw new Error(
                "Survey data could not be loaded."
            );
        }


        const surveyData =
            await response.json();

        const profileData =
            getProfileData();


        const matchingProfile =
            surveyData.profiles.find(
                profile =>

                    profile.gender ===
                        profileData.gender.toUpperCase()

                    &&

                    profile.income_level ===
                        incomeRange.label

                    &&

                    profile.city_level.toLowerCase() ===
                        profileData.city
            );


        if (!matchingProfile) {

            throw new Error(
                "No matching budget was found for this profile."
            );
        }


        const profile = {

            ...profileData,

            salary,

            expenses:
                matchingProfile.budget
        };


        profileError.textContent =
            "Salary and expense budget saved.";

        profileError.hidden = false;


        return profile;

    } catch (error) {

        throw new Error(
            `Unable to load profile data: ${error.message}`
        );
    }
}


// ============================================================
// SEND PROFILE TO SERVER
// ============================================================

async function sendUserDataToServer(
    userdata,
    profile
) {

    const payload = {

        userdata,

        profile
    };


    const response =
        await fetch(
            userDataApiUrl,
            {
                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body:
                    JSON.stringify(payload)
            }
        );


    if (!response.ok) {

        let message =
            "Profile data could not be saved to the server.";

        try {

            const errorData =
                await response.json();

            if (errorData.detail) {

                message =
                    errorData.detail;
            }

        } catch {
            // Keep default message.
        }

        throw new Error(message);
    }


    return response.json();
}


// ============================================================
// PROFILE INPUT LISTENERS
// ============================================================

profileUsername.addEventListener(
    "input",
    () => {

        clearRequiredState(profileUsername);

        updateSalaryControls();
    }
);


document
    .querySelector("#age")
    .addEventListener(
        "change",
        event => {

            clearRequiredState(
                event.target
            );

            updateSalaryControls();
        }
    );


document
    .querySelector("#income")
    .addEventListener(
        "change",
        event => {

            clearRequiredState(
                event.target
            );

            updateSalaryControls();
        }
    );


document
    .querySelectorAll(
        'input[name="gender"]'
    )
    .forEach(choice => {

        choice.addEventListener(
            "change",
            () => {

                clearRequiredState(choice);

                updateSalaryControls();
            }
        );
    });


// ============================================================
// NATURE
// ============================================================

natureChoices.forEach(choice => {

    choice.addEventListener(
        "change",
        () => {

            if (choice.checked) {

                natureChoices.forEach(
                    otherChoice => {

                        if (
                            otherChoice !== choice
                        ) {

                            otherChoice.checked =
                                false;
                        }
                    }
                );

                clearRequiredState(choice);
            }

            updateSalaryControls();
        }
    );
});


// ============================================================
// CITY / SPENDING PREFERENCE
// ============================================================

expenseChoices.forEach(choice => {

    choice.addEventListener(
        "click",
        () => {

            expenseChoices.forEach(
                otherChoice => {

                    const isSelected =
                        otherChoice === choice;

                    otherChoice.classList.toggle(
                        "selected",
                        isSelected
                    );

                    otherChoice.disabled =
                        isSelected;
                }
            );

            clearRequiredState(choice);

            updateSalaryControls();
        }
    );
});


// ============================================================
// RESET PROFILE FORM
// ============================================================

profileForm.addEventListener(
    "reset",
    () => {

        window.setTimeout(() => {

            profileUsername.value =
                usernameInput.value.trim();

            profileUsername.readOnly =
                true;

            profileError.hidden =
                true;


            document
                .querySelectorAll(
                    ".required-missing"
                )
                .forEach(field => {

                    field.classList.remove(
                        "required-missing"
                    );
                });


            expenseChoices.forEach(choice => {

                choice.disabled = false;

                choice.classList.remove(
                    "selected"
                );
            });


            salaryInput.value = "";

            salaryInput.disabled = true;

        }, 0);
    }
);


// ============================================================
// CREATE PROFILE SUBMIT
// ============================================================

profileForm.addEventListener(
    "submit",
    async event => {

        event.preventDefault();


        const username =
            profileUsername.value.trim();

        const nature =
            document
                .querySelector(
                    'input[name="nature"]:checked'
                )?.value;

        const expense =
            document
                .querySelector(
                    ".expense-choice.selected"
                )?.dataset.expense;


        const missingFields =
            validateRequiredFields();


        if (
            missingFields.length > 0 ||
            !username ||
            !nature ||
            !expense
        ) {

            profileError.textContent =
                "Complete every profile choice before creating your profile.";

            profileError.hidden = false;

            window.alert(
                "Please complete all required profile details."
            );

            return;
        }


        // ----------------------------------------------------
        // IMPORTANT:
        // NEW PROFILE = NEW ID
        //
        // Username was already checked against DB
        // before opening this form.
        // ----------------------------------------------------

        const userdata =
            createUserData(
                username,
                "pending"
            );


        try {

            const profile =
                await setSalaryAndExpenses();


            if (!profile) {

                return;
            }


            const serverResponse =
                await sendUserDataToServer(
                    userdata,
                    profile
                );


            if (
                serverResponse.status !==
                "success"
            ) {

                throw new Error(
                    "The server did not confirm the profile."
                );
            }


            // ------------------------------------------------
            // ONLY SAVE LOCAL USER AFTER DB SUCCESS
            // ------------------------------------------------

            saveUserData(
                serverResponse.userdata.username,
                serverResponse.userdata.status,
                serverResponse.userdata
            );


            console.log(
                "Server response:",
                serverResponse
            );


            // ------------------------------------------------
            // DATABASE CONFIRMED -> MAIN
            // ------------------------------------------------

            window.location.href =
                "../MAIN/main.HTML";


        } catch (error) {

            alert(
                `An error occurred while saving your profile: ${error.message} Please try again.`
            );
        }
    }
);
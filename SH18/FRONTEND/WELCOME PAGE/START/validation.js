// ============================================================
// LOCAL USER STORAGE
// ============================================================

const USERS_STORAGE_KEY = "users";
const ACTIVE_USER_STORAGE_KEY = "activeUserId";


// ============================================================
// USER ID
// ============================================================

const USER_ID_CHARACTERS =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^$*";


function generateUserId() {

    return Array.from(
        { length: 7 },
        () =>
            USER_ID_CHARACTERS[
                Math.floor(
                    Math.random() * USER_ID_CHARACTERS.length
                )
            ]
    ).join("");
}


// ============================================================
// BASIC USERNAME VALIDATION
// ============================================================

function validateProfile(username) {

    return username.trim() === ""
        ? "fail"
        : "pass";
}


// ============================================================
// READ USERS
// ============================================================

function readUsers() {

    const storedUsers =
        localStorage.getItem(USERS_STORAGE_KEY);

    if (!storedUsers) {

        return [];
    }

    try {

        const users = JSON.parse(storedUsers);

        if (!Array.isArray(users)) {

            return [];
        }

        return users;

    } catch {

        return [];
    }
}


// ============================================================
// FIND USER
// ============================================================

function readUserData(username = null) {

    const users = readUsers();

    const activeUserId =
        localStorage.getItem(ACTIVE_USER_STORAGE_KEY);

    if (username !== null) {

        return (
            users.find(
                user =>
                    typeof user.username === "string" &&
                    user.username.toLowerCase() ===
                        username.trim().toLowerCase()
            ) || null
        );
    }

    return (
        users.find(
            user => user.id === activeUserId
        ) || null
    );
}


// ============================================================
// CREATE USER DATA
// ============================================================

function createUserData(
    username,
    status = "pending",
    existingUserData = null
) {

    return {

        username: username.trim(),

        // IMPORTANT:
        // Existing ID is NEVER regenerated.
        id:
            existingUserData?.id ||
            generateUserId(),

        status
    };
}


// ============================================================
// SAVE USER
// ============================================================

function saveUserData(
    username,
    status,
    existingUserData = null
) {

    const users = readUsers();

    const userData = createUserData(
        username,
        status,
        existingUserData
    );

    const existingIndex =
        users.findIndex(
            user => user.id === userData.id
        );

    if (existingIndex >= 0) {

        users[existingIndex] = {
            ...users[existingIndex],
            ...userData
        };

    } else {

        users.push(userData);
    }

    localStorage.setItem(
        USERS_STORAGE_KEY,
        JSON.stringify(users)
    );

    localStorage.setItem(
        ACTIVE_USER_STORAGE_KEY,
        userData.id
    );

    return userData;
}
const USER_ID_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^$*";
const USERS_STORAGE_KEY = "users";
const ACTIVE_USER_STORAGE_KEY = "activeUserId";

function validateProfile(username) {
    return username.trim() === "" ? "fail" : "pass";
}

function generateUserId() {
    return Array.from({ length: 7 }, () =>
        USER_ID_CHARACTERS[Math.floor(Math.random() * USER_ID_CHARACTERS.length)]
    ).join("");
}

function readUsers() {
    const storedUsers = localStorage.getItem(USERS_STORAGE_KEY);

    if (storedUsers) {
        try {
            const users = JSON.parse(storedUsers);
            if (Array.isArray(users)) {
                return users.map(({ username, id, status }) => ({ username, id, status }));
            }
        } catch {
            return [];
        }
    }

    const legacyUser = localStorage.getItem("userdata");
    if (!legacyUser) {
        return [];
    }

    try {
        const user = JSON.parse(legacyUser);
        if (user?.id && user?.username) {
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([user]));
            return [user];
        }
    } catch {
        return [];
    }

    return [];
}

function readUserData(username = null) {
    const users = readUsers();
    const activeUserId = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);

    return users.find((user) => username
        ? user.username.toLowerCase() === username.toLowerCase()
        : user.id === activeUserId) || null;
}

function createUserData(username, status = "pending", existingUserData = null) {
    const userData = {
        username,
        id: existingUserData?.id || generateUserId(),
        status
    };

    return userData;
}

function saveUserData(username, status, existingUserData = null, profile = null) {
    const users = readUsers();
    const userData = {
        ...createUserData(username, status, existingUserData)
    };
    const existingIndex = users.findIndex((user) => user.id === userData.id);

    if (existingIndex >= 0) {
        users[existingIndex] = {
            ...users[existingIndex],
            ...userData
        };
    } else {
        users.push(userData);
    }

    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, userData.id);
    return userData;
}

function saveValidationState(username, status, existingUserData = null) {
    return saveUserData(username, status, existingUserData);
}

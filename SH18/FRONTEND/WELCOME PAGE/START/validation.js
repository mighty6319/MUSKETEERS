const USER_ID_CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz^$*";

function validateProfile(username) {
    return username.trim() === "" ? "fail" : "pass";
}

function generateUserId() {
    return Array.from({ length: 7 }, () =>
        USER_ID_CHARACTERS[Math.floor(Math.random() * USER_ID_CHARACTERS.length)]
    ).join("");
}

function readUserData() {
    const storedUserData = localStorage.getItem("userdata");

    if (!storedUserData) {
        return null;
    }

    try {
        return JSON.parse(storedUserData);
    } catch {
        return null;
    }
}

function saveUserData(username, status, existingUserData = null) {
    const userData = {
        username,
        id: existingUserData?.id || generateUserId(),
        status
    };

    localStorage.setItem("userdata", JSON.stringify(userData));
    return userData;
}

function saveValidationState(username, status, existingUserData = null) {
    const userData = {
        username,
        status
    };

    if (existingUserData?.id) {
        userData.id = existingUserData.id;
    }

    localStorage.setItem("userdata", JSON.stringify(userData));
    return userData;
}

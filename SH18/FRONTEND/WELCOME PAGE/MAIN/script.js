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
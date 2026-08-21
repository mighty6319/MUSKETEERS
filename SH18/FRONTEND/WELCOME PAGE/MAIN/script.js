const usersStorageKey = "users";
const activeUserStorageKey = "activeUserId";
const storedUsers = localStorage.getItem(usersStorageKey);

try {
	const users = JSON.parse(storedUsers || "[]");
	const activeUserId = localStorage.getItem(activeUserStorageKey);
	const userData = users.find((user) => user.id === activeUserId);

	if (!userData?.id || userData.status !== "pass") {
		window.location.href = "../START/start.HTML";
	}
} catch {
	window.location.href = "../START/start.HTML";
}

const logoutButton = document.querySelector('button[type="logout"]');
const menuItems = document.querySelectorAll(".menu-item[data-panel]");
const dashboardPanels = document.querySelectorAll(".dashboard-block");

menuItems.forEach((menuItem) => {

	menuItem.addEventListener("click", () => {
		const selectedPanel = document.querySelector(`#${menuItem.dataset.panel}`);

		menuItems.forEach((item) => item.classList.toggle("active", item === menuItem));
		dashboardPanels.forEach((panel) => panel.classList.toggle("is-selected", panel === selectedPanel));
	});
});

logoutButton.addEventListener("click", () => {
	localStorage.removeItem(activeUserStorageKey);
	window.location.href = "../START/start.HTML";
});
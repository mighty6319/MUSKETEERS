const storedUserData = localStorage.getItem("userdata");

try {
	const userData = JSON.parse(storedUserData || "null");

	if (!userData?.id || userData.status !== "pass") {
		window.location.href = "../START/start.HTML";
	}
} catch {
	window.location.href = "../START/start.HTML";
}

const logoutButton = document.querySelector('button[type="logout"]');

logoutButton.addEventListener("click", () => {
	localStorage.clear();
	window.location.href = "../START/start.HTML";
});
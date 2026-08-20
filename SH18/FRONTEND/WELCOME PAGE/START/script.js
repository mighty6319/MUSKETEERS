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

    }

});


// ================= PLAY =================

playButton.addEventListener("click", (event) => {

    event.stopPropagation();

    const username = usernameInput.value.trim();

    if (username === "") {
        alert("Please enter your username.");
        return;
    }

    console.log("Username entered:", username);

    localStorage.setItem("username", username);

    console.log(
        "Username stored:",
        localStorage.getItem("username")
    );
    console.log("JS FILE LOADED");

    window.location.href = "../MAIN/main.html";
});

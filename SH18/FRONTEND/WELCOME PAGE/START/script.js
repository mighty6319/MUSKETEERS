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
const logintab=document.querySelector("#login");
const headertab=document.querySelector("header");
const startbtn=document.querySelector(`button[type="start"]`);
startbtn.addEventListener("click",(event)=>{
    event.stopPropagation();
    startbtn.hidden=true;
    headertab.hidden=true;
    logintab.hidden=false;
})

document.addEventListener("click", (event) => {

    // Login is currently visible
    if (!logintab.hidden) {

        // Click was outside login
        if (!event.target.closest("#login")) {

            logintab.hidden = true;
            startbtn.hidden = false;
            headertab.hidden = false;
        }
    }

});
const USERNAME = "scoopy";
const PASSWORD = "devpy";

function login() {

    const user = document.getElementById("dev-username").value;
    const pass = document.getElementById("dev-password").value;
    const error = document.getElementById("login-error");

    if(user === USERNAME && pass === PASSWORD) {

        localStorage.setItem("devLoggedIn", "true");

        document.getElementById("site-lock").style.display = "none";
        document.getElementById("site-content").style.display = "block";

    } else {
        error.textContent = "Incorrect login";
    }
}

function checkLogin() {

    if(localStorage.getItem("devLoggedIn") === "true") {

        document.getElementById("site-lock").style.display = "none";
        document.getElementById("site-content").style.display = "block";

    }
}

checkLogin();
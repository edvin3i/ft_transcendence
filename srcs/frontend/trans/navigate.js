function openLogInPage()
{
	renderPage(logInPage());

	const logInWith42Button = document.getElementById("logInWith42Button");
	logInWith42Button.addEventListener("click", logInWith42);

	const logInForm = document.getElementById("logInForm");
	logInForm.addEventListener("submit", handleLogIn);

	const createAccountButton = document.getElementById("createAccountButton");
	createAccountButton.addEventListener("click", openAccountCreationPage);
}

function openAccountCreationPage() {
	renderPage(accountCreationPage());

	const signUpWith42Button = document.getElementById("signUpWith42Button");
	signUpWith42Button.addEventListener("click", signUpWith42);

	const accountCreationForm = document.getElementById("accountCreationForm");
	accountCreationForm.addEventListener("submit", handleAccountCreation);

	const logInButton = document.getElementById("logInButton");
	logInButton.addEventListener("click", openLogInPage);
}

function openUserProfilePage() {
	renderPage(userProfilePage());

	updateUIWithUser(); // 👈 Ajout ici pour forcer l'affichage correct du bandeau

	const logOutButton = document.getElementById("logOutButton");
	logOutButton.addEventListener("click", handleLogout);

	const startGameButton = document.getElementById("startGameButton");
	startGameButton.addEventListener("click", startGame);
}


function startGame() {
	renderPage(gamePage());

	const endGameButton = document.getElementById("endGameButton");
	endGameButton.addEventListener("click", endGame);

	playGame();
}

function endGame() {
	openUserProfilePage();
}

// ✅ Appelle updateUI au chargement
window.onload = () => {
	updateUIWithUser();

	const token = localStorage.getItem("access_token");
	if (token) {
		openUserProfilePage(); // 👈 s'il est connecté, va direct au profil
	} else {
		openLogInPage(); // sinon, login classique
	}
};



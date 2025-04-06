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

function openAccountCreationPage()
{
	renderPage(accountCreationPage());
	
	const signUpWith42Button = document.getElementById("signUpWith42Button");
	signUpWith42Button.addEventListener("click", signUpWith42);

	const accountCreationForm = document.getElementById("accountCreationForm");
	accountCreationForm.addEventListener("submit", handleAccountCreation);

	const logInButton = document.getElementById("logInButton");
	logInButton.addEventListener("click", openLogInPage);
}

function openUserProfilePage()
{
	renderPage(userProfilePage());

	const logOutButton = document.getElementById("logOutButton");
	logOutButton.addEventListener("click", logOut);

	const startGameButton = document.getElementById("startGameButton");
	startGameButton.addEventListener("click", startGame);
}

function logOut()
{
	openLogInPage();
}

function startGame()
{
	renderPage(gamePage());
	
	const endGameButton = document.getElementById("endGameButton");
	endGameButton.addEventListener("click", endGame);

	playGame();
}

function endGame()
{
	openUserProfilePage();
}

window.onload = openLogInPage();

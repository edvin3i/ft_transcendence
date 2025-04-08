// function logInPage()
// {
// 	return `
// 		<p>Please, log in to play the game.</p>
// 		<button id="logInWith42Button">Log in with 42</button>
// 		<p>---or---</p>
// 		<form id="logInForm" method="POST">
// 			<div>
// 				<label for="username">Enter your username:</label>
// 				<input  type="username"
// 						id="username"
// 						placeholder="username"
// 						minlength="3"
// 						maxlength="20"
// 						pattern="[a-zA-Z0-9_]+"
// 						title="Username can only contain letters, numbers, and underscores, and must be 3-20 characters long."
// 						required/>
// 			</div>
// 			<div>
// 				<label for="password">Enter your password:</label>
// 				<input type="password"
// 						id="password"
// 						placeholder="********"
// 						required/>
// 			</div>
// 			<button type="submit">Log in</button>
// 		</form>
// 		<p id="logInResult"></p>
// 		<div>
// 			<p style="display: inline;">Don't have an account?</p>
// 			<button style="display: inline;" id="createAccountButton">Create account</button>
// 		</div>`;
// }

function logInPage()
{
	return `
		<p class="text-center">Please, log in to play the game.</p>
		<div class="text-center">
			<button id="logInWith42Button" class="btn btn-dark mb-3">Log in with 42</button>
		</div>
		<p class="text-center">---or---</p>
		<form id="logInForm" method="POST" class="container">
			<div class="mb-3">
				<label for="username" class="form-label">Enter your username:</label>
				<input  type="username"
						id="username"
						class="form-control"
						placeholder="username"
						minlength="3"
						maxlength="20"
						pattern="[a-zA-Z0-9_]+"
						title="Username can only contain letters, numbers, and underscores, and must be 3-20 characters long."
						required/>
			</div>
			<div class="mb-3">
				<label for="password" class="form-label">Enter your password:</label>
				<input type="password"
						id="password"
						class="form-control"
						placeholder="********"
						required/>
			</div>
			<button type="submit" class="btn btn-primary w-100">Log in</button>
		</form>
		<p id="logInResult" class="text-danger mt-3 text-center"></p>
		<div class="text-center mt-3">
			<p style="display: inline;">Don't have an account?</p>
			<button style="display: inline;" id="createAccountButton" class="btn btn-link">Create account</button>
		</div>`;
}

function accountCreationPage()
{
	return `
		<div id="accountCreationHeader">
			<p class="text-center">Please, create your account to play the game.</p>
			<button id="signUpWith42Button">Sign up with 42</button>
			<p>---or---</p>
		</div>
		<form id="accountCreationForm" method="POST">
			<div>
				<label for="username">Enter your username:</label>
				<input  type="username"
						id="username"
						placeholder="username"
						minlength="3"
						maxlength="20"
						pattern="[a-zA-Z0-9_]+"
						title="Username can only contain letters, numbers, and underscores, and must be 3-20 characters long."
						required/>
			</div>
			<div>
				<label for="email">Enter your email:</label>
				<input type="email"
						id="email"
						placeholder="username@email.com"
						pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
						title="user@email.com"
						required/>
			</div>
			<div>
				<label for="password">Enter your password:</label>
				<input  type="password"
						id="password"
						placeholder="********"
						minlength="8"
						pattern="^(?!\d+$).*$"
						required/>
			</div>
			<button type="submit">Create account</button>
		</form>
		<p id="accountCreationResult"></p>
		<div>
			<p style="display: inline;">Already have an account?</p>
			<button style="display: inline;" id="logInButton">Log in</button>
		</div>`;
}
			
function userProfilePage()
{
	return `
		<p>You have just successfully logged in to your account!</p>
		<p id="userProfileInformation"></p>
		<button id="startGameButton">Play Pong</button>
		<button id="logOutButton">Log out</button>`;
}

function gamePage()
{
	return `
		<h1>Pong Game 1v1</h1>
		<canvas id="pongCanvas" width="600" height="400"></canvas>
		<p>Use W and S for Player 1 (left) and Arrow keys for Player 2 (right)</p>
		<button id="endGameButton">End game</button>`;
}

function renderPage(page)
{
	document.getElementById("app").innerHTML = page;
}

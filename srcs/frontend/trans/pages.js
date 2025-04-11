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
		<div class="text-center" id="accountCreationHeader">
			<p class="text-center">Please, create your account to play the game.</p>
			<button id="signUpWith42Button">Sign up with 42</button>
			<p>---or---</p>
		</div>
		<form class="text-center" id="accountCreationForm" method="POST">
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
		<div class="text-center">
			<p style="display: inline;">Already have an account?</p>
			<button style="display: inline;" id="logInButton">Log in</button>
		</div>`;
}
			
function userProfilePage()
{
	return `
		<div class="text-center">
			<p>You have just successfully logged in to your account!</p>
			<p id="userProfileInformation"></p>
			<button id="startGameButton">Play Pong</button>
			<button id="logOutButton">Log out</button>
		</div>`;
}

function gamePage()
{
	return `
		<div class="text-center">
			<h1 class="text-center">Pong Game 1v1</h1>
			<canvas id="pongCanvas" width="600" height="400"></canvas>
			<p>Use W and S for Player 1 (left) and Arrow keys for Player 2 (right)</p>
			
			<div class="d-flex justify-content-between align-items-center px-4" style="min-height: 100px;">
				<!-- Chat Button à gauche -->
				<button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#chatBox" aria-expanded="false" aria-controls="chatBox">Chat 💬</button>
			
				<!-- Bouton centré -->
				<div class="d-flex justify-content-center flex-grow-1">
					<button class="btn btn-danger" id="endGameButton">End game</button>
				</div>
			</div>

			<div class="collapse" id="chatBox">
				<div class="card bg-dark text-light shadow">
					<div class="card-header">
						Chat Room
					</div>
					<div class="card-body" style="max-height: 300px; overflow-y: auto;" id="chatMessages">
						<!-- Messages appear here -->
					</div>
					<div class="card-footer p-2">
						<div class="input-group">
							<input type="text" class="form-control" placeholder="Type a message..." id="chatInput">
							<button class="btn btn-success" id="sendMessageButton">Send</button>
						</div>
					</div>
				</div>
			</div>

		</div>`;
}

function renderPage(page)
{
	document.getElementById("app").innerHTML = page;
}

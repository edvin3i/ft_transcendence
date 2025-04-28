import {startOAuth42, openLogInPage} from './logIn.js'

function accountCreationPage()
{
	return `
		<div class="text-center" id="accountCreationHeader">
			<button id="oauth42Button">42</button>
			<p>---or---</p>
		</div>
		<form class="text-center" id="accountCreationForm" method="POST">
			<div>
				<label for="username">username:</label>
				<input  type="text"
						id="username"
						placeholder="username"
						minlength="3"
						maxlength="20"
						pattern="[a-zA-Z0-9_]+"
						title="Username can only contain letters, numbers, and underscores, and must be 3-20 characters long."
						required/>
			</div>
			<div>
				<label for="email">email:</label>
				<input type="email"
						id="email"
						placeholder="username@email.com"
						pattern="^[a-zA-Z0-9._%+\\-]+@([a-zA-Z0-9\\-]+\\.)+[a-zA-Z]{2,}$"
						title="user@email.com"
						required/>
			</div>
			<div>
				<label for="password">password:</label>
				<input  type="password"
						id="password"
						placeholder="********"
						minlength="8"
						pattern="^(?!\d+$).*$"
						required/>
			</div>
			<button type="submit">Create account</button>
		</form>
		<p id="accountCreationResult" class="mt-3 text-center"></p>
		<div class="text-center">
			<p style="display: inline;">Already have an account?</p>
			<button style="display: inline;" id="logInButton">Log in</button>
		</div>
	`;
}
			
export function openAccountCreationPage(page, push)
{
	document.getElementById('app').innerHTML = accountCreationPage();

	const oauth42Button = document.getElementById('oauth42Button');
	oauth42Button.addEventListener('click', startOAuth42);

	const accountCreationForm = document.getElementById('accountCreationForm');
	accountCreationForm.addEventListener('submit', handleAccountCreation);

	const logInButton = document.getElementById('logInButton');
	logInButton.addEventListener('click', () => openLogInPage(page, push));
}

async function handleAccountCreation()
{
	event.preventDefault();

	const username = document.getElementById('username').value;
	const email = document.getElementById('email').value;
	const password = document.getElementById('password').value;

	const response = await fetch('https://localhost/api/users/create/', 
	{
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({user: 
		{
			username: username,
			email: email,
			password: password
		}})
	});

	const data = await response.json();

	if (response.ok)
	{
		document.getElementById('accountCreationHeader').hidden = true;
		document.getElementById('accountCreationForm').hidden = true;
		document.getElementById('accountCreationResult').innerHTML = 
			"Your account has been successfully created";
	}
	else if (data.user.username && data.user.email)
	{
		document.getElementById('password').value = '';
		document.getElementById('username').blur();
		document.getElementById('email').blur();
		document.getElementById('password').blur();
		document.getElementById('accountCreationResult').innerHTML = 
			`The usename '${username}' and email '${email}' are already in use`;
	}
	else if (data.user.username)
	{
		document.getElementById('password').value = '';
		document.getElementById('username').focus();
		document.getElementById('accountCreationResult').innerHTML = 
			`The usename '${username}' is already in use`;
	}
	else if (data.user.email)
	{
		document.getElementById('password').value = '';
		document.getElementById('email').focus();
		document.getElementById('accountCreationResult').innerHTML = 
			`The email '${email}' is already in use`;
	}
	else
	{
		document.getElementById('password').value = '';
		document.getElementById('username').blur();
		document.getElementById('email').blur();
		document.getElementById('password').blur();
		document.getElementById('accountCreationResult').innerHTML = 
			"An error occurred while creating your account";
	}
}

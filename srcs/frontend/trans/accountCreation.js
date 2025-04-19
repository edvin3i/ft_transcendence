import {openLogInPage} from './logIn.js'

function accountCreationPage()
{
	return `
		<div class="text-center" id="accountCreationHeader">
			<button id="signUpWith42Button">Sign up with 42</button>
			<p>---or---</p>
		</div>
		<form class="text-center" id="accountCreationForm" method="POST">
			<div>
				<label for="username">username:</label>
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
				<label for="email">email:</label>
				<input type="email"
						id="email"
						placeholder="username@email.com"
						pattern="[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}"
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
		<p id="accountCreationResult"></p>
		<div class="text-center">
			<p style="display: inline;">Already have an account?</p>
			<button style="display: inline;" id="logInButton">Log in</button>
		</div>
	`;
}
			
export function openAccountCreationPage(push)
{
	document.getElementById('app').innerHTML = accountCreationPage();

	const signUpWith42Button = document.getElementById('signUpWith42Button');
	signUpWith42Button.addEventListener('click', signUpWith42);

	const accountCreationForm = document.getElementById('accountCreationForm');
	accountCreationForm.addEventListener('submit', handleAccountCreation);

	const logInButton = document.getElementById('logInButton');
	logInButton.addEventListener('click', () => openLogInPage(push));
}

async function signUpWith42()
{
	// add 42auth
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
			`Account(s) with usename '${username}' and email '${email}' 
			already exist(s)`;
	}
	else if (data.user.username)
	{
		document.getElementById('password').value = '';
		document.getElementById('username').focus();
		document.getElementById('accountCreationResult').innerHTML = 
			`Account with username '${username}' already exists`;
	}
	else if (data.user.email)
	{
		document.getElementById('password').value = '';
		document.getElementById('email').focus();
		document.getElementById('accountCreationResult').innerHTML = 
			`Account with email '${email}' already exists`;
	}
	else
	{
		document.getElementById('password').value = '';
		document.getElementById('username').blur();
		document.getElementById('email').blur();
		document.getElementById('password').blur();
		document.getElementById('accountCreationResult').innerHTML = 
			"An error occurred while creating the account";
	}
}

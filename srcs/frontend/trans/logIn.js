import {openAccountCreationPage} from './accountCreation.js'
import {setUserInformation} from './userInformation.js'
import {showNavigationHeader, openPage} from './navigation.js'
import {closeChat, showChat} from './chat.js'

function authenticationHeader()
{
	return `
		<h1>transCendenZ</h1>
		<p>Please log in or create an account</p>
	`;
}

function logInPage()
{
	return `
		<div class="text-center">
			<button id="oauth42Button" class="btn btn-dark mb-3">42</button>
		</div>
		<p class="text-center">---or---</p>
		<form id="logInForm" method="POST" class="container">
			<div class="mb-3">
				<label for="username" class="form-label">username:</label>
				<input  type="text"
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
				<label for="password" class="form-label">password:</label>
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
		</div>
	`;
}

export function openLogInPage(page, push)
{
	document.getElementById('header').innerHTML = authenticationHeader();
	document.getElementById('app').innerHTML = logInPage();
	document.getElementById('chat').innerHTML = '';

	const oauth42Button = document.getElementById('oauth42Button');
	oauth42Button.addEventListener('click', startOAuth42);

	const logInForm = document.getElementById('logInForm');
	logInForm.addEventListener('submit', () => handleLogIn(page, push));

	const createAccountButton = document.getElementById('createAccountButton');
	createAccountButton.addEventListener('click', 
			() => openAccountCreationPage(page, push));
}

export function startOAuth42()
{
	const width = Math.min(800, window.innerWidth);
	const height = Math.min(690, window.innerHeight);

	const left = (window.innerWidth - width) / 2;
	const top = (window.innerHeight - height) / 2;

	const url = 'https://localhost/api/auth/ft/callback/';
	const title = 'OAuth42';
	const features = `width=${width},height=${height},top=${top},left=${left}`;
	
    const popup = window.open(url, title, features);

	window.addEventListener('storage', endOAuth42);
}

async function endOAuth42()
{
	if (!localStorage.getItem('data'))
		return;

	const token = localStorage.getItem('accessToken');

	if (token)
		alert("You are already logged in!");
	else
	{
		const data = JSON.parse(localStorage.getItem('data'));

		localStorage.setItem('accessToken', data.access);
		localStorage.setItem('refreshToken', data.refresh);

		await setUserInformation();
	}
	
	localStorage.removeItem('data');

	showNavigationHeader();

	closeChat();
	showChat();

	openPage(history.state.page, 0);
}

async function handleLogIn(page, push)
{
	event.preventDefault();

	const username = document.getElementById('username').value;
	const password = document.getElementById('password').value;
	
	const response = await fetch('https://localhost/api/auth/token/',
	{
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({username: username, password: password})
	});

	const data = await response.json();

	if (response.ok)
	{
		const token = localStorage.getItem('accessToken');

		if (token)
			alert("You are already logged in!");
		else
		{
			localStorage.setItem('accessToken', data.access);
			localStorage.setItem('refreshToken', data.refresh);
	
			await setUserInformation();
		}

		showNavigationHeader();
		showChat();
		openPage(page, push);
	}
	else
	{
		document.getElementById('username').value = '';
		document.getElementById('password').value = '';
		document.getElementById('username').blur();
		document.getElementById('password').blur();
		document.getElementById('logInResult').innerHTML = 
			"Wrong username or password";
	}
}

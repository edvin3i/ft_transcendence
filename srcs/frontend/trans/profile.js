import {openUserInformationChangePage} from './userInformation.js'
import {open2FAStatusChangePage} from './twoFactorAuthentication.js'

function profilePage()
{
	return `
		<div class="text-center">
			<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
			<button id="uploadAvatarButton" class="mx-auto" style="display: block;">Upload new avatar</button>
			<h2>Your information:</h2>
			<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
			<button id="changeButton">Change</button>
			<h2>Security:</h2>
			<p>2FA: <span id="status"></span></p>
			<button id="enableOrDisableButton"></button>
		</div>
	`;
}

export function openProfilePage()
{
	document.getElementById('app').innerHTML = profilePage();

	const avatar = localStorage.getItem('avatar');
	document.getElementById('avatar').src = avatar // no more waiting
	
	const uploadAvatarButton = document.getElementById('uploadAvatarButton');
	uploadAvatarButton.addEventListener('click', uploadAvatar);

	const username = localStorage.getItem('username');
	const email = localStorage.getItem('email');

	document.getElementById('username').innerHTML = username;
	document.getElementById('email').innerHTML = email;
	
	const changeButton = document.getElementById('changeButton');
	changeButton.addEventListener('click', openUserInformationChangePage);
	
	if (localStorage.getItem('2FA') === 'false')
	{
		document.getElementById('status').innerHTML = 'disabled';
		document.getElementById('enableOrDisableButton').innerHTML = 'Enable';
	}
	else
	{
		document.getElementById('status').innerHTML = 'enabled';
		document.getElementById('enableOrDisableButton').innerHTML = 'Disable';
	}
	
	const enableOrDisableButton = 
		document.getElementById('enableOrDisableButton');
	enableOrDisableButton.addEventListener('click', open2FAStatusChangePage);
}

function uploadAvatar()
{
	return;
}

import {openUserInformationChangePage, uploadAvatar} from './userInformation.js'
import {open2FAStatusChangePage} from './twoFactorAuthentication.js'
import {checkToken} from './token.js'
import {showMatchHistory} from './userProfile.js'

function profilePage()
{
	return `
	<div class="panels-wrapper">
		<div style="display: flex; justify-content: center; gap: 40px; align-items: flex-start;">
		<div class="neon-panel">	
		<div class="text-center">
				<h2>Your profile</h2>
				<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
				<input type="file" accept="image/*" id="avatarInput" style="display: none;"></input>
				<button id="uploadAvatarButton" class="mx-auto" style="display: block;">Upload new avatar</button>
				<h2>Your information:</h2>
				<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
				<button id="changeButton">Change</button>
				<h2>Security:</h2>
				<p>2FA: <span id="status"></span></p>
				<button id="enableOrDisableButton"></button>
			</div>
			</div>
			<div class="neon-panel">
			<div class="text-center">
				<h2>Stats</h2>
				<div id="matchStats" style="justify-content: space-around; display: flex; margin-bottom: 15px; text-align: center;">
					<div>
						<p class="text-success"><span id="wins"></span></p>
						<p>Wins</p>
					</div>
					<div>
						<p class="text-danger"><span id="losses"></span></p>
						<p>Losses</p>
					</div>
				</div>
				<h2>Match History</h2>
				<ul id="matchHistory" style="list-style: none; padding: 0;"></ul>
			</div>
			</div>
			</div>
		</div>
	`;
}

export function openProfilePage()
{
	document.getElementById('app').innerHTML = profilePage();

	const avatar = localStorage.getItem('avatar');
	document.getElementById('avatar').src = avatar;

	const avatarInput = document.getElementById('avatarInput');
	avatarInput.addEventListener('change', uploadAvatar);

	const uploadAvatarButton = document.getElementById('uploadAvatarButton');
	uploadAvatarButton.addEventListener('click', () => avatarInput.click());

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

	getStats();
}

async function getStats()
{
	const token = await checkToken();

	const response = await fetch('api/users/me', 
	{
		method: 'GET',
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}
	});

	const data = await response.json();

	document.getElementById('wins').innerHTML = data.total_wins;
	document.getElementById('losses').innerHTML = data.total_losses;

	showMatchHistory(data.match_history);
}

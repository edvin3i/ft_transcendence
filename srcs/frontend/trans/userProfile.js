import {checkToken} from './token.js'

function userProfilePage()
{
	return `
		<div style="display: flex; justify-content: center; gap: 40px; align-items: flex-start;">
			<div class="text-center">
				<h2><span id="user"></span>'s profile</h2>
				<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
				<h2>Information:</h2>
				<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
			</div>
			<div class="text-center">
				<h2>Match History</h2>
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
				<ul id="matchList" style="list-style: none; padding: 0;"></ul>
			</div>
		</div>
	`;
}

export async function openUserProfilePage(id)
{
	document.getElementById('app').innerHTML = userProfilePage();

	const userInformation = await getUserInformation(id);

	document.getElementById('user').innerHTML = userInformation.user.username;

	document.getElementById('avatar').src = userInformation.avatar;
	document.getElementById('username').innerHTML = 
		userInformation.user.username;
	document.getElementById('email').innerHTML = userInformation.user.email;

	document.getElementById('wins').innerHTML = userInformation.total_wins;
	document.getElementById('losses').innerHTML = userInformation.total_losses;
}

async function getUserInformation(id)
{
	const token = await checkToken();

	const response = await fetch(`api/users/${id}/`, 
	{
		method: 'GET',
		headers: 
		{
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});
	
	const data = await response.json();

	return(data);
}

import {checkToken} from './token.js'

function userProfilePage()
{
	return `
		<div class="text-center">
			<h2><span id="user"></span>'s profile</h2>
			<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
			<h2>Information:</h2>
			<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
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

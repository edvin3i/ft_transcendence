import {checkToken} from './token.js'

function userProfilePage()
{
	return `
		<div class="text-center">
			<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
			<h2>Information:</h2>
			<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
		</div>
	`;
}

export function openUserProfilePage(id)
{
	document.getElementById('app').innerHTML = userProfilePage();

	const userInformation = getUserInformation(id);

	document.getElementById('avatar').src = userInformation.avatar;
	document.getElementById('username').innerHTML = userInformation.username;
	document.getElementById('email').innerHTML = userInformation.email;
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

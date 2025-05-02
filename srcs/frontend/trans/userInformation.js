import {checkToken} from './token.js'
import {showNavigationHeader} from './navigation.js'
import {openProfilePage} from './profile.js'

function userInformationChangePage()
{
	return `
		<div class="text-center">
			<h2>Your information:<br></h2>
			<form class="text-center" id="userInformationChangeForm" method="POST">
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
				<p id="userInformationChangeResult" class="text-danger mt-3 text-center"></p>
				<button type="submit" id="saveButton">Save</button>
			</form>
		</div>
	`;
}

export function openUserInformationChangePage()
{
	document.getElementById('app').innerHTML = userInformationChangePage();
	
	const username = localStorage.getItem('username');
	const email = localStorage.getItem('email');

	document.getElementById('username').value = username;
	document.getElementById('email').value = email;
	
	const userInfromationChangeForm = 
		document.getElementById('userInformationChangeForm');
	userInformationChangeForm.addEventListener('submit', changeUserInformation);
}

async function changeUserInformation()
{
	event.preventDefault();

	const username = document.getElementById('username').value;
	const email = document.getElementById('email').value;

	/*
	// waiting for Vanya's backend change START
	if (username === localStorage.getItem('username'))
	{
		const token = await checkToken();

		const response = await 
			fetch(`api/users/me/update/`, 
		{
			method: 'PATCH',
			headers: 
			{
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({user: 
			{
				email: email
			}})
		});
	
		const data = await response.json();

		if (response.ok)
		{
			await setUserInformation();
			openProfilePage();
		}
		else if (data.user.email)
		{
			document.getElementById('email').focus();
			document.getElementById('userInformationChangeResult').innerHTML = 
				`The email '${email}' is already in use`;
		}
		else
		{
			document.getElementById('username').blur();
			document.getElementById('email').blur();
			document.getElementById('userInformationChangeResult').innerHTML = 
				"An error occurred while updating your information";
		}
		return;
	}
	// waiting for Vanya's backend change END
	*/

	const token = await checkToken();

	const response = await fetch(`api/users/me/update/`, 
	{
		method: 'PATCH', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}, 
		body: JSON.stringify({user: 
		{
			username: username, 
			email: email
		}})
	});
	
	const data = await response.json();

	if (response.ok)
	{
		await setUserInformation();
		showNavigationHeader();
		openProfilePage();
	}
	else if (data.user.username && data.user.email)
	{
		document.getElementById('username').blur();
		document.getElementById('email').blur();
		document.getElementById('userInformationChangeResult').innerHTML = 
			`The usename '${username}' and email '${email}' are already in use`;
	}
	else if (data.user.username)
	{
		document.getElementById('username').focus();
		document.getElementById('userInformationChangeResult').innerHTML = 
			`The usename '${username}' is already in use`;
	}
	else if (data.user.email)
	{
		document.getElementById('email').focus();
		document.getElementById('userInformationChangeResult').innerHTML = 
			`The email '${email}' is already in use`;
	}
	else
	{
		document.getElementById('username').blur();
		document.getElementById('email').blur();
		document.getElementById('userInformationChangeResult').innerHTML = 
			"An error occurred while updating your information";
	}
}

export async function setUserInformation()
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

	localStorage.setItem('id', data.user.id);
	localStorage.setItem('avatar', data.avatar);
	localStorage.setItem('username', data.user.username);
	localStorage.setItem('email', data.user.email);
	localStorage.setItem('2FA', data.is_2fa_enabled);
}

export async function uploadAvatar()
{
	const fileInput = document.getElementById('avatarInput');
	const formData = new FormData();
	formData.append('avatar', fileInput.files[0]);

	const token = await checkToken();

	const response = await fetch(`api/users/me/update/`, 
	{
		method: 'PATCH', 
		headers: {'Authorization': `Bearer ${token}`}, 
		body: formData
	});

	if (response.ok)
	{
		await setUserInformation();
		openProfilePage();
	}
	else
		alert("Something went wrong while updating your avatar!");
}

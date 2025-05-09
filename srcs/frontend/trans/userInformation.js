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

	// waiting for Vanya's backend change START
	if (username === localStorage.getItem('username') && 
			email === localStorage.getItem('email'))
	{
		await setUserInformation();
		openProfilePage();
		return;
	}
	else if (username === localStorage.getItem('username'))
	{
		const id = localStorage.getItem('id');
		const token = localStorage.getItem('accessToken');

		const response = await 
			fetch(`https://localhost/api/users/update/${id}/`, 
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
	else if (email === localStorage.getItem('email'))
	{
		const id = localStorage.getItem('id');
		const token = localStorage.getItem('accessToken');

		const response = await 
			fetch(`https://localhost/api/users/update/${id}/`, 
		{
			method: 'PATCH',
			headers: 
			{
				'Authorization': `Bearer ${token}`,
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({user: 
			{
				username: username
			}})
		});

		const data = await response.json();

		if (response.ok)
		{
			await setUserInformation();
			openProfilePage();
		}
		else if (data.user.username)
		{
			document.getElementById('username').focus();
			document.getElementById('userInformationChangeResult').innerHTML = 
				`The usename '${username}' is already in use`;
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

	const id = localStorage.getItem('id');
	const token = localStorage.getItem('accessToken');

	const response = await fetch(`https://localhost/api/users/update/${id}/`, 
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
	const token = localStorage.getItem('accessToken');

	const response = await fetch('https://localhost/api/users/profile/me', 
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
	localStorage.setItem('username', data.user.username);
	localStorage.setItem('email', data.user.email);
}

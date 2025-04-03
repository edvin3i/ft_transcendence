async function loginWith42(event)
{
	// add 42
}

async function signUpWith42(event)
{
	// add 42
}

async function handleLogin(event)
{
	event.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	
	const response = await fetch('http://localhost:8000/users/login/',
		{
			method: 'POST', 
			headers: {'Content-Type': 'application/json'}, 
			body: JSON.stringify({username: username, password: password})
		});

	console.log(response.status);

	if (response.ok)
	{
		const data = await response.json();
		document.getElementById("username").blur();
		document.getElementById("password").blur();
		document.getElementById("username").value = "";
		document.getElementById("password").value = "";
		document.getElementById("loginResult").innerHTML = "";
		document.getElementById("profileInformation").innerHTML = 
			`Your information:<br>
			username: ${data.username}<br>
			email: ${data.email}`;
		openUserProfile();
	}
	else if (response.status === 404)
	{
		document.getElementById("loginResult").innerHTML = 
			`Account with username ${username} not found`;
		document.getElementById("loginResult").hidden = false;
		document.getElementById("username").focus();
	}
	else
	{
		document.getElementById("loginResult").innerHTML = 
			`Wrong password!`;
		document.getElementById("loginResult").hidden = false;
		document.getElementById("password").value = "";
		document.getElementById("password").focus();
	}
}

async function handleAccountCreation(event)
{
	event.preventDefault();

	const username = document.getElementById("newUsername").value;
	const email = document.getElementById("newEmail").value;
	const password = document.getElementById("newPassword").value;

	const response = await fetch('http://localhost:8000/users/create-account/', 
		{
			method: 'POST',
			headers: {'Content-Type': 'application/json'},
			body: JSON.stringify(
				{
					username: username,
					email: email,
					password: password
				})
		});
	const data = await response.json();
	console.log(data);

	if (response.ok)
	{
		document.getElementById("newUsername").blur();
		document.getElementById("newEmail").blur();
		document.getElementById("newPassword").blur();
		document.getElementById("newUsername").value = "";
		document.getElementById("newEmail").value = "";
		document.getElementById("newPassword").value = "";
		document.getElementById("accountCreationHeader").hidden = true;
		document.getElementById("accountCreationForm").hidden = true;
		document.getElementById("accountCreationResult").innerHTML = 
			"You have just successfully created your account!";
		document.getElementById("accountCreationResult").hidden = false;
	}
	else
	{
		if (data.error === "username_error")
		{
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with username ${username} already exists`;
			document.getElementById("accountCreationResult").hidden = false;
			document.getElementById("newUsername").focus();
		}
		if (data.error === "email_error")
		{
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with email ${email} already exists`;
			document.getElementById("accountCreationResult").hidden = false;
			document.getElementById("newEmail").focus();
		}
		if (data.error === "username_and_email_error")
		{
			document.getElementById("newUsername").blur();
			document.getElementById("newEmail").blur();
			document.getElementById("newPassword").blur();
			document.getElementById("accountCreationResult").innerHTML = 
				`Accounts with usename ${username} and email ${email} already 
				exist`;
			document.getElementById("accountCreationResult").hidden = false;
		}
	}
}

function startAccountCreation()
{
	document.getElementById("username").value = "";
	document.getElementById("password").value = "";
	document.getElementById("loginResult").innerHTML = "";
	document.getElementById("login").hidden = true;
	document.getElementById("accountCreation").hidden = false;
	document.getElementById("accountCreationHeader").hidden = false;
	document.getElementById("accountCreationForm").hidden = false;
}

function startLogin()
{
	document.getElementById("login").hidden = false;
	document.getElementById("newUsername").value = "";
	document.getElementById("newEmail").value = "";
	document.getElementById("newPassword").value = "";
	document.getElementById("accountCreationResult").innerHTML = "";
	document.getElementById("accountCreation").hidden = true;
}

function openUserProfile()
{
	document.getElementById("login").hidden = true;
	document.getElementById("accountCreation").hidden = true;
	document.getElementById("userProfile").hidden = false;
}

function logOut()
{
	document.getElementById("login").hidden = false;
	document.getElementById("accountCreation").hidden = true;
	document.getElementById("userProfile").hidden = true;
}

function startGame()
{
	document.getElementById("userProfile").hidden = true;
	document.getElementById("game").hidden = false;
	playGame();
}

function endGame()
{
	document.getElementById("userProfile").hidden = false;
	document.getElementById("game").hidden = true;
}


window.onload = startLogin();

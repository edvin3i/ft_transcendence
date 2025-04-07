async function logInWith42(event)
{
	// add 42auth
}

async function signUpWith42(event)
{
	// add 42auth
}

async function handleLogIn(event)
{
	event.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	
	const response = await fetch('api/auth/token/',
		{
			method: 'POST', 
			headers: {'Content-Type': 'application/json'}, 
			body: JSON.stringify({username: username, password: password})
		});

	console.log(response.status);

	const data = await response.json();
	console.log(data);

	if (response.ok)
	{
		openUserProfilePage();
		/*
		document.getElementById("userProfileInformation").innerHTML = 
			`Your information:<br>
			username: ${data.user.username}<br>
			email: ${data.user.email}`;
		*/
	}
	else
	{
		document.getElementById("password").value = "";
		document.getElementById("username").blur();
		document.getElementById("password").blur();
		document.getElementById("logInResult").innerHTML = `Wrong username or password!`;
	}
}

async function handleAccountCreation(event)
{
	event.preventDefault();

	const username = document.getElementById("username").value;
	const email = document.getElementById("email").value;
	const password = document.getElementById("password").value;

	const response = await fetch('api/users/create/', 
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

	console.log(response.status);

	const data = await response.json();
	console.log(data);

	if (response.ok)
	{
		document.getElementById("accountCreationHeader").hidden = true;
		document.getElementById("accountCreationForm").hidden = true;
		document.getElementById("accountCreationResult").innerHTML = 
			"You have just successfully created your account!";
	}
	else
	{
		if (data.user.username && data.user.email)
		{
			document.getElementById("password").value = "";
			document.getElementById("username").blur();
			document.getElementById("email").blur();
			document.getElementById("password").blur();
			document.getElementById("accountCreationResult").innerHTML = 
				`Accounts with usename ${username} and email ${email} already 
				exist`;
		}
		else if (data.user.username)
		{
			document.getElementById("password").value = "";
			document.getElementById("username").focus();
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with username ${username} already exists`;
		}
		else if (data.user.email)
		{
			document.getElementById("password").value = "";
			document.getElementById("email").focus();
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with email ${email} already exists`;
		}
		else
		{
			document.getElementById("accountCreationResult").innerHTML = 
				`An error has occurred  while creating account!`;
		}
	}
}

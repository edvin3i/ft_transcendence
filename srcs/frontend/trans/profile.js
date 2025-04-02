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
	
	const response = await fetch('api/auth/token/',
		{
			method: 'POST', 
			headers: {'Content-Type': 'application/json'}, 
			body: JSON.stringify({username: username, password: password})
		});
	const data = await response.json();

	console.log("Logging into account...");
	console.log(response.status);
	console.log(data);

	if (response.ok)
	{
		console.log("Success!");
		document.getElementById("username").blur();
		document.getElementById("password").blur();
		document.getElementById("username").value = "";
		document.getElementById("password").value = "";
		document.getElementById("loginResult").innerHTML = "";
		/*
		WE NEED TO GET USER PROFILE DATA!
		document.getElementById("profileInformation").innerHTML = 
			`Your information:<br>
			username: ${data.user.username}<br>
			email: ${data.user.email}`;
		*/
		openUserProfile();
	}
	else
	{
		// VANYA, I WANT TO KNOW IF THE ERROR WAS BECAUSE
		// SUCH USERNAME DOES NOT EXISTS!
		console.log("Error!");
		document.getElementById("loginResult").innerHTML = 
			`Wrong username or password!`;
		document.getElementById("loginResult").hidden = false;
		document.getElementById("password").value = "";
		document.getElementById("username").blur();
		document.getElementById("password").blur();
	}
}

async function handleAccountCreation(event)
{
	event.preventDefault();

	const username = document.getElementById("newUsername").value;
	const email = document.getElementById("newEmail").value;
	const password = document.getElementById("newPassword").value;

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
	const data = await response.json();

	console.log("Creating account...");
	console.log(response.status);

	if (response.ok)
	{
		console.log("Success!");
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
		console.log("Error!");
		if (data.user.username && data.user.email)
		{
			document.getElementById("newUsername").blur();
			document.getElementById("newEmail").blur();
			document.getElementById("newPassword").blur();
			document.getElementById("accountCreationResult").innerHTML = 
				`Accounts with usename ${username} and email ${email} already 
				exist`;
			document.getElementById("accountCreationResult").hidden = false;
		}
		else if (data.user.username)
		{
			console.log("username error!");
			console.log(data.user.username);
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with username ${username} already exists`;
			document.getElementById("accountCreationResult").hidden = false;
			document.getElementById("newUsername").focus();
		}
		else if (data.user.email)
		{
			console.log("email error!");
			console.log(data.user.email);
			document.getElementById("accountCreationResult").innerHTML = 
				`Account with email ${email} already exists`;
			document.getElementById("accountCreationResult").hidden = false;
			document.getElementById("newEmail").focus();
		}
		document.getElementById("newPassword").blur();
		document.getElementById("newPassword").value = "";
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

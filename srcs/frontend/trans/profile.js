async function logInWith42(event)
{
	// add 42auth
}

async function signUpWith42(event)
{
	// add 42auth
}

async function handleLogIn(event) {
	event.preventDefault();

	const username = document.getElementById("username").value;
	const password = document.getElementById("password").value;
	
	const response = await fetch('api/auth/token/', {
		method: 'POST',
		headers: {'Content-Type': 'application/json'},
		body: JSON.stringify({ username, password })
	});

	console.log(response.status);
	const data = await response.json();
	console.log(data);

	if (response.ok) {
		// ✅ Stockage des tokens
		localStorage.setItem("access_token", data.access);
		localStorage.setItem("refresh_token", data.refresh);

		// ✅ Optionnel : décoder le username à partir du token
		try {
			const payload = JSON.parse(atob(data.access.split('.')[1]));
			if (payload?.user_id) {
				localStorage.setItem("username", username);  // ou payload.username si dispo dans le token
			}
		} catch (e) {
			console.warn("❌ Failed to decode token", e);
		}

		// ✅ Mise à jour de l’interface et reconnexion WebSocket
		updateUIWithUser();  // met à jour "Logged in as"
		openChat();          // reconnecte au WebSocket avec le bon token

		openUserProfilePage();  // redirige vers la page de profil
	} else {
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

function handleLogout() {
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
	localStorage.removeItem("username"); // au cas où tu l'utilises aussi

	console.log("🚪 Logged out - tokens removed");

	// Coupe le WebSocket proprement
	if (typeof socket !== "undefined" && socket) {
		socket.close();
	}

	// Remet l'UI à jour
	updateUIWithUser();

	// Vider le chat visuellement
	const chatLog = document.getElementById("chat-log");
	if (chatLog) {
		chatLog.innerHTML = `<em class="text-muted">🚪 Vous êtes déconnecté.</em>`;
	}

	// Optionnel : focus sur le champ username ou rediriger
	 document.getElementById("username")?.focus();
	 updateUIWithUser(); // pour bien cacher le bandeau après logout
}


function getCurrentUserFromToken() {
	return localStorage.getItem("username"); // simple et fiable
}

function updateUIWithUser() {
	const username = localStorage.getItem("username");
	const userInfo = document.getElementById("user-info");
	const userLabel = document.getElementById("logged-user");

	if (username) {
		userInfo.style.display = "inline-block";
		userLabel.textContent = `👤 Logged in as: ${username}`;
	} else {
		userInfo.style.display = "none";
	}
}
function friendsPage()
{
	return `
		<div class="text-center">
			<h2>Your friends:<br></h2>
			<p id="friendsList"></p>
			<button id="addFriendButton">Add friend</button>
		</div>
	`;
}

export function openFriendsPage()
{
	document.getElementById('app').innerHTML = friendsPage();

	getFriendsList();

	const addFriendButton = document.getElementById('addFriendButton');
	addFriendButton.addEventListener('click', addFriend);
}

async function getFriendsList()
{
	const token = localStorage.getItem('accessToken');

	const response = await fetch('https://localhost/api/friends/all', 
	{
		method: 'GET', 
		headers: 
		{
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	const data = await response.json();

	if (data.length === 0)
		document.getElementById('friendsList').innerHTML = 
			"You haven't added any friends yet";
	else
		console.log(data);
}

async function addFriend()
{
	const id = localStorage.getItem('id');

	const token = localStorage.getItem('accessToken');

	const response = await fetch('https://localhost/api/friends/request/4/', 
	{
		method: 'POST', 
		headers: 
		{
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	if (response.ok)
		console.log("OK");
	else
		console.log("NOT OK");
}

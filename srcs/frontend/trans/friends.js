import {checkToken} from './token.js'

function friendsPage()
{
	return `
		<div class="text-center">
			<h2>Your friends:<br></h2>
			<p id="friendsList"></p>
			<h2>Incoming friend requests:<br></h2>
			<p id="incomingRequestsList"></p>
			<h2>Outgoing friend requests:<br></h2>
			<p id="outgoingRequestsList"></p>
			<input type="text" id="friendId" placeholder="Enter friend ID" />
			<button id="addFriendButton">Add friend</button>
			<p id="addFriendResponse" style="margin-top: 10px;"></p>
		</div>
	`;
}

export function openFriendsPage()
{
	document.getElementById('app').innerHTML = friendsPage();

	getFriendsList();
	getIncomingRequestsList();
	getOutgoingRequestsList();

	const addFriendButton = document.getElementById('addFriendButton');
	addFriendButton.addEventListener('click', addFriend);
}

async function getFriendsList()
{
	const token = await checkToken();

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

async function getIncomingRequestsList()
{
	const token = await checkToken();

	const response = await fetch('https://localhost/api/friends/requests/incoming/', 
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
		document.getElementById('incomingRequestsList').innerHTML = 
			"You don't have any incoming friend requests";
	else
		console.log(data);
}

async function getOutgoingRequestsList()
{
	const token = await checkToken();

	const response = await fetch('https://localhost/api/friends/requests/outgoing/', 
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
		document.getElementById('outgoingRequestsList').innerHTML = 
			"You don't have any outgoing friend requests";
	else
		console.log(data);
}

async function addFriend()
{
	const friendId = document.getElementById('friendId').value;

	const token = await checkToken();

	const response = await fetch(`https://localhost/api/friends/request/${friendId}/`, 
	{
		method: 'POST', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
	    }, 
		//body: JSON.stringify({}) //({to_user: friendId})
	});

	const data = await response.json();

	console.log(data);

	document.getElementById('addFriendResponse').innerHtml = data.message;
}

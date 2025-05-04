import {checkToken} from './token.js'
import {openUserProfilePage} from './userProfile.js'

function friendsPage()
{
	return `
	<div class="neon-panel">
		<div class="text-center">
			<h2>Your friends:<br></h2>
			<div id="friendsList"></div>
			<h2>Incoming friend requests:<br></h2>
			<div id="incomingRequestsList"></div>
			<h2>Outgoing friend requests:<br></h2>
			<div id="outgoingRequestsList"></div>
			<input type="text" id="friendId" placeholder="Enter friend ID" />
			<button id="addFriendButton">Add friend</button>
			<p id="addFriendResponse" style="margin-top: 10px;"></p>
		</div>
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

	const response = await fetch('api/friends/all', 
	{
		method: 'GET', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}
	});

	const friends = await response.json();

	if (friends.length === 0)
		document.getElementById('friendsList').innerHTML = 
			"You haven't added any friends yet";
	else
	{
		const username = localStorage.getItem('username');

		for (const friend of friends)
		{
			const p = document.createElement('p');

			if (friend.to_user_username === username)
				p.textContent = friend.from_user_username;
			else
				p.textContent = friend.to_user_username;

			friendsList.appendChild(p);
		}
	}
}

async function getIncomingRequestsList()
{
	const token = await checkToken();

	const response = await fetch('api/friends/requests/incoming/', 
	{
		method: 'GET', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}
	});

	const requests = await response.json();

	if (requests.length === 0)
		document.getElementById('incomingRequestsList').innerHTML = 
			"You don't have any incoming friend requests";
	else
	{
		for (const request of requests)
		{
			const p = document.createElement('p');
			p.textContent = request.from_user_username;
			incomingRequestsList.appendChild(p);
		}
	}
}

async function getOutgoingRequestsList()
{
	const token = await checkToken();

	const response = await fetch('api/friends/requests/outgoing/', 
	{
		method: 'GET', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}
	});

	const requests = await response.json();

	if (requests.length === 0)
		document.getElementById('outgoingRequestsList').innerHTML = 
			"You don't have any outgoing friend requests";
	else
	{
		for (const request of requests)
		{
			const p = document.createElement('p');
			p.textContent = request.to_user_username;
			outgoingRequestsList.appendChild(p);
		}
	}
}

async function addFriend()
{
	const friendId = document.getElementById('friendId').value;

	const token = await checkToken();

	const response = await fetch(`api/friends/request/${friendId}/`, 
	{
		method: 'POST', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
	    }
	});

	const data = await response.json();

	console.log(data);

	document.getElementById('addFriendResponse').innerHtml = data.message;

	openUserProfilePage(friendId);
}

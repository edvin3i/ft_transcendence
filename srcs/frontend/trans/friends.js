function friendsPage() {
	return `
		<div class="text-center">
			<h2>Your friends:<br></h2>
			<p id="friendsList"></p>
			<input type="text" id="friendIdInput" placeholder="Enter friend ID" />
			<button id="addFriendButton">Add friend</button>
			<p id="addFriendResponse" style="margin-top: 10px;"></p>
		</div>
	`;
}

export function openFriendsPage() {
	document.getElementById('app').innerHTML = friendsPage();

	getFriendsList();

	const addFriendButton = document.getElementById('addFriendButton');
	addFriendButton.addEventListener('click', addFriend);
}

async function getFriendsList() {
	const token = localStorage.getItem('accessToken');

	const response = await fetch('https://localhost/api/friends/all', {
		method: 'GET',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});

	const data = await response.json();

	if (data.length === 0) {
		document.getElementById('friendsList').innerHTML = 
			"You haven't added any friends yet";
	} else {
		console.log(data);
	}
}

async function addFriend() {
	const token = localStorage.getItem('accessToken');
	const friendId = document.getElementById('friendIdInput').value.trim();
	const responseElement = document.getElementById('addFriendResponse');

	if (!friendId) {
		responseElement.textContent = "Please enter a valid friend ID.";
		return;
	}

	try {
		const response = await fetch('https://localhost/api/friends/request/', {
    			method: 'POST',
   				headers: {
        			'Authorization': `Bearer ${token}`,
        			'Content-Type': 'application/json'
			    },
    			body: JSON.stringify({
        		"to_user": friendId
    			})
		});

		const result = await response.json();

		if (response.ok) {
			responseElement.textContent = result.message || "Friend request sent successfully.";
		} else {
			responseElement.textContent = result.message || "Failed to send friend request.";
		}
	} catch (error) {
		console.error(error);
		responseElement.textContent = "An error occurred while sending request.";
	}
}

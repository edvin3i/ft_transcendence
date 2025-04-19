function friendsPage()
{
	return `
		<p>You haven't added any friends yet</p>
	`;
}

export function openFriendsPage()
{
	document.getElementById('app').innerHTML = friendsPage();
}

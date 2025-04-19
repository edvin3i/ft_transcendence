function userProfilePage()
{
	return `
		<div class="text-center">
			<p id="userProfileInformation"></p>
		</div>
	`;
}

export function openUserProfilePage()
{
	document.getElementById('app').innerHTML = userProfilePage();
	
	const username = localStorage.getItem('username');
	const email = localStorage.getItem('email');
	
	document.getElementById('userProfileInformation').innerHTML = 
		`Your information: <br>
		username: ${username} <br>
		email: ${email}`;
}

import {openUserInformationChangePage} from './userInformation.js'

function profilePage()
{
	return `
		<div class="text-center">
			<h2>Your information:<br></h2>
			<p id="userInformation"></p>
			<button id="changeButton">Change</button>
		</div>
	`;
}

export function openProfilePage()
{
	document.getElementById('app').innerHTML = profilePage();
	
	const username = localStorage.getItem('username');
	const email = localStorage.getItem('email');
	
	document.getElementById('userInformation').innerHTML = 
		`username: ${username} <br>
		email: ${email}`;
	
	const changeButton = document.getElementById('changeButton');
	changeButton.addEventListener('click', openUserInformationChangePage);
}

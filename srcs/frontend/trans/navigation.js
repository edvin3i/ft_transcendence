import {showChat, closeChat} from './chat.js'
import {openLogInPage} from './logIn.js'
import {openProfilePage} from './profile.js'
import {openFriendsPage} from './friends.js'
import {openGamePage} from './game.js'

const homePage = 'profilePage';

window.onload = openApp();
window.addEventListener('popstate', handleNavigation);

function openApp()
{
	history.replaceState({page: homePage}, '', '');

	const token = localStorage.getItem('accessToken');

	if (token)
	{
		showNavigationHeader();
		showChat();
	}
	
	openPage(homePage, 0);
}

function handleNavigation(event)
{
	const page = event.state.page;

	openPage(page, 0);
}

function navigationHeader()
{
	return `
		<h1>transCendenZ</h1>
		<p>👤 Logged in as: <span id="loggedInAs"></span></p>
		<div style="display: flex; justify-content: center; gap: 10px;">
			<button id="profileButton">Profile</button>
			<button id="friendsButton">Friends</button>
			<button id="gameButton">Game</button>
			<button id="logOutButton">Log out</button>
		</div>
	`;
}

export function showNavigationHeader()
{
	document.getElementById('header').innerHTML = navigationHeader();
	
	const username = localStorage.getItem("username");
	document.getElementById("loggedInAs").innerHTML = username;

	const profileButton = document.getElementById('profileButton');
	profileButton.addEventListener('click', () => openPage('profilePage'));

	const friendsButton = document.getElementById('friendsButton');
	friendsButton.addEventListener('click', () => openPage('friendsPage'));

	const gameButton = document.getElementById('gameButton');
	gameButton.addEventListener('click', () => openPage('gamePage'));

	const logOutButton = document.getElementById('logOutButton');
	logOutButton.addEventListener('click', logOut);
}

export function openPage(page, push = 1)
{
	const token = localStorage.getItem('accessToken');

	console.log("--------------------------NAVIGATION LOG--------------------------------")
	console.log(token);
	console.log("----------------------NAVIGATION END OF LOG-----------------------------")

	if (!token)
		openLogInPage(page, push);
	else
	{
		if (push)
			history.pushState({page: page}, '', '');
		
		if (page === 'profilePage')
			openProfilePage();
		else if (page === 'friendsPage')
			openFriendsPage();
		else if (page === 'gamePage')
			openGamePage();
	}
}

function logOut()
{
	localStorage.removeItem('accessToken');
	localStorage.removeItem('refreshToken');
	localStorage.removeItem('username');
	localStorage.removeItem('email');

	closeChat();

	openPage(homePage);
}

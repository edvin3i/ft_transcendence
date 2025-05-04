import {checkToken} from './token.js'

function userProfilePage()
{
	return `
		<div style="display: flex; justify-content: center; gap: 40px; align-items: flex-start;">
			<div class="text-center">
				<h2><span id="user"></span>'s profile</h2>
				<img id="avatar" alt="Avatar" class="rounded-circle mx-auto" style="width: 150px; height: 150px; object-fit: cover; display: block">
				<p id="userInformation">username: <span id="username"></span><br>email: <span id="email"></span></p>
				<div id="matchStats" style="justify-content: space-around; display: flex; margin-bottom: 15px; text-align: center;">
					<div>
						<p class="text-success"><span id="wins"></span></p>
						<p>Wins</p>
					</div>
					<div>
						<p class="text-danger"><span id="losses"></span></p>
						<p>Losses</p>
					</div>
				</div>
			</div>
			<div class="text-center">
				<h2>Match History</h2>
				<ul id="matchHistory" style="list-style: none; padding: 0;"></ul>
			</div>
		</div>
	`;
}

export async function openUserProfilePage(id)
{
	document.getElementById('app').innerHTML = userProfilePage();

	const userInformation = await getUserInformation(id);

	document.getElementById('user').innerHTML = userInformation.user.username;

	document.getElementById('avatar').src = userInformation.avatar;
	document.getElementById('username').innerHTML = 
		userInformation.user.username;
	document.getElementById('email').innerHTML = userInformation.user.email;

	document.getElementById('wins').innerHTML = userInformation.total_wins;
	document.getElementById('losses').innerHTML = userInformation.total_losses;

	showMatchHistory(userInformation.match_history);
}

async function getUserInformation(id)
{
	const token = await checkToken();

	const response = await fetch(`api/users/${id}/`, 
	{
		method: 'GET',
		headers: 
		{
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json'
		}
	});
	
	const data = await response.json();

	return(data);
}

export async function showMatchHistory(history)
{
	if (history.length === 0)
		document.getElementById('matchHistory').innerHTML = 
			"You haven't played any games yet";
	else
	{

		for (const match of history)
		{
			if (!match.is_finished)
				continue;

			const player1 = match.player1.username;
			const player2 = match.player2.username;

			const score1 = match.score_p1;
			const score2 = match.score_p2;

			const date = formatDate(match.created_at);

			const p = document.createElement('p');

			if (!match.winner)
				p.innerHTML = `${player1} vs ${player2}<br>${score1} : ${score2}<br><span style="font-size: 0.6em;">${date}</span>`;
			else if (match.winner.username === match.player1.username)
				p.innerHTML = `<span style="color: green;">${player1}</span> vs <span style="color: red;">${player2}</span><br>${score1} : ${score2}<br><span style="font-size: 0.7em;">${date}</span>`;
			else
				p.innerHTML = `<span style="color: red;">${player1}</span> vs <span style="color: green;">${player2}</span><br>${score1} : ${score2}<br><span style="font-size: 0.8em;">${date}</span>`;

			matchHistory.appendChild(p);
		}
	}
}

function formatDate(rawDate)
{
	const formattedDate = new Date(rawDate).toLocaleString('fr-FR', 
	{
		day: '2-digit', 
		month: '2-digit', 
		year: 'numeric', 
		hour: '2-digit', 
		minute: '2-digit', 
		hour12: false
	});

	return formattedDate;
}

import {checkToken} from './token.js'
import {setUserInformation} from './userInformation.js'
import {openProfilePage} from './profile.js'

export function open2FAStatusChangePage()
{
	if (localStorage.getItem('2FA') === 'false')
		openSetup2FAPage();
	else
		openDisable2FAPage();
}

function setup2FAPage()
{
	return `
		<div class="text-center">
			<h2>Enable Two-Factor Authentication</h2>
			<p><strong>Scan this QR code using your authenticator app (like Google Authenticator) to enable Two-Factor Authentication (2FA):</strong><br>
			<img id="qrCode" class="img-fluid w-25 rounded border shadow-sm" alt="QR code couldn't be generated"></p>
			<p><strong class="fw-bold">Can’t scan the QR code?</strong> Manually enter this key into your app: <span id="secret"></span></p>
			<button id="doneButton">Done</button>
		</div>
	`;
}

async function openSetup2FAPage()
{
	document.getElementById('app').innerHTML = setup2FAPage();

	const token = await checkToken();

	const response = await fetch('api/auth/2fa/setup/', 
	{
		method: 'POST',
		headers: 
		{
    		'Authorization': `Bearer ${token}`, 
    		'Content-Type': 'application/json'
	    }
	});

	const data = await response.json();
	
	document.getElementById('qrCode').src = 
		`data:image/png;base64,${data.qrcode}`;
	document.getElementById('secret').innerHTML = data.secret;

	const doneButton = document.getElementById('doneButton');
	doneButton.addEventListener('click', openEnable2FAPage);
}

export function confirmationPage()
{
	return `
		<div class="text-center">
			<h2><span id="change"></span>Two-Factor Authentication</h2>
			<form id="confirmationForm" method="POST">
				<div>
					<label for="confirmationCode">Enter the 6-digit code:</label><br>
					<input type="text" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" minlength="6" title="Please enter a valid 6-digit code" required id="confirmationCode">
				</div>
				<p id="confirmationResult" class="text-danger mt-3 text-center"></p>
				<button type="submit">Confirm</button>
			</form>
		</div>
	`;
}

function openEnable2FAPage()
{
	document.getElementById('app').innerHTML = confirmationPage();
	
	document.getElementById('change').innerHTML = "Enable ";
	
	const confirmationForm = document.getElementById('confirmationForm');
	confirmationForm.addEventListener('submit', () => 
			checkConfirmationCode('api/auth/2fa/confirm/'));
}

function openDisable2FAPage()
{
	document.getElementById('app').innerHTML = confirmationPage();
	
	document.getElementById('change').innerHTML = "Disable ";
	
	const confirmationForm = document.getElementById('confirmationForm');
	confirmationForm.addEventListener('submit', () => 
			checkConfirmationCode('api/auth/2fa/disable/'));
}

async function checkConfirmationCode(url)
{
	event.preventDefault();

	const code = document.getElementById('confirmationCode').value;

	const token = await checkToken();

	const response = await fetch(url, 
	{
		method: 'POST',
		headers: 
		{
    		'Authorization': `Bearer ${token}`, 
    		'Content-Type': 'application/json'
	    }, 
		body: JSON.stringify({'totp_code': code})
	});

	if (response.ok)
	{
		await setUserInformation();
		openProfilePage();
	}
	else
		document.getElementById('confirmationResult').innerHTML = "Wrong code!";
}

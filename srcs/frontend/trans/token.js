export async function checkToken()
{
	const token = localStorage.getItem('accessToken');

	const response = await fetch('https://localhost/api/auth/token/verify/', 
	{
		method: 'POST', 
		headers: 
		{
			'Authorization': `Bearer ${token}`, 
			'Content-Type': 'application/json'
		}, 
		body: JSON.stringify({token: token})
	});

	if (!response.ok)
		return refreshToken();
	else
		return token;
}

async function refreshToken()
{
	const token = localStorage.getItem('refreshToken');

	const response = await fetch('https://localhost/api/auth/token/refresh/', 
	{
		method: 'POST', 
		headers: {'Content-Type': 'application/json'}, 
		body: JSON.stringify({refresh: token})
	});

	const data = await response.json();
	
	localStorage.setItem('accessToken', data.access);

	return data.access;
}

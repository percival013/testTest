document.getElementById('admin-login-form').addEventListener('submit', function(event) {
    event.preventDefault(); 

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const adminUsername = 'admin'; 
    const adminPassword = 'BKjonpCFvhw1QnPe'; 

    if (username === adminUsername && password === adminPassword) {
  
        window.location.href = 'admin-dashboard.html';
    } else {
        alert('Invalid credentials. Please try again.');
    }
});
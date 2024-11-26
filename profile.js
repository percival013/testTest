let currentUserId; 

document.addEventListener('DOMContentLoaded', async () => {
    await fetchUserInfo(); 
    if (currentUserId) { 
        await fetchUploadedServices(currentUserId); 
        await fetchBookingRequests(); 
        await checkUserRole();
    
    } else {
        console.error('Invalid userId after fetching user info.');
    }
});

async function fetchUserInfo() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const userInfo = await response.json();
        currentUserId = userInfo._id; 
        displayUserInfo(userInfo);
    

        
        if (userInfo.isApproved) {
            document.getElementById('switch-role-button').style.display = 'block'; 
            await fetchUploadedServices(userInfo._id); 
        } else {
            document.getElementById('switch-role-button').style.display = 'none'; 
        }
        if (userInfo.role === 'regular') {
            fetchBookedRequests(); 
            fetchBookingRequests();
            document.getElementById('booked-requests').style.display = 'block'; 
            document.getElementById('booking-requests').style.display = 'none';
        } else {
            document.getElementById('booked-requests').style.display = 'none';
            document.getElementById('booking-requests').style.display = 'block';
        }

        if (userInfo.role === 'provider') {
            fetchBookingRequests(); 
            document.getElementById('booking-requests').style.display = 'block';
        } else {
            document.getElementById('booking-requests').style.display = 'none'; 
        }

    } catch (error) {
        console.error('Error fetching user info:', error);
        document.getElementById('profile-details').innerHTML = '<p>Error loading user information. Please try again later.</p>';
    }
}

async function checkUserRole() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const userInfo = await response.json();
        
        
        if (userInfo.role === 'provider') {
            const bookingRequestsElement = document.getElementById('booking-requests');
            const bookedRequestsElement = document.getElementById('booked-requests');
            
            if (bookingRequestsElement) {
                bookingRequestsElement.style.display = 'block';
            }
            
            if (bookedRequestsElement) {
                bookedRequestsElement.style.display = 'none';
            }
            fetchBookingRequests();
        } else {
            const bookingRequestsElement = document.getElementById('booking-requests');
            const bookedRequestsElement = document.getElementById('booked-requests');
            
            if (bookingRequestsElement) {
                bookingRequestsElement.style.display = 'none';
            }
            
            if (bookedRequestsElement) {
                bookedRequestsElement.style.display = 'block';
            }
        }

    } catch (error) {
        console.error('Error checking user role:', error);
        document.getElementById('profile-details').innerHTML = '<p>Error loading user information. Please try again later.</p>';
    }
}

function displayUserInfo(userInfo) {
    const profileDetails = document.getElementById('profile-details');
    const advertiseServiceSection = document.getElementById('advertise-service');
    const providerApplicationSection = document.getElementById('provider-application');
    const uploadedServicesSection = document.getElementById('uploaded-services')
    const joinedDate = new Date(userInfo.joinedDate);
    
    if (isNaN(joinedDate.getTime())) {
        profileDetails.innerHTML = `
            <p><strong>Username:</strong> ${userInfo.username}</p>
            <p><strong>Email:</strong> ${userInfo.email || 'Not provided'}</p>
            <p><strong>Joined on:</strong> Invalid Date</p>
            <p><strong>Role:</strong> ${userInfo.role || 'Not specified'}</p>
        `;
        return;
    }

    const currentDate = new Date();
    const timeElapsed = Math.floor((currentDate - joinedDate) / (1000 * 60 * 60 * 24));

    profileDetails.innerHTML = `
        <p><strong>Username:</strong> ${userInfo.username}</p>
        <p><strong>Email:</strong> ${userInfo.email || 'Not provided'}</p>
        <p><strong>Joined on:</strong> ${joinedDate.toLocaleDateString()}</p>
        <p><strong>Account Age:</strong> ${timeElapsed} days</p>
        <p><strong>Role:</strong> ${userInfo.role}</p>
        <p><strong>Approved:</strong> ${userInfo.isApproved}</p>
        <p><strong>Landmark:</strong> ${userInfo.address}</p>
        <p><strong>City/State:</strong> ${userInfo.city}</p>
        <p><strong>Provice:</strong> ${userInfo.province}</p>
    `;

    
    if (userInfo.role === 'provider') {
        advertiseServiceSection.style.display = 'block'; 
        providerApplicationSection.style.display = 'none';
        uploadedServicesSection.style.display = 'block';
    } else {
        advertiseServiceSection.style.display = 'none'; 
        providerApplicationSection.style.display = 'block'
        uploadedServicesSection.style.display = 'none';
    }

    if (userInfo.isApproved) {
        providerApplicationSection.style.display = 'none'; 
    } else {
        providerApplicationSection.style.display = 'block'; 
    }
}

document.getElementById('switch-role-button').addEventListener('click', async function() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include'
        });

        if (response.ok) {
            const userInfo = await response.json();
            let switchResponse;

            if (userInfo.role === 'provider') {
                switchResponse = await fetch('/api/switch-to-customer', {
                    method: 'POST',
                    credentials: 'include'
                });
            } else {
                switchResponse = await fetch('/api/switch-to-provider', {
                    method: 'POST',
                    credentials: 'include'
                });
            }

            if (switchResponse.ok) {
                
                const newUserInfo = await fetch('/api/user', { credentials: 'include' });
                const updatedUserInfo = await newUserInfo.json();
                localStorage.setItem('userRole', updatedUserInfo.role); 

                
                await fetchUserInfo();
                
                if (userInfo.role === 'provider') {
                    document.getElementById('booking-requests').style.display = 'none';
                    document.getElementById('booked-requests').style.display = 'block';
                } else {
                    document.getElementById('booking-requests').style.display = 'block';
                    document.getElementById('booked-requests').style.display = 'none';
                }
            } else {
                throw new Error('Failed to switch roles');
            }
        }
    } catch (error) {
        console.error('Error switching roles:', error);
        alert('An error occurred while switching roles. Please try again later.');
    }
});

document.getElementById('provider-application-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const gender = document.getElementById('gender').value;
    const phone = document.getElementById('phone').value;
    const proofOfWork = document.getElementById('proofOfWork').value;
    const credentials = document.getElementById('credentials').value;

    const applicationData = {
      gender,
      phone,
      proofOfWork,
      credentials
    };

    try {
      const response = await fetch('/api/apply-service-provider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(applicationData),
        credentials: 'include' 
      });

      const result = await response.json();
      document.getElementById('application-message').textContent = result.message;

      if (response.ok) {
        document.getElementById('provider-application-form').reset(); 
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      document.getElementById('application-message ').textContent = 'An error occurred while submitting your application. Please try again later.';
    }
});

async function fetchUploadedServices(userId) {
    console.log('Fetching uploaded services for userId:', userId);
    if (!userId) {
        console.error('Invalid userId. Cannot fetch services.');
        document.getElementById('uploaded-services-list').innerHTML = '<p>Error: User ID is invalid. Please try again later.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/get-services?providerId=${userId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const services = await response.json();
        displayUploadedServices(services);
        await fetchBookingRequests(); 
    } catch (error) {
        console.error('Error fetching uploaded services:', error);
        document.getElementById('uploaded-services-list').innerHTML = '<p>Error loading your services. Please try again later.</p>';
    }
}

function displayUploadedServices(services) {
    const uploadedServicesList = document.getElementById('uploaded-services-list');
    uploadedServicesList.innerHTML = ''; 

    if (services.length === 0) {
        uploadedServicesList.innerHTML = '<p>You have not uploaded any services yet.</p>';
        return;
    }

    services.forEach(service => {
        const serviceDiv = document.createElement('div');
        serviceDiv.className = 'service-card';
        serviceDiv.innerHTML = `
            <h3>${service.serviceName}</h3>
            <p>${service.serviceCategory}</p>
            <p>${service.serviceDescription}</p>
            <p>Average Price: $${service.averagePrice}</p>
            <button onclick="removeService('${service._id}')">Remove Service</button>
        `;
        uploadedServicesList.appendChild(serviceDiv);
    });

    document.getElementById('uploaded-services').style.display = 'block'; 
}


async function fetchBookingRequests() {
    try {
        const response = await fetch('/api/get-bookings', {
            credentials: 'include' 
        });

        if (response.ok) {
            const bookings = await response.json();
            const bookingTableBody = document.querySelector('#booking-requests-table tbody');
            bookingTableBody.innerHTML = ''; 

            bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking._id}</td>
                    <td>${booking.serviceId.serviceName}</td>
                    <td>${booking.serviceId.serviceCategory}</td>
                    <td>${booking.userId.username}</td>
                    <td>${booking.status}</td>
                    <td>
                        <button class="approve-button" data-id="${booking._id}">Approve</button>
                        <button class="remove-button" data-id="${booking._id}">Remove</button>
                    </td>
                `;
                bookingTableBody.appendChild(row);
            });

            
            document.querySelectorAll('.approve-button').forEach(button => {
                button.addEventListener('click', async () => {
                    const bookingId = button.getAttribute('data-id');
                    await approveBooking(bookingId);
                });
            });

            document.querySelectorAll('.remove-button').forEach(button => {
                button.addEventListener('click', async () => {
                    const bookingId = button.getAttribute('data-id');
                    await removeBooking(bookingId);
                });
            });

            
            document.getElementById('booking-requests').style.display = 'block';

        } else {
            console.error('Error fetching bookings:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}

async function approveBooking(bookingId) {
    try {
        const response = await fetch(`/api/approve-booking/${bookingId}`, {
            method: 'PATCH',
            credentials: 'include'
        });

        if (response.ok) {
            alert('Booking approved successfully!');
            fetchBookingRequests(); 
        } else {
            const error = await response.json();
            alert('Error approving booking: ' + error.message);
        }
    } catch (error) {
        console.error('Error approving booking:', error);
        alert('Failed to approve booking. Please try again later.');
    }
}

async function removeBooking(bookingId) {
    if (confirm('Are you sure you want to remove this booking?')) {
        try {
            const response = await fetch(`/api/remove-booking/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('Booking removed successfully!');
                fetchBookingRequests(); 
            } else {
                const error = await response.json();
                alert('Error removing booking: ' + error.message);
            }
        } catch (error) {
            console.error('Error removing booking:', error);
            alert('Failed to remove booking. Please try again later.');
        }
    }
}


async function removeService(serviceId) {
    if (confirm('Are you sure you want to remove this service?')) {
        try {
            const response = await fetch(`/api/remove-service/${serviceId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                alert('Service removed successfully!');
                fetchUploadedServices(); 
            } else {
                const error = await response.json();
                alert('Error removing service: ' + error.message);
            }
        } catch (error) {
            console.error('Error removing service:', error);
            alert('Failed to remove service. Please try again later.');
        }
    }
}

async function fetchBookedRequests() {
    try {
        const response = await fetch('/api/get-user-bookings', {
            credentials: 'include' 
        });

        if (response.ok) {
            const bookings = await response.json();
            const bookingTableBody = document.querySelector('#booked-requests-table tbody');
            bookingTableBody.innerHTML = ''; 

            bookings.forEach(booking => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${booking._id}</td>
                    <td>${booking.serviceId.serviceName}</td>
                    <td>${booking.serviceId.serviceCategory}</td>
                    <td>${booking.status}</td>
                    <td>
                        <button onclick="removeBooking('${booking._id}')">Remove</button>
                    </td>
                `;
                bookingTableBody.appendChild(row);
            });
        } else {
            console.error('Error fetching bookings:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching bookings:', error);
    }
}

async function removeBooking(bookingId) {
    if (confirm('Are you sure you want to remove this booking?')) {
        try {
            const response = await fetch(`/api/remove-booking/${bookingId}`, {
                method: 'DELETE',
                credentials: 'include' 
            });

            if (response.ok) {
                alert('Booking removed successfully!');
                fetchBookedRequests(); 
            } else {
                const error = await response.json();
                alert('Error removing the booking: ' + error.message);
            }
        } catch (error) {
            console.error('Error removing booking:', error);
            alert('An error occurred while trying to remove the booking. Please try again later.');
        }
    }
}

document.getElementById('advertise-service-form').addEventListener('submit', async function(event) {
    event.preventDefault(); 

    const serviceName = document.getElementById('serviceName').value;
    const serviceCategory = document.getElementById('serviceCategory').value;
    const serviceDescription = document.getElementById('serviceDescription').value;
    const averagePrice = document.getElementById('averagePrice').value;

    try {
        const response = await fetch('/api/advertise-service', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                serviceName: serviceName,
                serviceCategory,
                serviceDescription,
                averagePrice,
            }),
            credentials: 'include' 
        });

        if (!response.ok) {
            const errorResult = await response.json();
            console.error('Error response from server:', errorResult);
            document.getElementById('message').textContent = errorResult.message; 
            return; 
        }

        const result = await response.json();
        document.getElementById('message').textContent = result.message;
        
        if (response.ok) {
            document.getElementById('advertise-service-form').reset(); 
        }
    } catch (error) {
        console.error('Error submitting request:', error);
        document.getElementById('message').textContent = 'Error submitting request. Please try again.';
    }
});

document.getElementById('logout-button').addEventListener('click', async function() {
    try {
        const response = await fetch('/logout', {
            method: 'POST',
            credentials: 'include' 
        });

        if (response.ok) {
            
            document.cookie = "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = 'index.html'; 
        } else {
            alert('Failed to logout. Please try again.');
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred while trying to logout. Please try again later.');
    }
});


let currentUserId;

async function fetchServiceDetails() {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('id');

    if (!serviceId) {
        document.getElementById('service-details').innerHTML = '<p>Service not found.</p>';
        return;
    }

    try {
        const response = await fetch(`/api/get-services/${serviceId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const service = await response.json();
        displayServiceDetails(service);
        await fetchComments(serviceId);
       
    } catch (error) {
        console.error('Error fetching service details:', error);
        document.getElementById('service-details').innerHTML = '<p>Error loading service details. Please try again later.</p>';
    }
}

function displayServiceDetails(service) {
    const serviceDetailsContainer = document.getElementById('service-details');
    serviceDetailsContainer.innerHTML = `
        <h2>${service.serviceName}</h2>
        <p><strong>Description:</strong> ${service.serviceDescription}</p>
        <p><strong>Average Price:</strong> $${service.averagePrice}</p>
        <p><strong>Provider: </strong> ${service.providerId ? service.providerId.username : 'Unknown'}</p>
        <p><strong>Average Rating: </strong> ${service.averageRating ? service.averageRating.toFixed(1) + '★' : 'Not yet rated'}</p>
        <p><strong>Location: </strong>${service.city}, ${service.province}</p>

    `;
}

async function fetchComments(serviceId) {
    try {
        const response = await fetch(`/api/get-comments?serviceId=${serviceId}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const comments = await response.json();
        displayComments(comments); 
    } catch (error) {
        console.error('Error fetching comments:', error);
        document.getElementById('comment-list').innerHTML = '<p>Error loading comments. Please try again later.</p>';
    }
}

function displayComments(comments) {
    const commentList = document.getElementById('comment-list');
    commentList.innerHTML = ''; 

    
    if (comments.length === 0) {
        commentList.innerHTML = '<p>No comments yet. Be the first to leave a comment!</p>';
        return;
    }

    
    comments.forEach(comment => {
        const listItem = document.createElement('li');
        listItem.textContent = `${comment.username}: ${comment.comment} (${comment.rating}★)`; 
        commentList.appendChild(listItem);
    });

    
    const userComment = comments.find(comment => comment.userId === currentUserId);
    if (userComment) {
        const userCommentItem = document.createElement('li');
        userCommentItem.textContent = `Your Comment: ${userComment.comment} (${userComment.rating}★)`; 
        userCommentItem.style.fontWeight = 'bold'; 
        commentList.appendChild(userCommentItem);
    }
}


async function submitRating(rating) {
    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('id');
    const commentText = document.getElementById('comment-text').value; 

    let username;

    try {
        const response = await fetch('/api/user', {
            credentials: 'include' 
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await response.json();
        username = userInfo.username; 

    } catch (error) {
        console.error('Error fetching username:', error);
        document.getElementById('rating-message').textContent = 'Error fetching username. Rating submission failed.';
        return; 
    }

    try {
        await fetchUserInfo();
        const response = await fetch('/api/submit-rating', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ serviceId, rating, comment: commentText, username }), 
        });

        if (!response.ok) {
            const errorResult = await response.json();
            throw new Error(errorResult.message || 'Failed to submit rating');
        }

        
        await fetchServiceDetails(); 
        await fetchComments(serviceId); 

    } catch (error) {
        console.error('Error submitting rating:', error);
        document.getElementById('rating-message').textContent = 'You cannot rate your own service.';
    }
}

async function fetchUserInfo() {
    try {
        const response = await fetch('/api/user', {
            credentials: 'include' 
        });

        if (!response.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await response.json();
        currentUserId = userInfo._id; 

    } catch (error) {
        console.error('Error fetching user info:', error);
        
        document.getElementById('rating-message').textContent = 'Error fetching user info. Please try again.';
    }
}

async function bookService() {
    
    await fetchUserInfo(); 

    const params = new URLSearchParams(window.location.search);
    const serviceId = params.get('id'); 

    
    let service;
    try {
        const serviceResponse = await fetch(`/api/get-services/${serviceId}`);
        if (!serviceResponse.ok) {
            throw new Error('Failed to fetch service details');
        }
        service = await serviceResponse.json(); 
    } catch (error) {
        console.error('Error fetching service details:', error);
        alert('Error fetching service details. Please try again.');
        return; 
    }

    
    try {
        const userResponse = await fetch('/api/user', {
            credentials: 'include'
        });

        if (!userResponse.ok) {
            throw new Error('Failed to fetch user info');
        }

        const userInfo = await userResponse.json();
        
        
        if (userInfo.role === 'provider' && service.providerId.equals(userInfo._id)) {
            alert('You cannot book your own service.');
            return;
        }

        
        const bookingRequest = {
            serviceId: serviceId,
            userId: userInfo._id, 
            providerId: service.providerId 
        };

        const bookingResponse = await fetch('/api/book-service', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingRequest),
            credentials: 'include' 
        });

        if (bookingResponse.ok) {
            const result = await bookingResponse.json();
            alert('Service booked successfully!'); 
        } else {
            const errorResult = await bookingResponse.json();
            throw new Error(errorResult.message || 'Failed to book service');
        }
    } catch (error) {
        console.error('Error booking service:', error);
        alert('Error booking service. Please try again.');
    }
}
window.onload = fetchServiceDetails;
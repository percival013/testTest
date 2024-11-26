document.addEventListener('DOMContentLoaded', async () => {
    try {
      const response = await fetch('/api/get-service-providers', {
        credentials: 'include'
      });
  
      if (response.ok) {
        const serviceProviders = await response.json();
        const tbody = document.querySelector('#serviceProvidersTable tbody');
  
        serviceProviders.forEach(provider => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${provider._id}</td>
            <td>${provider.username}</td>
            <td>${provider.email}</td>
            <td>${provider.role}</td>
          `;
          tbody.appendChild(row);
        });
      } else {
        console.error('Error fetching service providers:', response.statusText);
      }
    } catch (error) {
      console.error('Error fetching service providers:', error);
    }

    try {
        const response = await fetch('/api/get-pending-applications', {
          credentials: 'include'
        });
    
        if (response.ok) {
          const applications = await response.json();
          const tbody = document.querySelector('#applicationsTable tbody');
    
          applications.forEach(application => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td>${application._id}</td>
              <td>${application.userId}</td>
              <td>${application.gender}</td>
              <td>${application.phone}</td>
              <td>${application.proofOfWork}</td>
              <td>
                <button class="approve-button" data-id="${application._id}">Approve</button>
                <button class="remove-button" data-id="${application._id}">Remove</button>
              </td>
            `;
            tbody.appendChild(row);
          });
    
          document.querySelectorAll('.approve-button').forEach(button => {
            button.addEventListener('click', async () => {
                const applicationId = button.getAttribute('data-id');
                await approveApplication(applicationId);
            });
          });
          
          document.querySelectorAll('.remove-button').forEach(button => {
            button.addEventListener('click', async () => {
                const applicationId = button.getAttribute('data-id');
                const userId = button.getAttribute('data-userid');
        
                if (confirm('Are you sure you want to remove this application?')) {
                    try {
                        
                        const response = await fetch(`/api/remove-application/${applicationId}`, {
                            method: 'DELETE',
                            credentials: 'include'
                        });
        
                        if (response.ok) {
                            
                            await fetch(`/api/update-user-role/${userId}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({ isApproved: false }), 
                                credentials: 'include'
                            });
        
                            alert('Application removed successfully!');
                            location.reload(); 
                        } else {
                            const error = await response.json();
                            alert('Error removing application: ' + error.message);
                        }
                    } catch (error) {
                        console.error('Error removing application:', error);
                        alert('Failed to remove application. Please try again later.');
                    }
                }
            });
        });
        } else {
          console.error('Error fetching applications:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }

      try {
        const response = await fetch('/api/get-approved-applications', {
            credentials: 'include'
        });

        if (response.ok) {
            const approvedApplications = await response.json();
            const tbody = document.querySelector('#approvedApplicationsTable tbody');

            approvedApplications.forEach(application => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${application._id}</td>
                    <td>${application.userId}</td>
                    <td>${application.gender}</td>
                    <td>${application.phone}</td>
                    <td>${application.proofOfWork}</td>
                    <td>
                        <button class="remove-button" data-id="${application._id}" data-userid="${application.userId}">Remove</button>
                    </td>
                `;
                tbody.appendChild(row);
            });

            document.querySelectorAll('.remove-button').forEach(button => {
              button.addEventListener('click', async () => {
                  const applicationId = button.getAttribute('data-id');
                  if (confirm('Are you sure you want to remove this application?')) {
                      try {
                          const response = await fetch(`/api/remove-application/${applicationId}`, {
                              method: 'DELETE',
                              credentials: 'include'
                          });
      
                          if (response.ok) {
                              alert('Application removed successfully! User access to service provider mode has been revoked.');
                              location.reload(); 
                          } else {
                              const error = await response.json();
                              alert('Error removing application: ' + error.message);
                          }
                      } catch (error) {
                          console.error('Error removing application:', error);
                          alert('Failed to remove application. Please try again later.');
                      }
                  }
              });
          });
        } else {
            console.error('Error fetching approved applications:', response.statusText);
        }
    } catch (error) {
        console.error('Error fetching approved applications:', error);
    }
});

document.getElementById('redirect-button').addEventListener('click', () => {
    window.location.href = '/index.html';
});

async function approveApplication(applicationId) {
  try {
      const response = await fetch(`/api/update-application-status/${applicationId}`, {
          method: 'PATCH',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: 'approved' }), 
          credentials: 'include' 
      });

      if (response.ok) {
          const result = await response.json();
          alert('Application approved successfully!');
          location.reload(); 
      } else {
          const error = await response.json();
          alert('Error approving application: ' + error.message);
      }
  } catch (error) {
      console.error('Error approving application:', error);
      alert('Failed to approve application. Please try again later.');
  }
}

async function removeApplication(applicationId, userId) {
  if (confirm('Are you sure you want to remove this application?')) {
      try {
          
          const response = await fetch(`/api/remove-application/${applicationId}`, {
              method: 'DELETE',
              credentials: 'include'
          });

          if (response.ok) {
              
              await fetch(`/api/update-user-role/${userId}`, {
                  method: 'PATCH',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ role: 'user' }), 
                  credentials: 'include' 
              });

              alert('Application removed successfully! User role updated to user.');
              location.reload(); 
          } else {
              const error = await response.json();
              alert('Error removing application: ' + error.message);
          }
      } catch (error) {
          console.error('Error removing application:', error);
          alert('Failed to remove application. Please try again later.');
      }
  }
}

async function updateApplicationStatus(applicationId, status) {
    try {
      const response = await fetch(`/api/update-application-status/${applicationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status, isApproved: true }),
        credentials: 'include' 
      });
  
      if (response.ok) {
        const application = await response.json();
  
        
        if (status === 'approved') {
          const userResponse = await fetch(`/api/update-user-role/${application.userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'provider' }),
            credentials: 'include' 
          });
  
          if (!userResponse.ok) {
            console.error('Error updating user role:', userResponse.statusText);
          } else {
            alert('Application approved and user role updated to provider.');
          }
        } else if (status === 'removed') {
          
          const userResponse = await fetch(`/api/remove-access/${application.userId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ role: 'user' }),
            credentials: 'include' 
          });
  
          if (!userResponse.ok) {
            console.error('Error removing user access:', userResponse.statusText);
          } else {
            alert('User  access removed and role updated back to user.');
          }
        }
  
        
        location.reload();
      } else {
        console.error('Error updating application status:', response.statusText);
        alert('Failed to update application status. Please try again.');
      }
    } catch (error) {
      console.error('Error updating application status:', error);
      alert('An error occurred while updating the application status. Please try again later.');
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    await fetchPendingAdvertisementRequests();
    await fetchUploadedServices();
});

async function fetchUploadedServices() {
  try {
      const response = await fetch('/api/get-services', {
          method: 'GET',
          credentials: 'include'
      });

      if (response.ok) {
          const services = await response.json();
          const tbody = document.querySelector('#uploaded-services-table tbody');
          tbody.innerHTML = ''; 

          services.forEach(service => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${service.serviceName}</td>
                  <td>${service.serviceCategory}</td>
                  <td>${service.serviceDescription}</td>
                  <td>${service.averagePrice}</td>
                  <td>${service.providerId.username}</td>
                  <td>
                      <button onclick="removeService('${service._id}')">Remove</button>
                  </td>
              `;
              tbody.appendChild(row);
          });
      } else {
          console.error('Failed to fetch uploaded services:', response.statusText);
      }
  } catch (error) {
      console.error('Error fetching uploaded services:', error);
  }
}

async function fetchPendingAdvertisementRequests() {
  try {
      const response = await fetch('/api/get-advertisement-requests', {
          method: 'GET',
          credentials: 'include'
      });

      if (response.ok) {
          const requests = await response.json();
          const tbody = document.querySelector('#advertisement-requests tbody');
          tbody.innerHTML = ''; 

          requests.forEach(request => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${request._id}</td>
                  <td>${request.serviceName}</td>
                  <td>${request.serviceCategory}
                  <td>${request.serviceDescription}</td>
                  <td>${request.averagePrice}</td>
                  <td>${request.city}</td>
                  <td>${request.province}</td>
                  <td>${request.providerId.username}</td>
                  <td>
                      <button onclick="approveRequest('${request._id}')">Approve</button>
                  </td>
              `;
              tbody.appendChild(row);
          });
      } else {
          console.error('Failed to fetch advertisement requests:', response.statusText);
      }
  } catch (error) {
      console.error('Error fetching advertisement requests:', error);
  }
}

async function approveRequest(requestId) {
  try {
      const response = await fetch(`/api/approve-advertisement/${requestId}`, {
          method: 'POST',
          credentials: 'include'
      });

      if (response.ok) {
          alert('Advertisement request approved successfully!');
          fetchPendingAdvertisementRequests(); 
      } else {
          const error = await response.json();
          alert('Error approving request: ' + error.message);
      }
  } catch (error) {
console.error('Error approving request:', error);
      alert('Failed to approve request. Please try again later.');
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


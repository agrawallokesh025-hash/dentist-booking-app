document.addEventListener('DOMContentLoaded', () => {
    
    // --- AUTHENTICATION ---
    const loginForm = document.getElementById('login-form');
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const navControls = document.getElementById('nav-controls');
    
    // Check if already logged in via sessionStorage token
    const token = sessionStorage.getItem('luxesmile_admin_token');
    if (token) {
        showDashboard();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('luxesmile_admin_token', data.token);
                showDashboard();
            } else {
                document.getElementById('login-error').classList.remove('hidden');
            }
        } catch (err) {
            console.error('Login error', err);
            document.getElementById('login-error').innerText = 'Network error. Could not reach server.';
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('luxesmile_admin_token');
        window.location.reload();
    });

    function showDashboard() {
        loginView.classList.add('hidden');
        dashboardView.classList.remove('hidden');
        navControls.classList.remove('hidden');
        loadData();
    }

    // --- DASHBOARD LOGIC ---
    let allAppointments = [];
    
    async function loadData() {
        try {
            const token = sessionStorage.getItem('luxesmile_admin_token');
            const res = await fetch('/api/appointments/all', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                allAppointments = await res.json();
                updateStats(allAppointments);
                renderTable(allAppointments);
            } else {
                if (res.status === 401 || res.status === 403) {
                    sessionStorage.removeItem('luxesmile_admin_token');
                    window.location.reload();
                }
            }
        } catch (err) {
            console.error('Failed to load dashboard data', err);
        }
    }

    function updateStats(appointments) {
        document.getElementById('stat-total').innerText = appointments.length;
        
        // Count unique patients
        const uniquePhones = new Set(appointments.map(a => a.phone));
        document.getElementById('stat-patients').innerText = uniquePhones.size;
        
        const upcoming = appointments.filter(a => a.status === 'Pending' || a.status === 'Confirmed').length;
        document.getElementById('stat-upcoming').innerText = upcoming;
        
        const completed = appointments.filter(a => a.status === 'Completed').length;
        document.getElementById('stat-completed').innerText = completed;
    }

    // Search and Filter Listeners
    document.getElementById('search-input').addEventListener('input', applyFilters);
    document.getElementById('filter-status').addEventListener('change', applyFilters);
    document.getElementById('sort-date').addEventListener('change', applyFilters);

    function applyFilters() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const status = document.getElementById('filter-status').value;
        const sort = document.getElementById('sort-date').value;

        let filtered = allAppointments.filter(apt => {
            const matchSearch = apt.firstName.toLowerCase().includes(query) || 
                                apt.lastName.toLowerCase().includes(query) ||
                                apt.phone.includes(query);
            const matchStatus = status === 'All' || apt.status === status;
            return matchSearch && matchStatus;
        });

        filtered.sort((a, b) => {
            const dateA = new Date(a.date + 'T' + (a.time || '00:00'));
            const dateB = new Date(b.date + 'T' + (b.time || '00:00'));
            return sort === 'desc' ? dateB - dateA : dateA - dateB;
        });

        renderTable(filtered);
    }

    function renderTable(appointments) {
        const tbody = document.getElementById('appointments-tbody');
        const noData = document.getElementById('no-data-msg');
        
        tbody.innerHTML = '';
        
        if (appointments.length === 0) {
            noData.classList.remove('hidden');
        } else {
            noData.classList.add('hidden');
            
            appointments.forEach(apt => {
                const tr = document.createElement('tr');
                
                let statusBadge = 'bg-gray-100 text-gray-800';
                if (apt.status === 'Pending') statusBadge = 'bg-yellow-100 text-yellow-800';
                if (apt.status === 'Confirmed') statusBadge = 'bg-blue-100 text-blue-800';
                if (apt.status === 'Completed') statusBadge = 'bg-green-100 text-green-800';

                tr.innerHTML = `
                    <td class="px-6 py-4">
                        <div class="font-medium text-secondary">${apt.firstName} ${apt.lastName}</div>
                        <div class="text-xs text-gray-500">${apt.phone}</div>
                    </td>
                    <td class="px-6 py-4">
                        <div class="text-secondary">${apt.service}</div>
                        ${apt.notes ? `<div class="text-xs text-gray-400 truncate max-w-[150px]" title="${apt.notes}">${apt.notes}</div>` : ''}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-secondary">${apt.date}</div>
                        <div class="text-xs text-gray-500">${apt.time}</div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge}">
                            ${apt.status}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right flex items-center justify-end gap-3">
                        <select class="status-select bg-gray-50 border border-gray-200 text-xs rounded p-1 outline-none" data-id="${apt.id}">
                            <option value="Pending" ${apt.status === 'Pending' ? 'selected' : ''}>Pending</option>
                            <option value="Confirmed" ${apt.status === 'Confirmed' ? 'selected' : ''}>Confirm</option>
                            <option value="Completed" ${apt.status === 'Completed' ? 'selected' : ''}>Complete</option>
                        </select>
                        <button class="download-patient-btn text-primary-gold hover:text-secondary transition" data-id="${apt.id}" title="Download Patient Details">
                            <i class="fa-solid fa-download"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Status updates
            document.querySelectorAll('.status-select').forEach(select => {
                select.addEventListener('change', async (e) => {
                    const id = e.target.getAttribute('data-id');
                    const newStatus = e.target.value;
                    const token = sessionStorage.getItem('luxesmile_admin_token');

                    try {
                        const res = await fetch(`/api/appointments/${id}/status`, {
                            method: 'PUT',
                            headers: { 
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({ status: newStatus })
                        });

                        if (res.ok) {
                            const apt = allAppointments.find(a => a.id == id);
                            if (apt) apt.status = newStatus;
                            applyFilters(); 
                            updateStats(allAppointments);
                        }
                    } catch (err) {
                        console.error('Failed to update status', err);
                    }
                });
            });

            // Patient Download Updates
            document.querySelectorAll('.download-patient-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.currentTarget.getAttribute('data-id');
                    const apt = allAppointments.find(a => a.id == id);
                    if (apt) {
                        const headers = ['ID', 'First Name', 'Last Name', 'Phone', 'Email', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Created At'];
                        const row = [
                            apt.id, apt.firstName, apt.lastName, apt.phone, apt.email, apt.service,
                            apt.date, apt.time, apt.status, `"${(apt.notes || '').replace(/"/g, '""')}"`, apt.createdAt
                        ].join(',');
                        
                        const csvContent = [headers.join(','), row].join('\n');
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        link.setAttribute('href', URL.createObjectURL(blob));
                        link.setAttribute('download', `patient_details_${apt.firstName}_${apt.lastName}.csv`);
                        link.style.display = 'none';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    }
                });
            });
        }
    }

    // --- CSV EXPORT ---
    document.getElementById('export-btn').addEventListener('click', () => {
        if (allAppointments.length === 0) return alert('No data to export.');

        const headers = ['ID', 'First Name', 'Last Name', 'Phone', 'Service', 'Date', 'Time', 'Status', 'Notes', 'Created At'];
        const rows = allAppointments.map(apt => {
            return [
                apt.id, apt.firstName, apt.lastName, apt.phone, apt.service,
                apt.date, apt.time, apt.status, `"${(apt.notes || '').replace(/"/g, '""')}"`, apt.createdAt
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.setAttribute('href', URL.createObjectURL(blob));
        link.setAttribute('download', `luxesmile_appointments.csv`);
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });

    // --- ACCOUNT SETTINGS ---
    const usernameForm = document.getElementById('change-username-form');
    const passwordForm = document.getElementById('change-password-form');
    const usernameMsg = document.getElementById('username-msg');
    const passwordMsg = document.getElementById('password-msg');

    function showMessage(element, message, isError) {
        element.textContent = message;
        element.classList.remove('hidden', 'bg-red-50', 'text-red-600', 'border-red-200', 'bg-green-50', 'text-green-600', 'border-green-200');
        if (isError) {
            element.classList.add('bg-red-50', 'text-red-600', 'border-red-200');
        } else {
            element.classList.add('bg-green-50', 'text-green-600', 'border-green-200');
        }
    }

    if (usernameForm) {
        usernameForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newUsername = document.getElementById('new-username').value;
            const token = sessionStorage.getItem('luxesmile_admin_token');

            try {
                const res = await fetch('/api/auth/change-username', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ newUsername })
                });

                const data = await res.json();
                if (res.ok) {
                    showMessage(usernameMsg, data.message || 'Username updated successfully', false);
                    usernameForm.reset();
                } else {
                    showMessage(usernameMsg, data.error || 'Failed to update username', true);
                }
            } catch (err) {
                showMessage(usernameMsg, 'Network error', true);
            }
        });
    }

    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const oldPassword = document.getElementById('old-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const token = sessionStorage.getItem('luxesmile_admin_token');

            if (newPassword !== confirmPassword) {
                return showMessage(passwordMsg, 'New passwords do not match', true);
            }

            try {
                const res = await fetch('/api/auth/change-password', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ oldPassword, newPassword })
                });

                const data = await res.json();
                if (res.ok) {
                    showMessage(passwordMsg, data.message || 'Password updated successfully', false);
                    passwordForm.reset();
                } else {
                    showMessage(passwordMsg, data.error || 'Failed to update password', true);
                }
            } catch (err) {
                showMessage(passwordMsg, 'Network error', true);
            }
        });
    }

});

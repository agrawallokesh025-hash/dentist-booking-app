document.addEventListener('DOMContentLoaded', () => {
    
    const loginView = document.getElementById('login-view');
    const otpView = document.createElement('div'); // Dynamically create OTP view
    const dashboardView = document.getElementById('dashboard-view');
    const navControls = document.getElementById('nav-controls');
    
    // Inject OTP view HTML
    otpView.id = 'otp-view';
    otpView.className = 'max-w-md mx-auto bg-white p-8 sm:p-12 rounded-3xl shadow-lg border border-gray-100 text-center hidden';
    otpView.innerHTML = `
        <h1 class="text-3xl font-serif font-bold text-secondary mb-4">Verify Identity</h1>
        <p class="text-gray-500 mb-8">We've sent a 6-digit code to <span id="display-phone" class="font-bold text-secondary"></span></p>
        <form id="otp-form" class="space-y-6">
            <div id="otp-error" class="hidden bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200">Invalid code.</div>
            <div class="text-left">
                <input id="otp-input" type="text" required maxlength="6" class="w-full px-4 py-3 border border-gray-200 rounded-xl text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-primary-gold outline-none transition" placeholder="------">
            </div>
            <button type="submit" class="w-full btn-primary py-4 shadow-lg text-lg">Verify & Access</button>
        </form>
    `;
    document.querySelector('main > div').insertBefore(otpView, dashboardView);

    let currentPhone = '';
    let allAppointments = [];
    let activeTab = 'upcoming';

    // Session Check
    const token = sessionStorage.getItem('luxesmile_patient_token');
    if (token) {
        fetchHistory(token);
    }

    // Step 1: Request OTP
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        currentPhone = document.getElementById('phone-input').value.trim();
        
        try {
            const res = await fetch('/api/patients/request-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: currentPhone })
            });
            
            if (res.ok) {
                const data = await res.json();
                document.getElementById('display-phone').innerText = currentPhone;
                loginView.classList.add('hidden');
                otpView.classList.remove('hidden');
                
                // Auto-fill OTP for testing purposes since real SMS isn't connected
                if (data.devOtp) {
                    document.getElementById('otp-input').value = data.devOtp;
                }
            } else {
                document.getElementById('login-error').innerText = 'Failed to send OTP. Please try again.';
                document.getElementById('login-error').classList.remove('hidden');
            }
        } catch (err) {
            console.error(err);
        }
    });

    // Step 2: Verify OTP
    document.getElementById('otp-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const code = document.getElementById('otp-input').value.trim();
        
        try {
            const res = await fetch('/api/patients/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: currentPhone, code })
            });
            
            if (res.ok) {
                const data = await res.json();
                sessionStorage.setItem('luxesmile_patient_token', data.token);
                fetchHistory(data.token);
            } else {
                document.getElementById('otp-error').classList.remove('hidden');
            }
        } catch (err) {
            console.error(err);
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        sessionStorage.removeItem('luxesmile_patient_token');
        window.location.reload();
    });

    async function fetchHistory(token) {
        try {
            const res = await fetch('/api/patients/history', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.ok) {
                allAppointments = await res.json();
                loginView.classList.add('hidden');
                otpView.classList.add('hidden');
                dashboardView.classList.remove('hidden');
                navControls.classList.remove('hidden');
                renderAppointments();
            } else {
                sessionStorage.removeItem('luxesmile_patient_token');
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        }
    }

    // Tabs
    const tabUpcoming = document.getElementById('tab-upcoming');
    const tabPast = document.getElementById('tab-past');

    tabUpcoming.addEventListener('click', () => {
        activeTab = 'upcoming';
        tabUpcoming.classList.add('text-primary-gold', 'border-b-2', 'border-primary-gold');
        tabUpcoming.classList.remove('text-gray-500');
        tabPast.classList.remove('text-primary-gold', 'border-b-2', 'border-primary-gold');
        tabPast.classList.add('text-gray-500');
        renderAppointments();
    });

    tabPast.addEventListener('click', () => {
        activeTab = 'past';
        tabPast.classList.add('text-primary-gold', 'border-b-2', 'border-primary-gold');
        tabPast.classList.remove('text-gray-500');
        tabUpcoming.classList.remove('text-primary-gold', 'border-b-2', 'border-primary-gold');
        tabUpcoming.classList.add('text-gray-500');
        renderAppointments();
    });

    function renderAppointments() {
        const listContainer = document.getElementById('appointments-list');
        const emptyState = document.getElementById('empty-state');
        
        listContainer.innerHTML = '';
        
        const todayStr = new Date().toISOString().split('T')[0];
        
        let filtered = allAppointments.filter(apt => {
            if (activeTab === 'upcoming') {
                return apt.date >= todayStr && apt.status !== 'Completed';
            } else {
                return apt.date < todayStr || apt.status === 'Completed';
            }
        });

        if (filtered.length === 0) {
            emptyState.classList.remove('hidden');
        } else {
            emptyState.classList.add('hidden');
            
            filtered.forEach(apt => {
                const card = document.createElement('div');
                card.className = 'bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition';
                
                let statusBadge = 'bg-gray-100 text-gray-800';
                if (apt.status === 'Pending') statusBadge = 'bg-yellow-100 text-yellow-800';
                if (apt.status === 'Confirmed') statusBadge = 'bg-blue-100 text-blue-800';
                if (apt.status === 'Completed') statusBadge = 'bg-green-100 text-green-800';

                const dateObj = new Date(apt.date);
                const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'long', day: 'numeric' });

                card.innerHTML = `
                    <div class="flex items-start gap-4">
                        <div class="bg-primary-gold bg-opacity-10 w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0">
                            <i class="fa-solid fa-tooth text-primary-gold text-xl"></i>
                        </div>
                        <div>
                            <h3 class="font-bold text-secondary text-lg">${apt.service}</h3>
                            <div class="text-gray-500 text-sm mt-1 flex items-center gap-3">
                                <span><i class="fa-regular fa-calendar mr-1"></i> ${formattedDate}</span>
                                <span><i class="fa-regular fa-clock mr-1"></i> ${apt.time}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${statusBadge}">${apt.status}</span>
                    </div>
                `;
                listContainer.appendChild(card);
            });
        }
    }
});

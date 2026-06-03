document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('booking-form');
    const phoneInput = document.getElementById('phone');
    const modalContainer = document.getElementById('modal-container');

    // Fields to validate
    const requiredFields = [
        { id: 'firstName', label: 'First Name' },
        { id: 'lastName', label: 'Last Name' },
        { id: 'phone', label: 'Phone Number' },
        { id: 'service', label: 'Service of Interest' },
        { id: 'prefDate', label: 'Preferred Date' },
        { id: 'prefTime', label: 'Preferred Time' }
    ];

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let isValid = true;
        let firstInvalidElement = null;

        // Reset previous errors
        requiredFields.forEach(field => {
            const el = document.getElementById(field.id);
            el.classList.remove('border-red-500', 'ring-red-500');
            el.classList.add('border-gray-200');
        });

        // Validate basic empties
        requiredFields.forEach(field => {
            const el = document.getElementById(field.id);
            if (!el.value || el.value.trim() === '') {
                isValid = false;
                el.classList.remove('border-gray-200');
                el.classList.add('border-red-500', 'ring-red-500');
                if (!firstInvalidElement) {
                    firstInvalidElement = el;
                }
            }
        });

        // Phone 10-digit Validation
        const phoneEl = document.getElementById('phone');
        const phoneVal = phoneEl.value.trim().replace(/\D/g, ''); // strip non-digits
        if (phoneVal.length !== 10) {
            isValid = false;
            phoneEl.classList.remove('border-gray-200');
            phoneEl.classList.add('border-red-500', 'ring-red-500');
            if (!firstInvalidElement) firstInvalidElement = phoneEl;
        }

        if (!isValid) {
            showModal('Validation Error', 'Please fill the valid information', 'error');
            const y = firstInvalidElement.getBoundingClientRect().top + window.scrollY - 100;
            window.scrollTo({top: y, behavior: 'smooth'});
            firstInvalidElement.focus();
            return;
        }

        // Collect data
        const payload = {
            firstName: document.getElementById('firstName').value.trim(),
            lastName: document.getElementById('lastName').value.trim(),
            email: document.getElementById('email').value.trim(),
            phone: document.getElementById('phone').value.trim(),
            service: document.getElementById('service').value,
            date: document.getElementById('prefDate').value,
            time: document.getElementById('prefTime').value,
            notes: document.getElementById('notes').value.trim()
        };

        try {
            // Target the new Node.js Backend API
            const response = await fetch('/api/appointments/book', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error('Failed to book appointment');
            }

            // Show success
            showModal('Success!', 'Your appointment request has been received successfully. Our team will contact you shortly.', 'success');
            form.reset();
            
        } catch (error) {
            console.error(error);
            showModal('Error', 'An unexpected error occurred connecting to the server. Please try again or contact us via WhatsApp.', 'error');
        }
    });

    function showModal(title, message, type) {
        const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
        const icon = type === 'success' ? 'fa-check-circle' : 'fa-circle-exclamation';
        
        modalContainer.innerHTML = `
            <div id="active-modal" class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity duration-300 opacity-0">
                <div class="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden transform scale-95 transition-transform duration-300">
                    <div class="${bgColor} p-6 text-white text-center">
                        <i class="fa-solid ${icon} text-5xl mb-2"></i>
                        <h3 class="text-2xl font-serif font-bold">${title}</h3>
                    </div>
                    <div class="p-6 text-center">
                        <p class="text-gray-600 mb-6">${message}</p>
                        <button id="close-modal-btn" class="btn-primary w-full shadow-md">Close</button>
                    </div>
                </div>
            </div>
        `;

        requestAnimationFrame(() => {
            const modal = document.getElementById('active-modal');
            modal.classList.remove('opacity-0');
            modal.children[0].classList.remove('scale-95');
        });

        document.getElementById('close-modal-btn').addEventListener('click', () => {
            const modal = document.getElementById('active-modal');
            modal.classList.add('opacity-0');
            modal.children[0].classList.add('scale-95');
            setTimeout(() => {
                modalContainer.innerHTML = '';
            }, 300);
        });
    }
});

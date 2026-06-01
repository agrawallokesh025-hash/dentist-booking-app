/**
 * LuxeSmile Database System
 * 
 * Simulated backend architecture using LocalStorage for the client-side prototype.
 * Provides a professional async API mimicking a real SQL/NoSQL database.
 */

class Database {
    constructor() {
        this.DB_KEY = 'luxesmile_db';
        this.initializeDB();
    }

    initializeDB() {
        const data = localStorage.getItem(this.DB_KEY);
        if (!data) {
            const initialSchema = {
                patients: [],
                appointments: [],
                notifications: [],
                adminUsers: [{ username: 'admin', password: 'password123' }],
                services: [
                    'General Consultation', 
                    'Cosmetic Dentistry', 
                    'Dental Implants', 
                    'Invisalign / Orthodontics', 
                    'Other'
                ]
            };
            localStorage.setItem(this.DB_KEY, JSON.stringify(initialSchema));
        }
    }

    async _read() {
        return new Promise(resolve => {
            setTimeout(() => {
                resolve(JSON.parse(localStorage.getItem(this.DB_KEY)));
            }, 100); // Simulate network latency
        });
    }

    async _write(data) {
        return new Promise(resolve => {
            setTimeout(() => {
                localStorage.setItem(this.DB_KEY, JSON.stringify(data));
                resolve(true);
            }, 100);
        });
    }

    // --- PATIENTS ---

    async getPatientByPhone(phone) {
        const db = await this._read();
        return db.patients.find(p => p.phone === phone) || null;
    }

    async savePatient(patientData) {
        const db = await this._read();
        const existingIndex = db.patients.findIndex(p => p.phone === patientData.phone);
        
        if (existingIndex >= 0) {
            // Update existing
            db.patients[existingIndex] = { ...db.patients[existingIndex], ...patientData };
        } else {
            // Create new
            patientData.id = 'pat_' + Date.now();
            patientData.createdAt = new Date().toISOString();
            db.patients.push(patientData);
        }
        
        await this._write(db);
        return await this.getPatientByPhone(patientData.phone);
    }

    async getAllPatients() {
        const db = await this._read();
        return db.patients;
    }

    // --- APPOINTMENTS ---

    async createAppointment(appointmentData) {
        const db = await this._read();
        
        const appointment = {
            id: 'apt_' + Date.now(),
            ...appointmentData,
            status: 'Pending',
            createdAt: new Date().toISOString()
        };
        
        db.appointments.push(appointment);
        await this._write(db);
        
        // Trigger notification
        await this.createNotification(appointment);
        
        return appointment;
    }

    async getAppointmentsByPhone(phone) {
        const db = await this._read();
        return db.appointments.filter(a => a.phone === phone).sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    async getAllAppointments() {
        const db = await this._read();
        return db.appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    async updateAppointmentStatus(id, newStatus) {
        const db = await this._read();
        const apt = db.appointments.find(a => a.id === id);
        if (apt) {
            apt.status = newStatus;
            await this._write(db);
            return true;
        }
        return false;
    }

    // --- NOTIFICATIONS ---

    async createNotification(appointment) {
        const db = await this._read();
        const notification = {
            id: 'notif_' + Date.now(),
            message: `New booking: ${appointment.firstName} ${appointment.lastName} for ${appointment.service}`,
            appointmentId: appointment.id,
            read: false,
            createdAt: new Date().toISOString()
        };
        db.notifications.push(notification);
        await this._write(db);
        
        // Note: Future Twilio/WhatsApp integration hooks would go here
        console.log(`[SYSTEM] Notification generated for ${appointment.phone}`);
    }
}

// Global instance
window.LuxeDB = new Database();

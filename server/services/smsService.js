// const twilio = require('twilio');

/**
 * SMS Service Module
 * Modular architecture ready for Twilio or MSG91 integration.
 * Currently simulates the SMS behavior for local development without active API keys.
 */
class SmsService {
    constructor() {
        // Uncomment below and provide keys in production .env file
        // this.accountSid = process.env.TWILIO_ACCOUNT_SID;
        // this.authToken = process.env.TWILIO_AUTH_TOKEN;
        // this.fromPhone = process.env.TWILIO_PHONE_NUMBER;
        // this.client = twilio(this.accountSid, this.authToken);
    }

    async sendOtp(phone, otpCode) {
        const message = `Your LuxeSmile Clinic verification code is: ${otpCode}. It expires in 5 minutes.`;
        return this._mockSend(phone, message);
        
        /* Production code:
        return await this.client.messages.create({
            body: message,
            from: this.fromPhone,
            to: phone
        });
        */
    }

    async sendAppointmentConfirmation(phone, details) {
        const message = `LuxeSmile: Your appointment for ${details.service} on ${details.date} at ${details.time} is Confirmed.`;
        return this._mockSend(phone, message);
    }

    async sendStatusUpdate(phone, newStatus, details) {
        const message = `LuxeSmile: Your appointment on ${details.date} is now ${newStatus}.`;
        return this._mockSend(phone, message);
    }

    _mockSend(phone, message) {
        console.log(`\n[SMS SIMULATION] To: ${phone}\n[MESSAGE]: ${message}\n`);
        return Promise.resolve({ success: true, simulated: true });
    }
}

module.exports = new SmsService();

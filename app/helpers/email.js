const pool = require('../db');
const nodemailer = require("nodemailer");
const mailjetTransporter = require('nodemailer-mailjet-transport');
const env = require("../../env.json");
const QRCode = require('qrcode');
const mailjetKey = env.mailjet_key;
const mailjetSecret = env.mailjet_secret_key;

const transporter = nodemailer.createTransport(mailjetTransporter({
    auth: {
        apiKey: mailjetKey,
        apiSecret: mailjetSecret
    }
}));

const generateQRCode = async (url) => {
    try {
        const dataUrl = await QRCode.toDataURL(url);
        return dataUrl;
    } catch (error) {
        console.error('Error creating qr code', error);
        throw error;
    }
}

const sendEventReminder = async (user_email) => {
    const daysBeforeEvent = 7;
    const today = new Date();
    const formattedTodayDate = today.toISOString().split('T')[0];

    console.log(`Starting sendEventReminder for user: ${user_email} on ${formattedTodayDate}`);

    try {
        const result = await pool.query('SELECT * FROM events');
        const events = result.rows;
        
        console.log(`Fetched ${events.length} events from the database`);

        const upcomingEvents = events.filter(event => {
            const eventDate = new Date(event.event_date);

            const reminderDate = new Date(eventDate);
            reminderDate.setDate(eventDate.getDate() - daysBeforeEvent);
            const formattedReminderDate = reminderDate.toISOString().split('T')[0];

            console.log(`Today Date: ${formattedTodayDate}`);
            console.log(`Reminder Date: ${formattedReminderDate}`);
            console.log(`Checking event: ${event.event_name} (Date: ${formattedReminderDate})`);

            return formattedTodayDate === formattedReminderDate; 
        });

        console.log(`${upcomingEvents.length} total events upcoming`);
        console.log("sorting events by time");

        upcomingEvents.sort((a, b) => {
            const dateA = new Date(a.event_date);
            const dateB = new Date(b.event_date);

            return dateA - dateB;
        })
        
        if(upcomingEvents.length > 0){
            const eventList = upcomingEvents.map((event, index) => {
                const eventDate = new Date(event.event_date);
                const formattedEventDate = eventDate.toISOString().split('T')[0];
                const formattedEventTime = eventDate.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });

                return `
                    <p><strong>Event ${index + 1}:</strong></p>
                    <p><strong>${event.event_name}</strong>, is happening on ${formattedEventDate}, ${formattedEventTime} @ ${event.address}.</p>
                `;
            }).join('<hr>');
            

            const mail = {
                from: '"Event Registration" <do-not-reply.events_uvuch@outlook.com>',
                to: user_email,
                subject: `Reminder: Upcoming event${upcomingEvents.length > 1 ? 's' : ''}`,
                //text: "",
                html: `
                    <html>
                    <body>
                        <p>Hi there,</p>
                        <p>Just a friendly reminder that you have ${upcomingEvents.length} event${upcomingEvents.length > 1 ? 's' : ''} coming up in ${daysBeforeEvent} days:</p>
                        ${eventList}
                        <p>Looking forward to seeing you there!</p>
                        <p>Best regards,<br>Event Team</p>
                    </body>
                    </html>
                `,
            };

            console.log(`Sending email to: ${user_email}`);
    
            try {
                await transporter.sendMail(mail);
            } catch (error) {
                console.error('Error sending email:', error.message);
            }
            console.log(`Successfully sent to: ${user_email}`)
        }
    } catch (error) {
        console.error('sendEventReminder Error:', error.message);
        throw error;
    }
};

const sendPaymentConfirmation = async (user_email, amount, eventName) => {
    try {
        const qrCodeUrl = await generateQRCode('https://www.youtube.com/watch?v=p7YXXieghto');
        console.log(qrCodeUrl);

        const mail = {
            from: '"Event Registration" <do-not-reply.events_uvuch@outlook.com>',
            to: user_email,
            subject: `Event Payment Confirmation`,
            attachDataUrls: true,
            //text: "",
            html: `
                <html>
                <body>
                    <p>Hi there,</p>
                    <p>Thank you for your payment for the event: <strong>${eventName}</strong></p>
                    <p>Your total payment amount is: <strong>${amount} USD</strong>.</p>
                    <p>We are looking forward to seeing you at the event!</p>
                    <p>Please find the QR code below:</p>
                    <img src="${qrCodeUrl}" alt="QR Code" />
                    <p>Best regards,</p>
                    <p>The Event Team</p>
                </body>
                </html>
            `,
        };

        console.log(`Sending email to: ${user_email}`);

        try {
            await transporter.sendMail(mail);
        } catch (error) {
            console.error('Error sending email:', error.message);
        }
        console.log(`Successfully sent to: ${user_email}`)
    } catch (error) {
        console.error('sendPaymentConfirmation Error:', error.message);
        throw error;
    }
}

module.exports = {
    sendEventReminder,
    sendPaymentConfirmation
};
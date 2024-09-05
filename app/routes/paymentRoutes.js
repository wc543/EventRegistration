const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authenticateToken');
const env = require("../../env.json");
const stripeKey = env.stripe_key;
const domain = env.domain;
const { sendPaymentConfirmation } = require('../helpers/email');
const stripe = require('stripe')(stripeKey);

router.post('/create-checkout-session', authMiddleware, async (req, res) => {
    try{
        const user_email = req.user.email;
        const { price, event_name } = req.body;

        const amount = Math.round(price * 100);

        console.log("amount:", amount);

        const customer = await stripe.customers.create({
            email: user_email,
        });

        const session = await stripe.checkout.sessions.create({
            customer: customer.id,
            line_items: [{
                price_data: {
                    unit_amount: amount,
                    currency: 'usd',
                    product_data: {
                        name: `${event_name}`,
                    }
                },
                quantity: 1,
        }],
            metadata: {
                event_name: event_name,
            },
            mode: 'payment',
            payment_method_types: ['card'],
            success_url: `${domain}/api/order/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${domain}/events`,
        });
        res.json({ url: session.url });
    } catch (error) {
        console.error('Error creating checkout:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/order/success', async (req, res) => {
    try {
        const session = await stripe.checkout.sessions.retrieve(req.query.session_id);

        console.log('Session Object:', session);

        if(!session.customer){
            return res.status(400).send('No customer found for this session');
        }
        
        const customer = await stripe.customers.retrieve(session.customer);
        const amount = session.amount_total / 100;
        const email = customer.email;
        const eventName = session.metadata.event_name;

        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Order Success</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        text-align: center;
                        padding: 20px;
                    }
                    .success-message {
                        font-size: 1.5em;
                        color: #4CAF50;
                    }
                    .button {
                        display: inline-block;
                        padding: 10px 20px;
                        margin-top: 20px;
                        font-size: 1em;
                        color: white;
                        background-color: #007bff;
                        border: none;
                        border-radius: 5px;
                        text-decoration: none;
                        cursor: pointer;
                    }
                    .button:hover {
                        background-color: #0056b3;
                    }
                </style>
            </head>
            <body>
                <h1 class="success-message">Thanks for your order!</h1>
                <p>Your order total is ${amount} ${session.currency.toUpperCase()}.</p>
                <p>A confirmation email has been sent to ${email} with event details.</p>
                <a href="${domain}/events" class="button">Return to Events</a>
            </body>
            </html>
        `);

        sendPaymentConfirmation(email, amount, eventName).catch(error => {
            console.error('Failed to send confirmation email', error);
        });
    } catch (error) {
        console.error('Error retrieving success:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
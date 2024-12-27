// Load required modules
const express = require('express');
const stripe = require('stripe')('sk_test_YOUR_SECRET_KEY'); // Replace with your Stripe secret key
const ejs = require('ejs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();
const PORT = 3000;

// Middleware
app.use(express.static('public')); // Serve static files like CSS and images
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// Set EJS as the template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Root route that serves the HTML page
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle the payment process
app.post('/create-checkout-session', async (req, res) => {
    try {
        // Create a new checkout session using Stripe
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'HairSheen Product',
                        },
                        unit_amount: 5000, // Price in cents ($50)
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `http://localhost:${PORT}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:${PORT}/cancel`,
        });

        // Redirect the user to Stripe's checkout page
        res.redirect(303, session.url);
    } catch (err) {
        console.error(err);
        res.status(500).send('Error creating Stripe session');
    }
});

// Success page route
app.get('/success', (req, res) => {
    res.render('success', { sessionId: req.query.session_id });
});

// Cancel page route
app.get('/cancel', (req, res) => {
    res.render('cancel');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

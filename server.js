require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());
app.use(cors());

// This is the route your frontend will call
app.post('/gemini', async (req, res) => {
    try {
        // 1. Get the message from your frontend
        const userMessage = req.body.message;

        // 2. Prepare the request for Google Gemini
        // We use the "gemini-1.5-flash" model (it's fast and free/cheap)
        const API_KEY = process.env.GEMINI_API_KEY;
        const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        // 3. Send data to Gemini
        const response = await fetch(apiURL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: userMessage }]
                }]
            })
        });

        const data = await response.json();

        // 4. Handle errors if Gemini rejects the request
        if (!response.ok) {
            console.error("Gemini Error:", data);
            return res.status(500).json({ error: data.error.message || "Error from Gemini" });
        }

        // 5. Send just the answer text back to your frontend
        const botReply = data.candidates[0].content.parts[0].text;
        res.json({ reply: botReply });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
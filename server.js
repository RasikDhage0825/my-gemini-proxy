require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cors({ origin: '*' })); // Allow Vercel to access

app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// =======================================================
// 🔄 API KEY ROTATION LOGIC
// =======================================================

// 1. Load keys from Environment Variables (Safer for Render)
const allKeys = [
    process.env.GROQ_API_KEY_1,
    process.env.GROQ_API_KEY_2,
    process.env.GROQ_API_KEY_3
].filter(key => key); // This removes any undefined keys if you only have 1 or 2

app.post('/gemini', async (req, res) => {
    try {
        const userMessage = req.body.message;

        // 2. CHECK IF WE HAVE KEYS
        if (allKeys.length === 0) {
            return res.status(500).json({ reply: "Server Error: No API Keys configured." });
        }

        // 3. RANDOMLY PICK ONE KEY
        const randomKey = allKeys[Math.floor(Math.random() * allKeys.length)];
        
        // (Optional) Print which key is being used to the console logs
        console.log(`Using Key ending in: ...${randomKey.slice(-5)}`);

        // 4. CALL THE API WITH THE RANDOM KEY
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${randomKey}` // ⬅️ USE THE SELECTED KEY
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [
                    { role: "system", content: "You are a helpful electronics tutor. Keep answers short." },
                    { role: "user", content: userMessage }
                ]
            })
        });

        const data = await response.json();
        
        if (data.error) {
            console.error("Groq Error:", data.error);
            return res.json({ reply: "Error from AI provider." });
        }

        res.json({ reply: data.choices[0].message.content });

    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ reply: "Internal Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
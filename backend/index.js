require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENAI_API_KEY);

app.post('/api/generate-red-flag-question', async (req, res) => {
    try {
        const prompt = `
Generate a hilarious, relationship-themed scenario question and four multiple-choice answers (a, b, c, d) in the style of Chris Rock, Dave Chappelle, Samuel L. Jackson, and Wanda Sykes. The answers should be witty, bold, and have the comedic edge and attitude of these comedians. 
IMPORTANT: Do NOT include the comedian's name or attribution in the answers. Just write the answer in their style, not as a quote or with a name.
ALSO IMPORTANT: Do NOT use harsh language in the scenario or answers. Keep the humor sharp and witty, but PG-13. For each question, generate exactly two answers that would be considered positive or relationship goals, and two answers that would be considered red flags. Do not label them as such, but make it clear from the content.
Format your response as JSON:
{
  "scenario": "Your scenario here",
  "choices": {
    "a": "Choice A",
    "b": "Choice B",
    "c": "Choice C",
    "d": "Choice D"
  }
}
`;

        // Changed model from "gemini-pro" to "gemini-2.0-flash" for better compatibility
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(prompt);

        // Extract the text from the response
        const text = result.response.candidates[0].content.parts[0].text;

        // Parse the AI's response as JSON
        let data;
        try {
            data = JSON.parse(text);
        } catch (err) {
            console.warn('AI response was not direct JSON, attempting extraction:', text);
            const match = text.match(/\{[\s\S]*\}/);
            if (match) {
                data = JSON.parse(match[0]);
            } else {
                throw new Error("AI response was not valid JSON or could not be extracted:\n" + text);
            }
        }

        res.json({
            type: 'scenario_vote',
            text: data.scenario,
            choices: data.choices,
            pillar: "What Would You Do?"
        });
    } catch (err) {
        console.error('Gemini API error:', err);
        res.status(500).json({ error: "Failed to generate question", details: err.message });
    }
});

// (Optional) For browser GET testing - returns a static sample question
app.get('/api/generate-red-flag-question', (req, res) => {
    res.json({
        type: 'scenario_vote',
        text: "Sample GET: Your partner insists on speaking only in riddles after 7 PM. What's your move?",
        choices: {
            a: "Demand a direct answer, then sigh dramatically.",
            b: "Invest in a riddle dictionary and a Sherlock Holmes hat.",
            c: "Start speaking in interpretive dance, see how they like it.",
            d: "Politely inform them you're fluent only in 'food' and 'sleep'."
        },
        pillar: "Relationship Riddles"
    });
});

app.post('/api/generate-relationship-image', async (req, res) => {
    const { pillar, description } = req.body;
    if (!pillar && !description) {
        return res.status(400).json({ error: "Missing pillar or description" });
    }

    // Use the same Gemini 2.0 Flash model and prompt logic as scenario generation, but for images
    // If description is present, use it as the scenario for the image
    // Otherwise, use the pillar as a fallback
    const prompt = description
        ? `Create a photorealistic, modern, diverse, emotionally expressive image that visually represents this relationship scenario: ${description}. The image should capture the emotional nuance, context, and social dynamics described. Avoid generic or abstract art; make it feel like a real, candid moment.`
        : `Create a photorealistic, modern, diverse, emotionally expressive image that visually represents the relationship pillar of ${pillar}. The scene should be about relationships, not generic, and should be suitable for a game about red flags and relationship goals.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "image/png" }
        });

        // The SDK may return the image as a base64 string or a URL, depending on the API.
        // For demonstration, let's assume it returns a base64 image:
        const base64Image = result.response.candidates[0].content.parts[0].inlineData.data;
        if (base64Image) {
            res.json({ imageUrl: `data:image/png;base64,${base64Image}` });
        } else {
            console.error('No image data returned from Gemini.');
            res.status(500).json({ error: "No image data returned from Gemini." });
        }
    } catch (err) {
        console.error('Gemini Flash API error:', err);
        res.status(500).json({ error: "Failed to generate image", details: err.message });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));


import { RequestHandler } from "express";
import OpenAI from "openai";

// Uses process.env.OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export const estimateValuation: RequestHandler = async (req, res) => {
  try {
    const { title, description, category, revenue, initialInvestment, teamSize, monthlyCampaigners } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ error: "Title, description and category are required." });
    }

    if (process.env.OPENAI_API_KEY) {
      const prompt = `
        You are an expert startup valuator. Based on the following metrics, estimate a fair market asking price for this digital asset/startup in Algerian Dinars (DZD).
        Provide only a JSON response with:
        - estimatedMin (number)
        - estimatedMax (number)
        - reasoning (string, short explanation)
        
        Metrics:
        Title: ${title}
        Description: ${description}
        Category: ${category}
        Revenue: ${revenue || 0} DZD/month
        Initial Investment: ${initialInvestment || 0} DZD
        Team Size: ${teamSize || 1}
        Monthly Customers: ${monthlyCampaigners || 0}
      `;

      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
      });

      const result = JSON.parse(response.choices[0].message.content || "{}");
      return res.json(result);
    } else {
      // Mock response for development
      return res.json({
        estimatedMin: 1500000,
        estimatedMax: 3000000,
        reasoning: "Based on standard market rates for a pre-revenue SaaS app in Algeria."
      });
    }
  } catch (error) {
    console.error("AI estimation error:", error);
    res.status(500).json({ error: "Failed to generate estimation" });
  }
};

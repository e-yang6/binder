import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export type PriceEstimate = {
  estimatedPrice: number;
  priceRange: {
    low: number;
    high: number;
  };
  confidence: number; // 0-100
  reasoning: string;
  marketFactors: string[];
  conditionImpact: string;
};

export type ListingContext = {
  title: string;
  description: string;
  condition: string;
  currentPrice: string;
  category?: string;
};

export async function estimateFairPrice(
  listing: ListingContext,
  opts?: { model?: string }
): Promise<PriceEstimate> {
  const modelName = opts?.model ?? "gemini-2.0-flash-lite";
  
  // Get API key from environment
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || "AIzaSyA_MpscgDugd4s1C6oaDGVaijDE7LquC-E";
  console.log('API Key from environment:', apiKey ? 'Found' : 'Not found');
  console.log('All environment variables:', (import.meta as any).env);
  if (!apiKey) {
    throw new Error("Gemini API key not found. Please set VITE_GEMINI_API_KEY in your .env file");
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      topK: 32,
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          estimatedPrice: {
            type: SchemaType.NUMBER,
            description: "The estimated fair market value in CAD (Canadian dollars)",
          },
          priceRange: {
            type: SchemaType.OBJECT,
            properties: {
              low: {
                type: SchemaType.NUMBER,
                description: "Low end of reasonable price range",
              },
              high: {
                type: SchemaType.NUMBER,
                description: "High end of reasonable price range",
              },
            },
            required: ["low", "high"],
          },
          confidence: {
            type: SchemaType.NUMBER,
            description: "Confidence level 0-100 (higher = more confident)",
          },
          reasoning: {
            type: SchemaType.STRING,
            description: "Brief explanation of the price estimate reasoning",
          },
          marketFactors: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.STRING,
            },
            description: "Key factors that influenced the price estimate",
          },
          conditionImpact: {
            type: SchemaType.STRING,
            description: "How the item's condition affects its value",
          },
        },
        required: ["estimatedPrice", "priceRange", "confidence", "reasoning", "marketFactors", "conditionImpact"],
      },
    },
    systemInstruction: `
You are a conservative market analyst specializing in used goods pricing in Canada. 
Your job is to provide realistic, buyer-focused market value estimates for items listed on Kijiji.

ANALYSIS FRAMEWORK:
1. Research comparable items in the Canadian market
2. Consider condition, age, brand, and market demand
3. Factor in seasonal trends and local market conditions
4. Account for depreciation and wear patterns
5. Be CONSERVATIVE - most estimates should be LOWER than asking price

PRICING GUIDELINES:
- Be CONSERVATIVE and realistic about condition impact (New = 100%, Like New = 80-90%, Good = 60-75%, Fair = 40-60%, Poor = 20-40%)
- Consider brand reputation and reliability
- Factor in market saturation and demand
- Account for local economic conditions
- MOST estimates should be 10-30% LOWER than asking price
- Only estimate higher if the asking price is clearly underpriced

RESPONSE REQUIREMENTS:
- Provide specific reasoning for your estimate
- List key market factors that influenced the price
- Explain how condition affects value
- Give a realistic price range, not just a single number
- Be honest about confidence level
- Be CONSERVATIVE - err on the side of lower estimates

Remember: Your goal is to help buyers avoid overpaying. Most sellers overprice their items.
    `,
  });

  const prompt = `
ANALYZE THIS LISTING FOR FAIR MARKET VALUE:

Title: ${listing.title}
Description: ${listing.description}
Condition: ${listing.condition}
Current Asking Price: ${listing.currentPrice}
${listing.category ? `Category: ${listing.category}` : ''}

Please provide a fair market value estimate based on:
1. Comparable items in the Canadian market
2. The item's condition and age
3. Brand reputation and reliability
4. Current market demand and trends
5. Local economic factors

Consider whether the asking price is fair, overpriced, or underpriced.
  `;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
    });
    
    const response = result.response.text();
    
    // Parse JSON response
    let parsed: Partial<PriceEstimate> = {};
    try {
      parsed = JSON.parse(response);
    } catch {
      // Try to extract JSON from wrapped response
      const jsonMatch = response.match(/\{[\s\S]*\}$/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      }
    }

    // Validate and provide fallbacks
    const estimatedPrice = typeof parsed.estimatedPrice === 'number' ? parsed.estimatedPrice : 0;
    const priceRange = parsed.priceRange || { low: estimatedPrice * 0.8, high: estimatedPrice * 1.2 };
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(100, parsed.confidence)) : 50;
    
    return {
      estimatedPrice: Math.max(0, estimatedPrice),
      priceRange: {
        low: Math.max(0, priceRange.low || estimatedPrice * 0.8),
        high: Math.max(0, priceRange.high || estimatedPrice * 1.2),
      },
      confidence,
      reasoning: parsed.reasoning || "Analysis unavailable",
      marketFactors: Array.isArray(parsed.marketFactors) ? parsed.marketFactors : ["Market analysis unavailable"],
      conditionImpact: parsed.conditionImpact || "Condition impact analysis unavailable",
    };
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get price estimate. Please try again.");
  }
}

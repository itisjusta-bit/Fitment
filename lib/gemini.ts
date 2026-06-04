import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = 'AQ.Ab8RN6KOLWbRsATzeXi_688_54iWsSDXL9GJxuRqAjckUn4pgQ'; 
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

export async function generateFitnessProtocol(userStats: any) {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: "application/json" }
    });

    const prompt = `
      You are an elite personal trainer and nutritionist. Generate a fitness protocol.
      Return a JSON object with this exact structure: 
      { 
        "macros": {"target_calories": 2500, "target_protein": 180, "target_carbs": 250, "target_fat": 70}, 
        "todays_workout": {"title": "Upper Body Hypertrophy", "estimated_minutes": 60}, 
        "todays_meals": [
          {
            "name": "Breakfast", 
            "time": "8:00 AM",
            "food": "Protein Daliya", 
            "calories": 700, "p": 40, "c": 85, "f": 22,
            "items": [
              {"food": "Daliya, cooked", "quantity": 1, "unit": "cup", "calories": 180, "protein": 6, "carbs": 35, "fat": 1},
              {"food": "Paneer bhurji", "quantity": 3, "unit": "tbsp", "calories": 250, "protein": 15, "carbs": 5, "fat": 18}
            ]
          }
        ] 
      }
    `;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
    
  } catch (error) {
    console.warn("API Traffic High, using Fallback Data for Dashboard Preview:", error);
    
    // INSTANT DASHBOARD PREVIEW DATA - NOW WITH INGREDIENT BREAKDOWNS
    return {
      "macros": { "target_calories": 2800, "target_protein": 185, "target_carbs": 300, "target_fat": 70 },
      "todays_workout": { "title": "Upper Body Hypertrophy", "estimated_minutes": 75 },
      "todays_meals": [
        { 
          "name": "Breakfast", "time": "8:00 AM", "food": "Protein Daliya with Paneer Bhurji", 
          "calories": 700, "p": 40, "c": 85, "f": 22,
          "items": [
            {"food": "Daliya, cooked", "quantity": 1.5, "unit": "cup", "calories": 270, "protein": 9, "carbs": 52, "fat": 1.5},
            {"food": "Paneer bhurji", "quantity": 4, "unit": "tbsp", "calories": 330, "protein": 20, "carbs": 6, "fat": 20},
            {"food": "Low-fat milk", "quantity": 1, "unit": "glass", "calories": 100, "protein": 11, "carbs": 27, "fat": 0.5}
          ]
        },
        { 
          "name": "Mid-Morning", "time": "11:00 AM", "food": "Whey Protein & Almonds", 
          "calories": 250, "p": 25, "c": 15, "f": 10,
          "items": [
            {"food": "Whey Protein Isolate", "quantity": 1, "unit": "scoop", "calories": 110, "protein": 24, "carbs": 2, "fat": 0},
            {"food": "Almonds, raw", "quantity": 15, "unit": "grams", "calories": 140, "protein": 1, "carbs": 13, "fat": 10}
          ]
        },
        { 
          "name": "Lunch", "time": "1:30 PM", "food": "Lean Chicken Curry with Brown Rice", 
          "calories": 850, "p": 60, "c": 100, "f": 18,
          "items": [
            {"food": "Chicken Breast, cooked", "quantity": 150, "unit": "grams", "calories": 240, "protein": 46, "carbs": 0, "fat": 5},
            {"food": "Brown Rice, cooked", "quantity": 1.5, "unit": "cup", "calories": 375, "protein": 7, "carbs": 77, "fat": 3},
            {"food": "Yellow Dal", "quantity": 0.5, "unit": "cup", "calories": 235, "protein": 7, "carbs": 23, "fat": 10}
          ]
        },
        { 
          "name": "Evening Snack", "time": "5:00 PM", "food": "Roasted Makhana & Black Coffee", 
          "calories": 150, "p": 5, "c": 25, "f": 4,
          "items": [
            {"food": "Roasted Makhana", "quantity": 1, "unit": "bowl", "calories": 145, "protein": 5, "carbs": 25, "fat": 4},
            {"food": "Black Coffee", "quantity": 1, "unit": "cup", "calories": 5, "protein": 0, "carbs": 0, "fat": 0}
          ]
        },
        { 
          "name": "Dinner", "time": "8:30 PM", "food": "Mutton Keema with Roti", 
          "calories": 850, "p": 55, "c": 80, "f": 30,
          "items": [
            {"food": "Lean Mutton Keema", "quantity": 150, "unit": "grams", "calories": 350, "protein": 45, "carbs": 0, "fat": 20},
            {"food": "Whole Wheat Roti", "quantity": 3, "unit": "pieces", "calories": 360, "protein": 9, "carbs": 60, "fat": 9},
            {"food": "Cucumber Salad", "quantity": 1, "unit": "plate", "calories": 140, "protein": 1, "carbs": 20, "fat": 1}
          ]
        }
      ]
    };
  }
}
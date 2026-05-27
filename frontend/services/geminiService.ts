import { GoogleGenAI } from "@google/genai";

const getClient = () => {
    if (!process.env.API_KEY) {
        throw new Error("API Key is not configured.");
    }
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateStudyPlan = async (topic: string): Promise<string> => {
    try {
        const ai = getClient();
        const systemPrompt = "Você é um assistente ministerial experiente. Crie um esboço de Estudo de Célula sobre o tema. Use formatação Markdown: # para o Título Principal, ## para Seções Principais (Introdução, Versículo, Pontos, Conclusão), ### para Subpontos. Use **negrito** para ênfase e > para versículos bíblicos. Seja inspirador e prático. Não use blocos de código markdown, retorne o texto raw formatado.";
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: topic,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        if (!response.text) {
            throw new Error("No text generated.");
        }
        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};
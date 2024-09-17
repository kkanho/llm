"use server"

// import ModelClient from "@azure-rest/ai-inference";
// import { AzureKeyCredential } from "@azure/core-auth";
import OpenAI from "openai"


const token = process.env.NEXT_PUBLIC_GITHUB_TOKEN
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "gpt-4o";
// const modelName = "meta-llama-3-70b-instruct";

export const askLLM = async (prompt: string) => {

    if (modelName == "gpt-4o") {

        const client = new OpenAI({ baseURL: endpoint, apiKey: token });

        const response = await client.chat.completions.create({
            messages: [
                { role:"system", content: "You are a helpful assistant." },
                { role:"user", content: prompt }
                ],
            model: modelName,
            temperature: 0.8,
            max_tokens: 1000,
            top_p: 1.0
        })

        if (response) {
            return response.choices[0].message.content
        }

    } else {

        // @ts-expect-error no type is given
        const client = new ModelClient(endpoint, new AzureKeyCredential(token));

        const response = await client.path("/chat/completions").post({
            body: {
                messages: [
                    { role: "system", content: "You are a helpful assistant." },
                    { role: "user", content: prompt },
                ],
                model: modelName,
                temperature: 0.0,
                max_tokens: 1000,
            }
        })

        if (response) {
            return response.body.choices[0].message.content
        }
    }
}


export const askLLMWithImage = async (prompt: string, imageUrl: string ) => {

    const client = new OpenAI({ baseURL: endpoint, apiKey: token });

    const response = await client.chat.completions.create({
        messages: [
            { role:"system", content: "You are a helpful assistant." },
            { 
                role:"user", 
                content: [
                    { type: "text", text: prompt},
                    { type: "image_url", image_url: {
                            "url": imageUrl
                        }
                    }
                ]
            }
        ],
        model: modelName,
        temperature: 0.8,
        max_tokens: 1000,
        top_p: 1.0
    })

    if (response) {
        return response.choices[0].message.content
    }
}
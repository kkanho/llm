"use server"

import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";

const token = process.env.GITHUB_TOKEN
const endpoint = "https://models.inference.ai.azure.com";
const modelName = "meta-llama-3-70b-instruct";

export const askLLM = async (prompt: string) => {

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
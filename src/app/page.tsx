"use client"

import { v4 as uuidv4 } from "uuid";
import Markdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send } from "lucide-react";
import { askLLM } from "./actions";
import { useRef, useEffect, useState } from "react";

type Message = {
    id: string;
    type: "prompt" | "response";
    text: string;
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [submitting, setSubmitting] = useState<boolean>(false)
    const messagesRef = useRef<HTMLDivElement>(null)
    const promptInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        console.log(messages)
    }, [messages, setMessages])

    const handleSubmitPrompt = async () => {
        try {
            setSubmitting(true)
            const prompt = promptInputRef.current?.value
            if (!prompt) return
            setMessages((prev) => [...prev, { id: uuidv4(), type: 'prompt', text: prompt }])// Append prompt that user entered
            if (promptInputRef.current != undefined) { 
                promptInputRef.current.value = "" // Clear input text
            }
            const res = await askLLM(prompt)
            
            setMessages((prev) => [...prev, { id: uuidv4(), type: 'response', text: res }])
        } catch (error) {
            console.log(error)
        }
        finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="h-[100dvh] flex flex-col">
            <div className="mx-auto sm:m-auto container h-full md:h-auto flex flex-col min-h-[50dvh] max-h-[100dvh] border p-4 max-w-3xl rounded-md shadow-md">
                <div
                    className="flex-1 flex flex-col h-full min-h-0 md:max-h-[75dvh] overflow-y-auto"
                    ref={messagesRef}
                >
                    {messages.map((message) =>
                        message.text != "" ? (
                            <div
                                key={message.id}
                                className={`flex flex-col gap-2 mb-4 border-2 rounded-lg p-4 w-fit md:max-w-[85%] shadow-lg ${
                                    message.type === "prompt"
                                        ? "self-end"
                                        : "self-start relative"
                                }`}
                            >
                                <Markdown>{message.text}</Markdown>
                            </div>
                        ) : (
                            <></>
                        )
                    )}
                </div>
                <div className="flex gap-2">
                    <Input type="text" name="prompt" placeholder="Ask a question" ref={promptInputRef} required/>
                    <Button type="submit" size="icon" aria-label={`${submitting? "pending": "submit"}`} variant="icon" disabled={submitting} onClick={handleSubmitPrompt}>
                        <Send />
                    </Button>
                </div>
            </div>
        </div>
    );
}


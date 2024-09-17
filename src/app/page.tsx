"use client"

import { v4 as uuidv4 } from "uuid";
import Markdown from "react-markdown";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Paperclip, Plus, Send } from "lucide-react";
import { askLLM, askLLMWithImage } from "./actions";
import { useRef, useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import Image from 'next/image'
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@radix-ui/react-tooltip";

type Message = {
    id: string;
    imageUrl?: string
    imageName?: string
    type: "prompt" | "response";
    text: string;
};

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([])
    const [submitting, setSubmitting] = useState<boolean>(false)
    const [imageFile, setImageFile] = useState<File>()
    const messagesRef = useRef<HTMLDivElement>(null)
    const promptInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (messagesRef.current) {
            messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        console.log(imageFile)
    },[imageFile, setImageFile])

    const handleAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return
        setImageFile(e.target.files[0])
    }


    const convertBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const fileReader = new FileReader()
            fileReader.readAsDataURL(file)
        
            fileReader.onload = () => {
                resolve(fileReader.result as string)
            }
        
            fileReader.onerror = (error) => {
                reject(error)
            }
        })
    }

    const handleSubmitPrompt = async () => {
        try {
            setSubmitting(true)

            const prompt = promptInputRef.current?.value
            if (!prompt) return

            //init
            setMessages((prev) => [...prev, { id: uuidv4(), type: 'prompt', text: prompt }])// Append prompt that user entered
            if (promptInputRef.current != undefined) { 
                promptInputRef.current.value = "" // Clear input text
            }

            if (!imageFile) {
                const res = await askLLM(prompt)
                setMessages((prev) => [...prev, { id: uuidv4(), type: 'response', text: res }])
            } else {
                const imageData = await convertBase64(imageFile)
                const res = await askLLMWithImage(prompt, imageData)
                
                setMessages((prev) => [...prev, { id: uuidv4(), imageUrl: imageData, imageName: imageFile.name, type: 'response', text: res! }])
            }
            
        } catch (error) {
            console.log(error)
        }
        finally {
            setSubmitting(false)
        }
    }

    const handleRemoveFile = () => {
        setImageFile(undefined)
    }

    return (
        <div className="h-[100dvh] flex flex-col">
            <div className="mx-auto sm:m-auto container h-full md:h-auto flex flex-col gap-2 min-h-[50dvh] max-h-[100dvh] border p-2 max-w-3xl rounded-md shadow-md">
                <div
                    className="flex-1 flex flex-col h-[100dvh] min-h-0 w-full md:max-h-[75dvh] overflow-y-scroll px-2"
                    ref={messagesRef}
                >
                    {messages.map((message) =>
                        message.text != "" ? (
                            <div
                                key={message.id}
                                className={`mb-4 border-2 rounded-lg p-4 max-w-full md:max-w-[85%] shadow-lg  ${
                                    message.type === "prompt"
                                        ? "self-end"
                                        : "self-start relative"
                                }`}
                            >
                                {
                                    message.imageUrl && message.imageName? 
                                        <Image 
                                            src={message.imageUrl}
                                            alt={message.imageName}
                                            width={250}
                                            height={300}
                                        />
                                    : <></>
                                }
                                <Markdown>{message.text}</Markdown>
                            </div>
                        ) : (
                            <></>
                        )
                    )}
                </div>
                <div className="flex gap-2">
                    <div className="grid w-10 items-center relative">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger>
                                    <Label htmlFor="files" className={`absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 ${imageFile? "text-red-700": ""}`}>
                                        <Paperclip className="cursor-pointer"/>
                                    </Label>
                                    <Input type="file" id="files" onChange={handleAttachment} className="w-full z-10 invisible" accept="image/png, image/jpeg, image/jpg" disabled={submitting}/>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {
                                        imageFile? 
                                        <div className="flex gap-2 bg-gray-800 rounded-md px-2">
                                            <div className="self-center">
                                                {imageFile.name}
                                            </div>
                                            <Button type="button" size="icon" variant="icon" onClick={handleRemoveFile}>
                                                <Plus className="rotate-45 hover:text-red-600"/>
                                            </Button>
                                        </div>
                                        :<></>
                                    }
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                    <Input type="text" name="prompt" placeholder="Ask a question" ref={promptInputRef} required disabled={submitting} />
                    <Button type="submit" size="icon" aria-label={`${submitting? "pending": "submit"}`} variant="icon" disabled={submitting} onClick={handleSubmitPrompt}>
                        <Send />
                    </Button>
                </div>
            </div>
        </div>
    );
}


import { useEffect, useRef, useState } from "react"
import { v4 as uuidv4 } from 'uuid'
import ModelClient from "@azure-rest/ai-inference";
import { AzureKeyCredential } from "@azure/core-auth";
import { createSseStream } from "@azure/core-sse";
import Markdown from "react-markdown";


type Message = {
  id: string,
  type: 'prompt' | 'response',
  text: string,
}

const token = import.meta.env.VITE_GITHUB_TOKEN
const endpoint = "https://models.inference.ai.azure.com"
const modelName = "meta-llama-3-70b-instruct"

function App() {

  const [prompt, setPrompt] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [submitting, setSubmitting] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (messagesRef.current) {
        messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages])

  const handleQuery = async (e: React.MouseEvent<HTMLElement>) => {
    try {
      e.preventDefault()
      setSubmitting(true)
      
      setMessages((prev) => [...prev, { id: uuidv4(), type: 'prompt', text: prompt }])// Append prompt that user entered
      // @ts-expect-error no type is given
      const client = new ModelClient(endpoint, new AzureKeyCredential(token));

      const res = await client.path("/chat/completions").post({
        body: {
          messages: [
            { role:"system", content: "You are a helpful assistant." },
            { role:"user", content: prompt }
          ],
          model: modelName,
          temperature: 0.0,
          max_tokens: 1000,
          stream: true,
        }
      }).asNodeStream()
      setPrompt("") // Clear the input text


      const stream = res.body
      if (!stream) {
        throw new Error("The response stream is undefined")
      }

      if (res.status !== "200") {
        stream.destroy()
        throw new Error(`Failed to get chat completions, http operation failed with ${res.status} code`)
      }

      const sseStream = createSseStream(stream)

      let done = false;
      let result = ''
      setMessages((prev) => [...prev, { id: uuidv4(), type: 'response', text: result }])// Create an initial empty response message

      for await (const event of sseStream) {
        if (done) break;
        if (event.data !== "[DONE]") {
          for (const choice of (JSON.parse(event.data)).choices) {
            result += choice.delta?.content || ""
            setMessages((prev) => [...prev.slice(0, -1), { id: uuidv4(), type: 'response', text: result }])
          }
        } else {
          done = true
        }
      }

    } catch (error) {
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-[100dvh] flex flex-col">
      <div className="mx-auto sm:m-auto container h-full md:h-auto flex flex-col min-h-[50dvh] max-h-[100dvh] border p-4 max-w-3xl rounded-md shadow-md">
        <div className="flex-1 flex flex-col h-full min-h-0 md:max-h-[75dvh] overflow-y-auto" ref={messagesRef}>
          {
            messages.map((message) => (
              message.text!=""?
                <div key={message.id} className={`flex flex-col gap-2 mb-4 border-2 rounded-lg p-4 w-fit md:max-w-[85%] shadow-lg ${message.type === 'prompt' ? 'self-end' : 'self-start relative'}`}>
                  <Markdown>
                    {message.text}
                  </Markdown>
                </div>
              :<></>
            ))
          }
        </div>
        <div className="flex gap-2">
          <input
              type="text"
              className="flex h-10 w-full rounded-md border bg-inherit px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ask a question"
          />
          <button
              type="submit"
              aria-label="submit"
              onClick={handleQuery}
              disabled={submitting}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border-none bg-inherit hover:opacity-70 h-10 w-10"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-send">
              <path d="m22 2-7 20-4-9-9-4Z" />
              <path d="M22 2 11 13" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}

export default App

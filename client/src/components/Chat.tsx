import React, { useRef, useEffect, useState } from "react";
import MarkdownRenderer from "./MarkdownRenderer";
import TypingBubble from "./TypingBubble";
import { Message, getChatMessages, setChatMessages } from "../lib/types";
import { useParams } from "react-router";
import logoIcon from "../assets/Lovelace_Icon.png";

const API_URL = "http://localhost:3000" || import.meta.env.VITE_BASE_URL;

export default function Chat() {
  const [typingBubble, setTypingBubble] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatError, setErrorMessage] = useState("");
  const [inputText, setInputText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState("");
  const [currentResponse, setCurrentResponse] = useState("");
  const params = useParams();

  // Ref to track the last message for auto-scrolling
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const loadMessages = async () => {
      if (params.id) {
        const storedMessages = await getChatMessages(params.id);
        setMessages(storedMessages);
      }
    };
    loadMessages();
  }, [params]);

  useEffect(() => {    
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
    if (messages && messages.length > 0 && messages[messages.length - 1].role === "user" && !currentResponse) {
      setTypingBubble(true);
    } else {
      setTypingBubble(false);
    }
    setChatId(params.id || "");
  }, [messages, currentResponse, params.id]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    await handleSubmit(e);
  };

  const handleButtonClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    await handleSubmit(e);
  };

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement> | React.MouseEvent<HTMLButtonElement>
  ) => {
    e.preventDefault();
    setErrorMessage("");
    if (!inputText.trim() || isLoading) return;

    // Add user message to chat
    const userMessage: Message = {
      role: "user",
      content: inputText,
    };

    // Update messages with the new user message
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInputText("");
    setIsLoading(true);
    setCurrentResponse("");

    try {
      // Only send to server for streaming response, but store locally
      const response = await fetch(`${API_URL}/chat/${chatId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          messages: updatedMessages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let fullResponse = "";
      setTypingBubble(false);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") {
              break;
            }
            try {
              const parsedData = JSON.parse(data);
              if (parsedData.error) {
                throw new Error(parsedData.message || "An error occurred");
              }
              const contentChunk = parsedData.content || "";
              fullResponse += contentChunk;
              setCurrentResponse(fullResponse);
              if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ behavior: "smooth" });
              }
            } catch (e) {
              console.error("Error parsing JSON:", e);
              throw e;
            }
          }
        }
      }
      if (fullResponse) {
        const assistantMessage: Message = {
          role: "assistant",
          content: fullResponse,
        };
        setTimeout(async () => {
          const finalMessages = [...updatedMessages, assistantMessage];
          setMessages(finalMessages);
          setCurrentResponse("");
          await setChatMessages(chatId, finalMessages);
        }, 100);
      } else {
        await setChatMessages(chatId, updatedMessages);
      }
    } catch (error) {
      console.error("Error:", error);
      let errorMessage =
        "Sorry, there was an error communicating with the character.";
      if (error instanceof Error) {
        if (error.message?.includes("overloaded")) {
          errorMessage =
            "The AI service is currently overloaded. Please try again in a few moments.";
        } else if (error.message?.includes("rate limit")) {
          errorMessage =
            "You've reached the rate limit. Please try again in a few minutes.";
        } else if (error.message?.includes("Network response was not ok")) {
          errorMessage =
            "Unable to connect to the character service. Please check your internet connection.";
        }
      }
      setErrorMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      // Instead of calling handleSubmit, trigger the button click handler
      const submitButton = document.getElementById("chat-submit-btn") as HTMLButtonElement | null;
      if (submitButton) {
        submitButton.click();
      }
      const textarea = document.getElementById("query") as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.style.height = "auto";
      }
    }
  };

  const handleInputResize = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = event.target;
    textarea.style.height = "auto";
    setInputText(event.target.value);
  };

  return (
    <div className="min-h-screenflex flex-col items-center w-full">
      <div className="w-3/4 m-auto px-4 py-12">
        {messages.length === 0 && (
          <div className="flex flex-col items-center mb-12">
            <div className="text-amber-600 mb-2">
              <img src={logoIcon} alt="Lovelace" className="h-8" />
            </div>
            <h1 className="text-5xl font-serif text-gray-800 mb-16">
              Hey there
            </h1>
            <div className="w-full max-w-xl relative">
              <textarea
                id="query"
                autoFocus
                className="w-full p-4 pr-14 rounded-2xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none"
                value={inputText}
                placeholder="How can I help you today?"
                onChange={handleInputResize}
                onKeyDown={handleKeyDown}
                rows={1}
                style={{ overflow: "hidden" }}
              />
              <button 
                className="absolute right-2 bottom-2 p-2 text-white bg-amber-500 rounded-full hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleButtonClick}
                disabled={!inputText.trim() || isLoading}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90, 10, 10)" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {messages.length > 0 && (
          <>
            <div className="space-y-6 mb-24 pb-12">
              {messages.map((m, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {m.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="bg-gray-100 p-4 rounded-xl max-w-[80%]">
                        {m.content}
                      </div>
                    </div>
                  ) : (
                    <div className="flex">
                      <div className="bg-white p-4 rounded-xl max-w-[80%]">
                        <MarkdownRenderer markdownContent={m.content} />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Show streaming response */}
              {currentResponse && (
                <div className="flex">
                  <div className="bg-white p-4 rounded-xl max-w-[80%]">
                    <MarkdownRenderer markdownContent={currentResponse} />
                  </div>
                </div>
              )}

              {typingBubble && (
                <div className="flex mb-10">
                  <div className="bg-white p-3 rounded-xl">
                    <TypingBubble />
                  </div>
                </div>
              )}
              
              {chatError && (
                <div className="text-red-500 text-center w-full">
                  <span>{chatError}</span>
                </div>
              )}
              <div ref={bottomRef} className="pb-10" />
            </div>

            <div className="fixed bottom-0 left-0 right-0 bg-white bg-opacity-90 p-4 border-t border-gray-100">
              <div className="max-w-3xl mx-auto flex items-center">
                <button className="p-2 mr-2 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
                <button className="p-2 mr-2 text-gray-400 hover:text-gray-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.707 3.293a1 1 0 010 1.414L5.414 7H11a7 7 0 017 7v2a1 1 0 11-2 0v-2a5 5 0 00-5-5H5.414l2.293 2.293a1 1 0 11-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </button>
                <form onSubmit={handleFormSubmit} className="flex-1">
                  <textarea
                    id="query"
                    className="w-full p-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-200 resize-none bg-white"
                    value={inputText}
                    placeholder="How can I help you today?"
                    onChange={handleInputResize}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    style={{ overflow: "hidden" }}
                  />
                </form>
                <button 
                  id="chat-submit-btn"
                  className="p-2 ml-2 text-white bg-amber-500 rounded-full hover:bg-amber-600"
                  onClick={handleButtonClick}
                  disabled={!inputText.trim() || isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" transform="rotate(90, 10, 10)" />
                  </svg>
                </button>
              </div>              
            </div>
          </>
        )}
      </div>
    </div>
  );
}
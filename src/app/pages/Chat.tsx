'use client';

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import { MessageSquare, Send, User, Paperclip, Mic, MicOff, LogOut } from "lucide-react";
import { ChatMessage } from "@/app/components/chat/ChatMessage";
import { FilePreview } from "@/app/components/chat/FilePreview";
import { useToast } from "@/app/hooks/use-toast";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  file?: { name: string; type: string; url: string };
}
  
export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useRouter();
  const router = useRouter();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/");
    }
  }, [user, router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
  
      recognitionRef.current.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0])
          .map((result) => result.transcript)
          .join('');
        setInput(transcript);
      };
  
      recognitionRef.current.onerror = () => {
        setIsRecording(false);
        alert("Failed to recognize speech. Please try again.");
      };
    }
  }, [setInput]);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      toast({
        variant: "destructive",
        title: "Not supported",
        description: "Speech recognition is not supported in your browser.",
      });
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          variant: "destructive",
          title: "File too large",
          description: "Please select a file smaller than 10MB.",
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && !selectedFile) || isLoading) return;
  
    let fileData: { name: string; type: string; url: string } | undefined;
    let processedMessages = [...messages];
  
    if (selectedFile) {
      if (selectedFile.type.startsWith("image/")) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
  
        try {
          const base64Data = await base64Promise;
          fileData = {
            name: selectedFile.name,
            type: selectedFile.type,
            url: URL.createObjectURL(selectedFile),
          };
  
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim() || "Analyze this image",
            file: fileData,
          };
  
          setMessages((prev) => [...prev, userMessage]);
          setInput("");
          setSelectedFile(null);
          setIsLoading(true);
  
          const apiMessages = [
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user" as const,
              content: [
                { type: "text" as const, text: userMessage.content },
                { type: "image" as const, image: base64Data },
              ],
            },
          ];
  
          await sendToAPI(apiMessages as { role: string; content: string }[]);
          return;
        } catch {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to process image",
          });
          return;
        }
      } else {
        const reader = new FileReader();
        const textPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(selectedFile);
        });
  
        try {
          const fileContent = await textPromise;
          fileData = {
            name: selectedFile.name,
            type: selectedFile.type,
            url: URL.createObjectURL(selectedFile),
          };
  
          const userMessage: Message = {
            id: crypto.randomUUID(),
            role: "user",
            content: input.trim() || `Uploaded file: ${selectedFile.name}`,
            file: fileData,
          };
  
          setMessages((prev) => [...prev, userMessage]);
          setInput("");
          setSelectedFile(null);
          setIsLoading(true);
  
          const apiMessages = [
            ...messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            {
              role: "user" as const,
              content: `${userMessage.content}\n\nFile content:\n${fileContent}`,
            },
          ];
  
          await sendToAPI(apiMessages);
          return;
        } catch {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to read file content",
          });
          return;
        }
      }
    } else {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: input.trim(),
      };
      processedMessages = [...messages, userMessage];
      setMessages((prev) => [...prev, userMessage]);
    }
  
    setInput("");
    setSelectedFile(null);
    setIsLoading(true);
  
    const apiMessages = processedMessages.map(m => ({
      role: m.role,
      content: m.content,
    }));
  
    await sendToAPI(apiMessages);
  };
  
  const sendToAPI = async (apiMessages: { role: string; content: string }[]) => {
    try {
      const formattedMessages = apiMessages.map(m => ({
        role: m.role,
        content: m.content,
      }));
  
       const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: formattedMessages,
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }
  
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }
  
      const assistantId = crypto.randomUUID();
      let assistantContent = "";
  
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant" as const, content: "" },
      ]);
  
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
  
        const chunk = new TextDecoder().decode(value);
        assistantContent += chunk;
  
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, content: assistantContent } : m
          )
        );
      }
    } catch (error: unknown) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to get AI response.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate.push("/");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 flex flex-col">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg">
              <MessageSquare className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold">AI Chat</h1>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate.push("/profile")}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {messages.length === 0 ? (
            <div className="text-center py-20">
              <div className="mx-auto w-20 h-20 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl mb-6">
                <MessageSquare className="w-10 h-10 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Start a conversation</h2>
              <p className="text-muted-foreground">
                Ask me anything or upload a file to begin
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
              {isLoading && (
                <ChatMessage
                  message={{ role: "assistant", content: "Thinking...", id: "loading" }}
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 max-w-4xl">
          {selectedFile && (
            <div className="mb-3">
              <FilePreview
                file={selectedFile}
                onRemove={() => setSelectedFile(null)}
              />
            </div>
          )}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileSelect}
              accept="image/*,.pdf,.doc,.docx,.txt"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              onClick={toggleRecording}
              disabled={isLoading}
              className={`p-3 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                isRecording ? "bg-red-100 border-red-300" : ""
              }`}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message... (Shift + Enter for new line)"
              className="flex-1 resize-none min-h-[56px] p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={1}
              disabled={isLoading}
            />
            <button
              onClick={handleSend}
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="h-14 w-14 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

import { Bot, User } from "lucide-react";
import { cn } from "../../api/chat/utils";

interface Message {
  id?: string;
  role: "user" | "assistant";
  content: string;
  file?: { name: string; type: string; url: string };
}

export function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-4", isUser ? "flex-row-reverse" : "flex-row")}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 border-primary/20">
        {isUser ? (
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
        ) : (
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
        )}
      </div>

      <div className={cn("flex-1 space-y-2", isUser ? "items-end" : "items-start")}>
        <div
          className={cn(
            "inline-block rounded-2xl px-4 py-3 max-w-[80%] shadow-sm",
            isUser
              ? "bg-primary text-primary-foreground rounded-tr-sm"
              : "bg-muted text-foreground rounded-tl-sm"
          )}
        >
          {message.file && (
            <div className="mb-2">
              {message.file.type.startsWith("image/") ? (
                <img
                  src={message.file.url}
                  alt={message.file.name}
                  className="rounded-lg max-w-full h-auto max-h-64 object-cover"
                />
              ) : (
                <div className="flex items-center gap-2 text-sm p-2 bg-background/50 rounded-lg">
                  <span className="font-medium">{message.file.name}</span>
                </div>
              )}
            </div>
          )}
          <p className="whitespace-pre-wrap break-words">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

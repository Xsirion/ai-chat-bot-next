import { X, FileText } from "lucide-react";

interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

export function FilePreview({ file, onRemove }: FilePreviewProps) {
  const isImage = file.type.startsWith("image/");
  const url = URL.createObjectURL(file);

  return (
    <div className="relative inline-block bg-muted rounded-xl p-2 border border-border">
      <button
        className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
        onClick={onRemove}
        type="button"
      >
        <X className="h-3 w-3" />
      </button>
      {isImage ? (
        <img
          src={url}
          alt={file.name}
          className="h-20 w-20 object-cover rounded-lg"
        />
      ) : (
        <div className="h-20 w-20 flex flex-col items-center justify-center gap-1">
          <FileText className="h-8 w-8 text-muted-foreground" />
          <p className="text-xs text-muted-foreground truncate max-w-full px-1">
            {file.name}
          </p>
        </div>
      )}
    </div>
  );
}

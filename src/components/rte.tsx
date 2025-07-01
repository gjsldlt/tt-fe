import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Enter description...",
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  // Handle formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Set initial content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="border h-full rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center space-x-1 p-2 border-b bg-muted/50">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("bold")}
          className="h-8 w-8 p-0"
          title="Bold"
        >
          <span className="font-bold text-sm">B</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("italic")}
          className="h-8 w-8 p-0"
          title="Italic"
        >
          <span className="italic text-sm">I</span>
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("underline")}
          className="h-8 w-8 p-0"
          title="Underline"
        >
          <span className="underline text-sm">U</span>
        </Button>
        <div className="w-px h-6 bg-border mx-1" />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => execCommand("removeFormat")}
          className="h-8 px-2 text-xs"
          title="Clear Formatting"
        >
          Clear
        </Button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        className="min-h-[120px] p-3 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 prose prose-sm max-w-none"
        style={{ outline: "none" }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}

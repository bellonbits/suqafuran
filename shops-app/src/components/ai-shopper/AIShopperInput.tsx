import React, { useRef, useState } from 'react';
import { Send, Camera, Mic, MicOff } from 'lucide-react';

interface AIShopperInputProps {
  onSendMessage: (text: string) => void;
  onPhotoUpload?: (file: File) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

export const AIShopperInput: React.FC<AIShopperInputProps> = ({
  onSendMessage,
  onPhotoUpload,
  disabled = false,
  placeholder = "Describe your needs (e.g. laptop for coding under 60k)...",
  className = "",
}) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const toggleMic = () => {
    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) {
      alert("Voice input is supported in Chrome, Safari, and Edge. Type your request in the box!");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const rec = new SpeechRec();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-KE';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      rec.onresult = (evt: any) => {
        const transcript = evt.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setText(transcript);
          onSendMessage(transcript);
        }
      };
      rec.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onPhotoUpload) {
      onPhotoUpload(file);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative w-full rounded-2xl sm:rounded-full bg-white dark:bg-neutral-900 border-2 border-slate-200 dark:border-neutral-800 focus-within:border-[#00BFFF] dark:focus-within:border-[#00BFFF] shadow-md flex items-center px-2.5 sm:px-4 py-1 sm:py-1.5 gap-1.5 sm:gap-2 transition-all min-w-0 overflow-hidden box-border ${className}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Visual Search / Camera */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
        title="Upload photo / Visual search"
      >
        <Camera className="w-4 h-4" />
      </button>

      {/* Input Field */}
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder={placeholder}
        className="flex-1 min-w-0 h-9 sm:h-12 bg-transparent text-[16px] sm:text-base font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-neutral-500 focus:outline-none"
      />

      {/* Voice Mic Button */}
      <button
        type="button"
        onClick={toggleMic}
        className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
          isListening
            ? 'bg-rose-500 text-white animate-pulse'
            : 'text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-neutral-800'
        }`}
        title="Voice search"
      >
        {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Send Button - Only active / highlighted when there is text */}
      {text.trim() && (
        <button
          type="submit"
          disabled={disabled}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#00BFFF] hover:bg-[#02CCFE] active:scale-95 text-white flex items-center justify-center shadow-xs transition-all cursor-pointer shrink-0 animate-in fade-in zoom-in-95 duration-150"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      )}
    </form>
  );
};


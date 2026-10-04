import { useState, useEffect, useRef } from "react";

export function useTypewriter(fullText: string, speed = 18, onComplete?: () => void) {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText("");
      setIsTyping(false);
      return;
    }

    const words = fullText.split(" ");
    let currentIndex = 0;
    setDisplayedText("");
    setIsTyping(true);

    const interval = setInterval(() => {
      if (currentIndex < words.length) {
        setDisplayedText((prev) => (prev ? prev + " " + words[currentIndex] : words[currentIndex]));
        currentIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, [fullText, speed]);

  const skip = () => {
    setDisplayedText(fullText);
    setIsTyping(false);
    if (onCompleteRef.current) {
      onCompleteRef.current();
    }
  };

  return { displayedText, isTyping, skip };
}

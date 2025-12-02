import { useState, useEffect } from "react";
import { ytext } from "./yjs-setup";

export function useSharedText() {
  const [value, setValue] = useState(ytext.toString());

  useEffect(() => {
    const updateHandler = () => setValue(ytext.toString());

    ytext.observe(updateHandler);
    return () => ytext.unobserve(updateHandler);
  }, []);

  const setSharedText = (newText: string) => {
    ytext.delete(0, ytext.length);
    ytext.insert(0, newText);
  };

  return [value, setSharedText] as const;
}

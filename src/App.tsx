import { useSharedText } from "./useSharedText";
import ScribbleCanvas from "./scribbleCanvas";

function App() {
  const [text, setText] = useSharedText();

  return (
    <div
      style={{
        display: "block",
        fontFamily: "system-ui, sans-serif"
      }}
    >


      {/* Textarea */}
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      {/* Canvas */}
      <ScribbleCanvas />

    </div>
  );
}

export default App;

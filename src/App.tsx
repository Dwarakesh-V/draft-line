import { useSharedText } from "./useSharedText";
import ScribbleCanvas from "./scribbleCanvas";

function App() {
  const [text, setText] = useSharedText();

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "system-ui, sans-serif",
        padding: "2rem",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2rem",
        }}
      >
        {/* Text Block */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{ marginBottom: "0.5rem" }}>Realtime Shared Text</h1>
          <p>Open this page in two browser windows and start typing.</p>
        </div>

        {/* Textarea centered */}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        {/* Canvas centered */}
        <div
          style={{
            width: "60%",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <ScribbleCanvas />
        </div>
      </div>
    </div>
  );
}

export default App;

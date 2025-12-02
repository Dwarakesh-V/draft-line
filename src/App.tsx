import { useSharedText } from "./useSharedText";

function App() {
  const [text, setText] = useSharedText();

  return (
    <div
      style={{
        padding: "2rem",
        fontFamily: "system-ui, sans-serif",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      <h1>Realtime Shared Text</h1>
      <p>Open this page in two browser windows and start typing.</p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        style={{
          width: "100%",
          height: "200px",
          padding: "1rem",
          fontSize: "1.1rem",
          border: "1px solid #ccc",
          borderRadius: "6px",
        }}
      />
    </div>
  );
}

export default App;

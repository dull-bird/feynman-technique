import React from "react";
import { createRoot } from "react-dom/client";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";

// 每次编辑防抖 800ms 后把场景推给本地服务（excalidraw_loop.py serve --live）
function postScene(elements, appState) {
  fetch("/api/scene", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "excalidraw",
      version: 2,
      source: "excalidraw-loop",
      elements,
      appState: {
        viewBackgroundColor: appState.viewBackgroundColor,
        gridSize: appState.gridSize,
      },
    }),
  }).catch(() => {});
}

function App() {
  const [initialData, setInitialData] = React.useState(null);
  const [savedAt, setSavedAt] = React.useState(null);
  const timer = React.useRef(null);

  React.useEffect(() => {
    fetch("/api/scene")
      .then((r) => r.json())
      .then((scene) => setInitialData(scene))
      .catch(() => setInitialData({ elements: [], appState: {} }));
  }, []);

  const onChange = (elements, appState) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      postScene(elements, appState);
      setSavedAt(new Date().toLocaleTimeString());
    }, 800);
  };

  if (!initialData) return React.createElement("p", null, "加载中…");
  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      "div",
      {
        style: {
          position: "fixed", top: 8, right: 12, zIndex: 999,
          fontSize: 12, color: "#888", fontFamily: "sans-serif",
          background: "rgba(255,255,255,0.8)", padding: "2px 8px",
          borderRadius: 6, pointerEvents: "none",
        },
      },
      savedAt ? `已同步 ${savedAt}` : "编辑后自动同步"
    ),
    React.createElement(
      "div",
      { style: { height: "100vh" } },
      React.createElement(Excalidraw, { initialData, onChange })
    )
  );
}

createRoot(document.getElementById("root")).render(React.createElement(App));

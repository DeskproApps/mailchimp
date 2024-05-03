import React from "react";
import ReactDOM from "react-dom";
import "iframe-resizer/js/iframeResizer.contentWindow.js";
import "./index.css";
import App from "./App";

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById("root")
);

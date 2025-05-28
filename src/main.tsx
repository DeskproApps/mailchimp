import * as Sentry from '@sentry/react';
import './instrument';
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import "./main.css";
import "simplebar/dist/simplebar.min.css";
import { Scrollbar } from "@deskpro/deskpro-ui";

ReactDOM.render(
  <React.StrictMode>
    <Scrollbar style={{height: "100%", width: "100%"}}><App /></Scrollbar>
  </React.StrictMode>,
  document.getElementById("root")
);

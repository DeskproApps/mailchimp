import React from "react";
import { Main } from "./pages/Main";
import { DeskproAppProvider } from "@deskpro/app-sdk";
import "iframe-resizer/js/iframeResizer.contentWindow.js";

import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";

const App = () => {
  return (
    <DeskproAppProvider>
      <Main />
    </DeskproAppProvider>
  )
};

export default App;

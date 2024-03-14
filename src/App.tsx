import React, { FC } from "react";
import { Main } from "./pages/Main";
import { DeskproAppProvider } from "@deskpro/app-sdk";
import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";

const App: FC = () => {
  return (
    <DeskproAppProvider>
        <Main />
    </DeskproAppProvider>
  )
};

export default App;

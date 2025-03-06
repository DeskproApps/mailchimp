import { FC } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Main } from "./pages/Main";
import { AdminCallback } from './pages/AdminCallback';
import { DeskproAppProvider } from "@deskpro/app-sdk";
import "@deskpro/deskpro-ui/dist/deskpro-ui.css";
import "@deskpro/deskpro-ui/dist/deskpro-custom-icons.css";

const App: FC = () => {
  return (
    <DeskproAppProvider>
      <HashRouter>
        <Routes>
          <Route path='/admin/callback' element={<AdminCallback />} />
          <Route index element={<Main />} />
        </Routes>
      </HashRouter>
    </DeskproAppProvider>
  )
};

export default App;
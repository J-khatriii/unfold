import { BrowserRouter, Routes, Route } from "react-router";

import UploadScreen from "./components/UploadScreen";
import ReaderScreen from "./components/ReaderScreen";

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<UploadScreen />} />
        <Route path="/documents/:id" element={<ReaderScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

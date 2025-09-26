import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/dashboard";
import { Borrow } from "./pages/borrow";
import { BrowserRouter, Routes, Route } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/borrow" element={<Borrow />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;

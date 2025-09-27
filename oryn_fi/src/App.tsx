import { Layout } from "./components/Layout";
import { Dashboard } from "./pages/dashboard";
import { Borrow } from "./pages/borrow";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./components/providers/WalletProvider";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/borrow" element={<Borrow />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;

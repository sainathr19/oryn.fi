import { Layout } from "./components/Layout";
import { Landing } from "./pages/landing";
import { Borrow } from "./pages/borrow";
import { AddLiquidity } from "./pages/addLiquidity";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProvider } from "./providers/WalletProvider";

function App() {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/borrow" element={<Borrow />} />
            <Route path="/add-liquidity" element={<AddLiquidity />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </WalletProvider>
  );
}

export default App;

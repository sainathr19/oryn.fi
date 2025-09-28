import { useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../assets/Icon";
import { Typo } from "../assets/Typo";
import { WalletConnectButton } from "./UI/WalletConnect";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <nav className="z-50 fixed top-0 w-full px-6 bg-white/5 backdrop-blur-lg">
      <div className="max-w-7xl flex items-center justify-between py-5 mx-auto">
        <a href="/">
          <div className="flex items-center justify-start gap-3">
            <Icon className="h-9 w-fit" />
            <Typo className="h-8 w-fit mt-2" />
          </div>
        </a>
        <div className="flex items-center justify-end gap-12">
          <ul className="flex items-center justify-center gap-12 text-md">
            <li>
              <button
                onClick={() => navigate("/borrow")}
                className={`hover:text-purple-600 transition-colors ${location.pathname === "/borrow"
                  ? "text-purple-600 font-semibold"
                  : "text-gray-700"
                  }`}
              >
                Borrow
              </button>
            </li>
            <li>
              <button
                onClick={() => navigate("/add-liquidity")}
                className={`hover:text-purple-600 transition-colors ${location.pathname === "/add-liquidity" ? "text-purple-600 font-semibold" : "text-gray-700"
                  }`}
              >
                Add Liquidity
              </button>
            </li>
          </ul>
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

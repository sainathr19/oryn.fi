import { Icon } from "../assets/Icon";
import { Typo } from "../assets/Typo";
import { WalletConnectButton } from "./UI/WalletConnect";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLaunchApp = () => {
    navigate("/borrow");
  };

  return (
    <nav className="z-50 fixed top-0 w-full px-6">
      <div className="max-w-7xl flex items-center justify-between py-5 mx-auto">
        <div className="flex items-center justify-start gap-3">
          <Icon className="h-9 w-fit" />
          <Typo className="h-8 w-fit mt-2" />
        </div>
        <div className="flex items-center justify-end gap-12">
          <ul className="flex items-center justify-center gap-12 text-md">
            <li>
              <a href="/">Project</a>
            </li>
            <li>
              <a href="/borrow">Borrow</a>
            </li>
          </ul>
          <WalletConnectButton />
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

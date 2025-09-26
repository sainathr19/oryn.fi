import { Icon } from "../assets/Icon";
import { Typo } from "../assets/Typo";
import { Button } from "./UI/Button";
import { useLocation } from "react-router-dom";

const Navbar = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <nav
      className={`${
        isHomePage
          ? "border-b border-gray-100 bg-[#f9f9f9]/25"
          : "border-b border-gray-500/10 bg-white/5 text-white"
      } backdrop-blur-lg z-50 fixed top-0 w-full px-6`}
    >
      <div className="max-w-7xl flex items-center justify-between py-5 mx-auto">
        <div className="flex items-center justify-start gap-3">
          <Icon isWhite={!isHomePage} className="h-9 w-fit" />
          <Typo isWhite={!isHomePage} className="h-8 w-fit mt-2" />
        </div>
        <div>
          <ul className="flex items-center justify-center gap-20 text-md">
            <li>Project</li>
            <li>Borrow</li>
          </ul>
        </div>
        <Button variant="primary" size="md">
          Connect
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;

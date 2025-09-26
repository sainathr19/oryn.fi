import { Kiosk } from "../components/Borrow/kiosk";

export const Borrow = () => {
  return (
    <div className="relative h-screen w-screen">
      <img
        src="/bgwall.png"
        alt="background"
        className="w-screen absolute inset-0 h-screen object-cover"
      />
      <div className="pt-20 absolute inset-0 w-screen text-white min-h-[calc(100vh-80px)] flex items-center justify-center">
        <Kiosk />
      </div>
    </div>
  );
};

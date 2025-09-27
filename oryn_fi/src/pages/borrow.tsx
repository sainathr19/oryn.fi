import { Kiosk } from "../components/Borrow/kiosk";

export const Borrow = () => {
  return (
    <div className="relative h-screen w-screen">
      <div
        className="fixed bottom-0 z-[1] h-full max-h-[612px] w-screen origin-bottom overflow-hidden opacity-60"
        style={{
          background:
            "linear-gradient(180deg, rgba(188, 237, 220, 0) 0%, #A27FE6 100%)",
        }}
      />
      <img
        src="/bgwall.png"
        alt="background"
        className="w-screen absolute inset-0 h-screen object-cover"
      />
      <div className="absolute inset-0 w-screen text-white min-h-screen flex items-center justify-center">
        <Kiosk />
      </div>
    </div>
  );
};

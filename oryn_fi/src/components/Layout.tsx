import Navbar from "./Navbar";

type LayoutProps = {
  children: React.ReactNode;
};

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="font-golos">
      <Navbar />
      {children}
    </div>
  );
};

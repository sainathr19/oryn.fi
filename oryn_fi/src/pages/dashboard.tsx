import { Explain } from "../components/Dashboard/Explain";
import { Hero } from "../components/Dashboard/hero";
import { ValueProps } from "../components/Dashboard/ValueProps";
import { AudienceHooks } from "../components/Dashboard/AudienceHooks";
import { HiddenValue } from "../components/Dashboard/HiddenValue";

export const Dashboard = () => {
  return (
    <div className="px-6">
      <Hero />
      <Explain />
      <ValueProps />
      <AudienceHooks />
      <HiddenValue />
      <div className="min-h-screen"></div>
    </div>
  );
};

import HelperList from "@/components/common/helperList/helperList";
import FAQ from "@/components/mythos/about/FAQ";
import HeroSection from "@/components/mythos/about/HeroSection";
import KnowMoreAboutUs from "@/components/mythos/about/KnowMoreAboutUs";
import Problems from "@/components/mythos/about/Problems";
import ProductDisplay from "@/components/mythos/about/ProductDisplay";
const MythosAbout = () => {
  const helps = {
    "Psychology assessment":
      "a thorough assessment of your intelligence based on Howard Gardner’s (theory of 9 intelligences)",
    "Planetary impacts":
      "on your academics and career along with a detailed assessment report will be provided with necessary guidelines ",
    "Get one-on-one": "video call session with our career guides ",
  };
  return (
    <div>
      <HeroSection />
      <Problems />
      <HelperList data={helps} label="HOW WE HELP YOU" />
      <ProductDisplay />
      <KnowMoreAboutUs />
      <FAQ />
    </div>
  );
};

export default MythosAbout;

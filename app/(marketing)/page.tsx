
import HeroSection from "@/components/landing/HeroSection";
import StatsBar from "@/components/landing/StatsBar";
import FeaturedCourses from "@/components/landing/FeaturedCourses";
import AiTutorFeature from "@/components/landing/AiTutorFeature";
import HowItWorks from "@/components/landing/HowItWorks";
import PricingSection from "@/components/landing/PricingSection";

export default function Home() {
  return (
    <>
      <main className="bg-bg flex-1">
        <HeroSection />
        <StatsBar />
        <FeaturedCourses />
        <AiTutorFeature />
        <HowItWorks />
        <PricingSection />
      </main>
    </>
  );
}

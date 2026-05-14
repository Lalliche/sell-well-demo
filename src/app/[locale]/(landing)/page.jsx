import Hero from "@/components/landing/Hero";
import Problem from "@/components/landing/Problem";
import Solution from "@/components/landing/Solution";
import HowItWorks from "@/components/landing/HowItWorks";
import TwoPaths from "@/components/landing/TwoPaths";
import TrustedBy from "@/components/landing/TrustedBy";
import FAQ from "@/components/landing/FAQ";
import CTABanner from "@/components/landing/CTABanner";
import Footer from "@/components/landing/Footer";

export default function LandingPage() {
  return (
    <div className="bg-bg">
      <Hero />
      <Problem />
      <Solution />
      <HowItWorks />
      <TwoPaths />
      <TrustedBy />
      <FAQ />
      <CTABanner />
      <Footer />
    </div>
  );
}

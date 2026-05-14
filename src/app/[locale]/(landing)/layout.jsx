import Navbar from "@/components/landing/Navbar";

export default function LandingLayout({ children }) {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
}

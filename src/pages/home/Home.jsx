import Header from "./Header";
import Hero from "./Hero";
import Services from "./Services";
import Timeline from "./Timeline";
import Modules from "./Modules";
import AIModule from "./AIModule";
import FooterCTA from "./FooterCTA";
import Footer from "./Footer";
import "./home.css";

export default function Home() {
  return (
    <div className="ht-root">
      <Header />
      <main>
        <Hero />
        <Services />
        <Timeline />
        <Modules />
        <AIModule />
        <FooterCTA />
      </main>
      <Footer />
    </div>
  );
}
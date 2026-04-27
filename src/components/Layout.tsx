import { useRef } from "react";
import { Outlet } from "react-router-dom";
import PageHeader from "./PageHeader";
import Footer from "./Footer";
import CtfdCredentialsPopup from "./CtfdCredentialsPopup";
import ScrollRays from "./ScrollRays";

function Layout() {
  const footerRef = useRef<HTMLElement>(null);

  return (
    <>
      <div className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 pt-4 pb-3">
          <PageHeader />
        </div>
      </div>
      <Outlet />
      <Footer ref={footerRef} />
      <ScrollRays footerRef={footerRef} />
      <CtfdCredentialsPopup />
    </>
  );
}

export default Layout;

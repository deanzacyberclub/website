import { Outlet } from "react-router-dom";
import PageHeader from "./PageHeader";
import Footer from "./Footer";
import CtfdCredentialsPopup from "./CtfdCredentialsPopup";

function Layout() {
  return (
    <>
      <div className="sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 pt-4 pb-3">
          <PageHeader />
        </div>
      </div>
      <Outlet />
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <Footer />
      </div>
      <CtfdCredentialsPopup />
    </>
  );
}

export default Layout;

import { Outlet } from "react-router-dom";
import PageHeader from "./PageHeader";
import Footer from "./Footer";

function Layout() {
  return (
    <>
      <div className="sticky top-0 z-50 bg-white dark:bg-terminal-bg backdrop-blur-sm bg-white/95 dark:bg-terminal-bg/95 border-b border-gray-200 dark:border-matrix/20">
        <div className="max-w-5xl mx-auto px-6 pt-6 pb-1">
          <PageHeader />
        </div>
      </div>
      <Outlet />
      <div className="max-w-5xl mx-auto px-6 pb-6">
        <Footer />
      </div>
    </>
  );
}

export default Layout;

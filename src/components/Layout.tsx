import { useRef, Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import PageHeader from "./PageHeader";
import Footer from "./Footer";
import ScrollRays from "./ScrollRays";

const PageLoading = () => (
  <div className="flex min-h-[60vh] items-center justify-center pt-8">
    <div className="font-terminal text-sm text-gray-500 dark:text-gray-400 tracking-widest">
      LOADING...
    </div>
  </div>
);

function Layout() {
  const footerRef = useRef<HTMLElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);

  const location = useLocation();

  return (
    <>
      <div ref={pageRef}>
        <div className="sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-6 pt-4 pb-3">
            <PageHeader />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <Suspense fallback={<PageLoading />}>
              <Outlet />
            </Suspense>
          </motion.div>
        </AnimatePresence>

        <Footer ref={footerRef} />
      </div>
      <ScrollRays footerRef={footerRef} pageRef={pageRef} />
    </>
  );
}

export default Layout;

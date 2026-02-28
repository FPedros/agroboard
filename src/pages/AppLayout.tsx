import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background/40 p-4 md:p-6">
        <div className="mx-auto flex w-full max-w-7xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

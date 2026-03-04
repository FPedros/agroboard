import { Outlet } from "react-router-dom";
import Sidebar from "@/components/Sidebar";

const AppLayout = () => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <Sidebar />
      <main className="flex-1 h-screen overflow-y-auto bg-background/40 p-[0.2rem] md:p-[0.3rem]">
        <div className="mx-auto flex w-full max-w-[95%]">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;

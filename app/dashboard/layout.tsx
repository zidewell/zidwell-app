import { BlogProvider } from "@/app/context/BlogContext";
import { SWRProvider } from "../providers/SWRProvider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BlogProvider>
      <SWRProvider>
      {children}

      </SWRProvider>
    </BlogProvider>
  );
}
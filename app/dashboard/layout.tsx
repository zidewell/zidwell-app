import { BlogProvider } from "@/app/context/BlogContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <BlogProvider>
      {children}
    </BlogProvider>
  );
}
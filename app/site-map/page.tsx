// app/site-map/page.tsx
import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Site Map - Zidwell",
  description:
    "Complete list of all pages on Zidwell platform. Find sign up, login, pricing, features and more.",
  keywords: [
    "Zidwell site map",
    "all pages",
    "website navigation",
    "sign up",
    "login",
  ],
};

export default function SiteMapPage() {
  const pages = [
    {
      href: "/",
      name: "Home",
      description: "Zidwell homepage - Business finance platform",
    },
    {
      href: "/signup",
      name: "Sign Up",
      description: "Create your Zidwell account",
    },
    {
      href: "/login",
      name: "Login",
      description: "Access your Zidwell account",
    },
    {
      href: "/pricing",
      name: "Pricing",
      description: "Zidwell plans and pricing",
    },
    {
      href: "/features",
      name: "Features",
      description: "All Zidwell features and tools",
    },
    {
      href: "/about",
      name: "About Us",
      description: "Learn about Zidwell company",
    },
    {
      href: "/contact",
      name: "Contact",
      description: "Get in touch with Zidwell team",
    },
    { href: "/blog", name: "Blog", description: "Zidwell blog and articles" },
    {
      href: "/privacy",
      name: "Privacy Policy",
      description: "Privacy policy and data protection",
    },
    {
      href: "/terms",
      name: "Terms of Service",
      description: "Terms and conditions",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Zidwell Site Map
          </h1>
          <p className="text-lg text-gray-600">
            Complete navigation guide to all pages on Zidwell platform
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              Main Pages
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pages.map((page) => (
                <div
                  key={page.href}
                  className="border border-gray-200 rounded-lg p-4 hover:border-(--color-accent-yellow) transition-colors"
                >
                  <Link
                    href={page.href}
                    className="text-lg font-medium text-(--color-accent-yellow) hover:text-[#a67905] block mb-2"
                  >
                    {page.name}
                  </Link>
                  <p className="text-sm text-gray-600">{page.description}</p>
                  <span className="text-xs text-gray-500 mt-2 block">
                    {page.href}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">
              SEO Resources
            </h2>
            <div className="space-y-2">
              <Link
                href="/sitemap.xml"
                className="text-blue-600 hover:text-blue-800 hover:underline block"
              >
                XML Sitemap
              </Link>
              <Link
                href="/robots.txt"
                className="text-blue-600 hover:text-blue-800 hover:underline block"
              >
                Robots.txt
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

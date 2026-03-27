// utils/publicRoutes.ts
export const isPublicRoute = (pathname: string): boolean => {
  const publicPaths = [
    "/",
    "/blog",
    "/blog/",
    "/features",
    "/pricing",
    "/auth/login",
    "/auth/signup",
    "/auth/register",
    "/faq",
    "/contact",
    "/about",
    "/privacy",
    "/terms",
  ];

  // Check exact matches
  if (publicPaths.includes(pathname)) return true;

  // Check if path starts with any public path
  if (publicPaths.some((publicPath) => pathname.startsWith(publicPath + "/"))) {
    return true;
  }

  // Check dynamic public routes
  const publicPatterns = [
    /^\/sign-contract\/[^\/]+$/,
    /^\/sign-receipt\/[^\/]+$/,
    /^\/pay-invoice\/[^\/]+$/,
    /^\/verify-email\/[^\/]+$/,
    /^\/reset-password\/[^\/]+$/,
    /^\/invite\/[^\/]+$/,
    /^\/share\/[^\/]+$/,
    /^\/preview\/[^\/]+$/,
    /^\/privacy\/[^\/]+$/,
    /^\/public\/[^\/]+$/,
    /^\/blog\/(?!admin).+\/.+$/,
    /^\/news(\/.*)?$/,
    /^\/article(\/.*)?$/,
    /^\/docs(\/.*)?$/,
    /^\/help(\/.*)?$/,
    /^\/reset-pin(\/.*)?$/,
    /^\/tax-filing(\/.*)?$/,
    /^\/featurees(\/.*)?$/,
    /^\/f-onboarding(\/.*)?$/,
  ];

  return publicPatterns.some((pattern) => pattern.test(pathname));
};

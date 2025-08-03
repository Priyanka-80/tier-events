import { authMiddleware } from "@clerk/nextjs/server";

export const middleware = authMiddleware({
  publicRoutes: ["/", "/sign-in"], // ✅ Add /sign-in
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)"],
};

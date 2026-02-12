import { httpRouter } from "convex/server";
import { registerStaticRoutes } from "@convex-dev/self-hosting";
import { components } from "./_generated/api";
import { auth } from "./auth";

const http = httpRouter();

// Auth routes (Convex Auth)
auth.addHttpRoutes(http);

// Serve static files at root with SPA fallback
registerStaticRoutes(http, components.selfHosting);

export default http;

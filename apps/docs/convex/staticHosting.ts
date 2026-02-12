import { components } from "./_generated/api";
import {
  exposeUploadApi,
  exposeDeploymentQuery,
} from "@convex-dev/self-hosting";

// Internal functions for secure uploads (CLI only)
export const { generateUploadUrl, recordAsset, gcOldAssets, listAssets } =
  exposeUploadApi(components.selfHosting);

// Public query for live reload notifications
export const { getCurrentDeployment } =
  exposeDeploymentQuery(components.selfHosting);

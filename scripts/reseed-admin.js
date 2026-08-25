import { runAuthUserTool } from "./auth-user-tool.mjs";

runAuthUserTool({ role: "super_admin" }).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

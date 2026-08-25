import { runAuthUserTool } from "./auth-user-tool.mjs";

runAuthUserTool({ role: "technician" }).catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});

// app.tsx for TanStack Start
// @ts-nocheck
import { createStart } from "@tanstack/react-start";
import { createRouter } from "./router";

// Create the start instance
export default createStart(() => {
  return {
    createRouter,
  };
});

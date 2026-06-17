// @ts-nocheck
if (import.meta.env.DEV) {
  const { scan } = await import("react-scan");

  scan({
    enabled: true,
    trackUnnecessaryRenders: true,
  });
}

const React = await import("react");
const { hydrateRoot } = await import("react-dom/client");
const { StartClient } = await import("@tanstack/react-start/client");

React.startTransition(() => {
  hydrateRoot(
    document,
    React.createElement(React.StrictMode, null, React.createElement(StartClient)),
  );
});

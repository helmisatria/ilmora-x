# Use HTTP Polling for Poll Session Live Updates

Poll Session live state updates use HTTP polling at a 3-second interval for M3, not WebSockets. We chose this because Poll Sessions are an offline-class support tool with modest expected room sizes, and HTTP polling keeps deployment, auth, failure handling, and route logic aligned with the current application. WebSockets may be revisited if classroom scale, latency, or admin control responsiveness becomes a real product constraint.

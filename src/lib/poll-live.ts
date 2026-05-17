type PollLiveSubscription = {
  code?: string;
  sessionId?: string;
  onUpdate: () => void;
};

export function subscribeToPollUpdates({
  code,
  sessionId,
  onUpdate,
}: PollLiveSubscription) {
  if (typeof window === "undefined") return () => {};
  if (!window.EventSource) return () => {};
  if (!code && !sessionId) return () => {};

  const search = new URLSearchParams();

  if (code) {
    search.set("code", code);
  }

  if (sessionId) {
    search.set("sessionId", sessionId);
  }

  const source = new window.EventSource(`/api/polls/events?${search.toString()}`);
  const handleUpdate = () => onUpdate();

  source.addEventListener("poll-update", handleUpdate);

  return () => {
    source.removeEventListener("poll-update", handleUpdate);
    source.close();
  };
}

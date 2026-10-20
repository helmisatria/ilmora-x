// Display only: "Kardiovaskular - Stroke (Free)" shows as a small subject line plus a bold title.
export function splitTryoutTitle(title: string) {
  const match = /\s[-–]\s/.exec(title);
  if (!match) return { subject: null, name: title };

  const subject = title.slice(0, match.index).trim();
  const name = title.slice(match.index + match[0].length).trim();
  if (!subject || !name) return { subject: null, name: title };

  return { subject, name };
}

"use client";

import { useEffect, useState } from "react";

const REPOSITORY_URL = "https://github.com/Starkprince-Inc/studentvoice";
const REPOSITORY_API = "https://api.github.com/repos/Starkprince-Inc/studentvoice";

export function GitHubRepoBadge() {
  const [stars, setStars] = useState<number | null>(null);

  useEffect(() => {
    let active = true;

    async function refreshStars() {
      try {
        const response = await fetch(REPOSITORY_API, {
          headers: { Accept: "application/vnd.github+json" },
          cache: "no-store",
        });
        if (!response.ok) return;
        const repository = (await response.json()) as { stargazers_count?: number };
        if (active && typeof repository.stargazers_count === "number") {
          setStars(repository.stargazers_count);
        }
      } catch {
        // The repository link remains useful if GitHub is temporarily unavailable.
      }
    }

    void refreshStars();
    const interval = window.setInterval(refreshStars, 60_000);
    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  const starLabel = stars === null ? "Stars" : `${new Intl.NumberFormat("en").format(stars)} stars`;

  return (
    <a
      className="github-repo-badge"
      href={REPOSITORY_URL}
      target="_blank"
      rel="noreferrer"
      aria-label={`Open the StudentVoice GitHub repository. ${starLabel}.`}
    >
      <span className="github-live-dot" aria-hidden="true" />
      <span className="github-repo-name">GitHub</span>
      <span className="github-star-count" aria-live="polite"><span aria-hidden="true">★</span> {starLabel}</span>
    </a>
  );
}

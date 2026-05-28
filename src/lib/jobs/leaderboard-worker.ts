import "dotenv/config";
import { startLeaderboardJobs } from "./leaderboard-jobs";

await startLeaderboardJobs({ force: true });

console.log("Leaderboard jobs worker started.");

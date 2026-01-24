import { apiRequest } from "./apiClient";

// GitHub Insights response interface
export interface GitHubInsights {
    username: string;
    profile: {
        followers: number;
        public_repos: number;
        account_age_years: number;
    };
    activity: {
        total_commits: number;
        avg_commits_per_month: number;
        consistency_score: number;
        active_repos_last_6_months: number;
    };
    contribution_style: {
        commits_pct: number;
        pull_requests_pct: number;
        code_reviews_pct: number;
        issues_pct: number;
    };
    tech_stack: Record<string, number>;
    open_source: {
        is_open_source_contributor: boolean;
        oss_score: number;
        prs: number;
        reviews: number;
        issues: number;
    };
    repository_impact: {
        total_stars: number;
        total_forks: number;
    };
    final_evaluation: {
        developer_score: number;
        estimated_level: string;
    };
    processing_time_seconds: number;
}

/**
 * Extract GitHub username from various URL formats
 */
export function extractGithubUsername(url: string): string | null {
    if (!url) return null;

    // Remove trailing slashes and whitespace
    url = url.trim().replace(/\/$/, "");

    const patterns = [
        /github\.com\/([^\/\?#]+)/i, // https://github.com/username
        /^([a-zA-Z0-9](?:[a-zA-Z0-9]|-(?=[a-zA-Z0-9])){0,38})$/, // just "username" (GitHub username rules)
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match && match[1]) {
            return match[1];
        }
    }

    return null;
}

/**
 * Fetch GitHub insights for a username
 */
export async function fetchGithubInsights(
    githubUrl: string
): Promise<GitHubInsights> {
    const username = extractGithubUsername(githubUrl);

    if (!username) {
        throw new Error("Invalid GitHub URL or username");
    }

    return apiRequest<GitHubInsights>(`/analyze/${username}`, {
        method: "GET",
    });
}

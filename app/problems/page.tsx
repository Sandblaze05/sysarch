"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  CircleDot,
  Search,
  SlidersHorizontal,
  Star,
} from "lucide-react";

type Difficulty = "Easy" | "Medium" | "Hard";
type Status = "Solved" | "Attempted" | "Unsolved";

type Problem = {
  id: number;
  slug: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  companies: string[];
  acceptance: number;
  popularity: number;
  status: Status;
};

const problems: Problem[] = [
  { id: 1, slug: "design-url-shortener", title: "Design a URL Shortener", difficulty: "Easy", category: "Scalability", companies: ["Meta", "Amazon"], acceptance: 72, popularity: 5, status: "Solved" },
  { id: 2, slug: "design-rate-limiter", title: "Design a Rate Limiter", difficulty: "Medium", category: "Caching", companies: ["Stripe", "Cloudflare"], acceptance: 64, popularity: 5, status: "Attempted" },
  { id: 3, slug: "design-twitter", title: "Design Twitter", difficulty: "Hard", category: "Feeds", companies: ["X", "Meta"], acceptance: 41, popularity: 5, status: "Unsolved" },
  { id: 4, slug: "design-distributed-cache", title: "Design a Distributed Cache", difficulty: "Hard", category: "Caching", companies: ["Google", "Netflix"], acceptance: 38, popularity: 4, status: "Attempted" },
  { id: 5, slug: "design-whatsapp", title: "Design WhatsApp", difficulty: "Hard", category: "Messaging Queues", companies: ["Meta", "Apple"], acceptance: 44, popularity: 5, status: "Solved" },
  { id: 6, slug: "design-ecommerce-checkout", title: "Design an E-commerce Checkout System", difficulty: "Medium", category: "Payments", companies: ["Amazon", "Shopify"], acceptance: 58, popularity: 4, status: "Solved" },
  { id: 7, slug: "design-video-streaming", title: "Design a Video Streaming Platform", difficulty: "Hard", category: "Media", companies: ["Netflix", "YouTube"], acceptance: 36, popularity: 5, status: "Unsolved" },
  { id: 8, slug: "design-notification-service", title: "Design a Notification Service", difficulty: "Medium", category: "Messaging Queues", companies: ["Uber", "LinkedIn"], acceptance: 67, popularity: 4, status: "Solved" },
  { id: 9, slug: "design-search-autocomplete", title: "Design Search Autocomplete", difficulty: "Medium", category: "Search", companies: ["Google", "Amazon"], acceptance: 62, popularity: 4, status: "Attempted" },
  { id: 10, slug: "design-file-storage", title: "Design Dropbox", difficulty: "Hard", category: "Databases", companies: ["Dropbox", "Google"], acceptance: 40, popularity: 4, status: "Unsolved" },
  { id: 11, slug: "design-ride-sharing", title: "Design a Ride Sharing App", difficulty: "Hard", category: "Geospatial", companies: ["Uber", "Lyft"], acceptance: 35, popularity: 5, status: "Attempted" },
  { id: 12, slug: "design-news-feed", title: "Design a News Feed", difficulty: "Medium", category: "Feeds", companies: ["Meta", "LinkedIn"], acceptance: 55, popularity: 5, status: "Solved" },
  { id: 13, slug: "design-api-gateway", title: "Design an API Gateway", difficulty: "Medium", category: "Scalability", companies: ["Amazon", "Cloudflare"], acceptance: 61, popularity: 3, status: "Unsolved" },
  { id: 14, slug: "design-ad-click-aggregator", title: "Design an Ad Click Aggregator", difficulty: "Hard", category: "Analytics", companies: ["Google", "Meta"], acceptance: 33, popularity: 4, status: "Unsolved" },
  { id: 15, slug: "design-chatbot-platform", title: "Design a Chatbot Platform", difficulty: "Medium", category: "AI Systems", companies: ["OpenAI", "Microsoft"], acceptance: 59, popularity: 4, status: "Solved" },
  { id: 16, slug: "design-ticketmaster", title: "Design Ticketmaster", difficulty: "Hard", category: "Concurrency", companies: ["Ticketmaster", "Amazon"], acceptance: 31, popularity: 5, status: "Attempted" },
  { id: 17, slug: "design-pastebin", title: "Design Pastebin", difficulty: "Easy", category: "Databases", companies: ["Microsoft", "Google"], acceptance: 76, popularity: 3, status: "Solved" },
  { id: 18, slug: "design-leaderboard", title: "Design a Gaming Leaderboard", difficulty: "Medium", category: "Databases", companies: ["Roblox", "Riot"], acceptance: 69, popularity: 3, status: "Unsolved" },
  { id: 19, slug: "design-web-crawler", title: "Design a Web Crawler", difficulty: "Medium", category: "Search", companies: ["Google", "Bing"], acceptance: 57, popularity: 4, status: "Solved" },
  { id: 20, slug: "design-feature-flag-service", title: "Design a Feature Flag Service", difficulty: "Easy", category: "Scalability", companies: ["LaunchDarkly", "Meta"], acceptance: 74, popularity: 3, status: "Unsolved" },
];

const difficultyRank: Record<Difficulty, number> = { Easy: 1, Medium: 2, Hard: 3 };
const pageSize = 10;

const difficultyStyles: Record<Difficulty, string> = {
  Easy: "bg-emerald-500/10 text-emerald-300 ring-emerald-400/20",
  Medium: "bg-amber-500/10 text-amber-300 ring-amber-400/20",
  Hard: "bg-rose-500/10 text-rose-300 ring-rose-400/20",
};

const statusIcon = {
  Solved: <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden="true" />,
  Attempted: <CircleDot className="h-5 w-5 text-amber-300" aria-hidden="true" />,
  Unsolved: <Circle className="h-5 w-5 text-white/30" aria-hidden="true" />,
};

function unique<T>(values: T[]) {
  return Array.from(new Set(values)).sort();
}

export default function ProblemsPage() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState("All");
  const [category, setCategory] = useState("All");
  const [status, setStatus] = useState("All");
  const [company, setCompany] = useState("All");
  const [sortBy, setSortBy] = useState("popularity");
  const [page, setPage] = useState(1);

  const categories = useMemo(() => unique(problems.map((problem) => problem.category)), []);
  const companies = useMemo(() => unique(problems.flatMap((problem) => problem.companies)), []);
  const solved = problems.filter((problem) => problem.status === "Solved");
  const totalSolved = solved.length;
  const easySolved = solved.filter((problem) => problem.difficulty === "Easy").length;
  const mediumSolved = solved.filter((problem) => problem.difficulty === "Medium").length;
  const hardSolved = solved.filter((problem) => problem.difficulty === "Hard").length;

  const filteredProblems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return problems
      .filter((problem) => problem.title.toLowerCase().includes(normalizedQuery))
      .filter((problem) => difficulty === "All" || problem.difficulty === difficulty)
      .filter((problem) => category === "All" || problem.category === category)
      .filter((problem) => status === "All" || problem.status === status)
      .filter((problem) => company === "All" || problem.companies.includes(company))
      .sort((a, b) => {
        if (sortBy === "difficulty") return difficultyRank[a.difficulty] - difficultyRank[b.difficulty];
        if (sortBy === "alphabetical") return a.title.localeCompare(b.title);
        if (sortBy === "acceptance") return b.acceptance - a.acceptance;
        return b.popularity - a.popularity || a.title.localeCompare(b.title);
      });
  }, [category, company, difficulty, query, sortBy, status]);

  const totalPages = Math.max(1, Math.ceil(filteredProblems.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visibleProblems = filteredProblems.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function updateFilter(setter: (value: string) => void, value: string) {
    setter(value);
    setPage(1);
  }

  return (
    <main className="min-h-screen bg-black px-4 pb-14 pt-24 text-[#E1E0CC] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-[#E1E0CC]/45">System design practice</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#F5F2DE] sm:text-4xl">Problems</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#E1E0CC]/60 sm:text-base">
              Choose a prompt, drill the tradeoffs, and keep your architecture muscles warm.
            </p>
          </div>

          <aside className="rounded-lg border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/20" aria-label="Solved progress summary">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm text-[#E1E0CC]/55">Progress</p>
                <p className="mt-1 text-3xl font-semibold text-[#F5F2DE]">{totalSolved}/{problems.length}</p>
              </div>
              <p className="pb-1 text-sm font-medium text-[#E1E0CC]/65">Solved</p>
            </div>
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
              <span className="bg-emerald-400" style={{ width: `${(easySolved / problems.length) * 100}%` }} />
              <span className="bg-amber-300" style={{ width: `${(mediumSolved / problems.length) * 100}%` }} />
              <span className="bg-rose-400" style={{ width: `${(hardSolved / problems.length) * 100}%` }} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-[#E1E0CC]/60">
              <span><b className="text-emerald-300">{easySolved}</b> Easy</span>
              <span><b className="text-amber-300">{mediumSolved}</b> Medium</span>
              <span><b className="text-rose-300">{hardSolved}</b> Hard</span>
            </div>
          </aside>
        </section>

        <section className="rounded-lg border border-white/10 bg-[#202020] shadow-2xl shadow-black/25">
          <div className="border-b border-white/10 p-4 sm:p-5">
            <div className="grid gap-3 lg:grid-cols-[minmax(240px,1fr)_repeat(5,minmax(130px,170px))]">
              <label className="relative block">
                <span className="sr-only">Search problems by title</span>
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#E1E0CC]/45" aria-hidden="true" />
                <input
                  value={query}
                  onChange={(event) => updateFilter(setQuery, event.target.value)}
                  className="h-11 w-full rounded-md border border-white/10 bg-black pl-10 pr-3 text-sm text-[#F5F2DE] outline-none transition placeholder:text-[#E1E0CC]/35 focus:border-[#E1E0CC]/45 focus:ring-2 focus:ring-[#E1E0CC]/10"
                  placeholder="Search problems"
                  type="search"
                />
              </label>
              <FilterSelect label="Difficulty" value={difficulty} onChange={(value) => updateFilter(setDifficulty, value)} options={["All", "Easy", "Medium", "Hard"]} />
              <FilterSelect label="Category" value={category} onChange={(value) => updateFilter(setCategory, value)} options={["All", ...categories]} />
              <FilterSelect label="Status" value={status} onChange={(value) => updateFilter(setStatus, value)} options={["All", "Solved", "Attempted", "Unsolved"]} />
              <FilterSelect label="Company" value={company} onChange={(value) => updateFilter(setCompany, value)} options={["All", ...companies]} />
              <FilterSelect label="Sort by" value={sortBy} onChange={(value) => updateFilter(setSortBy, value)} options={["popularity", "difficulty", "alphabetical", "acceptance"]} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-[#E1E0CC]/55">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              <span>{filteredProblems.length} matching problems</span>
              {[difficulty, category, status, company].filter((item) => item !== "All").map((item) => (
                <span key={item} className="rounded-full bg-white/8 px-2.5 py-1 text-[#E1E0CC]/75 ring-1 ring-white/10">{item}</span>
              ))}
            </div>
          </div>

          <div className="max-h-[660px] overflow-auto">
            <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left text-sm">
              <thead className="sticky top-0 z-10 bg-[#252525] text-xs uppercase tracking-wide text-[#E1E0CC]/45 shadow-[0_1px_0_rgba(255,255,255,0.08)]">
                <tr>
                  <th scope="col" className="w-16 px-5 py-3 font-medium">Status</th>
                  <th scope="col" className="px-4 py-3 font-medium">Problem Title</th>
                  <th scope="col" className="px-4 py-3 font-medium">Difficulty</th>
                  <th scope="col" className="px-4 py-3 font-medium">Topic</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium md:table-cell">Companies</th>
                  <th scope="col" className="px-4 py-3 font-medium">Acceptance</th>
                  <th scope="col" className="hidden px-4 py-3 font-medium lg:table-cell">Frequency</th>
                  <th scope="col" className="w-24 px-5 py-3 font-medium"><span className="sr-only">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {visibleProblems.map((problem, index) => (
                  <tr
                    key={problem.id}
                    className={`group transition hover:bg-white/[0.075] ${index % 2 === 0 ? "bg-white/[0.015]" : "bg-transparent"}`}
                  >
                    <td className="px-5 py-4">
                      <span className="inline-flex" title={problem.status} aria-label={problem.status}>{statusIcon[problem.status]}</span>
                    </td>
                    <td className="px-4 py-4">
                      <Link href={`/problems/${problem.slug}`} className="font-medium text-[#F5F2DE] outline-none transition hover:text-white focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[#E1E0CC]/40">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4"><DifficultyBadge difficulty={problem.difficulty} /></td>
                    <td className="px-4 py-4 text-[#E1E0CC]/70">{problem.category}</td>
                    <td className="hidden px-4 py-4 md:table-cell"><CompanyTags companies={problem.companies} /></td>
                    <td className="px-4 py-4 text-[#E1E0CC]/70">{problem.acceptance}%</td>
                    <td className="hidden px-4 py-4 lg:table-cell"><Popularity value={problem.popularity} /></td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/problems/${problem.slug}`} className="rounded-md bg-[#F5F2DE] px-3 py-1.5 text-xs font-semibold text-black opacity-0 outline-none transition hover:bg-white focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-[#E1E0CC]/40 group-hover:opacity-100">
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {visibleProblems.length === 0 && (
              <div className="px-6 py-16 text-center text-sm text-[#E1E0CC]/55">No problems match the selected filters.</div>
            )}
          </div>

          <footer className="flex flex-col gap-3 border-t border-white/10 px-4 py-4 text-sm text-[#E1E0CC]/60 sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {visibleProblems.length ? (currentPage - 1) * pageSize + 1 : 0}-{Math.min(currentPage * pageSize, filteredProblems.length)} of {filteredProblems.length}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[#E1E0CC]/75 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Prev
              </button>
              <span className="min-w-16 text-center">Page {currentPage} / {totalPages}</span>
              <button
                type="button"
                onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 px-3 text-[#E1E0CC]/75 transition hover:bg-white/8 disabled:cursor-not-allowed disabled:opacity-35"
              >
                Next <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={label}
        className="h-11 w-full rounded-md border border-white/10 bg-black px-3 text-sm capitalize text-[#F5F2DE] outline-none transition focus:border-[#E1E0CC]/45 focus:ring-2 focus:ring-[#E1E0CC]/10"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {label === "Sort by" && option !== "All" ? option.replace("-", " ") : option}
          </option>
        ))}
      </select>
    </label>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${difficultyStyles[difficulty]}`}>
      {difficulty}
    </span>
  );
}

function CompanyTags({ companies }: { companies: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {companies.map((company) => (
        <span key={company} className="rounded-full bg-white/7 px-2 py-1 text-xs font-medium text-[#E1E0CC]/70 ring-1 ring-white/10">
          {company}
        </span>
      ))}
    </div>
  );
}

function Popularity({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5 popularity`}>
      {Array.from({ length: 5 }, (_, index) => (
        <Star
          key={index}
          className={`h-3.5 w-3.5 ${index < value ? "fill-amber-300 text-amber-300" : "text-white/15"}`}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

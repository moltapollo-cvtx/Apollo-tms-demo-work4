"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  PaperPlaneTilt,
  Truck,
  User,
  Clock,
  MapPin,
  Package,
  CheckCircle,
  SpinnerGap,
  ArrowRight,
  ChatCircle,
  Lightbulb,
  Gauge,
  Warning,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import { mockDrivers, mockTractors } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// ─── Parsing ────────────────────────────────────────────────────────────────

const CITY_LIST = [
  { name: "Houston", state: "TX" },
  { name: "Chicago", state: "IL" },
  { name: "Dallas", state: "TX" },
  { name: "Los Angeles", state: "CA" },
  { name: "Atlanta", state: "GA" },
  { name: "Denver", state: "CO" },
  { name: "Miami", state: "FL" },
  { name: "Phoenix", state: "AZ" },
  { name: "Seattle", state: "WA" },
  { name: "Portland", state: "OR" },
  { name: "Nashville", state: "TN" },
  { name: "Kansas City", state: "MO" },
  { name: "Memphis", state: "TN" },
  { name: "Newark", state: "NJ" },
  { name: "New York", state: "NY" },
  { name: "Fresno", state: "CA" },
  { name: "Long Beach", state: "CA" },
  { name: "Charlotte", state: "NC" },
  { name: "Columbus", state: "OH" },
  { name: "Richmond", state: "VA" },
  { name: "Las Vegas", state: "NV" },
  { name: "San Antonio", state: "TX" },
  { name: "Salt Lake City", state: "UT" },
  { name: "Oklahoma City", state: "OK" },
  { name: "Minneapolis", state: "MN" },
  { name: "Detroit", state: "MI" },
  { name: "Indianapolis", state: "IN" },
  { name: "Louisville", state: "KY" },
  { name: "Pittsburgh", state: "PA" },
  { name: "Baltimore", state: "MD" },
];

interface ParsedQuery {
  origin: string;
  destination: string;
  commodity: string;
  weight: string;
  equipment: string;
  deadline: string;
  hazmat: boolean;
}

function parseFreightQuery(query: string): ParsedQuery {
  const q = query.toLowerCase();

  const foundCities = CITY_LIST.filter((c) => q.includes(c.name.toLowerCase()));

  const equipmentMap: [string, string][] = [
    ["reefer", "Refrigerated"],
    ["refrigerated", "Refrigerated"],
    ["flatbed", "Flatbed"],
    ["flat bed", "Flatbed"],
    ["step deck", "Step Deck"],
    ["tanker", "Tanker"],
    ["dry van", "Dry Van"],
    ["van", "Dry Van"],
    ["ltl", "LTL Partial"],
  ];
  let equipment = "Dry Van";
  for (const [key, val] of equipmentMap) {
    if (q.includes(key)) { equipment = val; break; }
  }

  let weight = "";
  const kMatch = q.match(/(\d+(?:\.\d+)?)\s*k\s*(?:lbs?|pounds?)/);
  if (kMatch) {
    weight = `${(parseFloat(kMatch[1]) * 1000).toLocaleString()} lbs`;
  } else {
    const wMatch = q.match(/(\d{2,3},\d{3}|\d{5,6})\s*(?:lbs?|pounds?)/);
    if (wMatch) weight = `${wMatch[1]} lbs`;
  }

  let deadline = "";
  const dayNames = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];
  for (let i = 0; i < dayNames.length; i++) {
    if (q.includes(dayNames[i])) {
      const now = new Date();
      let diff = i - now.getDay();
      if (diff <= 0) diff += 7;
      now.setDate(now.getDate() + diff);
      deadline = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
      break;
    }
  }
  if (!deadline && q.includes("tomorrow")) {
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    deadline = tom.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }
  if (!deadline && q.includes("today")) {
    deadline = new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });
  }
  if (!deadline && (q.includes("expedited") || q.includes("urgent") || q.includes("rush") || q.includes("hot shot") || q.includes("asap"))) {
    deadline = "ASAP — Expedited";
  }

  let commodity = "";
  const commodityMap: [string, string][] = [
    ["pharmaceutical", "Pharmaceuticals"], ["pharma", "Pharmaceuticals"],
    ["frozen", "Frozen Food"], ["food", "Food Products"],
    ["automotive", "Automotive Parts"], ["auto part", "Automotive Parts"],
    ["electronics", "Electronics"], ["hazmat", "Hazardous Materials"],
    ["chemical", "Chemicals"], ["machinery", "Industrial Machinery"],
    ["consumer goods", "Consumer Goods"], ["clothing", "Apparel"],
    ["furniture", "Furniture"], ["produce", "Fresh Produce"],
    ["agriculture", "Agricultural Products"], ["steel", "Steel / Metal"],
    ["lumber", "Lumber"], ["medical", "Medical Supplies"],
  ];
  for (const [key, val] of commodityMap) {
    if (q.includes(key)) { commodity = val; break; }
  }

  const hazmat = q.includes("hazmat") || q.includes("hazardous") || q.includes("chemical");

  return {
    origin: foundCities[0] ? `${foundCities[0].name}, ${foundCities[0].state}` : "",
    destination: foundCities[1] ? `${foundCities[1].name}, ${foundCities[1].state}` : "",
    commodity,
    weight,
    equipment,
    deadline,
    hazmat,
  };
}

interface DriverMatch {
  id: number;
  firstName: string;
  lastName: string;
  status: string;
  homeTerminal: string;
  cdlEndorsements: string[];
  score: number;
  tractorUnit: string;
  eta: string;
  hosRemaining: number;
  reason: string;
}

function matchDrivers(parsed: ParsedQuery): DriverMatch[] {
  const equipEndorsements: Record<string, string[]> = {
    "Refrigerated": ["N"], "Dry Van": [], "Flatbed": ["T"],
    "Tanker": ["N"], "Step Deck": [], "LTL Partial": [],
  };
  const required = equipEndorsements[parsed.equipment] ?? [];
  if (parsed.hazmat) required.push("H");

  const scored = mockDrivers
    .filter((d) => d.status !== "off_duty")
    .map((driver) => {
      const endorsements: string[] = ((driver as Record<string, unknown>).cdlEndorsements as string[] | undefined) ?? [];
      let score = 55 + Math.floor(Math.random() * 20);
      if (driver.status === "available") score += 18;
      if (driver.status === "driving") score += 6;
      const hasAll = required.every((e) => endorsements.includes(e));
      if (hasAll) score += 12;
      const tractor = mockTractors.find((t) => t.currentDriverId === driver.id);
      const hos = 5 + Math.random() * 5.5;
      score = Math.min(99, score);

      const reasons = [];
      if (driver.status === "available") reasons.push("Available now");
      if (hasAll && required.length > 0) reasons.push(`Has ${required.join("/")} endorsements`);
      if (hos > 8) reasons.push("Full HOS available");
      else if (hos > 5) reasons.push("Adequate HOS");

      return {
        id: driver.id,
        firstName: driver.firstName,
        lastName: driver.lastName,
        status: driver.status,
        homeTerminal: driver.homeTerminal,
        cdlEndorsements: endorsements,
        score,
        tractorUnit: tractor?.unitNumber ?? "TRC—",
        eta: `${Math.floor(Math.random() * 3) + 1}h ${Math.floor(Math.random() * 55)}m`,
        hosRemaining: Math.round(hos * 10) / 10,
        reason: reasons.slice(0, 2).join(" · ") || "Nearest available",
      } as DriverMatch;
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  return scored;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  message: string;
  type: "success" | "error";
}

// ─── Conversation entry ───────────────────────────────────────────────────────

interface ConversationEntry {
  id: number;
  query: string;
  timestamp: Date;
  parsed?: ParsedQuery;
  drivers?: DriverMatch[];
  summary?: string;
}

// ─── Example prompts (7 scenarios) ──────────────────────────────────────────

const EXAMPLE_PROMPTS = [
  "I need a reefer from Houston to Chicago by Friday, 42k lbs of pharmaceuticals",
  "Flatbed load, steel coils from Dallas to Memphis, need pickup tomorrow morning",
  "Dry van from Atlanta to Miami, 35,000 lbs consumer goods, urgent",
  "Hazmat tanker Houston to Denver, chemical shipment by next Wednesday",
  "Expedited reefer, 18k lbs frozen food from Seattle to Portland, delivery today",
  "LTL dry van, 8,000 lbs electronics from Phoenix to Las Vegas by Friday",
  "Step deck from Kansas City to Nashville, 38k lbs industrial machinery",
];

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    available: { label: "Available", cls: "bg-emerald-500/15 text-emerald-600 border-emerald-500/20" },
    on_duty:   { label: "On Duty",   cls: "bg-yellow-500/15 text-yellow-600 border-yellow-500/20" },
    driving:   { label: "Driving",   cls: "bg-blue-500/15 text-blue-600 border-blue-500/20" },
    off_duty:  { label: "Off Duty",  cls: "bg-zinc-400/15 text-zinc-500 border-zinc-400/20" },
  };
  const s = map[status] ?? { label: status, cls: "bg-zinc-400/15 text-zinc-500 border-zinc-400/20" };
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium", s.cls)}>
      {s.label}
    </span>
  );
}

// ─── AI summary generator ────────────────────────────────────────────────────

function generateSummary(p: ParsedQuery): string {
  const parts: string[] = [];
  parts.push("I've analyzed your freight request.");
  if (p.origin && p.destination) {
    parts.push(`Route identified: ${p.origin} to ${p.destination}.`);
  } else if (p.origin) {
    parts.push(`Origin identified: ${p.origin}.`);
  } else if (p.destination) {
    parts.push(`Destination identified: ${p.destination}.`);
  }
  if (p.commodity) parts.push(`Commodity classified as ${p.commodity}.`);
  if (p.weight) parts.push(`Load weight: ${p.weight}.`);
  if (p.equipment !== "Dry Van") parts.push(`Equipment type: ${p.equipment}.`);
  if (p.deadline) parts.push(`Target delivery: ${p.deadline}.`);
  if (p.hazmat) parts.push("Hazmat endorsement required — filtering eligible drivers only.");
  parts.push("Here are the top driver matches based on proximity, HOS availability, and endorsements.");
  return parts.join(" ");
}

// ─── Editable field ──────────────────────────────────────────────────────────

function EditableField({
  icon: Icon,
  label,
  value,
  fieldKey,
  onSave,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  fieldKey: string;
  onSave: (key: string, value: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft((prev) => (prev === value ? prev : value));
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [editing, value]);

  const save = () => {
    onSave(fieldKey, draft);
    setEditing(false);
  };

  if (editing) {
    return (
      <motion.div
        initial={{ scale: 0.98 }}
        animate={{ scale: 1 }}
        className="flex flex-col gap-1 bg-primary/5 px-5 py-4 ring-1 ring-inset ring-primary/30"
      >
        <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <input
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={save}
          onKeyDown={(e) => {
            if (e.key === "Enter") save();
            if (e.key === "Escape") { setDraft(value); setEditing(false); }
          }}
          className="font-medium text-foreground text-sm bg-transparent border-b border-primary/40 outline-none py-0.5 w-full"
        />
      </motion.div>
    );
  }

  return (
    <div
      className="flex flex-col gap-1 bg-card px-5 py-4 group cursor-pointer hover:bg-primary/5 transition-colors"
      onClick={() => setEditing(true)}
    >
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5" />
        {label}
        <PencilSimple className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity text-primary" />
      </div>
      <p className="font-medium text-foreground text-sm">{value}</p>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AiCommandPage() {
  const [query, setQuery] = useState("");
  const [thinking, setThinking] = useState(false);
  const [parsed, setParsed] = useState<ParsedQuery | null>(null);
  const [editedParsed, setEditedParsed] = useState<ParsedQuery | null>(null);
  const [drivers, setDrivers] = useState<DriverMatch[]>([]);
  const [history, setHistory] = useState<ConversationEntry[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<number | null>(null);

  // Typing animation state
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const toastIdRef = useRef(0);

  // Page title
  useEffect(() => {
    document.title = "AI Command Center | Apollo TMS";
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    };
  }, []);

  const addToast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = ++toastIdRef.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const startTyping = useCallback((text: string) => {
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    const words = text.split(" ");
    let idx = 0;
    setTypingText("");
    setIsTyping(true);
    setShowResults(false);

    typingIntervalRef.current = setInterval(() => {
      if (idx < words.length) {
        const word = words[idx];
        setTypingText((prev) => (prev ? prev + " " + word : word));
        idx++;
      } else {
        if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsTyping(false);
        setShowResults(true);
      }
    }, 50);
  }, []);

  const handleSubmit = useCallback(async (q: string) => {
    if (!q.trim() || thinking) return;
    setQuery("");
    setThinking(true);
    setParsed(null);
    setEditedParsed(null);
    setDrivers([]);
    setActiveHistoryId(null);
    setTypingText("");
    setIsTyping(false);
    setShowResults(false);

    await new Promise((r) => setTimeout(r, 2200 + Math.random() * 800));

    const result = parseFreightQuery(q);
    const driverMatches = matchDrivers(result);
    const summary = generateSummary(result);

    const entry: ConversationEntry = {
      id: Date.now(),
      query: q,
      timestamp: new Date(),
      parsed: result,
      drivers: driverMatches,
      summary,
    };

    setParsed(result);
    setEditedParsed({ ...result });
    setDrivers(driverMatches);
    setHistory((prev) => [entry, ...prev]);
    setThinking(false);

    startTyping(summary);
  }, [thinking, startTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(query);
    }
  };

  const loadHistory = (entry: ConversationEntry) => {
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setActiveHistoryId(entry.id);
    setParsed(entry.parsed ?? null);
    setEditedParsed(entry.parsed ? { ...entry.parsed } : null);
    setDrivers(entry.drivers ?? []);
    setThinking(false);
    setIsTyping(false);
    setShowResults(true);
    setTypingText(entry.summary ?? "");
  };

  const clearHistory = () => {
    setHistory([]);
    setActiveHistoryId(null);
  };

  const handleFieldEdit = (key: string, value: string) => {
    if (!editedParsed) return;
    setEditedParsed((prev) => prev ? { ...prev, [key]: value } : null);
  };

  const dispatchDriver = (driver: DriverMatch) => {
    addToast(`Dispatching ${driver.firstName} ${driver.lastName} (${driver.tractorUnit}) — load assigned successfully`, "success");
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const thinkingDots = ["Analyzing route requirements", "Checking HOS compliance", "Scoring driver matches"];

  const displayParsed = editedParsed ?? parsed;

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-0 -mx-6 -mt-6">
      {/* ── Conversation History Sidebar ── */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card/60">
        <div className="flex items-center gap-2 border-b border-border px-4 py-3.5">
          <ChatCircle className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground">History</span>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{history.length}</span>
          {history.length > 0 && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={clearHistory}
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
              title="Clear history"
            >
              <Trash className="h-3.5 w-3.5" />
            </motion.button>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {history.length === 0 && (
            <p className="px-2 py-4 text-xs text-muted-foreground text-center">No queries yet</p>
          )}
          <AnimatePresence>
            {history.map((entry, i) => (
              <motion.button
                key={entry.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => loadHistory(entry)}
                className={cn(
                  "w-full text-left rounded-lg px-3 py-2.5 text-xs transition-colors",
                  activeHistoryId === entry.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <p className="font-medium truncate">{entry.query}</p>
                <p className="mt-0.5 opacity-60">
                  {entry.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-border bg-card/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
              <Brain className="h-5 w-5 text-primary" weight="duotone" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">AI Dispatch Assistant</h1>
              <p className="text-xs text-muted-foreground">Natural language freight dispatch — describe your load, get matched drivers</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* ── Empty / Example State ── */}
          <AnimatePresence>
            {!thinking && !parsed && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="space-y-6"
              >
                <div className="rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-emerald-500/3 p-6 text-center">
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                    <Brain className="h-7 w-7 text-primary" weight="duotone" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Describe your freight need</h2>
                  <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
                    Type in plain English — origin, destination, equipment, weight, deadline. Apollo AI will parse and match the best drivers instantly.
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Lightbulb className="h-3.5 w-3.5" />
                    Example prompts
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {EXAMPLE_PROMPTS.map((p, i) => (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
                        onClick={() => { setQuery(p); handleSubmit(p); }}
                        className="group flex items-start gap-2.5 rounded-xl border border-border bg-card p-3.5 text-left text-sm text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground hover:shadow-sm"
                      >
                        <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary opacity-60 group-hover:opacity-100 transition-opacity" />
                        <span>{p}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Thinking State ── */}
          <AnimatePresence>
            {thinking && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                className="rounded-2xl border border-primary/20 bg-primary/5 p-8"
              >
                <div className="flex flex-col items-center gap-4">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="h-10 w-10 rounded-full border-2 border-primary border-t-transparent"
                  />
                  <div className="text-center">
                    <p className="font-medium text-foreground">Apollo AI is thinking...</p>
                    <div className="mt-3 space-y-1.5">
                      {thinkingDots.map((step, i) => (
                        <motion.div
                          key={step}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.4 + 0.2 }}
                          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
                        >
                          <motion.div
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                            className="h-1.5 w-1.5 rounded-full bg-primary"
                          />
                          {step}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── AI Typing Response ── */}
          <AnimatePresence>
            {(isTyping || showResults) && !thinking && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 350, damping: 30 }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20 mt-0.5">
                  <Brain className="h-4 w-4 text-primary" weight="fill" />
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed pt-1.5">
                  {typingText}
                  {isTyping && (
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                      className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle rounded-full"
                    />
                  )}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Results ── */}
          <AnimatePresence>
            {showResults && !thinking && displayParsed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 280, damping: 28 }}
                className="space-y-5"
              >
                {/* Parsed Fields Card */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  <div className="flex items-center gap-2 border-b border-border px-5 py-3.5 bg-muted/30">
                    <CheckCircle className="h-4 w-4 text-emerald-600" weight="fill" />
                    <span className="text-sm font-medium text-foreground">Parsed Load Details</span>
                    <span className="ml-1 text-[10px] text-muted-foreground">(click to edit)</span>
                    <span className="ml-auto rounded-full bg-emerald-500/15 border border-emerald-500/20 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      High confidence
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-3">
                    {([
                      { icon: MapPin, label: "Origin", value: displayParsed.origin || "Not specified", key: "origin" },
                      { icon: MapPin, label: "Destination", value: displayParsed.destination || "Not specified", key: "destination" },
                      { icon: Package, label: "Commodity", value: displayParsed.commodity || "General freight", key: "commodity" },
                      { icon: Gauge, label: "Weight", value: displayParsed.weight || "Not specified", key: "weight" },
                      { icon: Truck, label: "Equipment", value: displayParsed.equipment, key: "equipment" },
                      { icon: Clock, label: "Deadline", value: displayParsed.deadline || "ASAP", key: "deadline" },
                    ] as const).map(({ icon, label, value, key }, i) => (
                      <motion.div
                        key={label}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.06 }}
                      >
                        <EditableField
                          icon={icon}
                          label={label}
                          value={value}
                          fieldKey={key}
                          onSave={handleFieldEdit}
                        />
                      </motion.div>
                    ))}
                  </div>
                  {displayParsed.hazmat && (
                    <div className="flex items-center gap-2 border-t border-border px-5 py-3 bg-yellow-500/5">
                      <Warning className="h-4 w-4 text-yellow-600" weight="fill" />
                      <span className="text-xs text-yellow-600 font-medium">Hazmat endorsement (H) required — only eligible drivers shown</span>
                    </div>
                  )}
                </div>

                {/* Driver Recommendations */}
                <div>
                  <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    Top Driver Matches
                  </p>
                  <div className="space-y-3">
                    {drivers.map((driver, i) => (
                      <motion.div
                        key={driver.id}
                        initial={{ opacity: 0, x: -16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.1, type: "spring", stiffness: 350, damping: 28 }}
                        className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition-all"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-center gap-3">
                            {/* Rank badge */}
                            <div className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border font-mono text-sm font-bold",
                              i === 0 ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-600" :
                              i === 1 ? "bg-blue-500/15 border-blue-500/30 text-blue-600" :
                              "bg-zinc-400/15 border-zinc-400/30 text-zinc-500"
                            )}>
                              #{i + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {driver.firstName} {driver.lastName}
                              </p>
                              <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                                <span className="font-mono">{driver.tractorUnit}</span>
                                <span>·</span>
                                <span>{driver.homeTerminal}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={driver.status} />
                            <motion.button
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => dispatchDriver(driver)}
                              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground shadow-sm hover:opacity-90 transition-opacity"
                            >
                              Dispatch
                            </motion.button>
                          </div>
                        </div>

                        {/* Match score bar */}
                        <div className="mt-4">
                          <div className="mb-1.5 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">{driver.reason}</span>
                            <span className="font-mono font-semibold text-foreground">{driver.score}% match</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${driver.score}%` }}
                              transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: "easeOut" }}
                              className={cn(
                                "h-full rounded-full",
                                driver.score >= 85 ? "bg-emerald-500" :
                                driver.score >= 70 ? "bg-blue-500" : "bg-yellow-500"
                              )}
                            />
                          </div>
                        </div>

                        <div className="mt-3.5 grid grid-cols-3 gap-3 text-xs">
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-muted-foreground">ETA to Origin</p>
                            <p className="mt-0.5 font-mono font-medium text-foreground">{driver.eta}</p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-muted-foreground">HOS Remaining</p>
                            <p className={cn(
                              "mt-0.5 font-mono font-medium",
                              driver.hosRemaining < 5 ? "text-yellow-600" : "text-foreground"
                            )}>
                              {driver.hosRemaining}h
                            </p>
                          </div>
                          <div className="rounded-lg bg-muted/50 px-3 py-2">
                            <p className="text-muted-foreground">Endorsements</p>
                            <p className="mt-0.5 font-mono font-medium text-foreground">
                              {driver.cdlEndorsements.length > 0 ? driver.cdlEndorsements.join(", ") : "None"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Input Area ── */}
        <div className="border-t border-border bg-card/80 px-6 py-4">
          <div className="relative flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe your freight need in plain English... (Enter to submit)"
                rows={2}
                disabled={thinking}
                className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 pr-12 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 disabled:opacity-50 transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSubmit(query)}
              disabled={!query.trim() || thinking}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {thinking ? (
                <SpinnerGap className="h-4 w-4 animate-spin" />
              ) : (
                <PaperPlaneTilt className="h-4 w-4" weight="fill" />
              )}
            </motion.button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Press Enter to submit · Shift+Enter for new line · Examples above to get started
          </p>
        </div>
      </div>

      {/* ── Toast notifications ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 12, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.94 }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
              className={cn(
                "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg text-sm max-w-sm",
                toast.type === "success"
                  ? "bg-card border-emerald-500/30 text-foreground"
                  : "bg-card border-red-500/30 text-foreground"
              )}
            >
              <CheckCircle
                className={cn("h-4 w-4 shrink-0", toast.type === "success" ? "text-emerald-600" : "text-red-500")}
                weight="fill"
              />
              <span>{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}

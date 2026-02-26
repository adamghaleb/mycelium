// ============================================================================
// Mycelium Engine — Agent Roles & Message Transforms
// 5 agent roles with cognitive profiles and message transformation.
// ============================================================================

import { AgentRole, CognitiveProfile } from "./types";
import { rngPick, rng } from "./math";
import { AGENT_LABELS } from "./constants";

// ---------------------------------------------------------------------------
// Transform templates per role
// ---------------------------------------------------------------------------

interface TransformTemplate {
  readonly styles: readonly string[];
  readonly verbs: readonly string[];
  readonly prefixes: readonly string[];
  readonly suffixes: readonly string[];
}

const TEMPLATES: Record<AgentRole, TransformTemplate> = {
  [AgentRole.Creative]: {
    styles: [
      "Divergent thinker — generates unexpected connections",
      "Pattern-breaker — finds beauty in contradictions",
      "Metaphor engine — translates abstractions into vivid imagery",
      "Lateral connector — bridges distant domains",
    ],
    verbs: ["reimagine", "reframe", "poeticize", "wildly connect", "dream up"],
    prefixes: [
      "What if we turned this sideways —",
      "Imagine this as a living thing:",
      "The unexpected angle here is",
      "Picture this differently —",
    ],
    suffixes: [
      "...and that opens up entirely new territory.",
      "— the beauty is in the contradiction.",
      "...which nobody has considered yet.",
      "...and suddenly everything connects.",
    ],
  },
  [AgentRole.Analytical]: {
    styles: [
      "Systems thinker — decomposes into components",
      "Pattern recognizer — finds structure in chaos",
      "Data synthesizer — quantifies the qualitative",
      "Framework builder — creates mental models",
    ],
    verbs: ["decompose", "structure", "quantify", "analyze", "map"],
    prefixes: [
      "Breaking this down systematically:",
      "The underlying structure reveals",
      "Three key dimensions emerge:",
      "The data pattern suggests",
    ],
    suffixes: [
      "— each component reinforces the others.",
      "...which gives us a clear framework.",
      "— the numbers tell a compelling story.",
      "— this structure is both elegant and robust.",
    ],
  },
  [AgentRole.Critical]: {
    styles: [
      "Devil's advocate — stress-tests every assumption",
      "Edge case finder — probes for hidden weaknesses",
      "Assumption challenger — questions the obvious",
      "Risk sensor — detects potential failure modes",
    ],
    verbs: ["challenge", "stress-test", "probe", "question", "push back on"],
    prefixes: [
      "But here's what could go wrong:",
      "The hidden assumption is",
      "Let me push back on this —",
      "The critical flaw I see:",
    ],
    suffixes: [
      "— addressing this makes the idea bulletproof.",
      "...and we need to resolve this first.",
      "— but once hardened, this becomes powerful.",
      "— the strongest ideas survive the hardest questions.",
    ],
  },
  [AgentRole.Synthesizer]: {
    styles: [
      "Integration engine — weaves threads into tapestries",
      "Convergent thinker — finds the unified theory",
      "Bridge builder — connects opposing viewpoints",
      "Essence distiller — finds signal in noise",
    ],
    verbs: ["synthesize", "integrate", "unify", "weave together", "distill"],
    prefixes: [
      "Drawing these threads together:",
      "The unified picture that emerges is",
      "Synthesizing all perspectives:",
      "Bringing it all together —",
    ],
    suffixes: [
      "— and that synthesis reveals something new.",
      "...which is greater than the sum of its parts.",
      "— a coherent whole from diverse fragments.",
      "— the network has spoken as one mind.",
    ],
  },
  [AgentRole.Wildcard]: {
    styles: [
      "Chaos agent — introduces productive randomness",
      "Cross-pollinator — injects ideas from alien domains",
      "Mutation engine — evolves ideas through random variation",
      "Paradigm shifter — drops the frame entirely",
    ],
    verbs: ["mutate", "cross-pollinate", "randomize", "subvert", "remix"],
    prefixes: [
      "Plot twist:",
      "What if we forget everything and —",
      "From a completely different universe:",
      "Throwing a curveball —",
    ],
    suffixes: [
      "— sometimes chaos is the answer.",
      "...and that randomness just solved the problem.",
      "— the mutation reveals a better species of idea.",
      "— breaking the pattern created something better.",
    ],
  },
};

// ---------------------------------------------------------------------------
// Profile factory
// ---------------------------------------------------------------------------

export function createCognitiveProfile(role: AgentRole): CognitiveProfile {
  const tpl = TEMPLATES[role];
  return {
    role,
    style: rngPick(tpl.styles),
    verbs: tpl.verbs.slice(0, 3),
    weight: role === AgentRole.Synthesizer ? rng(1.5, 2.0) : rng(0.8, 1.2),
  };
}

// ---------------------------------------------------------------------------
// Message transformation
// ---------------------------------------------------------------------------

export function transformMessage(
  input: string,
  profile: CognitiveProfile,
): string {
  const tpl = TEMPLATES[profile.role];
  const prefix = rngPick(tpl.prefixes);
  const suffix = rngPick(tpl.suffixes);
  const verb = rngPick(profile.verbs);

  const sentences = input.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const key =
    sentences.length > 0
      ? sentences[Math.floor(Math.random() * sentences.length)].trim()
      : input.slice(0, 100);

  const transforms: Record<AgentRole, () => string> = {
    [AgentRole.Creative]: () =>
      `${prefix} ${key}. If we ${verb} this concept ${suffix}`,
    [AgentRole.Analytical]: () =>
      `${prefix} ${key}. We can ${verb} this into its core components ${suffix}`,
    [AgentRole.Critical]: () =>
      `${prefix} ${key}. We need to ${verb} the core premise here ${suffix}`,
    [AgentRole.Synthesizer]: () =>
      `${prefix} ${key}. When we ${verb} all these perspectives ${suffix}`,
    [AgentRole.Wildcard]: () =>
      `${prefix} ${key}. Let's ${verb} this entirely ${suffix}`,
  };

  return transforms[profile.role]();
}

// ---------------------------------------------------------------------------
// Final synthesis
// ---------------------------------------------------------------------------

export function synthesizeOutput(
  originalPrompt: string,
  hops: Array<{ nodeId: string; text: string; profile: CognitiveProfile }>,
): string {
  if (hops.length === 0) {
    return `The network received "${originalPrompt}" but found no processing path.`;
  }

  const byRole = new Map<AgentRole, string[]>();
  for (const h of hops) {
    if (!byRole.has(h.profile.role)) byRole.set(h.profile.role, []);
    byRole.get(h.profile.role)!.push(h.text);
  }

  const parts: string[] = [
    `[MYCELIUM NETWORK SYNTHESIS]\nOriginal signal: "${originalPrompt}"\nProcessed through ${hops.length} cognitive nodes.\n`,
  ];

  for (const [role, texts] of byRole) {
    parts.push(
      `\n● ${AGENT_LABELS[role]} Layer:\n  ${texts[texts.length - 1]}`,
    );
  }

  const synthHops = hops.filter(
    (h) => h.profile.role === AgentRole.Synthesizer,
  );
  if (synthHops.length > 0) {
    parts.push(
      `\n◉ Final Synthesis:\n  ${synthHops[synthHops.length - 1].text}`,
    );
  } else {
    parts.push(
      `\n◉ Network Convergence:\n  The distributed intelligence processed this through ${hops.length} perspectives, each adding a new dimension.`,
    );
  }

  return parts.join("\n");
}

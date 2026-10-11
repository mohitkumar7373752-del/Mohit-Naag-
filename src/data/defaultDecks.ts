import { StudyDeck } from '../types/study';

export const DEFAULT_DECKS: StudyDeck[] = [
  {
    id: 'deck-cellular-respiration',
    title: 'Cellular Respiration & ATP Synthase',
    topic: 'Cellular Biology',
    difficulty: 'intermediate',
    mode: 'topic',
    createdAt: '2026-10-10T12:00:00.000Z',
    updatedAt: '2026-10-10T12:00:00.000Z',
    tags: ['Biology', 'Metabolism', 'Mitochondria', 'Biochemistry'],
    summary: {
      overview:
        'Cellular respiration is the catabolic pathway by which organic molecules (primarily glucose) are systematically oxidized to produce adenosine triphosphate (ATP), the universal cellular energy currency. The pathway encompasses four main interconnected stages: Glycolysis in the cytosol, the Transition/Link Reaction, the Citric Acid (Krebs) Cycle in the mitochondrial matrix, and Oxidative Phosphorylation via the Electron Transport Chain (ETC) along the inner mitochondrial membrane.',
      keyTakeaways: [
        'Glycolysis yields a net of 2 ATP and 2 NADH per glucose without requiring oxygen.',
        'The Citric Acid Cycle fully oxidizes acetyl groups to CO2, generating high-energy electron carriers (NADH and FADH2).',
        'The Electron Transport Chain establishes an electrochemical proton gradient across the inner mitochondrial membrane.',
        'ATP Synthase utilizes proton-motive force (chemiosmosis) via rotary catalysis to phosphorylate ADP into ATP.',
        'Oxygen acts as the terminal electron acceptor, reducing to form metabolic water.',
      ],
      essentialFormulasOrTheories: [
        'Overall Equation: C6H12O6 + 6 O2 → 6 CO2 + 6 H2O + ~30-32 ATP',
        'Chemiosmotic Hypothesis (Peter Mitchell): Proton-motive force drives ATP synthase rotation.',
      ],
      commonPitfalls: [
        'Confusing the net ATP yield of glycolysis (2 ATP) with gross yield (4 ATP produced, 2 consumed in investment phase).',
        'Assuming oxygen is consumed during the Krebs Cycle directly; oxygen is only directly reduced at Complex IV of the ETC.',
        'Forgetting that protons are pumped into the intermembrane space, making it acidic relative to the matrix.',
      ],
    },
    flashcards: [
      {
        id: 'cr-card-1',
        front: 'What is the primary role of Oxygen (O2) in aerobic cellular respiration?',
        back: 'Oxygen serves as the terminal electron acceptor at Complex IV of the electron transport chain, binding free protons and low-energy electrons to form water (H2O).',
        hint: 'Think: What receives electrons at the very end of the transport chain so traffic doesn\'t jam?',
        category: 'Mechanism',
        masteryStatus: 'mastered',
        reviewCount: 3,
      },
      {
        id: 'cr-card-2',
        front: 'Where in the eukaryotic cell does the Citric Acid (Krebs) Cycle occur?',
        back: 'Within the mitochondrial matrix (the fluid space inside the inner mitochondrial membrane).',
        hint: 'Mitochondrial inside fluid compartment.',
        category: 'Localization',
        masteryStatus: 'learning',
        reviewCount: 1,
      },
      {
        id: 'cr-card-3',
        front: 'What is the net gain of ATP molecules produced directly from one glucose during Glycolysis alone?',
        back: '2 net ATP (4 ATP are synthesized by substrate-level phosphorylation, but 2 ATP are consumed during the preparatory/energy investment phase).',
        hint: 'Invest 2, gain 4. Net = ?',
        category: 'Quantitative Fact',
        masteryStatus: 'new',
        reviewCount: 0,
      },
      {
        id: 'cr-card-4',
        front: 'Explain the mechanism of Chemiosmosis in ATP synthesis.',
        back: 'The flow of protons (H+) down their electrochemical gradient from the intermembrane space back into the matrix through ATP Synthase causes mechanical rotor rotation, driving the phosphorylation of ADP to ATP.',
        hint: 'Discovered by Peter Mitchell; driven by proton-motive force.',
        category: 'Mechanism',
        masteryStatus: 'learning',
        reviewCount: 2,
      },
      {
        id: 'cr-card-5',
        front: 'How many ATP molecules are theoretically yielded from one NADH vs one FADH2 in the ETC?',
        back: 'Approximately 2.5 ATP per NADH (enters at Complex I, pumps more protons) vs approximately 1.5 ATP per FADH2 (enters downstream at Complex II).',
        hint: 'NADH enters earlier at Complex I; FADH2 bypasses Complex I.',
        category: 'Comparison',
        masteryStatus: 'new',
        reviewCount: 0,
      },
      {
        id: 'cr-card-6',
        front: 'What happens to cellular respiration if an uncoupling agent like DNP (2,4-Dinitrophenol) is introduced?',
        back: 'Protons leak across the inner mitochondrial membrane without passing through ATP Synthase. The proton gradient collapses, ATP synthesis halts, and energy dissipates as heat.',
        hint: 'Uncouples ETC electron flow from phosphorylation; generates heat.',
        category: 'Application',
        masteryStatus: 'new',
        reviewCount: 0,
      },
    ],
    quizzes: [
      {
        id: 'cr-quiz-1',
        question:
          'If a metabolic poison specifically blocks Complex IV (cytochrome c oxidase) of the ETC, what immediate consequence will occur?',
        options: [
          'Glycolysis immediately accelerates with increased pyruvate output.',
          'NADH and FADH2 will accumulate in their reduced states because electrons cannot be transferred to oxygen.',
          'Proton concentration in the intermembrane space will drastically surge.',
          'ATP Synthase will spin faster due to compensatory feedback.',
        ],
        correctIndex: 1,
        explanation:
          'When Complex IV is inhibited, electrons cannot be transferred to oxygen. Consequently, electron carriers back up along complexes III, II, and I. The cell can no longer oxidize NADH to NAD+ or FADH2 to FAD, halting the entire respiratory chain.',
        conceptTested: 'Electron Transport Chain Inhibition',
      },
      {
        id: 'cr-quiz-2',
        question:
          'During cellular respiration, in which cellular compartment is the proton (H+) concentration the HIGHEST during active respiration?',
        options: [
          'The mitochondrial matrix',
          'The mitochondrial intermembrane space',
          'The cellular cytosol',
          'The outer surface of the plasma membrane',
        ],
        correctIndex: 1,
        explanation:
          'Complexes I, III, and IV pump protons outward from the mitochondrial matrix into the tight intermembrane space, creating a high H+ concentration (lower pH) and positive electrical potential.',
        conceptTested: 'Proton Gradient Localization',
      },
      {
        id: 'cr-quiz-3',
        question:
          'Which enzyme catalyzes the committed, rate-limiting step of Glycolysis, subject to allosteric inhibition by high ATP levels?',
        options: [
          'Hexokinase',
          'Phosphofructokinase-1 (PFK-1)',
          'Pyruvate Kinase',
          'Aldolase',
        ],
        correctIndex: 1,
        explanation:
          'Phosphofructokinase-1 (PFK-1) is the master regulatory pacemaking enzyme of glycolysis. High ATP and citrate allosterically inhibit PFK-1 to prevent wasteful glucose consumption when cellular energy charge is high.',
        conceptTested: 'Metabolic Regulation',
      },
      {
        id: 'cr-quiz-4',
        question:
          'Why does the oxidation of one molecule of FADH2 generate fewer ATP molecules than the oxidation of one molecule of NADH?',
        options: [
          'FADH2 carries only one electron while NADH carries two.',
          'FADH2 electrons enter the transport chain at Complex II (succinate dehydrogenase), bypassing the proton pumping of Complex I.',
          'FADH2 molecules are localized outside the mitochondria and require ATP to cross the membrane.',
          'FADH2 binds directly to ATP synthase and acts as an inhibitor.',
        ],
        correctIndex: 1,
        explanation:
          'NADH transfers electrons to Complex I, allowing proton pumping across Complexes I, III, and IV (~10 H+ total). FADH2 transfers electrons to Complex II, which does not pump protons; thus electrons from FADH2 only trigger proton pumping at Complexes III and IV (~6 H+ total).',
        conceptTested: 'Bioenergetics & Electron Carriers',
      },
    ],
  },
  {
    id: 'deck-data-structures-big-o',
    title: 'Computer Science: Big-O & Data Structures',
    topic: 'Computer Science',
    difficulty: 'intermediate',
    mode: 'topic',
    createdAt: '2026-10-09T09:30:00.000Z',
    updatedAt: '2026-10-09T09:30:00.000Z',
    tags: ['Algorithms', 'Data Structures', 'Coding Interview', 'Complexity'],
    summary: {
      overview:
        'Asymptotic analysis and data structure mechanics dictate algorithm scalability. Understanding time and space complexity tradeoffs between contiguous memory structures (Arrays), node-pointer structures (Linked Lists, Binary Trees), and hash-mapped tables is fundamental for high-performance software engineering.',
      keyTakeaways: [
        'Arrays provide O(1) random access by index via direct pointer arithmetic, but O(N) worst-case insertions/deletions.',
        'Hash Tables achieve average O(1) lookups and insertions, degrading to O(N) under catastrophic collision clustering.',
        'Balanced Binary Search Trees (AVL, Red-Black) guarantee O(log N) search, insertion, and deletion.',
        'Amortized analysis accounts for occasional expensive operations spread over many cheap ones (e.g., dynamic array resizing).',
      ],
      essentialFormulasOrTheories: [
        'Master Theorem: T(n) = a*T(n/b) + f(n)',
        'Hierarchy: O(1) < O(log N) < O(N) < O(N log N) < O(N^2) < O(2^N) < O(N!)',
      ],
      commonPitfalls: [
        'Confusing worst-case runtime with average-case (e.g. QuickSort worst-case is O(N^2), average is O(N log N)).',
        'Forgetting that string comparison or copying in a hash table adds a factor proportional to string length L.',
        'Assuming linked lists are always faster than arrays for insertion due to CPU cache locality and pointer overhead.',
      ],
    },
    flashcards: [
      {
        id: 'cs-card-1',
        front: 'What is the worst-case time complexity of searching for an element in an un-balanced Binary Search Tree (BST)?',
        back: 'O(N). If elements were inserted in sorted order, the BST degenerates into a linear linked list (skewed tree).',
        hint: 'Imagine inserting 1, then 2, then 3, then 4 in order...',
        category: 'Complexity',
        masteryStatus: 'mastered',
        reviewCount: 2,
      },
      {
        id: 'cs-card-2',
        front: 'Why does an Array have O(1) access time while a Singly Linked List has O(N) access time?',
        back: 'Arrays use contiguous memory blocks where the memory address is computed instantly as BaseAddress + (Index * ElementSize). Linked lists store disjoint nodes that must be sequentially traversed via next pointers.',
        hint: 'Direct memory pointer calculation vs node walking.',
        category: 'Mechanism',
        masteryStatus: 'learning',
        reviewCount: 1,
      },
      {
        id: 'cs-card-3',
        front: 'What is "Amortized Time Complexity" with an example?',
        back: 'The average time taken per operation over a long sequence of operations. For example, appending to a dynamic array is O(1) amortized because resizing by doubling capacity costs O(N) only once every N appends.',
        hint: 'Paying upfront for future cheap operations.',
        category: 'Definition',
        masteryStatus: 'new',
        reviewCount: 0,
      },
      {
        id: 'cs-card-4',
        front: 'What is the optimal average-case time complexity for comparison-based sorting algorithms?',
        back: 'O(N log N). Mathematically proven via the decision tree model; a binary decision tree of N! permutations requires minimum height ceil(log2(N!)) ≈ N log2(N).',
        hint: 'Think of Merge Sort and Heap Sort lower bounds.',
        category: 'Theory',
        masteryStatus: 'mastered',
        reviewCount: 3,
      },
    ],
    quizzes: [
      {
        id: 'cs-quiz-1',
        question:
          'You need to maintain a continuous stream of incoming numbers and frequently query the median in O(1) time. Which combination of data structures is optimal?',
        options: [
          'A single sorted dynamic array',
          'Two Heaps: A Max-Heap for the lower half and a Min-Heap for the upper half',
          'A Doubly Linked List with a pointer to the middle node',
          'A Hash Table keyed by frequency count',
        ],
        correctIndex: 1,
        explanation:
          'Using two balanced heaps (Max-Heap for lower half, Min-Heap for upper half) allows inserting incoming numbers in O(log N) and retrieving the median in O(1) by simply peeking at the tops of both heaps.',
        conceptTested: 'Heap / Priority Queue Patterns',
      },
      {
        id: 'cs-quiz-2',
        question:
          'What happens to the performance of a Hash Map if the hash function maps all keys to the exact same hash code index (Open Addressing or Separate Chaining)?',
        options: [
          'Lookups remain O(1) because bucket pointers are stored in RAM.',
          'Lookup and insert operations degrade from average O(1) to worst-case O(N).',
          'The hash table immediately triggers a stack overflow exception.',
          'The capacity automatically doubles to O(N^2).',
        ],
        correctIndex: 1,
        explanation:
          'If all keys hash to the same bucket, all elements collide into a single chain or probed sequence. To find or insert a key, the algorithm must linearly search through every element, degrading runtime to O(N).',
        conceptTested: 'Hash Collisions & Worst-Case Bounds',
      },
    ],
  },
  {
    id: 'deck-cognitive-biases',
    title: 'Psychology: Cognitive Biases & Heuristics',
    topic: 'Cognitive Psychology',
    difficulty: 'intermediate',
    mode: 'topic',
    createdAt: '2026-10-08T14:15:00.000Z',
    updatedAt: '2026-10-08T14:15:00.000Z',
    tags: ['Psychology', 'Decision Making', 'Behavioral Economics', 'Kahneman'],
    summary: {
      overview:
        'Cognitive biases are systematic deviations from rational judgment and probability theory, stemming from evolutionary mental shortcuts known as heuristics (System 1 fast thinking). Pioneered by Daniel Kahneman and Amos Tversky, understanding these predictable errors is essential for clinical psychology, behavioral economics, and critical thinking.',
      keyTakeaways: [
        'Heuristics are adaptive cognitive rules of thumb that prioritize speed over formal normative logic.',
        'Availability Heuristic evaluates frequency or likelihood based on how readily examples come to mind.',
        'Confirmation Bias causes thinkers to seek, interpret, and recall evidence in ways that validate pre-existing hypotheses.',
        'Anchoring Effect disproportionately weights initial numbers or impressions during subsequent quantitative estimations.',
      ],
      essentialFormulasOrTheories: [
        'Dual-Process Theory: System 1 (Fast, automatic, emotional, unconscious) vs System 2 (Slow, deliberate, analytical, effortful).',
        'Prospect Theory: Losses loom larger than gains (Loss Aversion coefficient ~2:1).',
      ],
      commonPitfalls: [
        'Confusing the Availability Heuristic (salience/memory recall) with the Representativeness Heuristic (stereotyping/prototype match).',
        'Believing high intelligence immunizes individuals against cognitive biases (the "bias blind spot").',
      ],
    },
    flashcards: [
      {
        id: 'psy-card-1',
        front: 'What is the "Availability Heuristic"?',
        back: 'The tendency to overestimate the likelihood or frequency of an event based on how easily recent, vivid, or dramatic examples come to mind.',
        hint: 'E.g., fearing shark attacks or plane crashes after seeing news reports.',
        category: 'Definition',
        masteryStatus: 'mastered',
        reviewCount: 4,
      },
      {
        id: 'psy-card-2',
        front: 'Define "Loss Aversion" as formulated in Prospect Theory.',
        back: 'The psychological phenomenon where the pain of losing something is emotionally and behaviorally roughly twice as impactful as the pleasure of gaining the equivalent amount.',
        hint: 'Losing $100 hurts more than finding $100 feels good.',
        category: 'Theory',
        masteryStatus: 'learning',
        reviewCount: 2,
      },
      {
        id: 'psy-card-3',
        front: 'What is the "Dunning-Kruger Effect"?',
        back: 'A metacognitive bias wherein individuals with low competence in a domain substantially overestimate their own ability, because the very lack of knowledge prevents them from recognizing their errors.',
        hint: 'Mount Stupid: confidence peaks at early novice stage.',
        category: 'Behavioral Bias',
        masteryStatus: 'learning',
        reviewCount: 1,
      },
    ],
    quizzes: [
      {
        id: 'psy-quiz-1',
        question:
          'A doctor diagnoses a rare disease in a patient because they treated another patient with the exact same unusual symptoms earlier that morning, despite common conditions having a 99% higher base rate. Which heuristic is most responsible?',
        options: [
          'Anchoring Heuristic',
          'Availability Heuristic',
          'Halo Effect',
          'Framing Effect',
        ],
        correctIndex: 1,
        explanation:
          'The Availability Heuristic is at work because the recent morning case made the rare disease acutely accessible in the clinician\'s memory, causing an overestimation of its statistical probability.',
        conceptTested: 'Availability Heuristic in Clinical Judgment',
      },
    ],
  },
];

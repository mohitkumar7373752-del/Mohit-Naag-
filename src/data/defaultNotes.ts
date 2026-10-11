import { StudyNote, QuizAttempt } from '../types/study';

export const DEFAULT_NOTES: StudyNote[] = [
  {
    id: 'note-physics-quantum',
    title: 'Quantum Mechanics: Wave-Particle Duality & Uncertainty',
    subject: 'Physics',
    createdAt: '2026-10-10T10:15:00.000Z',
    updatedAt: '2026-10-10T10:15:00.000Z',
    tags: ['Quantum', 'Schrodinger', 'DeBroglie', 'Heisenberg'],
    color: 'indigo',
    content: `### 1. The Wave-Particle Paradox
Light and matter exhibit both wave-like and particle-like properties depending on experimental observation:
* **Photoelectric Effect (Einstein 1905):** Light transfers energy in quantized packets (photons) where **E = hf**. Classical wave theory failed to explain why emission is instantaneous regardless of intensity.
* **de Broglie Hypothesis (1924):** All moving matter possesses a characteristic wavelength: **λ = h / p** (where *p = mv* is momentum). Demonstrated experimentally by Davisson-Germer electron diffraction.

### 2. Heisenberg Uncertainty Principle
You cannot simultaneously measure with arbitrary precision both the canonical position **x** and momentum **p** of a particle:
> **Δx · Δp ≥ ℏ / 2** (where ℏ = h / 2π ≈ 1.054 × 10⁻³⁴ J·s)

* Consequence: Confining a subatomic particle to a microscopic region forces a high velocity dispersion, preventing atomic collapse.

### 3. Schrödinger Wave Equation & Probability Interpretation
The time-dependent Schrödinger equation:
**iℏ ∂Ψ/∂t = ĤΨ**

* The wave function **Ψ(x, t)** itself is not directly measurable.
* Born's Rule dictates that **|Ψ(x, t)|²** represents the probability density of finding the particle at coordinates *(x, t)*.
* Superposition collapses to an eigenstate upon measurement.`,
    generatedQuiz: {
      generatedAt: '2026-10-10T10:16:00.000Z',
      provider: 'openai',
      quizzes: [
        {
          id: 'note-quiz-note-physics-quantum-0',
          question: 'According to the de Broglie hypothesis, what is the wavelength λ of a particle with momentum p?',
          options: ['λ = h / p', 'λ = p / h', 'λ = h · p', 'λ = ℏ · c / p'],
          correctIndex: 0,
          explanation: 'The de Broglie wavelength is given by λ = h / p, where h is Planck’s constant and p is momentum (mv).',
          conceptTested: 'de Broglie Wavelength',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-physics-quantum-1',
          question: 'What does Max Born’s probability interpretation state regarding the wave function Ψ(x, t)?',
          options: [
            'Ψ represents the physical electric charge density directly.',
            '|Ψ(x, t)|² represents the probability density of locating the particle at (x, t).',
            'The integral of Ψ over space gives the total velocity of the particle.',
            'Ψ is an imaginary quantity that has no physical meaning even when squared.'
          ],
          correctIndex: 1,
          explanation: 'Born’s statistical interpretation states that the absolute square of the wave function, |Ψ|², represents the probability density of detecting the particle in a given region.',
          conceptTested: 'Born Rule & Wave Function',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-physics-quantum-2',
          question: 'In the Heisenberg Uncertainty Principle Δx · Δp ≥ ℏ/2, what happens as a particle is confined to an extremely small spatial region Δx?',
          options: [
            'Its momentum uncertainty Δp approaches zero.',
            'Its momentum uncertainty Δp must increase dramatically.',
            'Its total energy must drop to absolute zero.',
            'The Planck constant h changes proportionally.'
          ],
          correctIndex: 1,
          explanation: 'Because the product of Δx and Δp has a lower bound of ℏ/2, compressing Δx toward zero forces the momentum uncertainty Δp to become enormous.',
          conceptTested: 'Heisenberg Uncertainty Principle',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-physics-quantum-3',
          question: 'Which historical experiment proved that light behaves as discrete quantized packets (photons) rather than purely continuous classical waves?',
          options: [
            'Young’s Double-Slit Experiment (1801)',
            'The Photoelectric Effect (Einstein 1905)',
            'Cavendish Torsion Balance Experiment',
            'Rutherford Gold Foil Experiment'
          ],
          correctIndex: 1,
          explanation: 'Einstein explained the photoelectric effect by demonstrating that light consists of localized energy packets (photons) with energy E = hf, resolving why electron emission depends on frequency rather than intensity.',
          conceptTested: 'Photoelectric Effect',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-physics-quantum-4',
          question: 'What fundamental phenomenon occurs when an unmeasured quantum system in superposition interacts with an ideal measurement apparatus?',
          options: [
            'Wave function collapse into a definite eigenstate',
            'Conversion of momentum into electromagnetic radiation',
            'Infinite multiplication of total angular momentum',
            'Complete cancellation of all quantum numbers'
          ],
          correctIndex: 0,
          explanation: 'Under the standard Copenhagen interpretation, measurement causes the superposition of quantum states to collapse into a single observable eigenstate corresponding to the measured eigenvalue.',
          conceptTested: 'Quantum Measurement & Collapse',
          userAnswer: null,
          isFlagged: false,
        },
      ],
      flashcards: [
        {
          id: 'note-card-note-physics-quantum-0',
          front: 'What is the formula for the de Broglie matter wavelength?',
          back: 'λ = h / p (or λ = h / mv), where h is Planck\'s constant and p is momentum.',
          hint: 'Lambda equals Planck constant over momentum',
          category: 'Definition',
          masteryStatus: 'new',
          reviewCount: 0,
        },
        {
          id: 'note-card-note-physics-quantum-1',
          front: 'State the Heisenberg Uncertainty Principle formula for position and momentum.',
          back: 'Δx · Δp ≥ ℏ / 2 (where ℏ = h / 2π ≈ 1.054 × 10⁻³⁴ J·s).',
          hint: 'Product of spatial uncertainty and momentum uncertainty is at least h-bar over 2',
          category: 'Principle',
          masteryStatus: 'new',
          reviewCount: 0,
        },
        {
          id: 'note-card-note-physics-quantum-2',
          front: 'What does |Ψ(x, t)|² physically represent according to Born\'s Rule?',
          back: 'The probability density of observing the particle at coordinates (x, t).',
          hint: 'Probability per unit volume of finding the particle upon measurement',
          category: 'Interpretation',
          masteryStatus: 'new',
          reviewCount: 0,
        },
      ],
    },
  },
  {
    id: 'note-programming-event-loop',
    title: 'JavaScript Event Loop, Microtasks & Async Concurrency',
    subject: 'Programming',
    createdAt: '2026-10-08T09:00:00.000Z',
    updatedAt: '2026-10-08T09:00:00.000Z',
    tags: ['JavaScript', 'Concurrency', 'V8', 'WebAPIs'],
    color: 'emerald',
    content: `### 1. Single-Threaded Architecture
JavaScript executes on a single main thread with one Call Stack and one Memory Heap:
* Run-to-completion semantics: A function running on the call stack cannot be interrupted by another JavaScript function until it finishes.

### 2. The Orchestration Trio
1. **Call Stack:** Evaluates synchronous statements (LIFO stack frame).
2. **Web APIs / Node APIs:** Offloads async timers (setTimeout), network requests (fetch), and file I/O to background system threads.
3. **Task Queues:**
   * **Microtask Queue:** Highest priority. Handles \`Promise.then/catch/finally\`, \`queueMicrotask()\`, and \`MutationObserver\`.
   * **Macrotask Queue (Callback Queue):** Lower priority. Handles \`setTimeout\`, \`setInterval\`, \`setImmediate\`, and UI events.

### 3. Execution Cycle Rule
\`\`\`javascript
console.log('1: Sync');
setTimeout(() => console.log('2: Timeout Macrotask'), 0);
Promise.resolve().then(() => console.log('3: Promise Microtask'));
console.log('4: Sync');
// Output Order: 1 -> 4 -> 3 -> 2
\`\`\`

> **The Golden Rule:** Between every tick of the event loop, the engine **completely empties the Microtask Queue** before picking the single next Macrotask!`,
    generatedQuiz: {
      generatedAt: '2026-10-08T09:05:00.000Z',
      provider: 'openai',
      quizzes: [
        {
          id: 'note-quiz-note-prog-0',
          question: 'What is the exact execution priority between Microtasks and Macrotasks in the JavaScript Event Loop?',
          options: [
            'All microtasks in the microtask queue are completely drained before the next macrotask runs.',
            'Macrotasks and microtasks alternate 1:1 on every tick.',
            'Macrotasks take precedence over Promise callbacks.',
            'Microtasks only execute when requestAnimationFrame fires.'
          ],
          correctIndex: 0,
          explanation: 'The event loop continuously drains the entire microtask queue to completion before picking and executing the next macrotask from the task queue.',
          conceptTested: 'Queue Priority',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-prog-1',
          question: 'Given the code snippet below, what is the output sequence in console?\nconsole.log("A");\nsetTimeout(() => console.log("B"), 0);\nPromise.resolve().then(() => console.log("C"));\nconsole.log("D");',
          options: ['A -> D -> C -> B', 'A -> B -> C -> D', 'A -> C -> D -> B', 'A -> D -> B -> C'],
          correctIndex: 0,
          explanation: 'Synchronous statements run first ("A", "D"). Then the microtask queue drains ("C" from Promise). Finally, the macrotask queue runs ("B" from setTimeout).',
          conceptTested: 'Execution Order',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-prog-2',
          question: 'Which of the following is processed on the Microtask Queue rather than the Macrotask Queue?',
          options: [
            'Promise.then() callback',
            'setTimeout() callback',
            'setInterval() handler',
            'setImmediate() in Node.js'
          ],
          correctIndex: 0,
          explanation: 'Promise callbacks (.then, .catch, .finally) and queueMicrotask() are queued on the microtask queue. setTimeout and setInterval schedule macrotasks.',
          conceptTested: 'Task Classification',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-prog-3',
          question: 'What does "run-to-completion" mean regarding the JavaScript Call Stack?',
          options: [
            'A running function executes entirely without being preempted by another script until it returns or yields.',
            'Scripts automatically terminate after running for 5 seconds.',
            'Promises can interrupt ongoing synchronous loops at any line.',
            'All asynchronous callbacks finish before memory is allocated.'
          ],
          correctIndex: 0,
          explanation: 'JavaScript has run-to-completion semantics: once a synchronous function begins on the call stack, it runs until finished before the engine does anything else.',
          conceptTested: 'Run-to-Completion Semantics',
          userAnswer: null,
          isFlagged: false,
        },
        {
          id: 'note-quiz-note-prog-4',
          question: 'Where are async operations like network requests (fetch) and timer countdowns actually performed in a browser environment?',
          options: [
            'In multi-threaded Web APIs provided by the browser environment',
            'Directly inside the single-threaded JavaScript call stack',
            'Inside the microtask queue itself',
            'In GPU hardware shaders'
          ],
          correctIndex: 0,
          explanation: 'The browser environment provides multi-threaded Web APIs (networking, timers, DOM) that run operations in the background and place callbacks onto the event loop queues.',
          conceptTested: 'Web APIs & Background Threads',
          userAnswer: null,
          isFlagged: false,
        },
      ],
      flashcards: [
        {
          id: 'note-card-note-prog-0',
          front: 'What is the priority difference between the Microtask Queue and the Macrotask Queue?',
          back: 'The microtask queue is completely drained after each task before the next macrotask is executed.',
          hint: 'Promises take precedence over setTimeout',
          category: 'Mechanism',
          masteryStatus: 'new',
          reviewCount: 0,
        },
        {
          id: 'note-card-note-prog-1',
          front: 'Name two APIs that schedule tasks onto the Microtask Queue.',
          back: '1. Promise.then/catch/finally\n2. queueMicrotask() (and MutationObserver in DOM).',
          hint: 'Promises and explicit microtask scheduler',
          category: 'APIs',
          masteryStatus: 'new',
          reviewCount: 0,
        },
        {
          id: 'note-card-note-prog-2',
          front: 'What does "run-to-completion" mean in JavaScript?',
          back: 'A function on the call stack cannot be interrupted by another JS function until it finishes execution.',
          hint: 'No preemption on the main call stack',
          category: 'Principle',
          masteryStatus: 'new',
          reviewCount: 0,
        },
      ],
    },
  },
  {
    id: 'note-history-coldwar',
    title: 'The Cold War: Space Race & Geopolitical Hegemony',
    subject: 'History',
    createdAt: '2026-10-09T14:30:00.000Z',
    updatedAt: '2026-10-09T14:30:00.000Z',
    tags: ['20th Century', 'USSR', 'Apollo', 'Diplomacy'],
    color: 'amber',
    content: `### 1. Origins & Strategic Impetus
The Space Race was an ideological, technical, and military competition between the Soviet Union (USSR) and the United States from 1957 to 1975:
* **October 4, 1957:** The USSR launches **Sputnik 1**, the first artificial satellite. Sparked the "Sputnik Crisis" in America, leading to the creation of **NASA** (1958) and the National Defense Education Act.
* **April 12, 1961:** Soviet cosmonaut **Yuri Gagarin** becomes the first human in outer space aboard Vostok 1.

### 2. The Moon Landing & Apollo Program
In May 1961, President John F. Kennedy challenged Congress to land a man on the Moon before the decade concluded:
* **July 20, 1969:** **Apollo 11** touches down in the Sea of Tranquility. Neil Armstrong and Buzz Aldrin become the first humans to walk on the lunar surface.
* Saturn V rocket, engineered by Wernher von Braun, delivered 7.5 million pounds of thrust.

### 3. Historical Impact & Detente
* Shift from militarized ballistic missile testing (ICBM capability showcase) toward cooperative space diplomacy.
* Culminated in the **Apollo-Soyuz Test Project (1975)**, signaling détente and joint orbital science.`,
  },
  {
    id: 'note-biology-crispr',
    title: 'CRISPR-Cas9: Molecular Machinery & Genomic Editing',
    subject: 'Biology',
    createdAt: '2026-10-07T11:20:00.000Z',
    updatedAt: '2026-10-07T11:20:00.000Z',
    tags: ['Genetics', 'Biotech', 'Enzymology', 'DNA'],
    color: 'rose',
    content: `### 1. Bacterial Adaptive Immunity
CRISPR (Clustered Regularly Interspaced Short Palindromic Repeats) originated as an adaptive antiviral defense system in prokaryotes (*Streptococcus pyogenes*):
* Bacteria capture viral DNA sequences and store them as "spacers" between repetitive genomic arrays.

### 2. The Core Molecular Components
* **Cas9 Endonuclease:** The molecular scissors that produce targeted double-strand breaks (DSBs).
* **guide RNA (gRNA):** Engineered hybrid of crRNA (matching target ~20nt sequence) and tracrRNA (structural scaffold binding Cas9).
* **PAM Sequence (Protospacer Adjacent Motif):** Mandatory 2–6 bp motif (5'-NGG-3' for SpCas9) immediately adjacent to target DNA. Without PAM, Cas9 will not cleave.

### 3. Repair Pathways & Gene Editing
Once Cas9 creates a blunt double-strand cut 3 base pairs upstream of PAM, the host cell repairs the damage:
1. **NHEJ (Non-Homologous End Joining):** Error-prone ligation causing insertions/deletions (indels), knocking out gene expression.
2. **HDR (Homology-Directed Repair):** Precise repair utilizing an exogenous donor template to insert or correct specific nucleotide sequences.`,
  },
];

export const DEFAULT_QUIZ_ATTEMPTS: QuizAttempt[] = [
  {
    id: 'attempt-demo-quantum-1',
    sourceType: 'note',
    sourceId: 'note-physics-quantum',
    title: 'Quantum Mechanics: Wave-Particle Duality & Uncertainty',
    subject: 'Physics',
    date: '2026-10-11T05:30:00.000Z',
    score: 4,
    total: 5,
    percentage: 80,
    timeSpentSeconds: 65,
    questionsReview: [
      {
        question: 'According to the de Broglie hypothesis, what is the wavelength λ of a particle with momentum p?',
        options: ['λ = h / p', 'λ = p / h', 'λ = h · p', 'λ = ℏ · c / p'],
        userAnswerIndex: 0,
        correctAnswerIndex: 0,
        isCorrect: true,
        explanation: 'The de Broglie wavelength is given by λ = h / p, where h is Planck’s constant and p is momentum (mv).',
      },
      {
        question: 'What does Max Born’s probability interpretation state regarding the wave function Ψ(x, t)?',
        options: [
          'Ψ represents the physical electric charge density directly.',
          '|Ψ(x, t)|² represents the probability density of locating the particle at (x, t).',
          'The integral of Ψ over space gives the total velocity of the particle.',
          'Ψ is an imaginary quantity that has no physical meaning even when squared.'
        ],
        userAnswerIndex: 1,
        correctAnswerIndex: 1,
        isCorrect: true,
        explanation: 'Born’s statistical interpretation states that the absolute square of the wave function, |Ψ|², represents the probability density of detecting the particle.',
      },
      {
        question: 'In the Heisenberg Uncertainty Principle Δx · Δp ≥ ℏ/2, what happens as a particle is confined to an extremely small spatial region Δx?',
        options: [
          'Its momentum uncertainty Δp approaches zero.',
          'Its momentum uncertainty Δp must increase dramatically.',
          'Its total energy must drop to absolute zero.',
          'The Planck constant h changes proportionally.'
        ],
        userAnswerIndex: 1,
        correctAnswerIndex: 1,
        isCorrect: true,
        explanation: 'Because the product of Δx and Δp has a lower bound of ℏ/2, compressing Δx toward zero forces Δp to grow enormous.',
      },
      {
        question: 'Which historical experiment proved that light behaves as discrete quantized packets (photons) rather than purely continuous classical waves?',
        options: [
          'Young’s Double-Slit Experiment (1801)',
          'The Photoelectric Effect (Einstein 1905)',
          'Cavendish Torsion Balance Experiment',
          'Rutherford Gold Foil Experiment'
        ],
        userAnswerIndex: 0,
        correctAnswerIndex: 1,
        isCorrect: false,
        explanation: 'Einstein explained the photoelectric effect by showing light transfers energy in quantized packets (photons) with E = hf.',
      },
      {
        question: 'What fundamental phenomenon occurs when an unmeasured quantum system in superposition interacts with an ideal measurement apparatus?',
        options: [
          'Wave function collapse into a definite eigenstate',
          'Conversion of momentum into electromagnetic radiation',
          'Infinite multiplication of total angular momentum',
          'Complete cancellation of all quantum numbers'
        ],
        userAnswerIndex: 0,
        correctAnswerIndex: 0,
        isCorrect: true,
        explanation: 'Measurement causes the superposition of quantum states to collapse into a single observable eigenstate.',
      },
    ],
  },
];

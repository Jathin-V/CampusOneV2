/**
 * CampusOne - Self-Contained Mock Firebase v10 SDK
 * Provides complete in-browser persistence via localStorage with zero setup.
 * Supports Auth (Email/Password, Google) and Firestore modular API.
 */

import {
  UserProfile,
  UserRole,
  MaintenanceTicket,
  AcademicResource,
  CampusEvent,
  AttendanceSession,
  SuggestionItem,
} from '../types';
import {
  safeGetItem,
  safeSetItem,
  safeRemoveItem,
  safeGetJson,
  safeSetJson,
} from '../utils/safeStorage';

const STORAGE_VERSION = 'v3'; // Bump version to flush old demo names
const STORAGE_PREFIX = `campusone_${STORAGE_VERSION}_`;
const AUTH_KEY = `${STORAGE_PREFIX}current_user`;
const USERS_KEY = `${STORAGE_PREFIX}users`;
const TICKETS_KEY = `${STORAGE_PREFIX}tickets`;
const VAULT_KEY = `${STORAGE_PREFIX}vault_resources`;
const EVENTS_KEY = `${STORAGE_PREFIX}events`;
const REGISTRATIONS_KEY = `${STORAGE_PREFIX}event_registrations`;
const ATTENDANCE_KEY = `${STORAGE_PREFIX}attendance_records`;
const SUGGESTIONS_KEY = `${STORAGE_PREFIX}suggestions`;

// Default Master Admin
export const MASTER_ADMIN_EMAIL = 'admin@campus.edu';
export const MASTER_ADMIN_PASS = 'AdminMasterPass123!';

// Generic Placeholders for Demo Accounts (Requirement: No specific names like Dean Prof SN Murthy)
const SEED_USERS: UserProfile[] = [
  {
    uid: 'master-admin-001',
    email: MASTER_ADMIN_EMAIL,
    displayName: 'Admin',
    role: 'Admin',
    department: 'University Administration',
    employeeId: 'EMP-ADM-01',
  },
  {
    uid: 'teacher-001',
    email: 'teacher@campus.edu',
    displayName: 'Teacher',
    role: 'Teacher',
    department: 'Electronics & Communication Engg.',
    employeeId: 'EMP-ECE-104',
  },
  {
    uid: 'student-001',
    email: 'student@campus.edu',
    displayName: 'Student',
    role: 'Student',
    department: 'Computer Science & Engineering',
    studentId: '1SG23CS015',
  },
  {
    uid: 'technician-001',
    email: 'technician@campus.edu',
    displayName: 'Technician',
    role: 'Technician',
    department: 'Campus Facilities & Maintenance',
    employeeId: 'TECH-FAC-88',
  },
  {
    uid: 'lab-instructor-001',
    email: 'lab.instructor@campus.edu',
    displayName: 'Lab Instructor',
    role: 'Lab Instructor',
    department: 'IoT & Embedded Systems Lab',
    employeeId: 'LAB-INST-42',
  },
];

const SEED_TICKETS: MaintenanceTicket[] = [
  {
    id: 'TICK-101',
    title: 'Ceiling Projector HDMI Flickering & Power Drop',
    location: 'A102',
    category: 'Classroom Utilities',
    priority: 'Medium',
    description: 'During morning lectures the ceiling EPSON projector blinks off every 4 minutes and HDMI port loses sync.',
    status: 'In Progress',
    reportedBy: 'Teacher',
    reportedByEmail: 'teacher@campus.edu',
    reportedByRole: 'Teacher',
    createdAt: '2026-10-06T09:15:00Z',
    upvoteCount: 3,
    reopenCount: 0,
    reopenHistory: [],
    actionPlan: {
      suggestedTools: ['Digital Multimeter', 'Replacement 4K HDMI Cable', 'Step Ladder', 'Projector PSU Tester'],
      estimatedTime: '45 mins',
      safetyCaution: 'Isolate main line breaker before checking ceiling mount power socket to prevent shock hazard.',
      actionSteps: [
        'Inspect ceiling power socket voltage under load.',
        'Swap out intermediate HDMI extender box.',
        'Run test video loop for 15 mins.',
      ],
      generatedAt: '2026-10-06T11:00:00Z',
    },
  },
  {
    id: 'TICK-102',
    title: 'Severe Water Pipe Leakage Near Washroom & Server Rack',
    location: 'B204',
    category: 'Plumbing',
    priority: 'Extreme',
    description: 'Continuous water seepage from main overhead CPVC pipe, flowing towards lab electrical conduits.',
    status: 'Pending',
    reportedBy: 'Lab Instructor',
    reportedByEmail: 'lab.instructor@campus.edu',
    reportedByRole: 'Lab Instructor',
    createdAt: '2026-10-07T14:30:00Z',
    upvoteCount: 5,
    reopenCount: 0,
    reopenHistory: [],
  },
  {
    id: 'TICK-103',
    title: 'Core Switch Fiber Port SFP Flapping in CS Lab 3',
    location: 'A304',
    category: 'IT',
    priority: 'Extreme',
    description: 'All 36 systems lost internet connection during AI lab examination due to unstable SFP module.',
    status: 'Pending',
    reportedBy: 'Teacher',
    reportedByEmail: 'teacher@campus.edu',
    reportedByRole: 'Teacher',
    createdAt: '2026-10-08T07:20:00Z',
    upvoteCount: 4,
    reopenCount: 0,
    reopenHistory: [],
  },
  {
    id: 'TICK-104',
    title: 'Oscilloscope Bench 04 Grounding Short Circuit',
    location: 'C108',
    category: 'Lab Utilities',
    priority: 'Medium',
    description: 'Workstation 4 earth pin is sparking slightly when connecting signal generator probe.',
    status: 'Pending',
    reportedBy: 'Student',
    reportedByEmail: 'student@campus.edu',
    reportedByRole: 'Student',
    createdAt: '2026-10-07T11:45:00Z',
    upvoteCount: 1,
    reopenCount: 0,
    reopenHistory: [],
  },
  {
    id: 'TICK-105',
    title: 'Corridor High-Bay LED Lights Not Triggering',
    location: 'A101',
    category: 'Electrical',
    priority: 'Normal',
    description: 'North wing 1st floor corridor lighting sensor is dead, area remains dark after 6 PM.',
    status: 'Resolved',
    reportedBy: 'Student',
    reportedByEmail: 'student@campus.edu',
    reportedByRole: 'Student',
    createdAt: '2026-10-04T16:00:00Z',
    upvoteCount: 2,
    reopenCount: 1,
    reopenHistory: [
      {
        reopenedAt: '2026-10-05T19:00:00Z',
        reopenedBy: 'Student',
        reopenedByRole: 'Student',
        reason: 'Light fixture flickered off completely again after 30 minutes of technician marking it fixed.',
      },
    ],
    resolutionNotes: 'Replaced faulty PIR motion driver board and swapped capacitor. Verified continuous 2 hr illumination.',
    resolvedAt: '2026-10-06T17:30:00Z',
    resolvedBy: 'Technician',
  },
  {
    id: 'TICK-106',
    title: 'Library 2nd Floor Split AC Unit Dripping Condensate',
    location: 'B102',
    category: 'Classroom Utilities',
    priority: 'Normal',
    description: 'Condensation line is clogged, dripping water onto reading desks.',
    status: 'Resolved',
    reportedBy: 'Teacher',
    reportedByEmail: 'teacher@campus.edu',
    reportedByRole: 'Teacher',
    createdAt: '2026-10-02T10:00:00Z',
    upvoteCount: 1,
    reopenCount: 0,
    reopenHistory: [],
    resolutionNotes: 'Flushed out drain trap, cleared algae blockage, recharged refrigerant pressure to standard 65 PSI.',
    resolvedAt: '2026-10-03T15:20:00Z',
    resolvedBy: 'Technician',
  },
];

const SEED_RESOURCES: AcademicResource[] = [
  // Year 1 P-Cycle
  {
    id: 'RES-P101',
    title: 'Applied Engineering Physics Complete Lecture Handouts & Formula Sheets',
    subjectCode: '26PHY101',
    subjectName: 'Engineering Physics',
    year: 1,
    cycle: 'P',
    type: 'Notes',
    fileSize: '14.2 MB',
    downloadsCount: 342,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-09-12',
    description: 'Covers Quantum Mechanics, Lasers, Optical Fibers, Dielectrics, and Semiconductor Physics with solved numerical problems.',
    contentSnippet: 'Module 1: Wave Particle Duality, Heisenberg Uncertainty Principle, 1D Schrödinger Wave Equation solutions.',
  },
  {
    id: 'RES-P102',
    title: 'Physics Laboratory Experiments Manual & Error Analysis Guide',
    subjectCode: '26PHYL102',
    subjectName: 'Engineering Physics Lab',
    year: 1,
    cycle: 'P',
    type: 'Lab Manuals',
    fileSize: '8.7 MB',
    downloadsCount: 512,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-09-15',
    description: 'Comprehensive manual for Laser Diffraction, Torsional Pendulum, Photoelectric Effect, and Newton Rings experiments.',
    contentSnippet: 'Experiment 4: Determination of wavelength of He-Ne laser source using transmission diffraction grating.',
  },
  {
    id: 'RES-P103',
    title: 'Calculus & Linear Algebra 5-Year Solved University Question Papers',
    subjectCode: '26MAT101',
    subjectName: 'Engineering Mathematics I',
    year: 1,
    cycle: 'P',
    type: 'Question Banks',
    fileSize: '6.4 MB',
    downloadsCount: 780,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-09-20',
    description: 'Compiled university semester exam question banks with step-by-step calculus proofs and matrix diagonalizations.',
    contentSnippet: 'Unit 3: Eigenvalues, Cayley-Hamilton theorem, Rayleigh power method with worked exam solutions.',
  },
  {
    id: 'RES-P104',
    title: 'Elements of Civil & Mechanical Engineering Textbook Reference Guide',
    subjectCode: '26CIV103',
    subjectName: 'Basic Civil & Mechanical Engg',
    year: 1,
    cycle: 'P',
    type: 'Textbooks',
    fileSize: '22.1 MB',
    downloadsCount: 290,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-09-10',
    description: 'Standard textbook chapters covering surveying, structural building materials, prime movers, and refrigeration cycles.',
    contentSnippet: 'Chapter 5: Internal Combustion engines, 2-stroke vs 4-stroke cycle comparisons, thermal efficiency formulas.',
  },
  {
    id: 'RES-P105',
    title: 'Problem Solving Using C Programming Laboratory Manual & Test Cases',
    subjectCode: '26CSL104',
    subjectName: 'C Programming Lab',
    year: 1,
    cycle: 'P',
    type: 'Lab Manuals',
    fileSize: '4.5 MB',
    downloadsCount: 934,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-09-08',
    description: 'Programs on arrays, string manipulation, dynamic memory allocation, and linked list fundamentals with GCC test harness.',
    contentSnippet: 'Lab Test 8: Implementation of student record management using structs and binary file I/O operations.',
  },

  // Year 1 E-Cycle
  {
    id: 'RES-E101',
    title: 'Basic Electronics & Communication Systems Core Study Notes',
    subjectCode: '26ELN102',
    subjectName: 'Basic Electronics Engineering',
    year: 1,
    cycle: 'E',
    type: 'Notes',
    fileSize: '11.8 MB',
    downloadsCount: 420,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-09-14',
    description: 'PN Junction diodes, BJT characteristics, Operational Amplifiers (Op-Amps), logic gates, and Boolean simplifications.',
    contentSnippet: 'Module 2: Inverting and non-inverting op-amp configurations, virtual ground concept, and filter designs.',
  },
  {
    id: 'RES-E102',
    title: 'Engineering Chemistry & Battery Technology Laboratory Handbook',
    subjectCode: '26CHM102',
    subjectName: 'Engineering Chemistry Lab',
    year: 1,
    cycle: 'E',
    type: 'Lab Manuals',
    fileSize: '7.1 MB',
    downloadsCount: 380,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-09-18',
    description: 'Conductometric titrations, flame photometry, water hardness estimation, and electroplating experiments.',
    contentSnippet: 'Experiment 2: Determination of percentage of copper in brass alloy by iodometric titration method.',
  },

  // Year 2 - Sem 3 CSE
  {
    id: 'RES-S301',
    title: 'Data Structures & Algorithms in C++ Complete Lecture Notebook',
    subjectCode: '26CSE301',
    subjectName: 'Data Structures & Algorithms',
    year: 2,
    semester: 3,
    stream: 'CSE',
    type: 'Notes',
    fileSize: '18.9 MB',
    downloadsCount: 1120,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-08-28',
    description: 'Detailed asymptotic analysis, Red-Black Trees, AVL Trees, Heap Sort, Graph Traversals (BFS/DFS), Dijkstra Algorithm.',
    contentSnippet: 'Chapter 4: Balanced search trees, rotation algorithms, time complexities, and hash map collision resolutions.',
  },
  {
    id: 'RES-S302',
    title: 'Data Structures Lab Manual with Solution Code & Valgrind Guides',
    subjectCode: '26CSL305',
    subjectName: 'DSA Laboratory',
    year: 2,
    semester: 3,
    stream: 'CSE',
    type: 'Lab Manuals',
    fileSize: '9.2 MB',
    downloadsCount: 840,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-09-02',
    description: '14 curriculum lab exercises: Circular Queues, Polynomial addition using Linked Lists, Expression Evaluation, Kruskal MST.',
    contentSnippet: 'Exercise 7: Implementation of threaded binary tree traversal with O(1) auxiliary space complexity.',
  },
  {
    id: 'RES-S303',
    title: 'Digital Design & Computer Architecture Standard Textbook Reference',
    subjectCode: '26CSE302',
    subjectName: 'Computer Organization & Architecture',
    year: 2,
    semester: 3,
    stream: 'CSE',
    type: 'Textbooks',
    fileSize: '29.4 MB',
    downloadsCount: 650,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-08-25',
    description: 'Computer organization notes, pipelining, hazards, memory hierarchy, cache hit/miss calculus.',
    contentSnippet: 'Chapter 5: 5-Stage MIPS pipeline, data forwarding techniques, branch prediction mechanisms.',
  },
  {
    id: 'RES-S304',
    title: 'Discrete Mathematical Structures Exam Question Bank & Proofs',
    subjectCode: '26CSE303',
    subjectName: 'Discrete Mathematics',
    year: 2,
    semester: 3,
    stream: 'CSE',
    type: 'Question Banks',
    fileSize: '5.8 MB',
    downloadsCount: 710,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-09-01',
    description: 'Set theory, predicate logic, recurrence relations, Pigeonhole principle, group theory, planar graphs proofs.',
    contentSnippet: 'Module 3: Generating functions for solving non-homogeneous second-order recurrence relations.',
  },
  {
    id: 'RES-S305',
    title: 'Object-Oriented Programming with Java & Design Patterns Notes',
    subjectCode: '26CSE304',
    subjectName: 'Object Oriented Programming',
    year: 2,
    semester: 3,
    stream: 'CSE',
    type: 'Notes',
    fileSize: '12.4 MB',
    downloadsCount: 980,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-08-30',
    description: 'Polymorphism, Java Streams, Concurrency, Generics, Gang-of-Four Design Patterns (Singleton, Factory, Observer).',
    contentSnippet: 'Module 4: Thread synchronization, thread pools, CompletableFuture, and deadlock prevention techniques.',
  },

  // Year 2 - Sem 4 CSE(AIML)
  {
    id: 'RES-S401',
    title: 'Foundations of Machine Learning & Optimization Mathematics',
    subjectCode: '26AML401',
    subjectName: 'Machine Learning Fundamentals',
    year: 2,
    semester: 4,
    stream: 'CSE(AIML)',
    type: 'Notes',
    fileSize: '24.1 MB',
    downloadsCount: 1250,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-02-10',
    description: 'Linear Regression, Regularization (L1/L2), SVMs, Decision Trees, Random Forests, Gradient Boosting, Scikit-learn pipelines.',
    contentSnippet: 'Chapter 3: Gradient descent variants: Batch, Mini-batch, Stochastic, Adam optimizer convergence proofs.',
  },
  {
    id: 'RES-S402',
    title: 'Machine Learning Lab Manual (Python, PyTorch, Pandas & NumPy)',
    subjectCode: '26AMLL405',
    subjectName: 'Machine Learning Laboratory',
    year: 2,
    semester: 4,
    stream: 'CSE(AIML)',
    type: 'Lab Manuals',
    fileSize: '15.6 MB',
    downloadsCount: 990,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-02-15',
    description: 'Jupyter notebooks for classification on real-world datasets, ROC-AUC metric tuning, and hyperparameter search.',
    contentSnippet: 'Lab 5: Cross-validation and ROC curve analysis on medical diagnostic prediction model.',
  },

  // Year 3 - Sem 5 ECE
  {
    id: 'RES-S501',
    title: 'Digital Signal Processing (DSP) & Filter Design Notes',
    subjectCode: '26ECE501',
    subjectName: 'Digital Signal Processing',
    year: 3,
    semester: 5,
    stream: 'ECE',
    type: 'Notes',
    fileSize: '16.7 MB',
    downloadsCount: 620,
    uploadedBy: 'Teacher',
    uploadedByRole: 'Teacher',
    uploadedAt: '2026-08-20',
    description: 'DFT, FFT algorithms (Radix-2 DIT/DIF), IIR Butterworth/Chebyshev filters, FIR filter design using window techniques.',
    contentSnippet: 'Module 3: Bilinear transformation mapping from s-plane to z-plane and frequency warping compensations.',
  },
  {
    id: 'RES-S502',
    title: 'DSP & MATLAB Simulation Laboratory Manual',
    subjectCode: '26ECEL505',
    subjectName: 'DSP Laboratory',
    year: 3,
    semester: 5,
    stream: 'ECE',
    type: 'Lab Manuals',
    fileSize: '8.4 MB',
    downloadsCount: 540,
    uploadedBy: 'Lab Instructor',
    uploadedByRole: 'Lab Instructor',
    uploadedAt: '2026-08-25',
    description: 'MATLAB and DSP TMS320C6713 board programming for linear convolution, circular convolution, and speech filtering.',
    contentSnippet: 'Experiment 6: Implementation of FIR bandpass filter using Hamming window on floating point DSP processor.',
  },
];

const SEED_EVENTS: CampusEvent[] = [
  {
    id: 'EVT-01',
    title: 'Promptwars 2026: 36-Hour National AI Hackathon',
    category: 'Technical',
    date: '2026-10-10',
    time: '09:00 AM - 09:00 PM (36 Hrs)',
    venue: 'Campus Innovation Center & Auditorium B',
    organizer: 'Dept. of CSE & Google Developer Student Club (GDSC)',
    shortDescription: 'Build next-gen full-stack generative AI solutions to win ₹1,50,000 cash prizes and internship tracks.',
    fullDescription: 'Join over 400 developers across India for Promptwars 2026. Teams will tackle real campus, healthcare, and sustainability challenges using Gemini 2.5 Flash, Cloud Run, and modern web architectures. Mentors from top tech firms will be present 24/7. Food, high-speed Wi-Fi, and merchandise provided.',
    registrationDeadline: '2026-10-09T18:00:00Z',
    isUrgent: true,
    urgentBadge: 'Registration closes in 24 hrs!',
    registeredCount: 388,
    maxCapacity: 450,
    bannerGradient: 'from-indigo-600 via-purple-600 to-pink-500',
    tags: ['AI/ML', 'Hackathon', 'Web Dev', 'Cash Prizes'],
    contactEmail: 'promptwars@sapthagiri.edu.in',
  },
  {
    id: 'EVT-02',
    title: 'Hands-on Generative AI & Agentic Workflows Workshop',
    category: 'Technical',
    date: '2026-10-12',
    time: '02:00 PM - 05:30 PM',
    venue: 'Seminar Hall 3, A Block',
    organizer: 'AI & Data Science Student Chapter',
    shortDescription: 'Deep dive into function calling, multi-modal streaming, and autonomous tool calling agents.',
    fullDescription: 'A practical, live-coding workshop led by senior AI researchers. Bring your laptop and learn how to construct tool-calling workflows, vector embeddings, and production-grade prompts. Certificate of completion awarded.',
    registrationDeadline: '2026-10-11T23:59:00Z',
    isUrgent: true,
    urgentBadge: 'Tomorrow at 2 PM',
    registeredCount: 112,
    maxCapacity: 120,
    bannerGradient: 'from-blue-600 via-cyan-600 to-teal-500',
    tags: ['Generative AI', 'Agents', 'Python', 'Hands-on'],
    contactEmail: 'ai.workshop@sapthagiri.edu.in',
  },
  {
    id: 'EVT-03',
    title: 'ShutterSnap: Golden Hour Campus Photo Walk & Critique',
    category: 'Clubs',
    date: '2026-10-15',
    time: '04:30 PM - 07:00 PM',
    venue: 'Amphitheatre & Botanical Greens',
    organizer: 'Campus Photography Club (Iris)',
    shortDescription: 'Explore creative perspective, golden hour lighting, and mobile street photography techniques.',
    fullDescription: 'Join Iris Photography Club for our autumn campus photo walk. Whether you shoot on DSLR, mirrorless, or your smartphone, learn composition rules, framing, and color theory. Best 3 captures will be featured in the university annual magazine.',
    registrationDeadline: '2026-10-14T17:00:00Z',
    registeredCount: 45,
    maxCapacity: 60,
    bannerGradient: 'from-amber-500 via-orange-600 to-rose-600',
    tags: ['Photography', 'Club Meet', 'Creative Arts'],
    contactEmail: 'iris.photo@sapthagiri.edu.in',
  },
  {
    id: 'EVT-04',
    title: 'Aura 2026: Annual Inter-University Cultural Fest',
    category: 'Cultural',
    date: '2026-10-24',
    time: '10:00 AM - 10:00 PM (2 Days)',
    venue: 'Main University Stadium & Open Air Theatre',
    organizer: 'Student Welfare & Cultural Council',
    shortDescription: 'Battle of the bands, classical & western group dance, celebrity concert, and fashion pageant.',
    fullDescription: 'The grandest cultural festival in Bengaluru! Over 35 competitive events including Battle of the Bands, Street Dance, Drama, Fine Arts, and an electric EDM night featuring top national artists. Food stalls, game arenas, and celebrity guest performances.',
    registrationDeadline: '2026-10-22T20:00:00Z',
    registeredCount: 1420,
    maxCapacity: 2500,
    bannerGradient: 'from-fuchsia-600 via-rose-600 to-amber-500',
    tags: ['Cultural Fest', 'Music', 'Dance', 'Celebrity Night'],
    contactEmail: 'aura2026@sapthagiri.edu.in',
  },
  {
    id: 'EVT-05',
    title: 'RoboWars 2026: Combat Robotics Championship',
    category: 'Technical',
    date: '2026-10-18',
    time: '11:00 AM - 06:00 PM',
    venue: 'Mechanical Block Arena C',
    organizer: 'Robotics & Automation Society (RAS)',
    shortDescription: '15kg and 30kg combat bots clashing inside bulletproof polycarbonate battle cage.',
    fullDescription: 'Witness high-octane engineering clashes! Custom spinners, flippers, and lifters battle in 3-minute survival matches. Safety briefing starts at 10 AM. Audience seating is open to all university students with digital pass.',
    registrationDeadline: '2026-10-16T18:00:00Z',
    registeredCount: 88,
    maxCapacity: 100,
    bannerGradient: 'from-slate-700 via-red-600 to-orange-500',
    tags: ['Robotics', 'Hardware', 'Combat Bots', 'Trophy'],
    contactEmail: 'robowars@sapthagiri.edu.in',
  },
  {
    id: 'EVT-06',
    title: 'Inter-Department Badminton Open Tournament 2026',
    category: 'Sports',
    date: '2026-10-20',
    time: '08:30 AM - 05:00 PM',
    venue: 'Indoor Sports Complex, Court 1-4',
    organizer: 'Dept. of Physical Education & Sports',
    shortDescription: 'Men & Women Singles, Doubles, and Mixed Doubles knockout tournaments with Yonex prizes.',
    fullDescription: 'Annual indoor tournament bringing together faculty and student athletes across all 8 semesters. Standard BWF scoring rules apply. Refreshments, certificates, and trophy cups for winners.',
    registrationDeadline: '2026-10-18T16:00:00Z',
    registeredCount: 64,
    maxCapacity: 80,
    bannerGradient: 'from-emerald-600 via-teal-600 to-cyan-700',
    tags: ['Badminton', 'Sports', 'Tournaments', 'Fitness'],
    contactEmail: 'sports@sapthagiri.edu.in',
  },
];

// Requirement: Generic student roster placeholders (Student 01, Student 02, etc.)
export const SEED_ATTENDANCE_STUDENTS: { studentRoll: string; studentName: string; isPresent: boolean }[] = [
  { studentRoll: '01', studentName: 'Student 01', isPresent: true },
  { studentRoll: '02', studentName: 'Student 02', isPresent: true },
  { studentRoll: '03', studentName: 'Student 03', isPresent: false },
  { studentRoll: '04', studentName: 'Student 04', isPresent: true },
  { studentRoll: '05', studentName: 'Student 05', isPresent: true },
  { studentRoll: '06', studentName: 'Student 06', isPresent: true },
  { studentRoll: '07', studentName: 'Student 07', isPresent: true },
  { studentRoll: '08', studentName: 'Student 08', isPresent: false },
  { studentRoll: '09', studentName: 'Student 09', isPresent: true },
  { studentRoll: '10', studentName: 'Student 10', isPresent: true },
  { studentRoll: '11', studentName: 'Student 11', isPresent: true },
  { studentRoll: '12', studentName: 'Student 12', isPresent: true },
  { studentRoll: '13', studentName: 'Student 13', isPresent: true },
  { studentRoll: '14', studentName: 'Student 14', isPresent: false },
  { studentRoll: '15', studentName: 'Student 15', isPresent: true },
];

const SEED_ATTENDANCE: AttendanceSession[] = [
  {
    id: 'ATT-2026-10-06-P1',
    roomCode: 'A102',
    roomDecoded: 'A Block, 1st Floor, Room 02',
    classCode: '01ECE02',
    classDecoded: 'Semester 1, Stream ECE, Section 02',
    subject: 'Basic Electronics (26ELN102)',
    period: 'Period 1 (09:00 - 10:00 AM)',
    date: '2026-10-06',
    teacherEmail: 'teacher@campus.edu',
    teacherName: 'Teacher',
    students: SEED_ATTENDANCE_STUDENTS.map(s => ({ ...s, isPresent: s.studentRoll !== '03' })),
    totalStudents: 15,
    presentCount: 14,
    absentCount: 1,
    createdAt: '2026-10-06T09:55:00Z',
  },
  {
    id: 'ATT-2026-10-07-P2',
    roomCode: 'A102',
    roomDecoded: 'A Block, 1st Floor, Room 02',
    classCode: '01ECE02',
    classDecoded: 'Semester 1, Stream ECE, Section 02',
    subject: 'Basic Electronics (26ELN102)',
    period: 'Period 2 (10:00 - 11:00 AM)',
    date: '2026-10-07',
    teacherEmail: 'teacher@campus.edu',
    teacherName: 'Teacher',
    students: SEED_ATTENDANCE_STUDENTS.map(s => ({
      ...s,
      isPresent: !['03', '08', '14'].includes(s.studentRoll),
    })),
    totalStudents: 15,
    presentCount: 12,
    absentCount: 3,
    createdAt: '2026-10-07T10:55:00Z',
  },
  {
    id: 'ATT-2026-10-08-P1',
    roomCode: 'A102',
    roomDecoded: 'A Block, 1st Floor, Room 02',
    classCode: '01ECE02',
    classDecoded: 'Semester 1, Stream ECE, Section 02',
    subject: 'Basic Electronics (26ELN102)',
    period: 'Period 1 (09:00 - 10:00 AM)',
    date: '2026-10-08',
    teacherEmail: 'teacher@campus.edu',
    teacherName: 'Teacher',
    students: SEED_ATTENDANCE_STUDENTS.map(s => ({
      ...s,
      isPresent: !['08'].includes(s.studentRoll),
    })),
    totalStudents: 15,
    presentCount: 14,
    absentCount: 1,
    createdAt: '2026-10-08T09:50:00Z',
  },
];

const SEED_SUGGESTIONS: SuggestionItem[] = [
  {
    id: 'SUGG-01',
    authorName: 'Student',
    authorEmail: 'student@campus.edu',
    category: 'Infrastructure',
    idea: 'Add USB-C and 65W PD fast-charging stations inside the 2nd-floor library study cubicles for project work.',
    createdAt: '2026-10-04T12:00:00Z',
    status: 'Under Consideration',
  },
  {
    id: 'SUGG-02',
    authorName: 'Teacher',
    authorEmail: 'teacher@campus.edu',
    category: 'Academics',
    idea: 'Provide automated Git classroom starter repos directly embedded into Academic Vault for student lab assignments.',
    createdAt: '2026-10-05T15:20:00Z',
    status: 'Reviewed',
  },
];

// Helper to seed localStorage
function initializeLocalStorage() {
  try {
    if (!safeGetItem(USERS_KEY)) {
      safeSetJson(USERS_KEY, SEED_USERS);
    }
    if (!safeGetItem(TICKETS_KEY)) {
      safeSetJson(TICKETS_KEY, SEED_TICKETS);
    }
    if (!safeGetItem(VAULT_KEY)) {
      safeSetJson(VAULT_KEY, SEED_RESOURCES);
    }
    if (!safeGetItem(EVENTS_KEY)) {
      safeSetJson(EVENTS_KEY, SEED_EVENTS);
    }
    if (!safeGetItem(REGISTRATIONS_KEY)) {
      safeSetJson(REGISTRATIONS_KEY, ['EVT-01_student@campus.edu', 'EVT-04_student@campus.edu']);
    }
    if (!safeGetItem(ATTENDANCE_KEY)) {
      safeSetJson(ATTENDANCE_KEY, SEED_ATTENDANCE);
    }
    if (!safeGetItem(SUGGESTIONS_KEY)) {
      safeSetJson(SUGGESTIONS_KEY, SEED_SUGGESTIONS);
    }
  } catch (err) {
    console.warn('[SafeStorage] Storage initialization error:', err);
  }
}

// Run initializer
initializeLocalStorage();

// Auth Listeners
type AuthListener = (user: UserProfile | null) => void;
const authListeners: Set<AuthListener> = new Set();

function notifyAuthChange(user: UserProfile | null) {
  authListeners.forEach(fn => {
    try {
      fn(user);
    } catch (e) {
      console.error('Auth listener error:', e);
    }
  });
}

// Simulated Firebase Auth
export const auth = {
  get currentUser(): UserProfile | null {
    return safeGetJson<UserProfile | null>(AUTH_KEY, null);
  },
};

export class GoogleAuthProvider {
  providerId = 'google.com';
}

export async function signInWithEmailAndPassword(
  _authInstance: typeof auth,
  email: string,
  password: string
): Promise<{ user: UserProfile }> {
  await new Promise(res => setTimeout(res, 200));
  const cleanEmail = email.trim().toLowerCase();

  // Master Admin check
  if (cleanEmail === MASTER_ADMIN_EMAIL.toLowerCase()) {
    if (password !== MASTER_ADMIN_PASS) {
      throw new Error('Invalid credentials for Master Admin. Please check your password.');
    }
    const adminUser = SEED_USERS[0];
    safeSetJson(AUTH_KEY, adminUser);
    notifyAuthChange(adminUser);
    return { user: adminUser };
  }

  // Check stored users
  const users: UserProfile[] = safeGetJson<UserProfile[]>(USERS_KEY, []);
  // Check exact email or supported aliases
  const match = users.find(u => {
    const userEm = u.email.toLowerCase();
    if (userEm === cleanEmail) return true;
    if (cleanEmail === 'teacher@campus.edu' && userEm === 'sharma@campus.edu') return true;
    if (cleanEmail === 'sharma@campus.edu' && userEm === 'teacher@campus.edu') return true;
    if (cleanEmail === 'student@campus.edu' && userEm === 'ananya.r@campus.edu') return true;
    if (cleanEmail === 'ananya.r@campus.edu' && userEm === 'student@campus.edu') return true;
    if (cleanEmail === 'technician@campus.edu' && userEm === 'kiran.tech@campus.edu') return true;
    if (cleanEmail === 'kiran.tech@campus.edu' && userEm === 'technician@campus.edu') return true;
    if (cleanEmail === 'lab.instructor@campus.edu' && userEm === 'priya.lab@campus.edu') return true;
    if (cleanEmail === 'priya.lab@campus.edu' && userEm === 'lab.instructor@campus.edu') return true;
    return false;
  });

  if (!match) {
    throw new Error(`Account not found for ${email}. Please sign up or select your role first.`);
  }

  safeSetJson(AUTH_KEY, match);
  notifyAuthChange(match);
  return { user: match };
}

export async function createUserWithEmailAndPassword(
  _authInstance: typeof auth,
  email: string,
  _password: string,
  displayName?: string,
  role?: UserRole
): Promise<{ user: UserProfile }> {
  await new Promise(res => setTimeout(res, 250));
  const cleanEmail = email.trim().toLowerCase();
  const users: UserProfile[] = safeGetJson<UserProfile[]>(USERS_KEY, []);

  const existing = users.find(u => u.email.toLowerCase() === cleanEmail);
  if (existing) {
    throw new Error('An account with this email already exists. Please sign in instead.');
  }

  const assignedRole: UserRole = role || 'Student';
  const newUser: UserProfile = {
    uid: `user-${Date.now()}`,
    email: cleanEmail,
    displayName: displayName?.trim() || assignedRole,
    role: assignedRole,
    department: assignedRole === 'Student' ? 'Computer Science & Engineering' : 'Engineering Department',
  };

  users.push(newUser);
  safeSetJson(USERS_KEY, users);
  safeSetJson(AUTH_KEY, newUser);
  notifyAuthChange(newUser);
  return { user: newUser };
}

export async function signInWithPopup(
  _authInstance: typeof auth,
  _provider: GoogleAuthProvider,
  requestedRole?: UserRole
): Promise<{ user: UserProfile }> {
  await new Promise(res => setTimeout(res, 250));
  const googleEmail = 'google.user@sapthagiri.edu.in';
  const users: UserProfile[] = safeGetJson<UserProfile[]>(USERS_KEY, []);
  let user = users.find(u => u.email === googleEmail);

  if (!user) {
    user = {
      uid: `g-user-${Date.now()}`,
      email: googleEmail,
      displayName: requestedRole || 'Student',
      role: requestedRole || 'Student',
      department: 'Computer Science',
    };
    users.push(user);
    safeSetJson(USERS_KEY, users);
  }

  safeSetJson(AUTH_KEY, user);
  notifyAuthChange(user);
  return { user };
}

export async function signOut(_authInstance: typeof auth): Promise<void> {
  await new Promise(res => setTimeout(res, 100));
  safeRemoveItem(AUTH_KEY);
  notifyAuthChange(null);
}

export function onAuthStateChanged(_authInstance: typeof auth, callback: AuthListener) {
  authListeners.add(callback);
  callback(auth.currentUser);
  return () => {
    authListeners.delete(callback);
  };
}

/**
 * Master Admin Role Switcher
 * STRICT SECURITY FIX: Visible and accessible ONLY when Master Admin is active,
 * and STRICTLY BLOCKED for Technicians.
 */
export function switchActiveUserRole(newRole: UserRole): UserProfile | null {
  const current = auth.currentUser;
  if (!current || current.email.toLowerCase() !== MASTER_ADMIN_EMAIL.toLowerCase()) {
    throw new Error('Security Violation: Only Master Admin can switch simulated active roles.');
  }
  // RBAC Security Enforcement: Technicians cannot switch roles!
  if (current.role === 'Technician') {
    throw new Error('Security Violation: Users in Technician role cannot switch roles.');
  }
  const updated: UserProfile = { ...current, role: newRole };
  safeSetJson(AUTH_KEY, updated);
  notifyAuthChange(updated);
  return updated;
}

// -------------------------------------------------------------
// Modular Firestore Simulation
// -------------------------------------------------------------
export const db = {
  _isMock: true,
};

export interface CollectionReference<T = any> {
  path: string;
}

export interface DocumentReference<T = any> {
  collectionPath: string;
  id: string;
}

export function collection(_dbInstance: typeof db, path: string): CollectionReference {
  return { path };
}

export function doc(_dbInstance: typeof db, pathOrCollection: string | CollectionReference, id?: string): DocumentReference {
  if (typeof pathOrCollection === 'string') {
    const parts = pathOrCollection.split('/');
    return { collectionPath: parts[0], id: parts[1] || id || `doc-${Date.now()}` };
  }
  return { collectionPath: pathOrCollection.path, id: id || `doc-${Date.now()}` };
}

function getStorageKeyForCollection(path: string): string {
  switch (path) {
    case 'users':
      return USERS_KEY;
    case 'tickets':
      return TICKETS_KEY;
    case 'vault_resources':
      return VAULT_KEY;
    case 'events':
      return EVENTS_KEY;
    case 'event_registrations':
      return REGISTRATIONS_KEY;
    case 'attendance_records':
      return ATTENDANCE_KEY;
    case 'suggestions':
      return SUGGESTIONS_KEY;
    default:
      return `${STORAGE_PREFIX}${path}`;
  }
}

export async function getDocs<T = any>(colRef: CollectionReference): Promise<{ docs: Array<{ id: string; data: () => T }> }> {
  await new Promise(res => setTimeout(res, 40));
  const key = getStorageKeyForCollection(colRef.path);
  const items: any[] = safeGetJson<any[]>(key, []);
  return {
    docs: items.map(item => ({
      id: item.id || item.uid || '',
      data: () => item,
    })),
  };
}

export async function getDoc<T = any>(docRef: DocumentReference): Promise<{ exists: () => boolean; data: () => T | null }> {
  await new Promise(res => setTimeout(res, 30));
  const key = getStorageKeyForCollection(docRef.collectionPath);
  const items: any[] = safeGetJson<any[]>(key, []);
  const found = items.find(item => (item.id || item.uid) === docRef.id);
  return {
    exists: () => !!found,
    data: () => found || null,
  };
}

export async function addDoc<T = any>(colRef: CollectionReference, data: any): Promise<DocumentReference> {
  await new Promise(res => setTimeout(res, 50));
  const key = getStorageKeyForCollection(colRef.path);
  const items: any[] = safeGetJson<any[]>(key, []);
  const newId = data.id || `${colRef.path.toUpperCase().slice(0, 4)}-${Date.now()}`;
  const newItem = { ...data, id: newId };
  items.unshift(newItem);
  safeSetJson(key, items);
  triggerFirestoreSnapshots(colRef.path);
  return { collectionPath: colRef.path, id: newId };
}

export async function setDoc<T = any>(docRef: DocumentReference, data: any, _options?: { merge?: boolean }): Promise<void> {
  await new Promise(res => setTimeout(res, 50));
  const key = getStorageKeyForCollection(docRef.collectionPath);
  let items: any[] = safeGetJson<any[]>(key, []);
  const index = items.findIndex(item => (item.id || item.uid) === docRef.id);
  const newItem = { ...data, id: docRef.id };
  if (index >= 0) {
    items[index] = newItem;
  } else {
    items.unshift(newItem);
  }
  safeSetJson(key, items);
  triggerFirestoreSnapshots(docRef.collectionPath);
}

export async function updateDoc(docRef: DocumentReference, updates: Record<string, any>): Promise<void> {
  await new Promise(res => setTimeout(res, 50));
  const key = getStorageKeyForCollection(docRef.collectionPath);
  let items: any[] = safeGetJson<any[]>(key, []);
  const index = items.findIndex(item => (item.id || item.uid) === docRef.id);
  if (index >= 0) {
    items[index] = { ...items[index], ...updates };
    safeSetJson(key, items);
    triggerFirestoreSnapshots(docRef.collectionPath);
  }
}

export async function deleteDoc(docRef: DocumentReference): Promise<void> {
  await new Promise(res => setTimeout(res, 40));
  const key = getStorageKeyForCollection(docRef.collectionPath);
  let items: any[] = safeGetJson<any[]>(key, []);
  items = items.filter(item => (item.id || item.uid) !== docRef.id);
  safeSetJson(key, items);
  triggerFirestoreSnapshots(docRef.collectionPath);
}

// Subscription support for real-time live UI updates
type SnapshotCallback = (snapshot: { docs: Array<{ id: string; data: () => any }> }) => void;
const snapshotListeners: Map<string, Set<SnapshotCallback>> = new Map();

function triggerFirestoreSnapshots(collectionPath: string) {
  const set = snapshotListeners.get(collectionPath);
  if (!set || set.size === 0) return;
  const key = getStorageKeyForCollection(collectionPath);
  const items: any[] = safeGetJson<any[]>(key, []);
  const snapshot = {
    docs: items.map(item => ({
      id: item.id || item.uid || '',
      data: () => item,
    })),
  };
  set.forEach(cb => {
    try {
      cb(snapshot);
    } catch (e) {
      console.error(`Snapshot listener error on ${collectionPath}:`, e);
    }
  });
}

export function onSnapshot(colRef: CollectionReference, callback: SnapshotCallback) {
  if (!snapshotListeners.has(colRef.path)) {
    snapshotListeners.set(colRef.path, new Set());
  }
  snapshotListeners.get(colRef.path)!.add(callback);

  // Trigger initial snapshot immediately
  const key = getStorageKeyForCollection(colRef.path);
  const items: any[] = safeGetJson<any[]>(key, []);
  try {
    callback({
      docs: items.map(item => ({
        id: item.id || item.uid || '',
        data: () => item,
      })),
    });
  } catch (e) {
    console.error(`Initial snapshot callback error on ${colRef.path}:`, e);
  }

  return () => {
    snapshotListeners.get(colRef.path)?.delete(callback);
  };
}

export function isUserRegisteredForEvent(eventId: string, userEmail: string): boolean {
  const list: string[] = safeGetJson<string[]>(REGISTRATIONS_KEY, []);
  return list.includes(`${eventId}_${userEmail.toLowerCase()}`);
}

export function toggleEventRegistration(eventId: string, userEmail: string): boolean {
  const list: string[] = safeGetJson<string[]>(REGISTRATIONS_KEY, []);
  const regKey = `${eventId}_${userEmail.toLowerCase()}`;
  const idx = list.indexOf(regKey);
  const events: CampusEvent[] = safeGetJson<CampusEvent[]>(EVENTS_KEY, []);
  const eventIdx = events.findIndex(e => e.id === eventId);

  let isNowRegistered = false;
  if (idx >= 0) {
    list.splice(idx, 1);
    if (eventIdx >= 0 && events[eventIdx].registeredCount > 0) {
      events[eventIdx].registeredCount -= 1;
    }
    isNowRegistered = false;
  } else {
    list.push(regKey);
    if (eventIdx >= 0) {
      events[eventIdx].registeredCount += 1;
    }
    isNowRegistered = true;
  }

  safeSetJson(REGISTRATIONS_KEY, list);
  safeSetJson(EVENTS_KEY, events);
  triggerFirestoreSnapshots('events');
  return isNowRegistered;
}

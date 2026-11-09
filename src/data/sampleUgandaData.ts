import { Course, DocumentItem, QuizItem, ExamItem, FlashcardItem } from '../types';

export const UGANDAN_INSTITUTIONS = [
  'Makerere University (MAK)',
  'Kyambogo University (KYU)',
  'Makerere University Business School (MUBS)',
  'Mbarara University of Science & Technology (MUST)',
  'Uganda Christian University (UCU)',
  'Gulu University',
  'Busitema University',
  'Islamic University in Uganda (IUIU)',
  'Uganda Martyrs University (UMU)',
  'Ndejje University',
  'Cavendish University Uganda',
  'Kabale University',
  'National Teachers College (NTC)',
  'Uganda National Examination Board (UNEB A-Level / UACE)',
];

export const EDUCATION_LEVELS = [
  'Undergraduate Degree',
  'Postgraduate / Master’s Degree',
  'Diploma / Higher National Diploma',
  'Secondary School (UACE - A-Level)',
  'Secondary School (UCE - O-Level)',
  'Professional Certification',
];

export const SAMPLE_COURSES: Course[] = [
  {
    id: 'course-dbms-101',
    userId: 'demo-user',
    code: 'CSC 2100',
    name: 'Database Management Systems',
    description: 'Relational data models, SQL querying, ER diagrams, normalisation (1NF, 2NF, 3NF, BCNF), and ACID transaction management.',
    lecturerName: 'Dr. Arthur Mukasa',
    institution: 'Makerere University (MAK)',
    semester: 'Semester 1',
    academicYear: '2026/2027',
    topics: ['Relational Model', 'SQL & Indexing', 'Normalisation', 'Transaction Management & ACID'],
    documentCount: 3,
    quizCount: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-net-102',
    userId: 'demo-user',
    code: 'BIT 2201',
    name: 'Computer Networks & Internet Protocols',
    description: 'OSI 7-layer model, TCP/IP, IP subnetting, routing protocols (OSPF, BGP), and network security.',
    lecturerName: 'Eng. Sarah Namatovu',
    institution: 'Kyambogo University (KYU)',
    semester: 'Semester 2',
    academicYear: '2026/2027',
    topics: ['OSI Model vs TCP/IP', 'Subnetting IPv4 & IPv6', 'Routing Protocols', 'DNS & HTTP'],
    documentCount: 2,
    quizCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-dsa-103',
    userId: 'demo-user',
    code: 'CSC 2202',
    name: 'Data Structures and Algorithms',
    description: 'Arrays, linked lists, stacks, queues, trees, graphs, sorting algorithms, and asymptotic Big-O runtime analysis.',
    lecturerName: 'Prof. Godfrey Kintu',
    institution: 'Makerere University (MAK)',
    semester: 'Semester 1',
    academicYear: '2026/2027',
    topics: ['Asymptotic Analysis', 'Trees & BSTs', 'Graph Traversals (BFS/DFS)', 'Dynamic Programming'],
    documentCount: 2,
    quizCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-swe-104',
    userId: 'demo-user',
    code: 'SWE 3101',
    name: 'Software Engineering Methodologies',
    description: 'Software development lifecycle, Agile Scrum, requirements engineering, architectural design patterns, and automated testing.',
    lecturerName: 'Dr. Grace Akello',
    institution: 'Makerere University (MAK)',
    semester: 'Semester 1',
    academicYear: '2026/2027',
    topics: ['Agile vs Waterfall', 'Design Patterns (MVC/Singleton)', 'System Requirements & UML', 'CI/CD & DevOps'],
    documentCount: 2,
    quizCount: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'course-ent-105',
    userId: 'demo-user',
    code: 'BBA 1205',
    name: 'Entrepreneurship & Small Business Management',
    description: 'Ugandan business registration (URSB), feasibility analysis, cash flow budgeting, digital mobile payments, and market entry.',
    lecturerName: 'Mrs. Rebecca Nabatanzi',
    institution: 'Makerere University Business School (MUBS)',
    semester: 'Semester 2',
    academicYear: '2026/2027',
    topics: ['Opportunity Identification', 'URSB & Tax Compliance', 'Working Capital & Mobile Money', 'Marketing Strategy'],
    documentCount: 1,
    quizCount: 1,
    createdAt: new Date().toISOString(),
  },
];

export const SAMPLE_DOCUMENTS: DocumentItem[] = [
  {
    id: 'doc-dbms-norm',
    userId: 'demo-user',
    courseId: 'course-dbms-101',
    courseName: 'CSC 2100 - Database Management Systems',
    title: 'Lecture 4: Database Normalization (1NF to BCNF).pdf',
    fileType: 'application/pdf',
    fileSize: 2450000,
    textContent: `Database Normalization Lecture Notes:
Normalization is the systematic approach of decomposing tables to eliminate data redundancy and undesirable characteristics like Insertion, Update, and Deletion Anomalies.

1. First Normal Form (1NF):
- Each column must contain atomic (indivisible) values.
- No repeating groups or arrays of items in a single tuple.
- Each record must be uniquely identified by a primary key.

2. Second Normal Form (2NF):
- The table must already be in 1NF.
- All non-key attributes must be fully functionally dependent on the entire primary key (No partial dependency on a composite key).

3. Third Normal Form (3NF):
- The table must already be in 2NF.
- There must be no transitive dependencies (Non-key attributes must not depend on other non-key attributes: X -> Y where Y is non-prime).
- Rule of thumb: 'Every non-key attribute must depend on the key, the whole key, and nothing but the key, so help me Codd.'

4. Boyce-Codd Normal Form (BCNF):
- A stricter version of 3NF.
- For every functional dependency X -> Y, X must be a super key.
- Solves anomalies occurring when a table has overlapping candidate keys.

Ugandan Practical Case Study:
Consider an Academic Registration System for Kyambogo University recording StudentID, CourseCode, LecturerName, Department, and HallOfResidence. Decomposing into separate entities (Students, Courses, Lecturers, Allocations) ensures that if Dr. Mukasa shifts departments, only one row in the Lecturers table is updated.`,
    summary: 'Comprehensive breakdown of relational database normalisation. Explains 1NF (atomic values), 2NF (elimination of partial dependencies), 3NF (elimination of transitive dependencies), and BCNF with student registration case examples.',
    concepts: 'Atomic Values, Functional Dependency (FD), Candidate Keys, Partial Dependency, Transitive Dependency, BCNF, Insertion & Deletion Anomalies.',
    uploadDate: '2026-10-14',
    bookmarked: true,
  },
  {
    id: 'doc-net-osi',
    userId: 'demo-user',
    courseId: 'course-net-102',
    courseName: 'BIT 2201 - Computer Networks',
    title: 'Module 2: The OSI Reference Model & TCP-IP Protocols.docx',
    fileType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    fileSize: 1820000,
    textContent: `The 7 Layers of the OSI (Open Systems Interconnection) Model:
7. Application Layer: Human-computer interaction layer where applications can access the network services (HTTP, HTTPS, FTP, SMTP, DNS).
6. Presentation Layer: Syntax and semantics formatting, data translation, encryption (SSL/TLS), and compression.
5. Session Layer: Establishes, manages, and terminates connections between applications.
4. Transport Layer: End-to-end connections, reliability, segmentation, and flow control (TCP for reliable connection-oriented delivery, UDP for low-latency connectionless datagrams). Port numbers reside here (Port 80 HTTP, Port 443 HTTPS, Port 53 DNS).
3. Network Layer: Logical addressing and routing of packets across internetworks (IPv4, IPv6, ICMP, routers, routing protocols like OSPF and BGP).
2. Data Link Layer: Node-to-node data transfer, physical MAC addressing, framing, and error detection (Ethernet, Wi-Fi 802.11, switches).
1. Physical Layer: Transmission and reception of unstructured raw bit streams over a physical medium (cables, fiber optics, radio frequencies).

Mnemonic for Exams:
'All People Seem To Need Data Processing' (Top to bottom) or 'Please Do Not Throw Sausage Pizza Away' (Bottom to top).`,
    summary: 'In-depth explanation of the 7 layers of the OSI model from Physical to Application, comparative transport protocol analysis between TCP and UDP, and standard mnemonic revision aids.',
    concepts: 'OSI 7 Layers, TCP vs UDP, MAC vs IP Addressing, Port Numbers, Encapsulation & Decapsulation, Routers vs Switches.',
    uploadDate: '2026-10-20',
    bookmarked: true,
  },
  {
    id: 'doc-dsa-bst',
    userId: 'demo-user',
    courseId: 'course-dsa-103',
    courseName: 'CSC 2202 - Data Structures and Algorithms',
    title: 'Lecture 7: Binary Search Trees and Traversal Algorithms.pdf',
    fileType: 'application/pdf',
    fileSize: 3100000,
    textContent: `Binary Search Trees (BST) & Algorithmic Complexity:
A Binary Search Tree is a node-based binary tree data structure with the following BST property:
- The left subtree of a node contains only nodes with keys lesser than the node's key.
- The right subtree of a node contains only nodes with keys greater than the node's key.
- The left and right subtrees each must also be a binary search tree.

Tree Traversal Orders:
1. In-order Traversal (Left, Root, Right): Produces sorted ascending output of keys!
2. Pre-order Traversal (Root, Left, Right): Useful for creating copies or serializing the tree structure.
3. Post-order Traversal (Left, Right, Root): Essential for deleting tree nodes or evaluating Reverse Polish expressions.

Time Complexity:
- Search, Insertion, Deletion in Balanced BST: O(log n).
- Worst-case in Skewed / Degenerate BST: O(n) (collapses into a linked list).
- Solution: Self-balancing trees such as AVL Trees and Red-Black Trees.`,
    summary: 'Complete guide to Binary Search Trees (BST), node insertion, deletion rules, in-order/pre-order/post-order traversals, and logarithmic vs linear time complexities.',
    concepts: 'BST Property, In-order traversal, Pre-order traversal, Post-order traversal, AVL balance, Big-O O(log n).',
    uploadDate: '2026-10-28',
    bookmarked: false,
  },
];

export const SAMPLE_QUIZZES: QuizItem[] = [
  {
    id: 'quiz-dbms-1',
    userId: 'demo-user',
    courseId: 'course-dbms-101',
    courseName: 'CSC 2100 - Database Management Systems',
    title: 'Normalisation & Relational Algebra Practice Quiz',
    subject: 'Database Management Systems',
    topic: 'Relational Normalization',
    createdAt: '2026-11-01',
    lastScore: 80,
    totalAttempts: 3,
    questions: [
      {
        id: 1,
        question: 'Which normal form is violated if a non-key attribute depends on another non-key attribute?',
        options: [
          'First Normal Form (1NF)',
          'Second Normal Form (2NF)',
          'Third Normal Form (3NF)',
          'Boyce-Codd Normal Form (BCNF)',
        ],
        correctIndex: 2,
        explanation: 'Third Normal Form (3NF) requires that no non-key attribute is transitively dependent on the primary key (i.e. no non-key attribute depends on another non-key attribute).',
      },
      {
        id: 2,
        question: 'What is required for a relation to be in Second Normal Form (2NF)?',
        options: [
          'It must have no multi-valued attributes and no partial dependency on a candidate key',
          'It must be in 1NF and have no partial functional dependency on any candidate key',
          'All determinants must be candidate keys',
          'It must contain only numeric primary keys',
        ],
        correctIndex: 1,
        explanation: '2NF requires that the relation is already in 1NF and that every non-prime attribute is fully functionally dependent on the primary key, eliminating partial dependencies.',
      },
      {
        id: 3,
        question: 'In BCNF, for every non-trivial functional dependency X -> Y, what must X be?',
        options: ['A prime attribute', 'A foreign key', 'A superkey', 'A secondary index'],
        correctIndex: 2,
        explanation: 'By definition of Boyce-Codd Normal Form (BCNF), for any non-trivial functional dependency X -> Y, X must be a superkey of the relation.',
      },
      {
        id: 4,
        question: 'Which of the following database anomalies occurs when deleting one record causes unintended loss of other unrelated data?',
        options: ['Update Anomaly', 'Insertion Anomaly', 'Deletion Anomaly', 'Redundancy Anomaly'],
        correctIndex: 2,
        explanation: 'A Deletion Anomaly occurs when the deletion of certain data involuntarily results in the loss of other valuable, unrelated information stored in the same unnormalized record.',
      },
      {
        id: 5,
        question: 'What is the primary role of the ACID properties in database transaction management?',
        options: [
          'To compress the database files on disk',
          'To guarantee transaction validity and consistency despite errors, power failures, or concurrent access',
          'To generate automatic visual ER diagrams',
          'To convert SQL queries into NoSQL JSON documents',
        ],
        correctIndex: 1,
        explanation: 'ACID (Atomicity, Consistency, Isolation, Durability) guarantees that database transactions are processed reliably, maintaining data integrity during server crashes or concurrent executions.',
      },
    ],
  },
  {
    id: 'quiz-net-1',
    userId: 'demo-user',
    courseId: 'course-net-102',
    courseName: 'BIT 2201 - Computer Networks',
    title: 'OSI 7-Layer & TCP/IP Protocols Check',
    subject: 'Computer Networks',
    topic: 'OSI Reference Model',
    createdAt: '2026-11-04',
    lastScore: 100,
    totalAttempts: 1,
    questions: [
      {
        id: 1,
        question: 'At which OSI layer do routers primarily operate to forward packets?',
        options: ['Data Link Layer (Layer 2)', 'Network Layer (Layer 3)', 'Transport Layer (Layer 4)', 'Session Layer (Layer 5)'],
        correctIndex: 1,
        explanation: 'Routers operate at the Network Layer (Layer 3) where they examine logical IP addresses to route packets across multiple networks.',
      },
      {
        id: 2,
        question: 'Which protocol operates at the Transport Layer and provides reliable, connection-oriented data transfer?',
        options: ['UDP', 'ICMP', 'TCP', 'IP'],
        correctIndex: 2,
        explanation: 'TCP (Transmission Control Protocol) is connection-oriented and provides sequencing, flow control, and error-checked delivery via acknowledgments.',
      },
      {
        id: 3,
        question: 'What is the default port number used by secure HTTPS communications?',
        options: ['80', '21', '443', '8080'],
        correctIndex: 2,
        explanation: 'Port 443 is the standard registered port for HTTPS (HTTP over TLS/SSL), whereas unencrypted HTTP uses port 80.',
      },
    ],
  },
];

export const SAMPLE_EXAMINATIONS: ExamItem[] = [
  {
    id: 'exam-dbms-final',
    userId: 'demo-user',
    courseId: 'course-dbms-101',
    courseName: 'CSC 2100 - Database Management Systems',
    title: 'University Semester Examination: Database Systems',
    subject: 'Database Management Systems',
    topic: 'Relational Design, SQL & Transactions',
    instructions: 'Time Allowed: 60 Minutes. Section A contains objective and short-answer questions. Section B requires detailed analytical derivations and schema decomposition. Clear working is required.',
    durationMinutes: 60,
    difficulty: 'intermediate',
    totalMarks: 50,
    createdAt: '2026-11-02',
    questions: [
      {
        id: 1,
        type: 'mcq',
        question: 'Given relation R(A, B, C, D) with candidate key {A, B} and functional dependency B -> C. Which normal form does R violate?',
        options: ['1NF', '2NF', '3NF', 'BCNF'],
        marks: 5,
        suggestedTimeMinutes: 3,
        correctAnswer: '2NF',
        explanation: 'Because B is a proper subset of the composite candidate key {A, B}, the dependency B -> C represents a partial dependency. Hence, R violates 2NF.',
        rubric: 'Full 5 marks for correctly identifying 2NF and recognizing the partial dependency.',
      },
      {
        id: 2,
        type: 'short_answer',
        question: 'Explain the difference between a Candidate Key and a Superkey in relational database design.',
        marks: 5,
        suggestedTimeMinutes: 5,
        correctAnswer: 'A superkey is any set of attributes that uniquely identifies a tuple. A candidate key is a minimal superkey—a superkey from which no attribute can be removed without losing unique identification.',
        explanation: 'All candidate keys are superkeys, but not all superkeys are candidate keys. Candidate keys contain zero redundant attributes.',
        rubric: '2.5 marks for superkey definition; 2.5 marks for minimality criteria of candidate key.',
      },
      {
        id: 3,
        type: 'essay',
        question: 'Analyze the four ACID properties of transactions. For each property, illustrate how it prevents a catastrophic failure in an automated Mobile Money (MTN / Airtel) transfer system.',
        marks: 20,
        suggestedTimeMinutes: 25,
        correctAnswer: 'Atomicity: Money must debit sender and credit receiver together or neither; Consistency: Sum of balances remains invariant; Isolation: Concurrent withdrawals cannot double-spend balance; Durability: Once confirmed, transaction record survives power outage or server reboot.',
        explanation: 'Detailed answer breaking down Atomicity, Consistency, Isolation, and Durability with clear mobile money transfer examples.',
        rubric: '5 marks for each correctly explained ACID property with contextual mobile money scenario.',
      },
      {
        id: 4,
        type: 'short_answer',
        question: 'Write a standard SQL query to find the names of students enrolled in "CSC 2100" who scored above 70 marks, ordered alphabetically by student surname.',
        marks: 10,
        suggestedTimeMinutes: 10,
        correctAnswer: 'SELECT s.name FROM Students s JOIN Enrollments e ON s.id = e.student_id WHERE e.course_code = "CSC 2100" AND e.score > 70 ORDER BY s.surname ASC;',
        explanation: 'Requires an inner JOIN between students and enrollments tables, compound WHERE predicate, and ORDER BY clause.',
        rubric: '4 marks for correct JOIN; 3 marks for WHERE conditions; 3 marks for SELECT and ORDER BY.',
      },
      {
        id: 5,
        type: 'true_false',
        question: 'True or False: Every relation that is in Boyce-Codd Normal Form (BCNF) is guaranteed to also be in Third Normal Form (3NF).',
        options: ['True', 'False'],
        marks: 5,
        suggestedTimeMinutes: 2,
        correctAnswer: 'True',
        explanation: 'BCNF is a stricter refinement of 3NF. Any relation that satisfies BCNF automatically satisfies 3NF, 2NF, and 1NF.',
        rubric: '5 marks for True with explanation.',
      },
      {
        id: 6,
        type: 'fill_blank',
        question: 'The property that ensures a transaction is executed in its entirety or not at all is known as _______.',
        marks: 5,
        suggestedTimeMinutes: 2,
        correctAnswer: 'Atomicity',
        explanation: 'Atomicity is the "all-or-nothing" rule of database transactions.',
        rubric: '5 marks for "Atomicity".',
      },
    ],
  },
];

export const SAMPLE_FLASHCARDS: FlashcardItem[] = [
  {
    id: 'fc-1',
    userId: 'demo-user',
    subject: 'Database Systems',
    topic: 'Normalisation',
    front: 'What defines a relation in First Normal Form (1NF)?',
    back: '1. Each column contains only atomic (indivisible) values.\n2. No repeating groups or arrays.\n3. Unique identification via a primary key.',
    difficulty: 'easy',
    status: 'easy',
    createdAt: '2026-11-01',
  },
  {
    id: 'fc-2',
    userId: 'demo-user',
    subject: 'Database Systems',
    topic: 'Normalisation',
    front: 'What is a Transitive Dependency?',
    back: 'When a non-key attribute depends on another non-key attribute (e.g., A -> B and B -> C, where A is the key and B is non-key). 3NF eliminates this.',
    difficulty: 'intermediate',
    status: 'needs_revision',
    createdAt: '2026-11-02',
  },
  {
    id: 'fc-3',
    userId: 'demo-user',
    subject: 'Computer Networks',
    topic: 'OSI Model',
    front: 'Differentiate between TCP and UDP at Layer 4.',
    back: 'TCP: Connection-oriented, reliable, guarantees packet ordering, handles retransmission, uses 3-way handshake.\nUDP: Connectionless, lightweight, no guarantee of delivery or order, ideal for live audio/video and DNS queries.',
    difficulty: 'intermediate',
    status: 'easy',
    createdAt: '2026-11-03',
  },
  {
    id: 'fc-4',
    userId: 'demo-user',
    subject: 'Data Structures',
    topic: 'Binary Search Trees',
    front: 'What is the average and worst-case time complexity for searching in a BST?',
    back: 'Average: O(log n) when the tree is balanced.\nWorst-case: O(n) when the tree is unbalanced/skewed into a degenerate linked list.',
    difficulty: 'difficult',
    status: 'difficult',
    createdAt: '2026-11-04',
  },
  {
    id: 'fc-5',
    userId: 'demo-user',
    subject: 'Software Engineering',
    topic: 'Architecture',
    front: 'Explain the Model-View-Controller (MVC) architectural pattern.',
    back: 'Model: Manages data logic and business rules.\nView: Renders the visual UI presentation to the user.\nController: Accepts user input and updates Model and View accordingly.',
    difficulty: 'easy',
    status: 'easy',
    createdAt: '2026-11-05',
  },
];

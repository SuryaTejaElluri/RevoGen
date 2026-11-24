// Role catalog used for role-based ATS scoring.
//
// coreSkills  — must-haves a recruiter screens for. Worth 70% of the score.
// bonusSkills — nice-to-haves that strengthen the profile. Worth 30%.
//
// Every skill name here must exist in SKILL_DICTIONARY (skill-dictionary.ts) so
// it can be detected in resumes; analysis.service.spec.ts enforces that.

export interface RoleDefinition {
  id: string;
  title: string;
  category: string;
  icon: string;
  description: string;
  coreSkills: string[];
  bonusSkills: string[];
  tips: string[];
}

export const ROLES_CATALOG: RoleDefinition[] = [
  // ── Engineering ────────────────────────────────────────────────────────────
  {
    id: 'frontend-engineer',
    title: 'Frontend Engineer',
    category: 'Engineering',
    icon: '💻',
    description:
      'Builds responsive, accessible user interfaces and fast client-side applications.',
    coreSkills: ['JavaScript', 'TypeScript', 'React', 'HTML', 'CSS', 'Git'],
    bonusSkills: [
      'Next.js',
      'Redux',
      'Tailwind',
      'REST API',
      'GraphQL',
      'Jest',
      'Cypress',
      'Webpack',
      'Figma',
    ],
    tips: [
      'Show production work in React or Next.js and how you managed state.',
      'Quantify performance wins, such as load time or Lighthouse score improvements.',
      'Mention component testing with Jest, React Testing Library or Cypress.',
    ],
  },
  {
    id: 'backend-engineer',
    title: 'Backend Engineer (Node.js)',
    category: 'Engineering',
    icon: '⚙️',
    description:
      'Designs server-side APIs, data models and services that scale.',
    coreSkills: ['Node.js', 'JavaScript', 'REST API', 'SQL', 'Git', 'Docker'],
    bonusSkills: [
      'TypeScript',
      'Express',
      'NestJS',
      'PostgreSQL',
      'MongoDB',
      'Redis',
      'Microservices',
      'AWS',
      'Prisma',
      'Kafka',
    ],
    tips: [
      'Quantify API latency, throughput or uptime improvements.',
      'Describe schema design, indexing and migrations you owned.',
      'Mention caching (Redis), queues (Kafka) and how you deployed services.',
    ],
  },
  {
    id: 'java-developer',
    title: 'Java Developer (Spring Boot)',
    category: 'Engineering',
    icon: '☕',
    description:
      'Builds enterprise back-end services and APIs on the Java and Spring ecosystem.',
    coreSkills: ['Java', 'Spring Boot', 'REST API', 'SQL', 'Hibernate', 'Git'],
    bonusSkills: [
      'Microservices',
      'Maven',
      'JUnit',
      'Kafka',
      'Docker',
      'Kubernetes',
      'MySQL',
      'PostgreSQL',
      'AWS',
      'Redis',
    ],
    tips: [
      'Name the Spring modules you used (Spring Boot, Spring Data JPA, Spring Security).',
      'Show unit and integration testing with JUnit and Mockito.',
      'Describe microservice communication, such as REST or Kafka, and its scale.',
    ],
  },
  {
    id: 'python-developer',
    title: 'Python Developer',
    category: 'Engineering',
    icon: '🐍',
    description: 'Builds back-end services, automation and APIs in Python.',
    coreSkills: ['Python', 'Django', 'REST API', 'SQL', 'Git'],
    bonusSkills: [
      'FastAPI',
      'Flask',
      'PostgreSQL',
      'Celery',
      'Redis',
      'Docker',
      'AWS',
      'Pytest',
      'Linux',
    ],
    tips: [
      'Name the framework you shipped with (Django, FastAPI or Flask) and what you built.',
      'Show testing with Pytest and how coverage changed.',
      'Mention background jobs (Celery) and how you deployed the app.',
    ],
  },
  {
    id: 'dotnet-developer',
    title: '.NET Developer',
    category: 'Engineering',
    icon: '🟣',
    description:
      'Builds web APIs and enterprise applications with C# and .NET.',
    coreSkills: ['C#', '.NET', 'ASP.NET', 'SQL Server', 'REST API', 'Git'],
    bonusSkills: [
      'Entity Framework',
      'Azure',
      'Microservices',
      'Docker',
      'JavaScript',
      'Angular',
      'React',
      'xUnit',
    ],
    tips: [
      'Specify .NET versions (for example .NET 8) and whether you used ASP.NET Core.',
      'Show data access work with Entity Framework and SQL Server.',
      'Mention Azure services you deployed to or integrated with.',
    ],
  },
  {
    id: 'fullstack-developer',
    title: 'Full-Stack Developer',
    category: 'Engineering',
    icon: '🚀',
    description:
      'Owns features end to end, from the user interface down to the database.',
    coreSkills: [
      'JavaScript',
      'TypeScript',
      'React',
      'Node.js',
      'SQL',
      'REST API',
      'Git',
    ],
    bonusSkills: [
      'Next.js',
      'Express',
      'NestJS',
      'PostgreSQL',
      'MongoDB',
      'Docker',
      'AWS',
      'Tailwind',
      'GraphQL',
      'Prisma',
    ],
    tips: [
      'Show features you owned from UI to database.',
      'Highlight TypeScript across both client and server.',
      'Mention automated tests and deployments for front and back end.',
    ],
  },

  // ── Mobile ─────────────────────────────────────────────────────────────────
  {
    id: 'mobile-app-developer',
    title: 'Mobile Developer (Cross-platform)',
    category: 'Mobile',
    icon: '📱',
    description:
      'Builds iOS and Android apps from one codebase with React Native or Flutter.',
    coreSkills: ['React Native', 'JavaScript', 'TypeScript', 'REST API', 'Git'],
    bonusSkills: [
      'Flutter',
      'Dart',
      'Redux',
      'Firebase',
      'iOS',
      'Android',
      'SQLite',
      'Jest',
    ],
    tips: [
      'Link to apps published on the Play Store or App Store, with ratings or downloads.',
      'Mention offline support, push notifications and device features you used.',
      'Quantify crash-rate or startup-time improvements.',
    ],
  },
  {
    id: 'android-developer',
    title: 'Android Developer',
    category: 'Mobile',
    icon: '🤖',
    description:
      'Builds native Android apps with Kotlin and modern Android libraries.',
    coreSkills: ['Kotlin', 'Android', 'Android Studio', 'REST API', 'Git'],
    bonusSkills: [
      'Java',
      'Jetpack Compose',
      'MVVM',
      'Room',
      'Retrofit',
      'Coroutines',
      'Firebase',
      'Dagger',
    ],
    tips: [
      'Mention Jetpack Compose or XML layouts and the architecture you used (MVVM).',
      'Link to live Play Store apps and their install counts.',
      'Show networking (Retrofit), local storage (Room) and background work.',
    ],
  },
  {
    id: 'ios-developer',
    title: 'iOS Developer',
    category: 'Mobile',
    icon: '🍎',
    description: 'Builds native iPhone and iPad apps with Swift.',
    coreSkills: ['Swift', 'iOS', 'Xcode', 'REST API', 'Git'],
    bonusSkills: [
      'SwiftUI',
      'UIKit',
      'Core Data',
      'Combine',
      'Objective-C',
      'Firebase',
      'MVVM',
    ],
    tips: [
      'Say whether you built with SwiftUI, UIKit or both.',
      'Link to App Store apps with ratings or downloads.',
      'Mention persistence (Core Data) and async patterns (Combine or async/await).',
    ],
  },

  // ── Data & AI ──────────────────────────────────────────────────────────────
  {
    id: 'data-analyst',
    title: 'Data Analyst',
    category: 'Data & AI',
    icon: '📈',
    description:
      'Turns raw data into reports, dashboards and business decisions.',
    coreSkills: ['SQL', 'Excel', 'Data Analysis', 'Power BI', 'Statistics'],
    bonusSkills: [
      'Python',
      'Tableau',
      'Pandas',
      'Data Visualization',
      'PostgreSQL',
      'Google Analytics',
      'Looker',
    ],
    tips: [
      'Quantify business impact, such as cost saved or revenue influenced by your analysis.',
      'Show advanced SQL: window functions, CTEs and complex joins.',
      'Mention the dashboards you built and who used them.',
    ],
  },
  {
    id: 'data-scientist',
    title: 'Data Scientist',
    category: 'Data & AI',
    icon: '🔬',
    description:
      'Builds statistical and machine learning models to answer business questions.',
    coreSkills: [
      'Python',
      'Machine Learning',
      'Statistics',
      'SQL',
      'Pandas',
      'Scikit-learn',
    ],
    bonusSkills: [
      'NumPy',
      'Deep Learning',
      'TensorFlow',
      'PyTorch',
      'Data Visualization',
      'Jupyter',
      'R',
      'A/B Testing',
    ],
    tips: [
      'Report model metrics (accuracy, F1, AUC) and the business result they drove.',
      'Describe feature engineering and how you validated models.',
      'Mention experiments (A/B tests) you designed or analysed.',
    ],
  },
  {
    id: 'data-engineer',
    title: 'Data Engineer',
    category: 'Data & AI',
    icon: '🗄️',
    description:
      'Builds reliable data pipelines, warehouses and streaming systems.',
    coreSkills: ['Python', 'SQL', 'ETL', 'Data Pipelines', 'Spark'],
    bonusSkills: [
      'Airflow',
      'Kafka',
      'Snowflake',
      'BigQuery',
      'dbt',
      'AWS',
      'Databricks',
      'Hadoop',
      'Docker',
    ],
    tips: [
      'Quantify data volumes, such as rows or events processed per day.',
      'Name your orchestration (Airflow) and transformation tools (dbt, Spark).',
      'Show warehouse modelling and query tuning work.',
    ],
  },
  {
    id: 'ai-ml-engineer',
    title: 'Machine Learning Engineer',
    category: 'Data & AI',
    icon: '🧠',
    description: 'Takes ML models from notebooks to production services.',
    coreSkills: [
      'Python',
      'Machine Learning',
      'Deep Learning',
      'PyTorch',
      'TensorFlow',
    ],
    bonusSkills: [
      'Scikit-learn',
      'MLOps',
      'Docker',
      'Kubernetes',
      'FastAPI',
      'NumPy',
      'Pandas',
      'AWS',
      'Computer Vision',
      'NLP',
    ],
    tips: [
      'Describe how models were served in production and their latency.',
      'Report model metrics and how you monitored drift.',
      'Mention MLOps tooling for training and deployment pipelines.',
    ],
  },
  {
    id: 'genai-engineer',
    title: 'Generative AI / LLM Engineer',
    category: 'Data & AI',
    icon: '✨',
    description:
      'Builds products on large language models: RAG, agents and evaluation.',
    coreSkills: [
      'Python',
      'LLM',
      'Prompt Engineering',
      'RAG',
      'LangChain',
      'REST API',
    ],
    bonusSkills: [
      'Vector DB',
      'OpenAI API',
      'Hugging Face',
      'LlamaIndex',
      'FastAPI',
      'Docker',
      'NLP',
      'PyTorch',
      'Fine-tuning',
    ],
    tips: [
      'Describe the LLM features you shipped and how users used them.',
      'Show how you evaluated quality, cost and latency.',
      'Mention retrieval design: embeddings, chunking and vector stores.',
    ],
  },

  // ── Infrastructure ─────────────────────────────────────────────────────────
  {
    id: 'devops-cloud-engineer',
    title: 'DevOps Engineer',
    category: 'Infrastructure',
    icon: '♾️',
    description:
      'Automates build, test and deployment pipelines and runs cloud infrastructure.',
    coreSkills: ['Linux', 'Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Git'],
    bonusSkills: [
      'Terraform',
      'Ansible',
      'Jenkins',
      'GitHub Actions',
      'Bash',
      'Python',
      'Prometheus',
      'Grafana',
      'Helm',
      'Nginx',
    ],
    tips: [
      'Show deployment frequency or lead-time improvements from your pipelines.',
      'Mention infrastructure as code (Terraform, Ansible) you wrote.',
      'Quantify cost savings or uptime you achieved.',
    ],
  },
  {
    id: 'cloud-engineer',
    title: 'Cloud Engineer',
    category: 'Infrastructure',
    icon: '☁️',
    description:
      'Designs, secures and operates workloads on AWS, Azure or GCP.',
    coreSkills: ['AWS', 'Linux', 'Networking', 'Terraform', 'IAM'],
    bonusSkills: [
      'Azure',
      'GCP',
      'Docker',
      'Kubernetes',
      'Python',
      'Bash',
      'CI/CD',
      'Serverless',
      'CloudFormation',
    ],
    tips: [
      'List cloud certifications (for example AWS Solutions Architect).',
      'Describe architectures you designed and their scale.',
      'Quantify cost optimisation or migration results.',
    ],
  },

  // ── Quality & Security ─────────────────────────────────────────────────────
  {
    id: 'qa-automation-engineer',
    title: 'QA Automation Engineer',
    category: 'Quality & Security',
    icon: '🧪',
    description: 'Builds automated test suites that keep releases safe.',
    coreSkills: ['Test Automation', 'Selenium', 'Java', 'API Testing', 'Git'],
    bonusSkills: [
      'Playwright',
      'Cypress',
      'TestNG',
      'Postman',
      'Jira',
      'CI/CD',
      'JavaScript',
      'Python',
      'Performance Testing',
    ],
    tips: [
      'Quantify coverage or regression time improvements from automation.',
      'Name your frameworks and patterns (Selenium with Page Object Model, Playwright).',
      'Mention API testing (Postman, REST Assured) running in CI.',
    ],
  },
  {
    id: 'cybersecurity-analyst',
    title: 'Cybersecurity Analyst',
    category: 'Quality & Security',
    icon: '🛡️',
    description: 'Detects, investigates and prevents security threats.',
    coreSkills: [
      'Network Security',
      'SIEM',
      'Vulnerability Assessment',
      'Incident Response',
      'Linux',
    ],
    bonusSkills: [
      'Penetration Testing',
      'OWASP',
      'Wireshark',
      'Firewalls',
      'Python',
      'IAM',
      'Splunk',
      'Cloud Security',
    ],
    tips: [
      'List certifications (Security+, CEH, CISSP) if you have them.',
      'Describe incidents you investigated and their outcome.',
      'Mention the tools you used: SIEM, scanners and packet analysis.',
    ],
  },

  // ── Product & Design ───────────────────────────────────────────────────────
  {
    id: 'ui-ux-designer',
    title: 'UI/UX Designer',
    category: 'Product & Design',
    icon: '🎨',
    description:
      'Designs usable, good-looking product experiences backed by research.',
    coreSkills: [
      'Figma',
      'UI Design',
      'UX Research',
      'Wireframing',
      'Prototyping',
    ],
    bonusSkills: [
      'Design Systems',
      'Usability Testing',
      'Adobe XD',
      'HTML',
      'CSS',
      'Accessibility',
      'User Flows',
    ],
    tips: [
      'Link to a portfolio with case studies, not just screens.',
      'Show the research behind decisions and the measured result.',
      'Mention design systems you built or maintained.',
    ],
  },
  {
    id: 'product-manager',
    title: 'Product Manager',
    category: 'Product & Design',
    icon: '🧭',
    description: 'Decides what to build, aligns teams and measures outcomes.',
    coreSkills: [
      'Product Management',
      'Roadmapping',
      'Agile',
      'Stakeholder Management',
      'Data Analysis',
    ],
    bonusSkills: [
      'Jira',
      'SQL',
      'A/B Testing',
      'User Research',
      'Figma',
      'Product Analytics',
      'Scrum',
    ],
    tips: [
      'Lead with outcomes: metrics you moved, such as activation or retention.',
      'Show how you prioritised and what you chose not to build.',
      'Mention experiments and the data you used to decide.',
    ],
  },
];

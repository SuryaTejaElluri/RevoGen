// Skill dictionary for resume parsing.
//
// Keys are canonical skill names (the names used in roles.ts and shown to users).
//   aliases       — other ways the skill is written on resumes (matched case-insensitively).
//                   The canonical name itself is always an alias.
//   caseSensitive — the canonical name only counts with this exact casing
//                   ("React" the library vs "react" the verb).
//   needsContext  — the canonical name is also an everyday word ("Excel", "Swift",
//                   "Room"), so it only counts on a line that names another
//                   confirmed skill (a skills list or a tech-stack line). Aliases still
//                   count on their own, e.g. "Microsoft Excel" or "golang".
//   implies       — skills that knowing this one demonstrates (MySQL → SQL).

export interface SkillEntry {
  aliases?: string[];
  caseSensitive?: boolean;
  needsContext?: boolean;
  implies?: string[];
}

export const SKILL_DICTIONARY: Record<string, SkillEntry> = {
  // ── Languages ──
  JavaScript: { aliases: ['javascript', 'js', 'es6', 'ecmascript'] },
  TypeScript: { aliases: ['typescript'] },
  Python: { aliases: ['python', 'python3'] },
  Java: { aliases: ['java', 'core java', 'java 8', 'java 11', 'java 17'] },
  Kotlin: {},
  Swift: {
    aliases: ['swift 5', 'swift programming'],
    caseSensitive: true,
    needsContext: true,
  },
  'Objective-C': { aliases: ['objective c', 'objc'] },
  Dart: { aliases: ['dart language'], caseSensitive: true, needsContext: true },
  'C#': { aliases: ['csharp', 'c sharp'] },
  R: {
    aliases: ['r programming', 'r language', 'rstudio', 'tidyverse', 'ggplot2'],
    caseSensitive: true,
    needsContext: true,
  },
  SQL: { aliases: ['sql', 'pl/sql', 'plsql'] },
  Bash: {
    aliases: ['bash', 'shell scripting', 'shell script', 'shell scripts'],
  },
  HTML: { aliases: ['html', 'html5'] },
  CSS: { aliases: ['css', 'css3', 'scss', 'sass'] },

  // ── Frontend ──
  React: {
    aliases: ['react.js', 'reactjs', 'react js', 'react hooks'],
    caseSensitive: true,
  },
  'Next.js': { aliases: ['nextjs', 'next js'], implies: ['React'] },
  Angular: { aliases: ['angular', 'angularjs'] },
  Redux: { aliases: ['redux', 'redux toolkit'] },
  Tailwind: {
    aliases: ['tailwind', 'tailwindcss', 'tailwind css'],
    implies: ['CSS'],
  },
  Webpack: { aliases: ['webpack'] },
  GraphQL: { aliases: ['graphql', 'apollo graphql'] },

  // ── Backend ──
  'Node.js': { aliases: ['nodejs', 'node js'] },
  Express: {
    aliases: ['express.js', 'expressjs', 'express js'],
    caseSensitive: true,
    needsContext: true,
    implies: ['Node.js'],
  },
  NestJS: {
    aliases: ['nestjs', 'nest.js'],
    implies: ['Node.js', 'TypeScript'],
  },
  'Spring Boot': {
    aliases: ['spring boot', 'springboot', 'spring framework', 'spring mvc'],
    implies: ['Java'],
  },
  Hibernate: { aliases: ['hibernate', 'jpa', 'spring data jpa'] },
  Maven: { aliases: ['maven', 'gradle'] },
  Django: {
    aliases: ['django', 'django rest framework', 'drf'],
    implies: ['Python'],
  },
  FastAPI: { aliases: ['fastapi', 'fast api'], implies: ['Python'] },
  Flask: { aliases: ['flask'], implies: ['Python'] },
  Celery: { aliases: ['celery'] },
  '.NET': {
    aliases: [
      '.net',
      'dotnet',
      '.net core',
      '.net framework',
      '.net 6',
      '.net 8',
    ],
  },
  'ASP.NET': {
    aliases: ['asp.net', 'asp.net core', 'asp.net mvc', 'web api 2'],
    implies: ['.NET', 'C#'],
  },
  'Entity Framework': {
    aliases: ['entity framework', 'ef core'],
    implies: ['.NET'],
  },
  'REST API': {
    aliases: [
      'rest api',
      'rest apis',
      'restful',
      'restful api',
      'restful apis',
      'restful services',
      'rest services',
      'rest endpoints',
    ],
  },
  Microservices: {
    aliases: [
      'microservices',
      'microservice',
      'micro-services',
      'micro services',
    ],
  },
  Prisma: { aliases: ['prisma'] },
  Kafka: { aliases: ['kafka', 'apache kafka'] },

  // ── Databases ──
  PostgreSQL: { aliases: ['postgresql', 'postgres', 'psql'], implies: ['SQL'] },
  MySQL: { aliases: ['mysql'], implies: ['SQL'] },
  'SQL Server': {
    aliases: ['sql server', 'mssql', 'ms sql', 't-sql', 'tsql'],
    implies: ['SQL'],
  },
  SQLite: { aliases: ['sqlite'], implies: ['SQL'] },
  MongoDB: { aliases: ['mongodb', 'mongo', 'mongoose'] },
  Redis: { aliases: ['redis'] },
  Firebase: { aliases: ['firebase', 'firestore'] },

  // ── Mobile ──
  'React Native': { aliases: ['react native', 'react-native'] },
  Flutter: { aliases: ['flutter'], implies: ['Dart'] },
  Android: { aliases: ['android', 'android sdk'] },
  'Android Studio': { aliases: ['android studio'], implies: ['Android'] },
  'Jetpack Compose': {
    aliases: ['jetpack compose', 'compose ui'],
    implies: ['Android', 'Kotlin'],
  },
  MVVM: { aliases: ['mvvm'] },
  Room: {
    aliases: ['room database', 'room db', 'room persistence'],
    caseSensitive: true,
    needsContext: true,
  },
  Retrofit: { aliases: ['retrofit2'], caseSensitive: true, needsContext: true },
  Coroutines: { aliases: ['coroutines', 'kotlin coroutines'] },
  Dagger: {
    aliases: ['dagger2', 'dagger 2', 'hilt', 'dagger-hilt', 'dagger hilt'],
    caseSensitive: true,
    needsContext: true,
  },
  iOS: { aliases: ['ios'] },
  Xcode: { aliases: ['xcode'] },
  SwiftUI: { aliases: ['swiftui', 'swift ui'], implies: ['Swift', 'iOS'] },
  UIKit: { aliases: ['uikit'], implies: ['iOS'] },
  'Core Data': { aliases: ['core data', 'coredata'], implies: ['iOS'] },
  Combine: {
    aliases: ['combine framework'],
    caseSensitive: true,
    needsContext: true,
  },

  // ── Testing ──
  Jest: { aliases: ['jest'] },
  Cypress: { aliases: ['cypress'] },
  Playwright: { aliases: ['playwright'] },
  Selenium: {
    aliases: ['selenium', 'selenium webdriver', 'webdriver'],
    implies: ['Test Automation'],
  },
  TestNG: { aliases: ['testng'] },
  JUnit: { aliases: ['junit', 'junit5', 'mockito'] },
  xUnit: { aliases: ['xunit', 'nunit', 'mstest'] },
  Pytest: { aliases: ['pytest'], implies: ['Python'] },
  Postman: { aliases: ['postman', 'newman'] },
  'Test Automation': {
    aliases: [
      'test automation',
      'automation testing',
      'automated testing',
      'automated tests',
      'automation framework',
    ],
  },
  'API Testing': {
    aliases: ['api testing', 'rest assured', 'restassured', 'api automation'],
  },
  'Performance Testing': {
    aliases: ['performance testing', 'load testing', 'jmeter', 'gatling', 'k6'],
  },

  // ── DevOps & Cloud ──
  Git: { aliases: ['git', 'github', 'gitlab', 'bitbucket'] },
  Docker: {
    aliases: [
      'docker',
      'docker-compose',
      'docker compose',
      'containerization',
      'containerisation',
    ],
  },
  Kubernetes: {
    aliases: ['kubernetes', 'k8s', 'eks', 'aks', 'gke', 'openshift'],
  },
  Helm: {
    aliases: ['helm chart', 'helm charts'],
    caseSensitive: true,
    needsContext: true,
  },
  'CI/CD': {
    aliases: [
      'ci/cd',
      'cicd',
      'ci cd',
      'continuous integration',
      'continuous delivery',
      'continuous deployment',
    ],
  },
  Jenkins: { aliases: ['jenkins'], implies: ['CI/CD'] },
  'GitHub Actions': { aliases: ['github actions'], implies: ['CI/CD', 'Git'] },
  Terraform: { aliases: ['terraform'] },
  Ansible: { aliases: ['ansible'] },
  CloudFormation: { aliases: ['cloudformation', 'aws cdk'] },
  AWS: {
    aliases: ['aws', 'amazon web services', 'ec2', 'aws lambda', 'amazon s3'],
  },
  Azure: { aliases: ['azure', 'microsoft azure'] },
  GCP: { aliases: ['gcp', 'google cloud', 'google cloud platform'] },
  Serverless: {
    aliases: ['serverless', 'aws lambda', 'azure functions', 'cloud functions'],
  },
  Linux: { aliases: ['linux', 'ubuntu', 'centos', 'rhel', 'unix', 'debian'] },
  Nginx: { aliases: ['nginx'] },
  Prometheus: { aliases: ['prometheus'] },
  Grafana: { aliases: ['grafana'] },
  Networking: {
    aliases: [
      'networking',
      'tcp/ip',
      'dns',
      'vpc',
      'subnetting',
      'load balancing',
      'load balancers',
    ],
  },
  IAM: { aliases: ['iam', 'identity and access management'] },

  // ── Data ──
  Excel: {
    aliases: [
      'ms excel',
      'microsoft excel',
      'advanced excel',
      'vlookup',
      'pivot tables',
      'pivot table',
    ],
    caseSensitive: true,
    needsContext: true,
  },
  'Power BI': { aliases: ['power bi', 'powerbi', 'dax'] },
  Tableau: { aliases: ['tableau'] },
  Looker: {
    aliases: ['looker studio', 'google data studio'],
    caseSensitive: true,
    needsContext: true,
  },
  'Google Analytics': { aliases: ['google analytics', 'ga4'] },
  'Data Analysis': {
    aliases: [
      'data analysis',
      'data analytics',
      'analyzing data',
      'analysing data',
      'exploratory data analysis',
      'eda',
    ],
  },
  'Data Visualization': {
    aliases: [
      'data visualization',
      'data visualisation',
      'matplotlib',
      'seaborn',
      'plotly',
    ],
  },
  Statistics: {
    aliases: [
      'statistics',
      'statistical analysis',
      'statistical modeling',
      'statistical modelling',
      'hypothesis testing',
      'regression analysis',
    ],
  },
  'A/B Testing': {
    aliases: [
      'a/b testing',
      'a/b tests',
      'a/b test',
      'ab testing',
      'split testing',
    ],
  },
  Pandas: { aliases: ['pandas'], implies: ['Python'] },
  NumPy: { aliases: ['numpy'], implies: ['Python'] },
  Jupyter: { aliases: ['jupyter', 'jupyter notebook', 'jupyter notebooks'] },
  ETL: { aliases: ['etl', 'elt', 'etl pipelines'] },
  'Data Pipelines': {
    aliases: [
      'data pipeline',
      'data pipelines',
      'etl pipeline',
      'etl pipelines',
    ],
  },
  Spark: {
    aliases: ['apache spark', 'pyspark', 'spark sql', 'spark streaming'],
    caseSensitive: true,
    needsContext: true,
  },
  Hadoop: { aliases: ['hadoop', 'hdfs', 'apache hive', 'mapreduce'] },
  Airflow: { aliases: ['airflow', 'apache airflow'] },
  Snowflake: { aliases: ['snowflake'] },
  BigQuery: { aliases: ['bigquery', 'big query'] },
  Databricks: { aliases: ['databricks'] },
  dbt: { aliases: ['dbt', 'data build tool'] },

  // ── AI / ML ──
  'Machine Learning': {
    aliases: [
      'machine learning',
      'ml models',
      'ml model',
      'supervised learning',
      'unsupervised learning',
    ],
  },
  'Deep Learning': {
    aliases: [
      'deep learning',
      'neural networks',
      'neural network',
      'cnn',
      'rnn',
      'lstm',
    ],
  },
  'Scikit-learn': { aliases: ['scikit-learn', 'scikit learn', 'sklearn'] },
  TensorFlow: { aliases: ['tensorflow', 'keras'] },
  PyTorch: { aliases: ['pytorch'] },
  NLP: { aliases: ['nlp', 'natural language processing'] },
  'Computer Vision': {
    aliases: [
      'computer vision',
      'opencv',
      'object detection',
      'image classification',
    ],
  },
  MLOps: { aliases: ['mlops', 'mlflow', 'kubeflow', 'sagemaker', 'vertex ai'] },
  LLM: {
    aliases: [
      'llm',
      'llms',
      'large language model',
      'large language models',
      'gpt-4',
      'gpt-4o',
      'gpt-3.5',
    ],
  },
  'Prompt Engineering': { aliases: ['prompt engineering', 'prompt design'] },
  RAG: {
    aliases: [
      'retrieval augmented generation',
      'retrieval-augmented generation',
    ],
    caseSensitive: true,
  },
  LangChain: { aliases: ['langchain', 'langgraph'] },
  LlamaIndex: { aliases: ['llamaindex', 'llama index', 'llama-index'] },
  'Hugging Face': { aliases: ['hugging face', 'huggingface'] },
  'OpenAI API': { aliases: ['openai api', 'openai'] },
  'Vector DB': {
    aliases: [
      'vector db',
      'vector database',
      'vector databases',
      'pinecone',
      'weaviate',
      'chromadb',
      'chroma db',
      'faiss',
      'pgvector',
      'milvus',
      'qdrant',
    ],
  },
  'Fine-tuning': {
    aliases: [
      'fine-tuning',
      'fine tuning',
      'finetuning',
      'lora',
      'qlora',
      'peft',
    ],
  },

  // ── Security ──
  'Network Security': { aliases: ['network security'] },
  SIEM: { aliases: ['siem', 'qradar', 'microsoft sentinel', 'arcsight'] },
  Splunk: { aliases: ['splunk'], implies: ['SIEM'] },
  'Vulnerability Assessment': {
    aliases: [
      'vulnerability assessment',
      'vulnerability scanning',
      'vulnerability management',
      'vapt',
      'nessus',
      'qualys',
      'openvas',
    ],
  },
  'Penetration Testing': {
    aliases: [
      'penetration testing',
      'pen testing',
      'pentesting',
      'pentest',
      'vapt',
      'burp suite',
      'metasploit',
      'ethical hacking',
    ],
  },
  'Incident Response': {
    aliases: ['incident response', 'incident handling', 'incident management'],
  },
  OWASP: { aliases: ['owasp', 'owasp top 10'] },
  Wireshark: { aliases: ['wireshark'] },
  Firewalls: {
    aliases: ['firewall', 'firewalls', 'palo alto', 'fortinet', 'iptables'],
  },
  'Cloud Security': { aliases: ['cloud security'] },

  // ── Design ──
  Figma: { aliases: ['figma'] },
  'Adobe XD': { aliases: ['adobe xd'] },
  'UI Design': {
    aliases: [
      'ui design',
      'user interface design',
      'visual design',
      'ui/ux',
      'ui/ux design',
    ],
  },
  'UX Research': {
    aliases: ['ux research', 'user experience research', 'ui/ux research'],
  },
  'User Research': {
    aliases: ['user research', 'user interviews', 'customer interviews'],
  },
  'Usability Testing': {
    aliases: ['usability testing', 'usability tests', 'user testing'],
  },
  Wireframing: { aliases: ['wireframing', 'wireframe', 'wireframes'] },
  Prototyping: {
    aliases: ['prototyping', 'prototypes', 'interactive prototypes'],
  },
  'Design Systems': {
    aliases: ['design system', 'design systems', 'component library'],
  },
  'User Flows': {
    aliases: [
      'user flow',
      'user flows',
      'user journey',
      'user journeys',
      'journey mapping',
    ],
  },
  Accessibility: { aliases: ['accessibility', 'a11y', 'wcag'] },

  // ── Product & process ──
  'Product Management': {
    aliases: ['product management', 'product manager', 'product owner'],
  },
  Roadmapping: {
    aliases: ['roadmap', 'roadmaps', 'roadmapping', 'product roadmap'],
  },
  'Stakeholder Management': {
    aliases: [
      'stakeholder management',
      'stakeholders',
      'stakeholder communication',
    ],
  },
  'Product Analytics': {
    aliases: ['product analytics', 'mixpanel', 'amplitude'],
  },
  Agile: { aliases: ['agile', 'agile methodology', 'kanban'] },
  Scrum: {
    aliases: ['scrum', 'sprint planning', 'scrum master'],
    implies: ['Agile'],
  },
  Jira: { aliases: ['jira'] },
};

// Everyday words in the general skills list (skills.ts) that need the same
// "only on a tech line" treatment as needsContext entries above.
export const AMBIGUOUS_GENERAL_SKILLS = new Set([
  'Go',
  'Rust',
  'Ruby',
  'Shell',
  'C',
  'Swift',
  'Spring',
  'Express',
  'Excel',
  'Spark',
  'Room',
  'Combine',
  'Helm',
  'Looker',
  'R',
  'Dart',
  'Retrofit',
  'Dagger',
]);

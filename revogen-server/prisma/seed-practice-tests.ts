import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const tests = [
    {
      title: 'Java Developer Assessment',
      duration: 30,

      modules: [
        {
          module: 'Java',
          questionCount: 15,
        },
        {
          module: 'SQL',
          questionCount: 5,
        },
        {
          module: 'DBMS',
          questionCount: 5,
        },
        {
          module: 'DSA',
          questionCount: 5,
        },
      ],
    },

    {
      title: 'Python Developer Assessment',
      duration: 30,

      modules: [
        {
          module: 'Python',
          questionCount: 15,
        },
        {
          module: 'SQL',
          questionCount: 5,
        },
        {
          module: 'DBMS',
          questionCount: 5,
        },
        {
          module: 'Aptitude',
          questionCount: 5,
        },
      ],
    },

    {
      title: 'Frontend Developer Assessment',
      duration: 30,

      modules: [
        {
          module: 'React',
          questionCount: 10,
        },
        {
          module: 'JavaScript',
          questionCount: 10,
        },
        {
          module: 'DBMS',
          questionCount: 5,
        },
        {
          module: 'Aptitude',
          questionCount: 5,
        },
      ],
    },

    {
      title: 'Full Stack Developer Assessment',
      duration: 45,

      modules: [
        {
          module: 'React',
          questionCount: 10,
        },
        {
          module: 'JavaScript',
          questionCount: 5,
        },
        {
          module: 'Java',
          questionCount: 10,
        },
        {
          module: 'SQL',
          questionCount: 5,
        },
        {
          module: 'DBMS',
          questionCount: 5,
        },
      ],
    },

    {
      title: 'AI Engineer Assessment',
      duration: 45,

      modules: [
        {
          module: 'Python',
          questionCount: 15,
        },
        {
          module: 'DSA',
          questionCount: 10,
        },
        {
          module: 'SQL',
          questionCount: 5,
        },
        {
          module: 'Aptitude',
          questionCount: 5,
        },
      ],
    },
  ];

  for (const testData of tests) {
    const test =
      await prisma.test.create({
        data: {
          title: testData.title,
          duration: testData.duration,
          isPractice: true,

          modules: {
            create:
              testData.modules,
          },
        },
      });

    console.log(
      `Created: ${test.title}`,
    );
  }

  console.log(
    'Practice tests seeded successfully',
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
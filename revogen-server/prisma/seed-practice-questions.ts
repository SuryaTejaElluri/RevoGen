import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const practiceTests =
    await prisma.test.findMany({
      where: {
        isPractice: true,
      },

      include: {
        modules: true,
      },
    });

  for (const test of practiceTests) {
    console.log(
      `Processing ${test.title}`,
    );

    for (const module of test.modules) {
      const bankQuestions =
        await prisma.questionBank.findMany({
          where: {
            category:
              module.module,
          },
        });

      if (
        bankQuestions.length <
        module.questionCount
      ) {
        console.log(
          `Skipping ${module.module} - not enough questions`,
        );

        continue;
      }

      const shuffled =
        [...bankQuestions].sort(
          () => Math.random() - 0.5,
        );

      const selected =
        shuffled.slice(
          0,
          module.questionCount,
        );

      for (const q of selected) {
        await prisma.question.create({
          data: {
            question:
              q.question,

            optionA:
              q.optionA,

            optionB:
              q.optionB,

            optionC:
              q.optionC,

            optionD:
              q.optionD,

            correctAnswer:
              q.correctAnswer,

            testId: test.id,
          },
        });
      }
    }
  }

  console.log(
    'Practice questions seeded successfully',
  );
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
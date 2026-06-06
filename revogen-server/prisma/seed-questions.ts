import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
  {
    category: "Aptitude",
    question: "A number is increased from 200 to 250. What is the percentage increase?",
    optionA: "20%",
    optionB: "25%",
    optionC: "30%",
    optionD: "35%",
    correctAnswer: "25%"
  },
  {
    category: "Aptitude",
    question: "The average of 10, 20, 30, 40 and 50 is:",
    optionA: "25",
    optionB: "30",
    optionC: "35",
    optionD: "40",
    correctAnswer: "30"
  },
  {
    category: "Aptitude",
    question: "If the ratio of boys to girls is 3:2 and there are 30 boys, how many girls are there?",
    optionA: "15",
    optionB: "20",
    optionC: "25",
    optionD: "30",
    correctAnswer: "20"
  },
  {
    category: "Aptitude",
    question: "A shopkeeper buys an item for ₹800 and sells it for ₹1000. What is the profit percentage?",
    optionA: "20%",
    optionB: "25%",
    optionC: "30%",
    optionD: "35%",
    correctAnswer: "25%"
  },
  {
    category: "Aptitude",
    question: "A product marked at ₹1000 is sold at a 10% discount. What is the selling price?",
    optionA: "₹850",
    optionB: "₹900",
    optionC: "₹950",
    optionD: "₹990",
    correctAnswer: "₹900"
  },
  {
    category: "Aptitude",
    question: "Simple Interest on ₹5000 at 10% per annum for 2 years is:",
    optionA: "₹500",
    optionB: "₹1000",
    optionC: "₹1500",
    optionD: "₹2000",
    correctAnswer: "₹1000"
  },
  {
    category: "Aptitude",
    question: "A train travels 120 km in 2 hours. What is its speed?",
    optionA: "50 km/h",
    optionB: "60 km/h",
    optionC: "70 km/h",
    optionD: "80 km/h",
    correctAnswer: "60 km/h"
  },
  {
    category: "Aptitude",
    question: "A car travels at 80 km/h for 3 hours. What distance does it cover?",
    optionA: "200 km",
    optionB: "220 km",
    optionC: "240 km",
    optionD: "260 km",
    correctAnswer: "240 km"
  },
  {
    category: "Aptitude",
    question: "A can complete a work in 10 days. What fraction of work does A complete in 1 day?",
    optionA: "1/5",
    optionB: "1/10",
    optionC: "1/15",
    optionD: "1/20",
    correctAnswer: "1/10"
  },
  {
    category: "Aptitude",
    question: "A and B can complete a work in 12 days and 18 days respectively. Their combined one-day work is:",
    optionA: "5/36",
    optionB: "1/30",
    optionC: "7/36",
    optionD: "1/12",
    correctAnswer: "5/36"
  },
  {
    category: "Aptitude",
    question: "A bag contains 3 red and 2 blue balls. What is the probability of drawing a red ball?",
    optionA: "2/5",
    optionB: "3/5",
    optionC: "1/2",
    optionD: "4/5",
    correctAnswer: "3/5"
  },
  {
    category: "Aptitude",
    question: "How many ways can 3 people be arranged in a row?",
    optionA: "3",
    optionB: "6",
    optionC: "9",
    optionD: "12",
    correctAnswer: "6"
  },
  {
    category: "Aptitude",
    question: "How many ways can 2 people be selected from 4 people?",
    optionA: "4",
    optionB: "5",
    optionC: "6",
    optionD: "8",
    correctAnswer: "6"
  },
  {
    category: "Aptitude",
    question: "The average of 8 numbers is 15. What is their total sum?",
    optionA: "100",
    optionB: "110",
    optionC: "120",
    optionD: "130",
    correctAnswer: "120"
  },
  {
    category: "Aptitude",
    question: "A sum of money doubles in 5 years at simple interest. What is the annual rate of interest?",
    optionA: "10%",
    optionB: "15%",
    optionC: "20%",
    optionD: "25%",
    correctAnswer: "20%"
  },
  {
    category: "Aptitude",
    question: "What is 15% of 240?",
    optionA: "24",
    optionB: "30",
    optionC: "36",
    optionD: "40",
    correctAnswer: "36"
  },
  {
    category: "Aptitude",
    question: "If 12 men complete a work in 15 days, how many days will 20 men take (same efficiency)?",
    optionA: "8",
    optionB: "9",
    optionC: "10",
    optionD: "12",
    correctAnswer: "9"
  },
  {
    category: "Aptitude",
    question: "A boat's speed in still water is 12 km/h and stream speed is 3 km/h. What is the downstream speed?",
    optionA: "9 km/h",
    optionB: "12 km/h",
    optionC: "15 km/h",
    optionD: "18 km/h",
    correctAnswer: "15 km/h"
  },
  {
    category: "Aptitude",
    question: "What is the angle between the hands of a clock at 3:00?",
    optionA: "45°",
    optionB: "60°",
    optionC: "90°",
    optionD: "120°",
    correctAnswer: "90°"
  },
  {
    category: "Aptitude",
    question: "Find the next number in the series: 2, 4, 8, 16, 32, ?",
    optionA: "48",
    optionB: "56",
    optionC: "64",
    optionD: "72",
    correctAnswer: "64"
  }
];

async function main() {
  console.log(
    `Seeding ${questions.length} questions...`,
  );

  await prisma.questionBank.createMany({
  data: questions,
  skipDuplicates: true,
});

  console.log(
    'Questions seeded successfully!',
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
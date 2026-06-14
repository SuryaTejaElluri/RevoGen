import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const questions = [
{
    category: "Python",
    question: "What is the output?\n\nprint(type(10).__name__)",
    optionA: "number",
    optionB: "integer",
    optionC: "int",
    optionD: "Int",
    correctAnswer: "int"
  },
  {
    category: "Python",
    question: "What is the output?\n\nprint(5 // 2)",
    optionA: "2.5",
    optionB: "2",
    optionC: "3",
    optionD: "2.0",
    correctAnswer: "2"
  },
  {
    category: "Python",
    question: "What is the output?\n\nprint(2 ** 3)",
    optionA: "6",
    optionB: "8",
    optionC: "9",
    optionD: "Error",
    correctAnswer: "8"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = [1,2,3]\nprint(len(x))",
    optionA: "2",
    optionB: "3",
    optionC: "4",
    optionD: "Error",
    correctAnswer: "3"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = [10,20,30]\nprint(x[1])",
    optionA: "10",
    optionB: "20",
    optionC: "30",
    optionD: "Error",
    correctAnswer: "20"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = [1,2,3,4,5]\nprint(x[1:4])",
    optionA: "[1,2,3]",
    optionB: "[2,3,4]",
    optionC: "[2,3,4,5]",
    optionD: "[1,2,3,4]",
    correctAnswer: "[2,3,4]"
  },
  {
    category: "Python",
    question: "What is the output?\n\nprint('Python'[::-1])",
    optionA: "Python",
    optionB: "nohtyP",
    optionC: "Error",
    optionD: "Pnohty",
    correctAnswer: "nohtyP"
  },
  {
    category: "Python",
    question: "Which data structure is immutable?",
    optionA: "List",
    optionB: "Dictionary",
    optionC: "Set",
    optionD: "Tuple",
    correctAnswer: "Tuple"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = (1,2,3)\nprint(type(x).__name__)",
    optionA: "list",
    optionB: "set",
    optionC: "tuple",
    optionD: "dict",
    correctAnswer: "tuple"
  },
  {
    category: "Python",
    question: "Which data structure stores key-value pairs?",
    optionA: "List",
    optionB: "Tuple",
    optionC: "Dictionary",
    optionD: "Set",
    correctAnswer: "Dictionary"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = {'a':1,'b':2}\nprint(x['a'])",
    optionA: "a",
    optionB: "1",
    optionC: "2",
    optionD: "Error",
    correctAnswer: "1"
  },
  {
    category: "Python",
    question: "Which collection does not allow duplicate values?",
    optionA: "List",
    optionB: "Tuple",
    optionC: "Dictionary",
    optionD: "Set",
    correctAnswer: "Set"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = {1,2,2,3}\nprint(len(x))",
    optionA: "4",
    optionB: "3",
    optionC: "2",
    optionD: "Error",
    correctAnswer: "3"
  },
  {
    category: "Python",
    question: "What is a List Comprehension?",
    optionA: "A compact way to create lists",
    optionB: "A sorting algorithm",
    optionC: "A module",
    optionD: "An exception",
    correctAnswer: "A compact way to create lists"
  },
  {
    category: "Python",
    question: "What is the output?\n\nx = [i*i for i in range(3)]\nprint(x)",
    optionA: "[1,4,9]",
    optionB: "[0,1,4]",
    optionC: "[0,1,2]",
    optionD: "[1,2,3]",
    correctAnswer: "[0,1,4]"
  },
  {
    category: "Python",
    question: "What does *args allow?",
    optionA: "Multiple keyword arguments",
    optionB: "Multiple positional arguments",
    optionC: "Inheritance",
    optionD: "Recursion",
    correctAnswer: "Multiple positional arguments"
  },
  {
    category: "Python",
    question: "What does **kwargs allow?",
    optionA: "Multiple keyword arguments",
    optionB: "Multiple lists",
    optionC: "Multiple tuples",
    optionD: "Multiple classes",
    correctAnswer: "Multiple keyword arguments"
  },
  {
    category: "Python",
    question: "What is a Lambda Function?",
    optionA: "Anonymous function",
    optionB: "Built-in class",
    optionC: "Loop",
    optionD: "Decorator",
    correctAnswer: "Anonymous function"
  },
  {
    category: "Python",
    question: "What is the output?\n\nsquare = lambda x: x*x\nprint(square(4))",
    optionA: "8",
    optionB: "16",
    optionC: "4",
    optionD: "Error",
    correctAnswer: "16"
  },
  {
    category: "Python",
    question: "What is the purpose of try-except?",
    optionA: "Looping",
    optionB: "Exception Handling",
    optionC: "Inheritance",
    optionD: "Sorting",
    correctAnswer: "Exception Handling"
  },
  {
    category: "Python",
    question: "Which OOP concept allows one interface to have multiple forms?",
    optionA: "Encapsulation",
    optionB: "Inheritance",
    optionC: "Polymorphism",
    optionD: "Abstraction",
    correctAnswer: "Polymorphism"
  },
  {
    category: "Python",
    question: "What is a Decorator?",
    optionA: "A function that modifies another function",
    optionB: "A loop",
    optionC: "A module",
    optionD: "A class variable",
    correctAnswer: "A function that modifies another function"
  },
  {
    category: "Python",
    question: "What is a Generator?",
    optionA: "A function that returns an iterator using yield",
    optionB: "A random number generator",
    optionC: "A list",
    optionD: "A class",
    correctAnswer: "A function that returns an iterator using yield"
  },
  {
    category: "Python",
    question: "Which keyword is used inside generators?",
    optionA: "return",
    optionB: "yield",
    optionC: "break",
    optionD: "continue",
    correctAnswer: "yield"
  },
  {
    category: "Python",
    question: "What does GIL stand for?",
    optionA: "Global Interpreter Lock",
    optionB: "General Interface Layer",
    optionC: "Global Internal Loop",
    optionD: "Graph Integration Library",
    correctAnswer: "Global Interpreter Lock"
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
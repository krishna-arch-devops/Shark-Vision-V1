import { db } from "../src/lib/db";
import {
  profiles,
  institutions,
  batches,
  batchStudents,
  subjects,
  questions,
  examinations,
  examinationQuestions,
  examinationAssignments,
} from "../src/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { hashPassword } from "../src/lib/auth/local-auth";

export async function seedExecutiveDemo() {
  console.log("----------------------------------------------------------------");
  console.log("SEVERAL STEP SEEDING: SHARKVISION — EXECUTIVE DEMO ASSESSMENT");
  console.log("----------------------------------------------------------------");

  // 1. Ensure Executive Demo Student Account
  const demoEmail = "demo.ceo@sharkvision.com";
  const demoPassword = "DemoShark@2026";
  const passwordHash = await hashPassword(demoPassword);

  let [demoStudent] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, demoEmail))
    .limit(1);

  if (!demoStudent) {
    [demoStudent] = await db
      .insert(profiles)
      .values({
        email: demoEmail,
        passwordHash,
        role: "STUDENT",
        fullName: "Executive Demo Candidate (CEO)",
        phoneNumber: "+91 9900000001",
        isActive: true,
      })
      .returning();
    console.log(`✓ Created Executive Demo Account: ${demoEmail}`);
  } else {
    console.log(`✓ Existing Executive Demo Account verified: ${demoEmail}`);
  }

  // Also ensure Aarav (existing student) is enrolled so any student can attempt
  const [aaravStudent] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.email, "student.aarav@sharkvision.com"))
    .limit(1);

  // 2. Ensure Super Admin / Teacher author exists
  const [superAdmin] = await db
    .select()
    .from(profiles)
    .where(eq(profiles.role, "SUPER_ADMIN"))
    .limit(1);

  // 3. Ensure Institution and Batch
  let [inst] = await db.select().from(institutions).limit(1);
  if (!inst) {
    [inst] = await db
      .insert(institutions)
      .values({
        name: "SharkVision National Headquarters",
        code: "SV-HQ",
        city: "Bangalore",
        state: "Karnataka",
      })
      .returning();
  }

  let [batch] = await db
    .select()
    .from(batches)
    .where(eq(batches.name, "Executive Demonstration Cohort"))
    .limit(1);

  if (!batch) {
    [batch] = await db
      .insert(batches)
      .values({
        institutionId: inst.id,
        name: "Executive Demonstration Cohort",
        targetExam: "DEMO",
        academicYear: "2026",
        isActive: true,
      })
      .returning();
    console.log(`✓ Created Batch: ${batch.name}`);
  }

  // Enroll Demo CEO and Aarav in the batch
  await db
    .insert(batchStudents)
    .values({
      batchId: batch.id,
      studentId: demoStudent.id,
      isActive: true,
    })
    .onConflictDoNothing();

  if (aaravStudent) {
    await db
      .insert(batchStudents)
      .values({
        batchId: batch.id,
        studentId: aaravStudent.id,
        isActive: true,
      })
      .onConflictDoNothing();
  }
  console.log(`✓ Enrolled candidates in batch ${batch.name}`);

  // 4. Ensure Subjects Exist
  async function getOrCreateSubject(name: string, code: string) {
    let [subj] = await db.select().from(subjects).where(eq(subjects.code, code)).limit(1);
    if (!subj) {
      [subj] = await db.insert(subjects).values({ name, code, isActive: true }).returning();
      console.log(`✓ Created subject: ${name} (${code})`);
    }
    return subj;
  }

  const gkSubject = await getOrCreateSubject("General Knowledge", "GK");
  const sciSubject = await getOrCreateSubject("Basic Science", "SCI");
  const mathSubject = await getOrCreateSubject("Basic Mathematics", "MAT");
  const lrSubject = await getOrCreateSubject("Logical Reasoning", "LR");

  // 5. Define 20 Curated Questions
  const demoQuestionsData = [
    // General Knowledge (8 Questions)
    {
      subjectId: gkSubject.id,
      topic: "Geography & Capitals",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "What is the capital city of India?",
      options: [
        { id: "A", text: "Mumbai" },
        { id: "B", text: "New Delhi" },
        { id: "C", text: "Kolkata" },
        { id: "D", text: "Chennai" },
      ],
      correctAnswer: "B",
      explanation: "New Delhi is the official national capital of India.",
    },
    {
      subjectId: gkSubject.id,
      topic: "Physical Geography",
      difficulty: "EASY" as const,
      benchmarkSeconds: 30,
      questionText: "Which is the largest and deepest ocean on Earth?",
      options: [
        { id: "A", text: "Atlantic Ocean" },
        { id: "B", text: "Indian Ocean" },
        { id: "C", text: "Arctic Ocean" },
        { id: "D", text: "Pacific Ocean" },
      ],
      correctAnswer: "D",
      explanation: "The Pacific Ocean is the largest and deepest of Earth's oceanic divisions.",
    },
    {
      subjectId: gkSubject.id,
      topic: "Time & Calendars",
      difficulty: "EASY" as const,
      benchmarkSeconds: 20,
      questionText: "How many days are there in a standard solar leap year?",
      options: [
        { id: "A", text: "364 days" },
        { id: "B", text: "365 days" },
        { id: "C", text: "366 days" },
        { id: "D", text: "367 days" },
      ],
      correctAnswer: "C",
      explanation: "A leap year contains 366 days, with an extra day added in February (February 29).",
    },
    {
      subjectId: gkSubject.id,
      topic: "World Geography",
      difficulty: "EASY" as const,
      benchmarkSeconds: 30,
      questionText: "On which continent is the Sahara Desert, the world's largest hot desert, located?",
      options: [
        { id: "A", text: "Asia" },
        { id: "B", text: "Africa" },
        { id: "C", text: "Australia" },
        { id: "D", text: "South America" },
      ],
      correctAnswer: "B",
      explanation: "The Sahara Desert covers large parts of North Africa.",
    },
    {
      subjectId: gkSubject.id,
      topic: "National Symbols",
      difficulty: "EASY" as const,
      benchmarkSeconds: 20,
      questionText: "What is the national animal of India?",
      options: [
        { id: "A", text: "Asiatic Lion" },
        { id: "B", text: "Bengal Tiger" },
        { id: "C", text: "Indian Elephant" },
        { id: "D", text: "Indian Rhinoceros" },
      ],
      correctAnswer: "B",
      explanation: "The Royal Bengal Tiger (Panthera tigris) is the national animal of India.",
    },
    {
      subjectId: gkSubject.id,
      topic: "Inventions & Tech",
      difficulty: "MEDIUM" as const,
      benchmarkSeconds: 35,
      questionText: "Who is widely credited with the invention of the World Wide Web in 1989?",
      options: [
        { id: "A", text: "Steve Jobs" },
        { id: "B", text: "Bill Gates" },
        { id: "C", text: "Tim Berners-Lee" },
        { id: "D", text: "Alan Turing" },
      ],
      correctAnswer: "C",
      explanation: "Sir Tim Berners-Lee invented the World Wide Web while working at CERN in 1989.",
    },
    {
      subjectId: gkSubject.id,
      topic: "Global Landmarks",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "In which country can you visit the ancient historical amphitheatre known as the Colosseum?",
      options: [
        { id: "A", text: "Greece" },
        { id: "B", text: "Spain" },
        { id: "C", text: "Italy" },
        { id: "D", text: "France" },
      ],
      correctAnswer: "C",
      explanation: "The Colosseum is located in the center of the city of Rome, Italy.",
    },
    {
      subjectId: gkSubject.id,
      topic: "Monetary Systems",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "What is the official currency of Japan?",
      options: [
        { id: "A", text: "Yuan" },
        { id: "B", text: "Yen" },
        { id: "C", text: "Won" },
        { id: "D", text: "Ringgit" },
      ],
      correctAnswer: "B",
      explanation: "The Yen (JPY) is the official currency unit of Japan.",
    },

    // Basic Science (4 Questions)
    {
      subjectId: sciSubject.id,
      topic: "Solar System",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "Which planet in our solar system is known as the 'Red Planet' due to iron oxide on its surface?",
      options: [
        { id: "A", text: "Venus" },
        { id: "B", text: "Jupiter" },
        { id: "C", text: "Mars" },
        { id: "D", text: "Saturn" },
      ],
      correctAnswer: "C",
      explanation: "Mars appears reddish because of the prevalence of iron oxide (rust) across its crust.",
    },
    {
      subjectId: sciSubject.id,
      topic: "Human Biology",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "Which vital organ in the human body is primarily responsible for pumping blood throughout the circulatory system?",
      options: [
        { id: "A", text: "Lungs" },
        { id: "B", text: "Heart" },
        { id: "C", text: "Liver" },
        { id: "D", text: "Kidneys" },
      ],
      correctAnswer: "B",
      explanation: "The heart acts as a muscular pump propelling blood through the cardiovascular network.",
    },
    {
      subjectId: sciSubject.id,
      topic: "Everyday Physics",
      difficulty: "EASY" as const,
      benchmarkSeconds: 30,
      questionText: "At standard atmospheric pressure, at what temperature does pure water freeze into solid ice?",
      options: [
        { id: "A", text: "0° Celsius" },
        { id: "B", text: "32° Celsius" },
        { id: "C", text: "100° Celsius" },
        { id: "D", text: "-10° Celsius" },
      ],
      correctAnswer: "A",
      explanation: "Pure water freezes at 0 degrees Celsius (32 degrees Fahrenheit) at 1 atm.",
    },
    {
      subjectId: sciSubject.id,
      topic: "Plant Biology",
      difficulty: "MEDIUM" as const,
      benchmarkSeconds: 35,
      questionText: "What natural green pigment do plants use to capture sunlight during photosynthesis?",
      options: [
        { id: "A", text: "Hemoglobin" },
        { id: "B", text: "Chlorophyll" },
        { id: "C", text: "Carotene" },
        { id: "D", text: "Melanin" },
      ],
      correctAnswer: "B",
      explanation: "Chlorophyll is the green pigment in chloroplasts that absorbs light energy for photosynthesis.",
    },

    // Basic Mathematics (4 Questions)
    {
      subjectId: mathSubject.id,
      topic: "Arithmetic Operations",
      difficulty: "EASY" as const,
      benchmarkSeconds: 20,
      questionText: "What is the exact sum of 15 + 25?",
      options: [
        { id: "A", text: "35" },
        { id: "B", text: "40" },
        { id: "C", text: "45" },
        { id: "D", text: "50" },
      ],
      correctAnswer: "B",
      explanation: "15 + 25 equals 40.",
    },
    {
      subjectId: mathSubject.id,
      topic: "Mental Arithmetic",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "What is the product of 12 multiplied by 8?",
      options: [
        { id: "A", text: "84" },
        { id: "B", text: "92" },
        { id: "C", text: "96" },
        { id: "D", text: "108" },
      ],
      correctAnswer: "C",
      explanation: "12 × 8 = 96.",
    },
    {
      subjectId: mathSubject.id,
      topic: "Elementary Geometry",
      difficulty: "EASY" as const,
      benchmarkSeconds: 20,
      questionText: "What is the sum of the interior angles of any planar triangle?",
      options: [
        { id: "A", text: "90 degrees" },
        { id: "B", text: "180 degrees" },
        { id: "C", text: "270 degrees" },
        { id: "D", text: "360 degrees" },
      ],
      correctAnswer: "B",
      explanation: "The three interior angles of a triangle in Euclidean geometry always sum to 180°.",
    },
    {
      subjectId: mathSubject.id,
      topic: "Percentages",
      difficulty: "MEDIUM" as const,
      benchmarkSeconds: 35,
      questionText: "If an item is regularly priced at Rs. 200 and is sold at a 25% discount, what is the final selling price?",
      options: [
        { id: "A", text: "Rs. 140" },
        { id: "B", text: "Rs. 150" },
        { id: "C", text: "Rs. 160" },
        { id: "D", text: "Rs. 175" },
      ],
      correctAnswer: "B",
      explanation: "25% of 200 is 50. Subtracting the discount gives 200 - 50 = Rs. 150.",
    },

    // Logical Reasoning (4 Questions)
    {
      subjectId: lrSubject.id,
      topic: "Number Sequences",
      difficulty: "EASY" as const,
      benchmarkSeconds: 30,
      questionText: "Find the next logical number in the sequence: 2, 4, 8, 16, ___",
      options: [
        { id: "A", text: "24" },
        { id: "B", text: "28" },
        { id: "C", text: "32" },
        { id: "D", text: "36" },
      ],
      correctAnswer: "C",
      explanation: "Each subsequent term doubles the previous number (multiplied by 2): 16 × 2 = 32.",
    },
    {
      subjectId: lrSubject.id,
      topic: "Categorical Classification",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "Identify the odd one out from the following four options:",
      options: [
        { id: "A", text: "Apple" },
        { id: "B", text: "Banana" },
        { id: "C", text: "Carrot" },
        { id: "D", text: "Orange" },
      ],
      correctAnswer: "C",
      explanation: "Carrot is a root vegetable, whereas Apple, Banana, and Orange are fruits.",
    },
    {
      subjectId: lrSubject.id,
      topic: "Verbal Analogies",
      difficulty: "EASY" as const,
      benchmarkSeconds: 25,
      questionText: "Complete the relationship analogy: Book is to Reading as Fork is to ___",
      options: [
        { id: "A", text: "Writing" },
        { id: "B", text: "Cooking" },
        { id: "C", text: "Eating" },
        { id: "D", text: "Cutting" },
      ],
      correctAnswer: "C",
      explanation: "A book is an instrument used for reading; a fork is an instrument used for eating.",
    },
    {
      subjectId: lrSubject.id,
      topic: "Clock & Spatial Aptitude",
      difficulty: "MEDIUM" as const,
      benchmarkSeconds: 40,
      questionText: "If a standard analog clock displays exactly 3:00, what is the angle between the hour hand and the minute hand?",
      options: [
        { id: "A", text: "45 degrees" },
        { id: "B", text: "60 degrees" },
        { id: "C", text: "90 degrees" },
        { id: "D", text: "120 degrees" },
      ],
      correctAnswer: "C",
      explanation: "At 3:00, the minute hand points to 12 and the hour hand points to 3, forming a 90-degree right angle.",
    },
  ];

  console.log(`Inserting / Updating ${demoQuestionsData.length} Executive Demo Questions...`);
  const insertedQuestionIds: { id: string; order: number; marks: number; negativeMarks: number; snapshotText: string; snapshotOptions: any; snapshotCorrectAnswer: string; benchmark: number }[] = [];

  for (let i = 0; i < demoQuestionsData.length; i++) {
    const qData = demoQuestionsData[i];

    // Check if question exists by text
    let [q] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionText, qData.questionText))
      .limit(1);

    if (!q) {
      [q] = await db
        .insert(questions)
        .values({
          category: "DEMO",
          subjectId: qData.subjectId,
          topic: qData.topic,
          difficulty: qData.difficulty,
          qType: "SINGLE_CORRECT_MCQ",
          questionText: qData.questionText,
          options: qData.options,
          correctAnswer: qData.correctAnswer,
          explanation: qData.explanation,
          defaultMarks: "4.00",
          defaultNegativeMarks: "1.00",
          isPublished: true,
          createdBy: superAdmin?.id,
        })
        .returning();
    }

    insertedQuestionIds.push({
      id: q.id,
      order: i + 1,
      marks: 4,
      negativeMarks: 1,
      snapshotText: q.questionText,
      snapshotOptions: q.options,
      snapshotCorrectAnswer: q.correctAnswer,
      benchmark: qData.benchmarkSeconds,
    });
  }
  console.log(`✓ 20 Executive Demo Questions confirmed.`);

  // 6. Create / Update the Examination Master
  const examTitle = "SHARKVISION — EXECUTIVE DEMO";
  let [demoExam] = await db
    .select()
    .from(examinations)
    .where(eq(examinations.title, examTitle))
    .limit(1);

  const totalMarks = insertedQuestionIds.length * 4; // 20 * 4 = 80 marks

  if (!demoExam) {
    [demoExam] = await db
      .insert(examinations)
      .values({
        title: examTitle,
        description: "A short and engaging general knowledge and aptitude test designed to demonstrate Sharkvision's examination experience, question timing, answer tracking, and intelligent analytics.",
        category: "DEMO",
        durationMinutes: 15,
        totalMarks: totalMarks.toString(),
        startWindow: new Date("2026-01-01T00:00:00Z"),
        endWindow: new Date("2026-12-31T23:59:59Z"),
        maxAttempts: 10, // Generous attempts so the CEO can test multiple runs comfortably
        resultReleasePolicy: "IMMEDIATE",
        isPublished: true,
        createdBy: superAdmin?.id,
      })
      .returning();
    console.log(`✓ Created Executive Demo Examination: "${demoExam.title}" (ID: ${demoExam.id})`);
  } else {
    // Update parameters to ensure publication & attempt allowance
    await db
      .update(examinations)
      .set({
        category: "DEMO",
        durationMinutes: 15,
        totalMarks: totalMarks.toString(),
        maxAttempts: 10,
        resultReleasePolicy: "IMMEDIATE",
        isPublished: true,
        updatedAt: new Date(),
      })
      .where(eq(examinations.id, demoExam.id));
    console.log(`✓ Updated Executive Demo Examination: "${demoExam.title}" (ID: ${demoExam.id})`);
  }

  // 7. Associate 20 Questions with Examination
  for (const qItem of insertedQuestionIds) {
    await db
      .insert(examinationQuestions)
      .values({
        examinationId: demoExam.id,
        questionId: qItem.id,
        questionOrder: qItem.order,
        marks: qItem.marks.toString(),
        negativeMarks: qItem.negativeMarks.toString(),
        snapshotText: qItem.snapshotText,
        snapshotOptions: qItem.snapshotOptions,
        snapshotCorrectAnswer: qItem.snapshotCorrectAnswer,
      })
      .onConflictDoNothing();
  }
  console.log(`✓ Associated all 20 questions with Examination ${demoExam.id}`);

  // 8. Assign Examination to Batch
  await db
    .insert(examinationAssignments)
    .values({
      examinationId: demoExam.id,
      batchId: batch.id,
      assignedBy: superAdmin?.id,
    })
    .onConflictDoNothing();

  console.log(`✓ Assigned Examination to cohort "${batch.name}"`);

  console.log("----------------------------------------------------------------");
  console.log("EXECUTIVE DEMO SETUP READY!");
  console.log(`Exam Title:       ${examTitle}`);
  console.log(`Exam ID:          ${demoExam.id}`);
  console.log(`Total Questions:  20 (80 Marks)`);
  console.log(`Duration:         15 Minutes`);
  console.log(`Scoring:          +4 Correct, -1 Incorrect, 0 Unanswered`);
  console.log(`Result Release:   IMMEDIATE`);
  console.log("----------------------------------------------------------------");
  console.log("DEMO CANDIDATE LOGIN CREDENTIALS:");
  console.log(`Email:    ${demoEmail}`);
  console.log(`Password: ${demoPassword}`);
  console.log("----------------------------------------------------------------");

  return {
    examId: demoExam.id,
    demoEmail,
    demoPassword,
  };
}

// Allow direct execution
if (require.main === module) {
  seedExecutiveDemo()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("Failed to seed executive demo:", err);
      process.exit(1);
    });
}

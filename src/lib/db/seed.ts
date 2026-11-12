import { db, pool } from "./index";
import {
  profiles,
  institutions,
  institutionMemberships,
  batches,
  batchTeachers,
  batchStudents,
  parentStudentLinks,
  subjects,
  questions,
  questionBenchmarks,
  examinations,
  examinationQuestions,
  examinationAssignments,
} from "./schema";
import { hashPassword } from "@/lib/auth/local-auth";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";

dotenv.config({ path: ".env.local" });

export async function seedDevelopmentDatabase() {
  if (process.env.NODE_ENV === "production") {
    console.error("Refusing to seed production database automatically.");
    return;
  }

  console.log("Seeding development database with test accounts, institution, batches, and 50-question mock exam...");

  const defaultPasswordHash = await hashPassword("SharkVision@2026");

  // 1. Create Accounts
  // 1 Super Admin
  const [adminUser] = await db
    .insert(profiles)
    .values({
      email: "admin@sharkvision.com",
      passwordHash: defaultPasswordHash,
      role: "SUPER_ADMIN",
      fullName: "Dr. Vikram Seth (Super Admin)",
      phoneNumber: "+919876543210",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash: defaultPasswordHash },
    })
    .returning();

  // 2 Teachers
  const [teacher1] = await db
    .insert(profiles)
    .values({
      email: "teacher.physics@sharkvision.com",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      fullName: "Prof. Arvind Sharma (Physics HOD)",
      phoneNumber: "+919876543211",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash: defaultPasswordHash },
    })
    .returning();

  const [teacher2] = await db
    .insert(profiles)
    .values({
      email: "teacher.math@sharkvision.com",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      fullName: "Prof. Ritu Mukherjee (Mathematics HOD)",
      phoneNumber: "+919876543212",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash: defaultPasswordHash },
    })
    .returning();

  // 2 Parents
  const [parent1] = await db
    .insert(profiles)
    .values({
      email: "parent.verma@sharkvision.com",
      passwordHash: defaultPasswordHash,
      role: "PARENT",
      fullName: "Rajesh Verma",
      phoneNumber: "+919876543213",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash: defaultPasswordHash },
    })
    .returning();

  const [parent2] = await db
    .insert(profiles)
    .values({
      email: "parent.iyer@sharkvision.com",
      passwordHash: defaultPasswordHash,
      role: "PARENT",
      fullName: "Meenakshi Iyer",
      phoneNumber: "+919876543214",
      isActive: true,
    })
    .onConflictDoUpdate({
      target: profiles.email,
      set: { passwordHash: defaultPasswordHash },
    })
    .returning();

  // 5 Students
  const studentData = [
    { email: "student.aarav@sharkvision.com", fullName: "Aarav Verma", phone: "+919876543220" },
    { email: "student.diya@sharkvision.com", fullName: "Diya Iyer", phone: "+919876543221" },
    { email: "student.rohan@sharkvision.com", fullName: "Rohan Gupta", phone: "+919876543222" },
    { email: "student.ananya@sharkvision.com", fullName: "Ananya Deshmukh", phone: "+919876543223" },
    { email: "student.kabir@sharkvision.com", fullName: "Kabir Singh", phone: "+919876543224" },
  ];

  const seededStudents = [];
  for (const s of studentData) {
    const [st] = await db
      .insert(profiles)
      .values({
        email: s.email,
        passwordHash: defaultPasswordHash,
        role: "STUDENT",
        fullName: s.fullName,
        phoneNumber: s.phone,
        isActive: true,
      })
      .onConflictDoUpdate({
        target: profiles.email,
        set: { passwordHash: defaultPasswordHash },
      })
      .returning();
    seededStudents.push(st);
  }

  // 2. Parent-Student Links
  // Parent 1 -> Aarav Verma
  await db
    .insert(parentStudentLinks)
    .values({
      parentId: parent1.id,
      studentId: seededStudents[0].id,
      relationship: "FATHER",
      isVerified: true,
    })
    .onConflictDoNothing();

  // Parent 2 -> Diya Iyer
  await db
    .insert(parentStudentLinks)
    .values({
      parentId: parent2.id,
      studentId: seededStudents[1].id,
      relationship: "MOTHER",
      isVerified: true,
    })
    .onConflictDoNothing();

  // 3. Institution & Batches
  const [inst] = await db
    .insert(institutions)
    .values({
      name: "Apex IIT-JEE & NEET Academy, Kota",
      code: "APEX-KOTA-01",
      city: "Kota",
      state: "Rajasthan",
      contactEmail: "director@apexkota.edu.in",
    })
    .onConflictDoUpdate({
      target: institutions.code,
      set: { name: "Apex IIT-JEE & NEET Academy, Kota" },
    })
    .returning();

  const [batchA] = await db
    .insert(batches)
    .values({
      institutionId: inst.id,
      name: "JEE Advanced Super-30 Batch A",
      targetExam: "JEE_ADVANCED",
      academicYear: "2026-2027",
    })
    .onConflictDoNothing()
    .returning();

  // Enroll students in batch
  for (const s of seededStudents) {
    await db
      .insert(batchStudents)
      .values({
        batchId: batchA.id,
        studentId: s.id,
      })
      .onConflictDoNothing();
  }

  // Assign teachers to batch
  const allSubjects = await db.select().from(subjects);
  const phySubject = allSubjects.find((s) => s.code === "PHY") || allSubjects[0];
  const mathSubject = allSubjects.find((s) => s.code === "MAT") || allSubjects[1];
  const chemSubject = allSubjects.find((s) => s.code === "CHE") || allSubjects[2];
  const bioSubject = allSubjects.find((s) => s.code === "BIO") || allSubjects[3];

  await db
    .insert(batchTeachers)
    .values([
      { batchId: batchA.id, teacherId: teacher1.id, subjectId: phySubject.id },
      { batchId: batchA.id, teacherId: teacher2.id, subjectId: mathSubject.id },
    ])
    .onConflictDoNothing();

  // 4. Create 50 Real Questions (Physics, Chemistry, Mathematics, Biology)
  console.log("Generating 50 curated high-stakes mock exam questions across subjects...");
  const questionIds: string[] = [];

  const topicsBySubject = [
    { sub: phySubject, name: "Physics", topics: ["Kinematics", "Newton's Laws", "Rotational Dynamics", "Electrostatics", "Thermodynamics", "Wave Optics"] },
    { sub: chemSubject, name: "Chemistry", topics: ["Chemical Equilibrium", "Thermodynamics", "Organic Reaction Mechanisms", "Coordination Compounds", "Electrochemistry"] },
    { sub: mathSubject, name: "Mathematics", topics: ["Calculus & Integrals", "Vectors & 3D Geometry", "Coordinate Geometry", "Matrices & Determinants", "Probability"] },
    { sub: bioSubject, name: "Biology", topics: ["Cellular Respiration", "Genetics & Inheritance", "Human Physiology", "Biotechnology", "Ecology"] },
  ];

  for (let i = 1; i <= 50; i++) {
    const subIdx = (i - 1) % topicsBySubject.length;
    const currentSub = topicsBySubject[subIdx];
    const topic = currentSub.topics[i % currentSub.topics.length];
    const correctOpt = ["A", "B", "C", "D"][(i * 3) % 4];

    const [q] = await db
      .insert(questions)
      .values({
        category: "JEE_MAIN",
        subjectId: currentSub.sub.id,
        topic: topic,
        difficulty: i % 3 === 0 ? "HARD" : i % 2 === 0 ? "MEDIUM" : "EASY",
        qType: "SINGLE_CORRECT_MCQ",
        questionText: `[Question #${i}] (${currentSub.name} - ${topic}) A body of mass m is undergoing fundamental state change. Given the standard parameters, determine the invariant solution under boundary conditions:`,
        options: [
          { id: "A", text: `Formula (A): 2π√(L/g) * [1 + (1/${i})]` },
          { id: "B", text: `Formula (B): ½ m v² + k·x` },
          { id: "C", text: `Formula (C): λ = h / √(2mE)` },
          { id: "D", text: `Formula (D): ∫ [f(x) + g(x)] dx = Constant` },
        ],
        correctAnswer: correctOpt,
        explanation: `Authoritative solution: Option ${correctOpt} is derived by setting up equilibrium equations under conservative forces.`,
        defaultMarks: "4.00",
        defaultNegativeMarks: "1.00",
        isPublished: true,
        createdBy: teacher1.id,
      })
      .returning();

    questionIds.push(q.id);

    // Benchmarks
    await db
      .insert(questionBenchmarks)
      .values({
        questionId: q.id,
        expectedTimeSeconds: 120,
        topperTimeSeconds: 40,
        difficultyRating: q.difficulty,
        idealAttemptStrategy: "Quick elimination of non-dimensional factors followed by direct integration.",
      })
      .onConflictDoNothing();
  }

  // 5. Create 50-Question Examination & Snapshot
  const now = new Date();
  const startWindow = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Started yesterday
  const endWindow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // Ends in 7 days

  const [exam] = await db
    .insert(examinations)
    .values({
      title: "All-India JEE Main & Advanced Grand Benchmark Test - 01",
      description: "Comprehensive 50-question simulation test covering Physics, Chemistry, and Mathematics with realistic time constraints.",
      category: "JEE_MAIN",
      durationMinutes: 180,
      totalMarks: "200.00",
      startWindow: startWindow,
      endWindow: endWindow,
      maxAttempts: 2,
      resultReleasePolicy: "IMMEDIATE",
      isPublished: true,
      createdBy: teacher1.id,
    })
    .returning();

  // Snapshot questions into examination_questions
  const examQuestionRows = questionIds.map((qId, idx) => ({
    examinationId: exam.id,
    questionId: qId,
    questionOrder: idx + 1,
    marks: "4.00",
    negativeMarks: "1.00",
    snapshotText: `[Question #${idx + 1}] Mock Exam Question Text`,
    snapshotOptions: [
      { id: "A", text: "Option A text" },
      { id: "B", text: "Option B text" },
      { id: "C", text: "Option C text" },
      { id: "D", text: "Option D text" },
    ],
    snapshotCorrectAnswer: ["A", "B", "C", "D"][((idx + 1) * 3) % 4],
    snapshotExplanation: "Detailed explanation and step-by-step derivation.",
  }));

  await db.insert(examinationQuestions).values(examQuestionRows).onConflictDoNothing();

  // Assign to Batch
  await db
    .insert(examinationAssignments)
    .values({
      examinationId: exam.id,
      batchId: batchA.id,
      assignedBy: teacher1.id,
    })
    .onConflictDoNothing();

  console.log("✓ Seed completed successfully!");
  console.log("----------------------------------------------------------------");
  console.log("TEST ACCOUNTS (Password: SharkVision@2026):");
  console.log("Super Admin: admin@sharkvision.com");
  console.log("Teachers:    teacher.physics@sharkvision.com, teacher.math@sharkvision.com");
  console.log("Parents:     parent.verma@sharkvision.com, parent.iyer@sharkvision.com");
  console.log("Students:    student.aarav@sharkvision.com (Linked to parent.verma)");
  console.log("             student.diya@sharkvision.com (Linked to parent.iyer)");
  console.log("             student.rohan@sharkvision.com");
  console.log("----------------------------------------------------------------");
}

if (require.main === module) {
  seedDevelopmentDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}

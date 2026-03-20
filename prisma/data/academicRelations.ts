const classNames = [
  "Nursery",
  "Kindergarten",
  "Class 1",
  "Class 2",
  "Class 3",
  "Class 4",
  "Class 5",
  "Class 6",
  "Class 7",
  "Class 8",
  "Class 9",
  "Class 10",
  "Class 11 (Science)",
  "Class 11 (Commerce)",
  "Class 12 (Science)",
  "Class 12 (Commerce)",
];

const subjectNames = [
  "Mathematics",
  "Science",
  "English",
  "History",
  "Geography",
  "Physics",
  "Chemistry",
  "Biology",
  "Computer Science",
  "Physical Education",
  "Art & Design",
  "Music",
  "Literature",
  "Economics",
  "Accounting",
  "Business Studies",
  "Civics",
  "Health Education",
];

// Combine every class with 2 unique subjects
export const dummyClassSubjects = classNames.flatMap((className, i) => [
  {
    className,
    subjectName: subjectNames[i % subjectNames.length],
    totalMarks: 100,
    passMarks: 40,
    isOptional: false,
  },
  {
    className,
    subjectName: subjectNames[(i + 1) % subjectNames.length],
    totalMarks: 100,
    passMarks: 33,
    isOptional: false,
  },
]);

// Combine every class with a unique class teacher
export const dummyClassTeachers = classNames.map((className, i) => ({
  className,
  teacherEmail: `teacher${(i % 20) + 1}@example.com`,
  isClassTeacher: true,
}));

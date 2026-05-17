import { PrismaClient, type UserRole, type VisitStatus } from "@prisma/client";
import { hashPassword } from "../lib/password";

const prisma = new PrismaClient();

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const employeeData = [
  {
    name: "Алексей Иванов",
    department: "IT",
    position: "Руководитель IT",
    email: "ivanov@office.local",
  },
  {
    name: "Мария Петрова",
    department: "HR",
    position: "HR-менеджер",
    email: "petrova@office.local",
  },
  {
    name: "Дмитрий Сидоров",
    department: "Безопасность",
    position: "Начальник охраны",
    email: "sidorov@office.local",
  },
  {
    name: "Елена Козлова",
    department: "Бухгалтерия",
    position: "Главный бухгалтер",
    email: "kozlova@office.local",
  },
  {
    name: "Сергей Новиков",
    department: "Администрация",
    position: "Директор",
    email: "novikov@office.local",
  },
];

const visitorData = [
  { fullName: "Андрей Морозов", phone: "+7 900 111 2233", email: "morozov@mail.ru", documentNumber: "4510 123456" },
  { fullName: "Светлана Орлова", phone: "+7 911 222 3344", email: "orlova@gmail.com", documentNumber: "4511 234567" },
  { fullName: "Николай Зайцев", phone: "+7 922 333 4455", email: null, documentNumber: "4512 345678" },
  { fullName: "Татьяна Белова", phone: "+7 933 444 5566", email: "belova@yandex.ru", documentNumber: "4513 456789" },
  { fullName: "Виктор Громов", phone: "+7 944 555 6677", email: null, documentNumber: "4514 567890" },
  { fullName: "Ольга Соколова", phone: "+7 955 666 7788", email: "sokolova@mail.ru", documentNumber: "4515 678901" },
  { fullName: "Павел Волков", phone: "+7 966 777 8899", email: "volkov@inbox.ru", documentNumber: "4516 789012" },
  { fullName: "Ирина Лебедева", phone: "+7 977 888 9900", email: null, documentNumber: "4517 890123" },
  { fullName: "Константин Медведев", phone: "+7 988 999 0011", email: "medvedev@bk.ru", documentNumber: "4518 901234" },
  { fullName: "Наталья Фёдорова", phone: "+7 999 000 1122", email: "fedorova@mail.ru", documentNumber: "4519 012345" },
  { fullName: "Артём Щербаков", phone: "+7 900 123 4567", email: null, documentNumber: "4520 123456" },
  { fullName: "Юлия Васильева", phone: "+7 911 234 5678", email: "vasileva@gmail.com", documentNumber: "4521 234567" },
  { fullName: "Роман Попов", phone: "+7 922 345 6789", email: "popov@mail.ru", documentNumber: "4522 345678" },
  { fullName: "Анна Смирнова", phone: "+7 933 456 7890", email: null, documentNumber: "4523 456789" },
  { fullName: "Денис Кузнецов", phone: "+7 944 567 8901", email: "kuznetsov@yandex.ru", documentNumber: "4524 567890" },
  { fullName: "Марина Захарова", phone: "+7 955 678 9012", email: null, documentNumber: "4525 678901" },
  { fullName: "Илья Тихонов", phone: "+7 966 789 0123", email: "tikhonov@bk.ru", documentNumber: "4526 789012" },
  { fullName: "Екатерина Макарова", phone: "+7 977 890 1234", email: "makarova@inbox.ru", documentNumber: "4527 890123" },
  { fullName: "Алексей Никитин", phone: "+7 988 901 2345", email: null, documentNumber: "4528 901234" },
  { fullName: "Людмила Романова", phone: "+7 999 012 3456", email: "romanova@mail.ru", documentNumber: "4529 012345" },
  { fullName: "Михаил Сергеев", phone: "+7 900 234 5678", email: "sergeev@gmail.com", documentNumber: "4530 123456" },
  { fullName: "Валентина Кириллова", phone: "+7 911 345 6789", email: null, documentNumber: "4531 234567" },
  { fullName: "Борис Матвеев", phone: "+7 922 456 7890", email: "matveev@mail.ru", documentNumber: "4532 345678" },
  { fullName: "Галина Степанова", phone: "+7 933 567 8901", email: null, documentNumber: "4533 456789" },
  { fullName: "Игорь Яковлев", phone: "+7 944 678 9012", email: "yakovlev@yandex.ru", documentNumber: "4534 567890" },
  { fullName: "Нина Андреева", phone: "+7 955 789 0123", email: "andreeva@bk.ru", documentNumber: "4535 678901" },
  { fullName: "Владимир Алексеев", phone: "+7 966 890 1234", email: null, documentNumber: "4536 789012" },
  { fullName: "Тамара Герасимова", phone: "+7 977 901 2345", email: "gerasimova@mail.ru", documentNumber: "4537 890123" },
  { fullName: "Евгений Пономарёв", phone: "+7 988 012 3456", email: null, documentNumber: "4538 901234" },
  { fullName: "Зинаида Ковалёва", phone: "+7 999 123 4567", email: "kovaleva@inbox.ru", documentNumber: "4539 012345" },
];

const purposes = [
  "Деловая встреча",
  "Собеседование",
  "Подписание договора",
  "Техническое обслуживание",
  "Доставка документов",
  "Консультация",
  "Плановая проверка",
  "Обучение",
];

const demoUsers: Array<{
  name: string;
  email: string;
  password: string;
  role: UserRole;
}> = [
  {
    name: "Администратор системы",
    email: "admin@office.local",
    password: "admin123",
    role: "ADMIN",
  },
  {
    name: "Оператор КПП",
    email: "operator@office.local",
    password: "user123",
    role: "USER",
  },
  ...employeeData.map((employee) => ({
    name: employee.name,
    email: employee.email,
    password: "user123",
    role: "USER" as UserRole,
  })),
];

async function seedEmployees() {
  const count = await prisma.employee.count();
  if (count > 0) return;

  await prisma.employee.createMany({
    data: employeeData.map(({ email: _email, ...employee }) => employee),
  });
}

async function seedVisitors() {
  const count = await prisma.visitor.count();
  if (count > 0) return;

  await prisma.visitor.createMany({ data: visitorData });
}

async function seedUsers() {
  for (const user of demoUsers) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash: hashPassword(user.password),
        role: user.role,
        isActive: true,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash: hashPassword(user.password),
        role: user.role,
        isActive: true,
      },
    });
  }
}

async function seedVisits() {
  const count = await prisma.visit.count();
  if (count > 0) return;

  const [employees, visitors] = await Promise.all([
    prisma.employee.findMany(),
    prisma.visitor.findMany(),
  ]);

  const statusWeights = [0.15, 0.75, 0.1];
  const now = new Date();
  const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < 100; i++) {
    const checkIn = randomDate(sixtyDaysAgo, now);
    const rand = Math.random();
    let status: VisitStatus;

    if (rand < statusWeights[0]) {
      status = "ACTIVE";
    } else if (rand < statusWeights[0] + statusWeights[1]) {
      status = "COMPLETED";
    } else {
      status = "CANCELLED";
    }

    const checkOut =
      status === "COMPLETED"
        ? new Date(checkIn.getTime() + Math.random() * 4 * 60 * 60 * 1000)
        : null;

    await prisma.visit.create({
      data: {
        visitorId: randomElement(visitors).id,
        employeeId: randomElement(employees).id,
        purpose: randomElement(purposes),
        checkIn,
        checkOut,
        passCode: `VIS-${checkIn.getFullYear()}-${String(i + 1).padStart(4, "0")}`,
        status,
      },
    });
  }
}

async function main() {
  await seedEmployees();
  await seedVisitors();
  await seedUsers();
  await seedVisits();

  const [employees, visitors, users, visits] = await Promise.all([
    prisma.employee.count(),
    prisma.visitor.count(),
    prisma.user.count(),
    prisma.visit.count(),
  ]);

  console.log(
    `Seed completed: ${employees} employees, ${visitors} visitors, ${users} users, ${visits} visits`
  );
  console.log("Demo admin: admin@office.local / admin123");
  console.log("Demo user: operator@office.local / user123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

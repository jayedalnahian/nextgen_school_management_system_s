# NextGen School Management System

NextGen School Management System is a modern, scalable, and role-based web application designed to digitize the administrative and academic operations of educational institutions. Built with a powerful stack including Next.js, Node.js, and PostgreSQL, it streamlines daily tasks such as student enrollment, routine scheduling, attendance tracking, and result publishing.

## 🔗 Live Links
- **Live Demo:** [https://your-live-link.com](https://your-live-link.com)
- **API Documentation:** [https://api-docs-link.com](https://api-docs-link.com)
- **Client Repository:** [Link to Frontend Repo]
- **Server Repository:** [Link to Backend Repo]

## 🚀 Core Features

### 👤 User Roles & Responsibilities (RBAC)
The system implements Role-Based Access Control to ensure data security and personalized user experiences:
- **Super Admin:** Strategic control, admin management, revenue analytics via Stripe, and system audit logs.
- **Admin:** Operational management, student/teacher CRUD, routine builder, and class-wise performance statistics.
- **Teacher:** Digital attendance marking, gradebook management, and student feedback portal.
- **Parent:** Real-time attendance tracking, result card downloads (PDF), and secure tuition fee payments via Stripe.

### 🛠️ Key Technical Features
- **Hybrid Authentication:** Multi-layer security using JWT and Better-Auth.
- **Smart RBAC:** Automatic UI menu filtering and API protection based on user roles.
- **Stripe Integration:** Fully secure payment gateway for automated tuition fee collection.
- **Soft Delete:** Data is never permanently lost; records are hidden using `isDeleted` flags for audit trails.
- **Automated Reports:** PDF generation for result cards and transaction ledgers.

## 💻 Technologies Used

### Frontend
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **State Management:** TanStack Query / Redux (Optional)

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **ORM:** Prisma
- **Database:** PostgreSQL

### Integration & Security
- **Authentication:** Better-Auth & JWT
- **Payments:** Stripe API
- **File Storage:** Cloudinary (for profile pictures and documents)
- **Mailing:** Nodemailer (for notices and alerts)

## 📊 Database Architecture
The system follows a relational model optimized for performance (3NF):
- **Shared Identity:** Centralized `User` table for authentication.
- **Profile Separation:** 1:1 relationships for `Admin`, `Teacher`, and `Parent` profiles.
- **Bridge Tables:** Many-to-Many relationships for `ClassTeacher` and `ClassSubject`.
- **Financial Tracking:** Dedicated `Payment` table for transaction history and Stripe synchronization.

## ⚙️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL Database
- Stripe Account (for API keys)
- Cloudinary Account (for image uploads)

### Installation
1. **Clone the Repository:**
   ```bash
   git clone https://github.com/your-username/nextgen-sms.git
   cd nextgen-sms
   ```

2. **Install Dependencies:**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../client
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the server directory and add the following:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/nextgen_db"
   JWT_ACCESS_SECRET="your_secret_key"
   STRIPE_SECRET_KEY="your_stripe_key"
   CLOUDINARY_CLOUD_NAME="your_name"
   BETTER_AUTH_SECRET="your_auth_secret"
   ```

4. **Database Migration:**
   ```bash
   cd server
   npx prisma generate
   npx prisma migrate dev --name init
   ```

5. **Run the Application:**
   ```bash
   # Run Server (from server directory)
   npm run dev

   # Run Client (from client directory)
   npm run dev
   ```

## 🛡️ License
Distributed under the MIT License. See `LICENSE` for more information.

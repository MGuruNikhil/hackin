# Hackin ⚡

> **From idea to demo in record time** - AI-powered hackathon companion that guides teams through every step of the development journey.

<div align="center">

[![GitHub stars](https://img.shields.io/github/stars/nirbarin/hackin?style=social)](https://github.com/nirbarin/hackin)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)

[Live Demo](https://hackin.nirbar.in) • [Documentation](#documentation) • [Contributing](#contributing)

</div>

## 🎯 What is Hackin?

Hackin is an open-source AI-powered platform designed specifically for hackathon teams to ship faster and build better. It transforms the chaotic hackathon experience into a structured, guided journey from initial idea brainstorming to final demo presentation.

### The Problem We Solve

Hackathons are exciting but overwhelming:
- **Blank page syndrome**: Teams waste precious hours figuring out what to build
- **Poor planning**: No clear roadmap leads to incomplete projects
- **Context switching**: Teams lose focus jumping between tasks
- **Time pressure**: Limited time requires efficient execution
- **Team coordination**: Managing tasks across team members is challenging

### Our Solution

Hackin provides a comprehensive hackathon pipeline that:
1. **Generates tailored project ideas** based on team skills and hackathon constraints
2. **Creates detailed implementation plans** with AI-powered step breakdowns
3. **Manages tasks and progress** with intelligent todo tracking
4. **Provides contextual AI assistance** at every development stage
5. **Facilitates team collaboration** with integrated team management

## 🚀 Key Features

### 🧠 Smart Idea Generation
- **AI-powered brainstorming** based on hackathon theme, team skills, and time constraints
- **Multiple concept variations** to choose from
- **Technology stack recommendations** aligned with team expertise
- **Difficulty and time estimates** for realistic planning

### 🛠️ Guided Implementation Planning
- **Automated step generation** breaking complex projects into manageable tasks
- **Section-based organization** (Setup, Backend, Frontend, Integration, Deployment)
- **Progress tracking** with visual completion indicators
- **Interactive task management** with real-time updates

### 🤖 Contextual AI Assistant
- **Step-specific guidance** understanding your current progress
- **Technical problem solving** with project context awareness
- **Architecture suggestions** tailored to your tech stack
- **Real-time chat support** for instant help

### 👥 Team Collaboration
- **Skill-based member profiles** for optimal task assignment
- **GitHub authentication** for seamless integration
- **Team project sharing** with role-based access
- **Progress visibility** across all team members

### 📊 Project Management
- **Visual progress tracking** with completion percentages
- **Task dependencies** and logical workflow organization
- **Deadline awareness** with hackathon timeline integration
- **Export capabilities** for external project management tools

## 🏗️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Lucide React** - Beautiful icons

### Backend
- **Next.js API Routes** - Serverless backend functions
- **Drizzle ORM** - Type-safe database operations
- **PostgreSQL** - Robust relational database
- **Arctic** - OAuth authentication library

### AI Integration
- **OpenRouter API** - Multiple AI model access
- **Vercel AI SDK** - Streaming AI responses
- **Custom prompting** - Hackathon-optimized AI instructions

### Development Tools
- **Bun** - Fast JavaScript runtime and package manager
- **Biome** - Lightning-fast linter and formatter
- **ESLint** - Code quality enforcement
- **Drizzle Kit** - Database migration management

## 🎯 User Journey

### 1. **Project Setup**
```
Register with GitHub → Define hackathon details → Set team skills → Ready to ideate
```

### 2. **Idea Generation**
```
AI analyzes context → Generates 3 tailored ideas → Team selects best fit → Finalizes concept
```

### 3. **Implementation Planning**
```
Breaks down into sections → Creates detailed todos → Assigns team roles → Starts development
```

### 4. **Guided Development**
```
Track progress → Get AI assistance → Complete tasks → Stay on timeline
```

### 5. **Demo Preparation**
```
Review completion → Prepare presentation → Deploy project → Win hackathon! 🏆
```

## 🛠️ Installation & Setup

### Prerequisites
- **Node.js 18+** or **Bun**
- **PostgreSQL** database
- **GitHub OAuth App** credentials
- **OpenRouter API** key

### 1. Clone the Repository
```bash
git clone https://github.com/nirbarin/hackin.git
cd hackin
```

### 2. Install Dependencies
```bash
# Using bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Environment Configuration
Create a `.env.local` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hackin"

# GitHub OAuth (create at https://github.com/settings/applications/new)
GITHUB_ID="your_github_client_id"
GITHUB_SECRET="your_github_client_secret"

# OpenRouter API (get from https://openrouter.ai/)
OPENROUTER_API_KEY="your_openrouter_api_key"

# Application URL (only required for production)
# APP_URL="https://your-domain.com"
```

### 4. Database Setup
```bash
# Generate database schema
bun run db:generate

# Run migrations
bun run db:migrate

# Optional: Open Drizzle Studio to view database
bun run db:studio
```

### 5. Start Development Server
```bash
# Using bun
bun run dev

# Or using npm
npm run dev
```

Visit `http://localhost:3000` to see Hackin in action! 🎉

## 📚 API Documentation

### Core Endpoints

#### Projects
- `POST /api/new` - Create new hackathon project
- `GET /api/projects` - List user's projects
- `GET /api/projects/[id]` - Get project details
- `PUT /api/projects/[id]` - Update project

#### Ideas
- `POST /api/ideas/generate` - Generate AI-powered ideas
- `GET /api/ideas?projectId=X` - List project ideas
- `POST /api/ideas` - Create custom idea
- `DELETE /api/ideas/[id]` - Delete idea

#### Implementation Planning
- `POST /api/step-sections/generate` - Generate implementation plan
- `GET /api/step-sections?ideaId=X` - Get implementation sections
- `POST /api/step-todos` - Create task
- `PATCH /api/step-todos/[id]` - Update task completion

#### AI Assistance
- `POST /api/ideas/[id]/chat` - Chat about idea refinement
- `POST /api/steps/chat` - Get implementation guidance
- `POST /api/step-sections/[id]/chat` - Section-specific help

### Database Schema

The application uses a relational database with the following key entities:

- **Users** - GitHub-authenticated user profiles with skills
- **Projects** - Hackathon project containers with metadata
- **Teams** - Collaborative team structures
- **Ideas** - AI-generated or custom project concepts
- **Steps/Sections** - Implementation plan organization
- **Todos** - Granular task management
- **Chats** - Contextual AI conversation history

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Development Workflow

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes** with proper TypeScript types
4. **Add tests** if applicable
5. **Run the linter**: `bun run fix`
6. **Commit changes**: `git commit -m 'Add amazing feature'`
7. **Push to branch**: `git push origin feature/amazing-feature`
8. **Open a Pull Request**

### Areas for Contribution

- 🎨 **UI/UX improvements** - Enhanced user experience
- 🤖 **AI prompt optimization** - Better AI responses
- 📱 **Mobile responsiveness** - Improved mobile experience
- 🔌 **Integrations** - Connect with other tools (Slack, Discord, Jira)
- 🌐 **Internationalization** - Multi-language support
- 📊 **Analytics** - Usage insights and metrics
- 🧪 **Testing** - Comprehensive test coverage

### Code Style

- Use **TypeScript** for all new code
- Follow **Next.js best practices**
- Use **Tailwind CSS** for styling
- Write **descriptive commit messages**
- Add **JSDoc comments** for complex functions

## 🗺️ Roadmap

### Short Term (Next 2-3 months)
- [ ] **Mobile app** - React Native implementation
- [ ] **Real-time collaboration** - Live team updates
- [ ] **Integration marketplace** - Connect popular dev tools
- [ ] **Advanced AI models** - GPT-4, Claude integration
- [ ] **Template library** - Pre-built project templates

### Medium Term (3-6 months)
- [ ] **Voice commands** - Voice-controlled task management
- [ ] **Code generation** - AI-powered boilerplate creation
- [ ] **Deployment automation** - One-click deployment to various platforms
- [ ] **Mentor matching** - Connect with experienced developers
- [ ] **Hackathon discovery** - Find and join hackathons

### Long Term (6+ months)
- [ ] **White-label solutions** - Custom Hackin for organizations
- [ ] **Advanced analytics** - Team performance insights
- [ ] **AI code review** - Automated code quality checks
- [ ] **Global hackathon platform** - Host and organize events

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenRouter** - For providing access to multiple AI models
- **Vercel** - For excellent hosting and deployment platform
- **Drizzle Team** - For the amazing ORM experience
- **Radix UI** - For accessible component primitives
- **The open-source community** - For inspiration and contributions

## 🔗 Links

- **Live Demo**: [hackin.nirbar.in](https://hackin.nirbar.in)
- **GitHub**: [github.com/nirbarin/hackin](https://github.com/nirbarin/hackin)
- **Documentation**: [Coming Soon]
- **Discord Community**: [Coming Soon]
- **Creator**: [@nirbar](https://nirbar.in)

---

<div align="center">

**Built with ❤️ by hackers, for hackers**

[⭐ Star this repo](https://github.com/nirbarin/hackin) if you find it helpful!

</div>
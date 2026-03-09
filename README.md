# LogicLab

A full-stack propositional logic laboratory built with **ASP.NET Core 8** and **React 18 + Vite + TailwindCSS v4**. Features a custom expression parser, truth table generator with automatic sub-columns, Karnaugh maps, logical analysis tools, and an interactive exercise system with a custom exercise creator.

![Tech Stack](https://img.shields.io/badge/.NET-8.0-purple?style=flat-square) ![React](https://img.shields.io/badge/React-18-blue?style=flat-square) ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?style=flat-square) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?style=flat-square)

## Features

### Logic Engine (Custom Parser in C#)
- **Recursive descent parser** — builds an AST from logical expressions
- **Multi-syntax support** — write `AND`/`&&`/`∧`, `OR`/`||`/`∨`, `NOT`/`!`/`¬`, `->` or `→`, `<->` or `↔`, `XOR`/`⊕`, `NAND`/`↑`, `NOR`/`↓`
- **Automatic sub-columns** — extracts every node from the AST as a separate column in the truth table
- **Up to 8 variables** (256 rows)

### Modules

| Module | Description |
|--------|-------------|
| **Editor** | Real-time truth table with all sub-expressions, history, quick tools (CNF, DNF, simplify, satisfiability) |
| **Analysis** | Logical equivalence checker, logical consequence (⊨), satisfiability |
| **K-Map** | Karnaugh map visualization for 2, 3 and 4 variables with Gray code ordering |
| **Exercises** | Browse public exercises, filter by difficulty, attempt and get scored |
| **Exercise Creator** | Design exercises: enter expression → see full table → choose what to hide → publish |
| **Profile** | Expression history, created exercises, XP and streak tracking |
| **Reference** | Interactive cheat sheet with laws of logic — click any law to load it in the editor |

### Exercise Creator (Key Feature)
- Write any logical expression → system automatically generates the truth table with **all sub-columns**
- Choose how to hide information:
  - **Easy** — only hides the final result column
  - **Medium** — hides half the sub-expression columns
  - **Hard** — hides all sub-columns (only variables visible)
  - **Custom** — click to toggle individual columns or individual cells
- Preview the exercise exactly as students will see it
- Set title, description, difficulty, tags, and public/private visibility

## Tech Stack

### Backend
- **ASP.NET Core 8** Web API
- **Custom recursive descent parser** for logical expressions
- **Entity Framework Core 8** with Npgsql
- **PostgreSQL** database
- **JWT Bearer** authentication + BCrypt

### Frontend
- **React 18** with Vite
- **TailwindCSS v4** (`@tailwindcss/vite` plugin)
- **React Router v6**
- **Axios** with JWT interceptors
- **Dark mode** with localStorage persistence
- **Symbol keyboard** for easy operator input

## Project Structure

```
LogicLab/
├── Services/
│   ├── LogicEngine.cs       # Parser, evaluator, truth table, K-Map, QM, analysis
│   ├── AuthService.cs
│   ├── ExpressionService.cs
│   └── ExerciseService.cs
├── Controllers/
│   ├── LogicController.cs   # All logic endpoints
│   ├── AuthController.cs
│   ├── ExpressionsController.cs
│   ├── ExercisesController.cs
│   └── UsersController.cs
├── Models/
│   ├── User.cs
│   ├── SavedExpression.cs
│   ├── Exercise.cs
│   └── ExerciseAttempt.cs
└── frontend/src/
    ├── pages/
    │   ├── Editor.jsx        # Main truth table editor
    │   ├── Analysis.jsx      # Equivalence, consequence, satisfiability
    │   ├── KMap.jsx          # Karnaugh map
    │   ├── Exercises.jsx     # Exercise browser
    │   ├── CreateExercise.jsx # Exercise creator with sub-column config
    │   ├── PlayExercise.jsx  # Interactive exercise player
    │   ├── Reference.jsx     # Logic laws reference
    │   └── Profile.jsx       # User profile + history
    └── components/
        ├── Navbar.jsx
        ├── TruthTable.jsx    # Reusable table (editor + exercise player)
        └── SymbolKeyboard.jsx
```

## API Endpoints

### Logic (no auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/logic/evaluate` | Generate truth table with sub-columns |
| POST | `/api/logic/validate` | Validate expression syntax |
| POST | `/api/logic/equivalence` | Check logical equivalence |
| POST | `/api/logic/consequence` | Check logical consequence |
| POST | `/api/logic/satisfiability` | Check satisfiability |
| POST | `/api/logic/cnf` | Convert to CNF |
| POST | `/api/logic/dnf` | Convert to DNF |
| POST | `/api/logic/simplify` | Quine-McCluskey simplification |
| POST | `/api/logic/kmap` | Generate K-Map data |
| POST | `/api/logic/tree` | Get expression tree (AST) |

### Expressions & Exercises
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/expressions` | ✓ | Save expression to history |
| GET | `/api/expressions/mine` | ✓ | Get my saved expressions |
| GET | `/api/expressions/share/{id}` | | Get shared expression |
| GET | `/api/exercises` | | List public exercises |
| POST | `/api/exercises` | ✓ | Create exercise |
| GET | `/api/exercises/:id` | | Get exercise detail |
| POST | `/api/exercises/:id/attempt` | ✓ | Submit attempt |

## Getting Started

### Prerequisites
- .NET 8 SDK
- Node.js 18+
- PostgreSQL

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/varocode/LogicLab
   cd LogicLab
   ```

2. **Configure** `appsettings.json`:
   ```json
   {
     "ConnectionStrings": {
       "DefaultConnection": "Host=localhost;Database=logiclabdb;Username=postgres;Password=yourpassword"
     },
     "Jwt": { "Key": "your-32-char-secret", "Issuer": "LogicLab", "Audience": "LogicLabClient" }
   }
   ```

3. **Run migrations**
   ```bash
   dotnet ef database update
   ```

4. **Start the backend**
   ```bash
   dotnet run
   # API at http://localhost:5300
   ```

5. **Start the frontend**
   ```bash
   cd frontend && npm install && npm run dev
   # App at http://localhost:5181
   ```

### Demo Account
- Email: `demo@logiclab.com`
- Password: `Demo1234`

## Supported Operators

| Symbol | Aliases | Name |
|--------|---------|------|
| `∧` | `AND`, `&&`, `&` | Conjunction |
| `∨` | `OR`, `\|\|`, `\|` | Disjunction |
| `¬` | `NOT`, `!`, `~` | Negation |
| `→` | `->`, `=>` | Implication |
| `↔` | `<->`, `<=>` | Biconditional |
| `⊕` | `XOR`, `^` | Exclusive OR |
| `↑` | `NAND` | Not-AND |
| `↓` | `NOR` | Not-OR |

---

Built by [Alvaro Acevedo](https://linkedin.com/in/alvaro-acevedo-a94054382) · [alvaroacevedo83@gmail.com](mailto:alvaroacevedo83@gmail.com)

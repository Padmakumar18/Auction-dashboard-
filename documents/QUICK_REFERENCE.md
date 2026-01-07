# Quick Reference Guide

## 🚀 Common Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Install dependencies
npm install

# Add new package
npm install package-name
```

## 📁 File Locations

| What        | Where                    |
| ----------- | ------------------------ |
| Pages       | `src/pages/*.jsx`        |
| Components  | `src/components/*.jsx`   |
| State       | `src/store/useStore.js`  |
| API         | `src/services/api.js`    |
| Utils       | `src/utils/helpers.js`   |
| Toast Utils | `src/utils/toast.js`     |
| Config      | `src/config/supabase.js` |
| Styles      | `src/index.css`          |
| Environment | `.env`                   |

## 🎨 Using Toast

```javascript
import toast from "react-hot-toast";

// Success
toast.success("Operation successful!");

// Error
toast.error("Something went wrong!");

// Loading
const id = toast.loading("Processing...");
toast.success("Done!", { id });

// Custom duration
toast.success("Message", { duration: 5000 });
```

## 🔧 Common Tasks

### Add a New Page

1. Create `src/pages/NewPage.jsx`
2. Add route in `src/App.js`
3. Add nav link in `src/components/Layout.jsx`

### Add a New Component

1. Create `src/components/NewComponent.jsx`
2. Export default
3. Import where needed

### Add Toast to Function

```javascript
try {
  // Your code
  toast.success("Success!");
} catch (error) {
  toast.error(error.message);
}
```

### Update State

```javascript
import useStore from "../store/useStore";

const { teams, setTeams } = useStore();
setTeams(newTeams);
```

### Call API

```javascript
import { teamsAPI } from "../services/api";

const data = await teamsAPI.getAll();
```

## 🗄️ Supabase Queries

```sql
-- Get all teams
SELECT * FROM teams;

-- Get all players
SELECT * FROM players;

-- Get sold players
SELECT * FROM players WHERE status = 'sold';

-- Get team with players
SELECT t.*, p.name as player_name
FROM teams t
LEFT JOIN players p ON p.team_id = t.id;
```

## 🎯 Keyboard Shortcuts

| Action        | Shortcut           |
| ------------- | ------------------ |
| Close Modal   | `Esc`              |
| Submit Form   | `Enter`            |
| Refresh Page  | `Ctrl+R` / `Cmd+R` |
| Open DevTools | `F12`              |

## 🐛 Debugging

```javascript
// Console log
console.log("Debug:", data);

// Check state
const state = useStore.getState();
console.log("State:", state);

// Check API response
const data = await teamsAPI.getAll();
console.log("API Response:", data);
```

## 📊 Useful Supabase Commands

```javascript
// Get all
const { data } = await supabase.from("teams").select("*");

// Get with filter
const { data } = await supabase
  .from("players")
  .select("*")
  .eq("status", "sold");

// Insert
const { data } = await supabase
  .from("teams")
  .insert([{ name: "Team Name", total_points: 1000000 }]);

// Update
const { data } = await supabase
  .from("teams")
  .update({ points_used: 500000 })
  .eq("id", teamId);

// Delete
const { data } = await supabase.from("teams").delete().eq("id", teamId);
```

## 🎨 Tailwind Classes

```javascript
// Colors
bg-blue-600 text-white

// Spacing
p-4 m-4 gap-4

// Layout
flex flex-col items-center justify-between

// Responsive
md:grid-cols-2 lg:grid-cols-3

// Hover
hover:bg-blue-700 hover:shadow-lg

// Rounded
rounded-lg rounded-full

// Shadow
shadow-md shadow-lg
```

## 🔍 Finding Things

```bash
# Find in files (VS Code)
Ctrl+Shift+F / Cmd+Shift+F

# Find file (VS Code)
Ctrl+P / Cmd+P

# Search in project
grep -r "searchterm" src/
```

## 📝 Common Patterns

### Loading State

```javascript
const [loading, setLoading] = useState(false);

const loadData = async () => {
  try {
    setLoading(true);
    const data = await api.getAll();
    setState(data);
  } catch (error) {
    toast.error(error.message);
  } finally {
    setLoading(false);
  }
};
```

### Form Handling

```javascript
const [formData, setFormData] = useState({ name: "", value: "" });

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    await api.create(formData);
    toast.success("Created!");
    setFormData({ name: "", value: "" });
  } catch (error) {
    toast.error(error.message);
  }
};
```

### Modal Pattern

```javascript
const [isOpen, setIsOpen] = useState(false);

<Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
  {/* Content */}
</Modal>;
```

## 🚨 Common Errors & Fixes

| Error                  | Fix                                   |
| ---------------------- | ------------------------------------- |
| "Module not found"     | `npm install`                         |
| "Invalid Supabase URL" | Check `.env` file                     |
| "Cannot read property" | Check data exists                     |
| "Network error"        | Check Supabase is running             |
| "Toast not showing"    | Import toast, check Toaster in App.js |

## 📦 Package Versions

```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.20.1",
  "zustand": "^4.4.7",
  "@supabase/supabase-js": "^2.39.0",
  "react-hot-toast": "^2.4.1",
  "recharts": "^2.10.3",
  "lucide-react": "^0.460.0"
}
```

## 🔗 Useful Links

- React Docs: https://react.dev
- Tailwind: https://tailwindcss.com
- Supabase: https://supabase.com/docs
- React Router: https://reactrouter.com
- Zustand: https://github.com/pmndrs/zustand
- React Hot Toast: https://react-hot-toast.com
- Recharts: https://recharts.org
- Lucide Icons: https://lucide.dev

## 💡 Pro Tips

1. **Use toast for all user feedback** - No more alerts!
2. **Check browser console** - Errors show there
3. **Use React DevTools** - Inspect component state
4. **Test on mobile** - Use browser DevTools
5. **Keep .env secure** - Never commit it
6. **Use loading states** - Better UX
7. **Validate inputs** - Prevent errors
8. **Handle errors** - Always use try/catch
9. **Comment your code** - Future you will thank you
10. **Read the docs** - When stuck, check documentation

---

**Keep this handy while developing!** 📌

# 🔧 Resolve Merge Conflicts - Command Guide

## 🎯 Quick Solutions

### Option 1: Keep YOUR Changes (Overwrite Remote)
```bash
git pull origin main --strategy-option ours
```
This keeps all your local changes and ignores incoming changes.

### Option 2: Accept THEIR Changes (Overwrite Local)
```bash
git pull origin main --strategy-option theirs
```
This accepts all incoming changes and discards your local changes.

### Option 3: Keep Your Changes, Then Pull Fresh
```bash
git reset --hard HEAD
git pull origin main
```
This discards all local changes and pulls fresh from remote.

---

## 📋 Recommended Approach (Safe Method)

### Step 1: Save Your Work First
```bash
git stash
```
This temporarily saves your local changes.

### Step 2: Pull Latest Changes
```bash
git pull origin main
```
This pulls the latest code without conflicts.

### Step 3: Apply Your Changes Back
```bash
git stash pop
```
This reapplies your saved changes.

### Step 4: If Conflicts Appear
```bash
# See which files have conflicts
git status

# For each conflicted file, choose one:
git checkout --ours <filename>    # Keep your version
git checkout --theirs <filename>  # Keep their version

# Or manually edit the file to resolve conflicts
# Then add the resolved files:
git add <filename>

# Complete the merge
git commit -m "Resolved merge conflicts"
```

---

## 🚀 Nuclear Option (Start Fresh)

If you want to completely discard local changes and start fresh:

```bash
# Save your work to a backup branch (optional but recommended)
git branch backup-$(date +%Y%m%d-%H%M%S)

# Discard all local changes
git reset --hard HEAD

# Pull latest
git pull origin main

# Install dependencies
npm install

# Start fresh
npx expo start --clear
```

---

## 🎨 Visual Conflict Resolution

If you prefer to resolve conflicts visually:

### Using VS Code
```bash
# Just open VS Code - it has built-in merge conflict resolver
code .
```
Then look for files marked with conflicts and use the UI buttons to accept changes.

### Using Git Mergetool
```bash
git mergetool
```

---

## 📝 Manual Conflict Resolution

### Step 1: See Conflicted Files
```bash
git status
```

### Step 2: Open Each File
Look for conflict markers:
```
<<<<<<< HEAD
Your changes
=======
Their changes
>>>>>>> branch-name
```

### Step 3: Edit the File
Remove the markers and keep the code you want.

### Step 4: Mark as Resolved
```bash
git add <filename>
```

### Step 5: Complete the Merge
```bash
git commit -m "Resolved merge conflicts"
```

---

## 🔍 Check What's Conflicting

### See Conflicted Files
```bash
git status
```

### See Differences
```bash
git diff
```

### See Incoming Changes
```bash
git diff HEAD origin/main
```

---

## ⚡ Quick Commands Reference

| Command | What It Does |
|---------|-------------|
| `git stash` | Save local changes temporarily |
| `git stash pop` | Restore saved changes |
| `git reset --hard HEAD` | Discard all local changes |
| `git checkout --ours <file>` | Keep your version of file |
| `git checkout --theirs <file>` | Keep their version of file |
| `git status` | See conflicted files |
| `git diff` | See differences |
| `git add <file>` | Mark conflict as resolved |
| `git commit` | Complete the merge |

---

## 🎯 Recommended Solution for Your Case

Since you have new changes (JWT + Responsive design), I recommend:

```bash
# 1. Save your changes
git stash

# 2. Pull latest
git pull origin main

# 3. Apply your changes back
git stash pop

# 4. If conflicts, keep your version (since your changes are newer)
git checkout --ours .

# 5. Add all files
git add .

# 6. Commit
git commit -m "Merged with JWT and responsive design updates"

# 7. Push
git push origin main
```

---

## 🆘 If Nothing Works

Complete reset and fresh start:

```bash
# 1. Backup your changes to a new branch
git checkout -b backup-my-changes
git add .
git commit -m "Backup before reset"

# 2. Go back to main
git checkout main

# 3. Reset to remote
git fetch origin
git reset --hard origin/main

# 4. Pull fresh
git pull origin main

# 5. Cherry-pick your changes from backup
git cherry-pick backup-my-changes

# Or manually copy files from backup branch
```

---

## 📞 Quick Help

**Most Common Solution:**
```bash
git stash
git pull origin main
git stash pop
```

**If You Want to Keep All Your Changes:**
```bash
git checkout --ours .
git add .
git commit -m "Keeping local changes"
```

**If You Want to Accept All Their Changes:**
```bash
git checkout --theirs .
git add .
git commit -m "Accepting remote changes"
```

---

## ✅ After Resolving

Always run:
```bash
npm install
npx expo start --clear
```

To ensure dependencies are up to date and cache is cleared.

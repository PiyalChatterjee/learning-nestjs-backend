# Learning Issues Log

## Issue Entry Rule (Use For Every New Issue)

Capture the following fields every time:

- Symptom
- Root Cause
- Change Made
- Verification Result
- Lesson/Topic Context

## Issue Template

```md
## YYYY-MM-DD - Short Issue Title

### Symptom
-

### Root Cause
-

### Change Made
-

### Verification Result
-

### Lesson/Topic Context
-
```

## 2026-05-16 - Build succeeded but dist output missing

### Symptom
- Running `npm run build` completed with exit code 0.
- Running production start failed with:
  - `Error: Cannot find module '.../dist/main'`

### Root Cause
- `deleteOutDir` in Nest compiler settings removed the `dist` folder at build start.
- TypeScript incremental build cache (`tsconfig.build.tsbuildinfo`) incorrectly treated project as up to date and skipped emitting files.
- Result: build command looked successful, but `dist/main.js` was not recreated.

### Resolution
- Updated build config in `tsconfig.build.json`:
  - Added:
    - `"compilerOptions": { "incremental": false }`
- Kept normal `tsconfig.json` unchanged for general dev behavior.

### Verification
- Ran two consecutive builds.
- Confirmed `dist/main.js` exists after both builds.
- Confirmed production start path `node dist/main` is now valid.

### Learning Note
- A green build is not always enough; always verify expected output artifacts exist (for example, `dist/main.js`) before running production start.

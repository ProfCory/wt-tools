# Clean 5etools Install — Canonical Steps (v2.22.0)

This README documents **only the clean, official install flow** for hosting 5etools, aligned with the 5etools install guide.
No troubleshooting, no history — just the correct steps.

---

## Environment

* **Working directory:**
  `C:\wt-tools\`

* **5etools source (v2.22.0):**
  [https://github.com/5etools-mirror-3/5etools-src/releases/tag/v2.22.0](https://github.com/5etools-mirror-3/5etools-src/releases/tag/v2.22.0)

* **5etools images (v2.22.0):**
  [https://github.com/5etools-mirror-3/5etools-img/releases/tag/v2.22.0](https://github.com/5etools-mirror-3/5etools-img/releases/tag/v2.22.0)

* **Install guide:**
  [https://wiki.tercept.net/en/5eTools/InstallGuide](https://wiki.tercept.net/en/5eTools/InstallGuide)

* **Your GitHub repo:**
  [https://github.com/ProfCory/wt-tools](https://github.com/ProfCory/wt-tools)

---

## Target Folder Layout (Final State)

```
C:\wt-tools\
├── site\
│   ├── index.html
│   ├── data\
│   ├── js\
│   ├── css\
│   └── img\
│       ├── creatures\
│       ├── items\
│       └── …
```

* `site` is the web root
* `img` **must** be inside the same folder as `index.html`

---

## Step-by-Step Clean Install

### 1. Create working folders

Create the following directories manually:

```
C:\wt-tools\
C:\wt-tools\site\
```

---

### 2. Install 5etools source (site code)

1. Download the **5etools-src v2.22.0 ZIP**
2. Extract it
3. Copy **all extracted contents** into:

```
C:\wt-tools\site\
```

After this step, `index.html` should exist at:

```
C:\wt-tools\site\index.html
```

---

### 3. Install 5etools images

1. Download the **5etools-img v2.22.0 ZIP**
2. Extract it
3. Inside the extracted archive, locate the `img` folder
4. Copy that entire `img` folder into:

```
C:\wt-tools\site\img\
```

Do **not** nest it further (no `img/img`).

---

### 4. Verify locally (no Git, no server yet)

Confirm:

* `C:\wt-tools\site\index.html` exists
* `C:\wt-tools\site\img\` contains image subfolders
* Opening `index.html` in a browser loads the UI (images may require a server, this is expected)

---

### 5. Initialize Git (after files are correct)

From PowerShell:

```powershell
cd C:\wt-tools
git init
git add -A
git commit -m "Add 5etools v2.22.0 (src + images)"
```

---

### 6. Push to GitHub

```powershell
git remote add origin https://github.com/ProfCory/wt-tools.git
git branch -M main
git push -u origin main
```

---

### 7. Enable GitHub Pages

In GitHub repo settings:

* **Pages**

  * Source: Deploy from a branch
  * Branch: `main`
  * Folder: `/site`

Resulting URL:

```
https://profcory.github.io/wt-tools/
```

---

## Notes from the Official Guide (Applied Here)

* 5etools is **static** — no build step required
* Any basic web server or GitHub Pages is sufficient
* Images must live in `/img` relative to `index.html`
* Git is optional but recommended for hosting

---

## Stop Points (Sanity Checks)

* After Step 2: `index.html` exists in `/site`
* After Step 3: `/site/img` exists and is populated
* After Step 5: `git status` shows clean working tree
* After Step 7: site loads at GitHub Pages URL

---

End of clean install directions.
No deviations, no optimizations, no extensions.

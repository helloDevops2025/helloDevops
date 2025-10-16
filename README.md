# ⭐ Group: helloDevops  

## ✅ วิธี clone git
1. สร้าง folder หรือไปที่ folder ที่ต้องการ  
2. คลิกขวา กด "Open in Terminal"  
3. ใส่คำสั่งใน command  

```bash
git clone https://github.com/theploy67/helloDevops.git
````

---

## ⚠️ แจ้งให้ทราบ

เราจะมี branch กันทั้งหมด **3 กลุ่มใหญ่**

1. **main** : จะเป็น branch หลักที่รวมโค้ดที่สมบูรณ์และเป็นฉบับจริงมาไว้ที่ branch นี้
2. **develop** : จะเป็น branch ที่รวมโค้ดเพื่อนๆทุกคนเปรียบเสมือน main มีเพื่อเอามาเช็คโค้ดก่อนเอาไปที่ branch main เผื่อพัง
3. **\[branchชื่อเพื่อนๆ]** : branch นี้จะเป็น branch สำหรับให้เพื่อนได้ push โค้ดของตัวเองเก็บไว้ของใครของมัน

เพื่อป้องกันไม่ให้โค้ดเกินการเมิร์จกัน – ทุกคนจะมี branch ชื่อของตัวเอง ได้แก่
`ploy`, `mint`, `grace`, `fluke`, `pair`

⚠️ **สำคัญ** : ก่อนจะ push งานขึ้น git แจ้งในกลุ่มก่อนทุกครั้ง
⚠️ **สำคัญ** : ห้ามเพื่อนๆ push code ไปที่ branch `"main"` เด็ดขาด

ก่อนจะอัพงาน ทุกคนต้องเช็ค ว่าอยู่ branch ชื่อตัวเองไหม
ด้วยคำสั่ง

```bash
git branch
```

**Example:**

```
  develop
  fluke
  grace
* main   --> เครื่องหมาย * คือ branch ปัจจุบันที่กำลังทำงาน
  mint
  pair
  ploy
```

---

## ✅ Step 1 - วิธีการอัพงานตัวเองขึ้นไปบน git บน branch ตัวเอง

⚠️ เพื่อนทุกคนต้อง commit ทุกวัน ศ. เวลา 23.59

1. เข้าไปที่ terminal ใน vs code หรือ Intellij หรือ ไปที่ CMD ที่ root folder project

2. ตรวจสอบว่าอยู่ branch ตัวเองรึยัง ⭐สำคัญ

```bash
git branch
git switch <ชื่อ branch ตัวเอง>
```

3. เช็กว่าไฟล์ไหนถูกแก้ไขแล้ว \[ไฟล์ไหนที่ถูกแก้ไข จะมีสีแดง และเขียนว่า modified]

```bash
git status
```

4. เลือกไฟล์ที่ต้องการอัพขึ้น

```bash
#มี 3 ตัวเลือก
#1.เพิ่มไฟล์ทั้งหมด (รวมถึงที่ยัง untracked)
#คำสั่งนี้จะรวมทุกการแก้ไข — ทั้งไฟล์ใหม่, ไฟล์เก่า, และไฟล์ที่ลบออก
git add -A

#2. ต้องการไฟล์เดียวที่ push
git add <ชื่อไฟล์>

#3.หรือถ้าอยาก add ทุกไฟล์ที่แก้
git add .
```

5. ตรวจเช็กว่าไฟล์ถูก add แล้ว (ไฟล์จะมีสีเขียว และเขียนว่า modified)

```bash
git status
```

**Example:**

```
On branch ploy ---> อยู่ branch ชื่อ ploy แล้ว
Your branch is up to date with 'origin/ploy'.

Changes to be committed:
  (use "git restore --staged <file>..." to unstage)
        modified:   README.md   ---> ไฟล์นี้ถูกแก้ไข
```

6. Commit เพื่อบันทึกการเปลี่ยนแปลงใน branch ตัวเอง

```bash
git commit -m "feat: อธิบายสิ่งที่ทำ เช่น เพิ่มหน้า Login"
```

7. Push ขึ้นไปที่ GitHub (ครั้งแรกต้อง set upstream)

```bash
git push -u origin <ชื่อ branch ตัวเอง>
# เช่น
git push -u origin ploy
```

---

## ✅ Step 2 - เอางานบน branch ตัวเอง push ต่อไปที่ develop

❌ พอยดูส่วนนี้คนเดียว

1. กลับมาที่ branch develop

```bash
git checkout develop
```

2. ดึงโค้ดล่าสุดของ develop มาก่อน (กันพัง)

```bash
git pull origin develop
```

3. รวมงานจาก branch ของเพื่อน (ตัวอย่าง: mint)

```bash
git merge --no-ff mint -m "merge: mint → develop"
```

4. ดัน develop ขึ้น GitHub

```bash
git push origin develop
```

ตอนนี้โค้ดจากเพื่อนจะถูกรวมเข้าที่ develop แล้ว

---

## ✅ Step 3 - เอาโค้ดจาก develop ไปที่ main

❌ พอยดูส่วนนี้คนเดียว

1. ตรวจสอบว่า develop สมบูรณ์แล้ว (เพื่อนทุกคน push งานเข้ามาใน develop เรียบร้อย, ทดสอบระบบแล้ว)

2. ไปที่ branch develop

```bash
git checkout develop
git pull origin develop
```

3. ไปที่ branch main

```bash
git checkout main
git pull origin main
```

4. merge develop → main

```bash
git merge --no-ff develop -m "merge: develop → main (release version 1.0)"
```

5. push main ขึ้น GitHub

```bash
git push origin main
```

---

## 🛠 ถ้า git add ผิดไฟล์ แต่ยังไม่ได้ commit

สามารถ “ยกเลิก” ได้ตามนี้

1. ยกเลิกเฉพาะไฟล์ที่ add ไปแล้ว

```bash
git restore --staged <ชื่อไฟล์>
```

2. ยกเลิกทุกไฟล์ที่ถูก add ไปแล้ว

```bash
git restore --staged .
```

3. ถ้าคุณอยากกลับไปไฟล์เดิมทั้งหมด (รวมลบการแก้ไขใน working directory ด้วย ⚠️)

```bash
git restore <ชื่อไฟล์>
# หรือทั้งหมด
git restore .
```

⚠️ ระวัง: คำสั่งนี้จะทำให้ไฟล์หายไปเป็นเวอร์ชันก่อนแก้ (undo code)
ปกติถ้าแค่ “ยกเลิก git add” ก่อน commit ใช้

```bash
git restore --staged <file>
```
---


* **ทุกครั้งที่ branch `develop` ถูกอัพเดต**  เพื่อนๆ **ควร pull** จาก `develop` ลง branch ของตัวเองก่อนทำงานต่อ
* ถ้ามีงานค้างอยู่ → Git จะเตือนว่ามีการแก้ไขไฟล์เดียวกันจากหลายคน (**conflict**) เราจะต้องแก้ไข conflict เอง ไม่อย่างนั้นงานจะทับซ้อนกัน

---

## 🔄 Workflow ที่ควรทำ

1. **อยู่ branch ของตัวเอง** เช่น `grace`

   ```bash
   git checkout grace
   ```

2. **ดึงโค้ดล่าสุดจาก develop มารวมเข้ามาใน branch ตัวเอง**

   ```bash
   git fetch origin
   git merge origin/develop
   ```

   > เพื่อให้ branch ของเราอัพเดตตาม `develop` ตลอด

3. **ถ้ามี conflict** (Git แจ้งไฟล์ที่ทับซ้อน) → เปิดไฟล์มาแก้ไขเอง เช่น:

   ```text
   <<<<<<< HEAD
   // ของเรา
   =======
   // ของ develop
   >>>>>>>
   ```

   → ลบส่วนที่ไม่ต้องการออก แล้ว commit ใหม่

4. **ทำงานต่อ/แก้ไขไฟล์ของตัวเองได้ตามปกติ**

5. **commit + push ไปที่ branch ของตัวเอง**

   ```bash
   git add .
   git commit -m "feat: เพิ่มหน้าใหม่"
   git push origin grace
   ```

---

## ⚠️ ถ้า “ทำงานค้างไว้” แล้วต้อง pull develop

* **กรณีแก้ไฟล์คนละไฟล์กับเพื่อน** → Git จะ merge ให้อัตโนมัติ ไม่มีปัญหา
* **กรณีแก้ไฟล์เดียวกันกับเพื่อน (โดยเฉพาะบรรทัดเดียวกัน)** → จะเกิด **merge conflict** ต้องแก้เอง
* **กรณีอยากเก็บงานที่ยังไม่เสร็จ แต่ต้อง pull ก่อน**
  ใช้ `stash` เก็บงานชั่วคราว

  ```bash
  git stash
  git pull origin develop
  git stash pop
  ```

  → จะได้งานของเรากลับมา พร้อมกับโค้ดใหม่จาก `develop`

---
# 🚀 วิธีการรัน Frontend (React + Vite)

## ✅ ติดตั้งครั้งแรก (Setup Project)

1. เข้าไปที่โฟลเดอร์ frontend

   ```bash
   cd frontend
   ```

2. ติดตั้ง dependency (ต้องมี **Node.js** และ **npm** ติดตั้งในเครื่องก่อน)

   ```bash
   npm install
   ```

   📌 คำสั่งนี้จะอ่านไฟล์ `package.json` แล้วติดตั้ง library ทั้งหมดที่โปรเจคต้องใช้ เช่น React, Vite, Axios ฯลฯ

---

## ✅ รัน frontend แบบ development

```bash
npm run dev
```

* รอจนขึ้นข้อความประมาณนี้:

  ```
  VITE v5.0.0  ready in 1000 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://192.168.xx.xx:5173/
  ```
* จากนั้นเปิด browser แล้วเข้าไปที่ [http://localhost:5173](http://localhost:5173)

---

## ✅ รัน frontend แบบ production (build จริง)

1. สร้าง build

   ```bash
   npm run build
   ```

   ผลลัพธ์จะถูกเก็บไว้ในโฟลเดอร์ `dist/`

2. ทดสอบ build ด้วย

   ```bash
   npm run preview
   ```

   แล้วเข้าไปที่ [http://localhost:4173](http://localhost:4173)

---

## ✅ คำสั่งที่ใช้บ่อย

* **ติดตั้ง library เพิ่ม**

  ```bash
  npm install <ชื่อแพ็กเกจ>
  ```

  เช่น

  ```bash
  npm install axios
  ```

* **ลบ node\_modules แล้วติดตั้งใหม่ (เวลาเจอบั๊กแปลกๆ)**

  ```bash
  rm -rf node_modules package-lock.json
  npm install
  ```

---

## 📌 สรุปสั้นๆ (copy ไปใช้ได้เลย)

```bash
cd frontend
npm install
npm run dev
```

แล้วเปิดเว็บ [http://localhost:5173](http://localhost:5173) 🎉

---

ยอดเยี่ยมมากครับ 💪
คำถามนี้คือ “อยากให้ branch `pair` ดึงโค้ดล่าสุดจาก branch `ploy` มาด้วย”
ซึ่งทำได้ง่ายมาก โดยใช้คำสั่ง `merge` หรือ `rebase`

---

## 🧭 วิธีดึงโค้ดจาก branch `develop` → มาที่ branch ตัวเอง ยกตัวอย่างของ `ploy`

> ✅ ใช้ได้ทั้งใน frontend, backend หรือ project รวม
> (แค่ต้องอยู่ใน repo เดียวกัน)

---

### 🔹 ขั้นตอนละเอียด

#### 1️⃣ เข้าไปในโฟลเดอร์โปรเจกต์

```bash
#อันนี้แล้วแต่ path แต่ละคน
cd C:\Users\ployhp\Desktop\HelloDevops\helloDevops
```

---

#### 2️⃣ ดึงข้อมูลล่าสุดจาก GitHub

```bash
git fetch --all --prune
```

---

#### 3️⃣ สลับไปที่ branch ของตัวเอง (`ploy`)

```bash
git checkout ploy
```

ตรวจสอบให้แน่ใจว่าคุณอยู่ใน branch `ploy` จริง

```bash
git branch
```

จะเห็นเครื่องหมาย `* ploy`

---

#### 4️⃣ ดึงโค้ดจาก branch `develop` เข้ามา

มีให้เลือก 2 วิธี 👇

---

### ✅ วิธีที่ 1 (แนะนำ) — **merge** (รวมแบบเห็นประวัติชัดเจน)

```bash
git merge origin/develop -m "merge: update from develop → ploy"
```

> ✔ โค้ดของ `develop` จะถูกรวมเข้ามาใน `ploy`
> ✔ เหมาะกับทีมที่ต้องการเห็นว่ามีการ merge มาจาก branch ไหน

---

### ⚠️ วิธีที่ 2 — **reset แบบทับทั้งหมด**

> ใช้เฉพาะเมื่ออยากให้ branch `ploy` มีโค้ดเหมือน `develop` ทุกไฟล์ (ทับของเดิมหมด)

```bash
git reset --hard origin/develop
```

> ❗ ระวัง: งานที่ยังไม่ commit ใน branch `ploy` จะถูกลบออกหมด

---

#### 5️⃣ push กลับขึ้น GitHub

```bash
git push origin ploy --force
```

---

### ✅ สรุปคำสั่งแบบย่อ

```bash
cd helloDevops
git fetch --all --prune
git checkout ploy
git merge origin/develop -m "merge: update from develop → ploy"
git push origin ploy
```

หรือถ้าอยากให้เหมือน `develop` เป๊ะ:

```bash
git checkout ploy
git fetch --all --prune
git reset --hard origin/develop
git push origin ploy --force
```

---

### 💡 เคล็ดลับ

* ถ้ามี conflict ให้ใช้ VS Code หรือ GitHub Desktop แก้ไฟล์ที่ขึ้น conflict แล้ว commit ใหม่
* ถ้าจะตรวจสอบว่า merge สำเร็จหรือยัง ใช้:

  ```bash
  git log --oneline --graph --decorate -10
  ```

---




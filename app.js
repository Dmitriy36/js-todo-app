// ── FIREBASE CONFIG ───────────────────────────────────────────────────────────
// Firebase handles authentication (Google sign-in).
// TO REMOVE FIREBASE: delete these config lines, the firebase CDN scripts in
// index.html, and replace the auth section below with your preferred auth.
const firebaseConfig = {
  apiKey: "AIzaSyAFKHwUALHoy3tSsdJKHq7Rn8PpxpYtu6w",
  authDomain: "todo-app-487519.firebaseapp.com",
  projectId: "todo-app-487519",
  storageBucket: "todo-app-487519.firebasestorage.app",
  messagingSenderId: "111792919136",
  appId: "1:111792919136:web:25aea116a101e965cf6905",
};
firebase.initializeApp(firebaseConfig);
const firebaseAuth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// ── SUPABASE CONFIG ───────────────────────────────────────────────────────────
// Supabase is used as the database only — NOT for authentication.
// TO REMOVE SUPABASE: delete these lines, the Supabase CDN in index.html,
// and replace loadTodos/saveTodo/deleteTodoFromDB with your preferred database.
const SUPABASE_URL = "https://bkssvocrrtsrvixsdips.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJrc3N2b2NycnRzcnZpeHNkaXBzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMjExMjAsImV4cCI6MjA4NjY5NzEyMH0.tU-Mhl-GJonpuLcv4oTr2nW0cLO1ggJxEr88oPKDCv4";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ── UI ELEMENTS ───────────────────────────────────────────────────────────────
const loginScreen = document.getElementById("login-screen");
const appDiv = document.getElementById("app");
const logoutButton = document.getElementById("logout-button");
const todoForm = document.querySelector("form");
const todoInput = document.getElementById("todo-input");
const todoListUL = document.getElementById("todo-list");
let allTodos = [];
let currentUser = null;

// ── MATRIX RAIN ───────────────────────────────────────────────────────────────
// Animated Matrix-style falling text in the background.
// Only visible in dark mode.
// TO REMOVE: delete this block and <canvas id="matrix-canvas"> in index.html.
//
// *** EDIT YOUR CUSTOM PHRASES HERE: ***
const MATRIX_PHRASES = [
  "so many tasks...",
  "why did I add this",
  "I'll never finish",
  "oh so many things to do",
  "maybe tomorrow",
  "this won't take long",
  "I'll do it later",
  "how is it still not done",
  "just one more task",
  "send help",
  "prioritize!",
  "focus...",
  "oh no",
];
// *** END OF CUSTOM PHRASES ***

// Classic Matrix katakana and symbols mixed in
const MATRIX_CHARS =
  "アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789@#$%&*";

// *** TUNE MATRIX APPEARANCE HERE ***
const MATRIX_CHAR_SIZE = 42; // character size in pixels — controls font, column width, and trail spacing
const MATRIX_SPEED = 2; // multiplier for fall speed — lower = slower
const MATRIX_CHAR_SPACING = 13.5;
// *** END TUNING ***

const matrixCanvas = document.getElementById("matrix-canvas");
const matrixCtx = matrixCanvas.getContext("2d");
let matrixColumns = [];
let matrixAnimFrame = null;

function initMatrix() {
  matrixCanvas.width = window.innerWidth;
  matrixCanvas.height = window.innerHeight;
  const colWidth = MATRIX_CHAR_SIZE;
  const numCols = Math.floor(matrixCanvas.width / colWidth);
  matrixColumns = Array.from({ length: numCols }, () => ({
    y: Math.random() * -matrixCanvas.height,
    speed: 1 + Math.random() * 2,
    phrase:
      Math.random() > 0.7
        ? MATRIX_PHRASES[Math.floor(Math.random() * MATRIX_PHRASES.length)]
        : null,
    charIndex: 0,
  }));
}

function drawMatrix() {
  matrixCtx.fillStyle = "rgba(0, 0, 0, 0.05)";
  matrixCtx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

  matrixCtx.font = `${MATRIX_CHAR_SIZE}px monospace`;

  matrixColumns.forEach((col, i) => {
    const x = i * MATRIX_CHAR_SIZE;
    let char;

    if (col.phrase) {
      char = col.phrase[col.charIndex % col.phrase.length];
      col.charIndex++;
    } else {
      char = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
    }

    // Bright green for the leading character
    matrixCtx.fillStyle = "#00ff88";
    matrixCtx.fillText(char, x, col.y);

    // Dimmer green for trail
    matrixCtx.fillStyle = "#00aa44";
    matrixCtx.fillText(char, x, col.y - MATRIX_CHAR_SIZE * MATRIX_CHAR_SPACING);

    col.y += col.speed * MATRIX_SPEED;

    if (col.y > matrixCanvas.height) {
      col.y = Math.random() * -200;
      col.speed = 1 + Math.random() * 2;
      col.phrase =
        Math.random() > 0.7
          ? MATRIX_PHRASES[Math.floor(Math.random() * MATRIX_PHRASES.length)]
          : null;
      col.charIndex = 0;
    }
  });

  matrixAnimFrame = requestAnimationFrame(drawMatrix);
}

function startMatrix() {
  if (matrixAnimFrame) return;
  initMatrix();
  drawMatrix();
  matrixCanvas.style.display = "block";
}

function stopMatrix() {
  if (matrixAnimFrame) {
    cancelAnimationFrame(matrixAnimFrame);
    matrixAnimFrame = null;
  }
  matrixCtx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
  matrixCanvas.style.display = "none";
}

// Start or stop based on current theme
function updateMatrix(theme) {
  if (theme === "dark") {
    startMatrix();
  } else {
    stopMatrix();
  }
}

// Re-init on window resize
window.addEventListener("resize", () => {
  if (!document.documentElement.classList.contains("light")) {
    initMatrix();
  }
});

// ── THEME TOGGLE ──────────────────────────────────────────────────────────────
// Toggles between dark (default) and light mode.
// TO REMOVE: delete this block and the #theme-toggle button in index.html.
const themeToggle = document.getElementById("theme-toggle");
const moonIcon = document.getElementById("theme-icon-moon");
const sunIcon = document.getElementById("theme-icon-sun");

function applyTheme(theme) {
  if (theme === "light") {
    document.documentElement.classList.add("light");
    moonIcon.style.display = "none";
    sunIcon.style.display = "block";
  } else {
    document.documentElement.classList.remove("light");
    moonIcon.style.display = "block";
    sunIcon.style.display = "none";
  }
  updateMatrix(theme);
}

// Load saved preference
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const current = document.documentElement.classList.contains("light")
    ? "light"
    : "dark";
  const next = current === "light" ? "dark" : "light";
  localStorage.setItem("theme", next);
  applyTheme(next);
});

// ── AUTH ──────────────────────────────────────────────────────────────────────
// Firebase handles session persistence automatically — no manual getSession needed.
// onAuthStateChanged fires on page load with existing session, and on login/logout.
firebaseAuth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = { id: user.uid, email: user.email };
    showApp();
    await loadTodos();
  } else {
    currentUser = null;
    showLogin();
  }
});

// ── GOOGLE LOGIN ──────────────────────────────────────────────────────────────
document
  .getElementById("google-login-button")
  .addEventListener("click", async () => {
    try {
      await firebaseAuth.signInWithPopup(googleProvider);
    } catch (e) {
      console.error("Google login error:", e);
    }
  });

// ── LOGOUT ────────────────────────────────────────────────────────────────────
logoutButton.addEventListener("click", async () => {
  await firebaseAuth.signOut();
});

// ── SHOW/HIDE ─────────────────────────────────────────────────────────────────
function showApp() {
  loginScreen.classList.add("hidden");
  appDiv.classList.remove("hidden");
}
function showLogin() {
  appDiv.classList.add("hidden");
  loginScreen.classList.remove("hidden");
  allTodos = [];
  todoListUL.innerHTML = "";
}

// ── TODOS ─────────────────────────────────────────────────────────────────────
async function loadTodos() {
  const { data, error } = await supabaseClient
    .from("todos")
    .select("*")
    .eq("firebase_uid", currentUser.id)
    .order("position", { ascending: true });
  if (error) {
    console.error(error);
    return;
  }
  allTodos = data || [];
  updateTodoList();
}

async function saveTodo(todo) {
  const { error } = await supabaseClient.from("todos").upsert({
    id: todo.id,
    user_id: currentUser.id,
    firebase_uid: currentUser.id,
    position: todo.position,
    text: todo.text,
    completed: todo.completed,
    subtasks: todo.subtasks || [],
  });
  if (error) console.error(error);
}

async function deleteTodoFromDB(id) {
  const { error } = await supabaseClient.from("todos").delete().eq("id", id);
  if (error) console.error(error);
}

// ── FORM ──────────────────────────────────────────────────────────────────────
todoForm.addEventListener("submit", (e) => {
  e.preventDefault();
  addTodo();
});

async function addTodo() {
  const todoText = todoInput.value.trim();
  if (todoText.length > 0) {
    const newTodo = {
      id: crypto.randomUUID(),
      firebase_uid: currentUser.id,
      text: todoText,
      completed: false,
      subtasks: [],
      position: allTodos.length,
    };
    allTodos.push(newTodo);
    updateTodoList();
    todoInput.value = "";
    await saveTodo(newTodo);
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────
function updateTodoList() {
  todoListUL.innerHTML = "";
  allTodos.forEach((todo, todoIndex) => {
    const todoItem = createTodoItem(todo, todoIndex);
    todoListUL.append(todoItem);
  });
  initTaskDrag();
}

function createTodoItem(todo, todoIndex) {
  const todoID = "todo-" + todoIndex;
  const todoLI = document.createElement("li");
  todoLI.className = "todo";
  todoLI.dataset.index = todoIndex;

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle";
  dragHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z"/></svg>`;

  const numberLabel = document.createElement("span");
  numberLabel.className = "task-number";
  numberLabel.textContent = todoIndex + 1 + ".";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = todoID;
  checkbox.checked = todo.completed;
  checkbox.addEventListener("change", async () => {
    allTodos[todoIndex].completed = checkbox.checked;
    await saveTodo(allTodos[todoIndex]);
  });

  const customCheckbox = document.createElement("label");
  customCheckbox.htmlFor = todoID;
  customCheckbox.className = "custom-checkbox";
  customCheckbox.innerHTML = `<svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m381-240 424-424-57-56-368 367-169-170-57 57 227 226Zm0 113L42-466l169-170 170 170 366-367 172 168-538 538Z"/></svg>`;

  const textLabel = document.createElement("label");
  textLabel.htmlFor = todoID;
  textLabel.className = "todo-text";
  textLabel.textContent = todo.text;

  const addSubBtn = document.createElement("button");
  addSubBtn.className = "add-sub-button";
  addSubBtn.title = "Add subtask";
  addSubBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="currentColor"><path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z"/></svg>`;

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-button";
  deleteButton.innerHTML = `<svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;

  todoLI.appendChild(dragHandle);
  todoLI.appendChild(numberLabel);
  todoLI.appendChild(checkbox);
  todoLI.appendChild(customCheckbox);
  todoLI.appendChild(textLabel);
  todoLI.appendChild(addSubBtn);
  todoLI.appendChild(deleteButton);

  if (!todo.subtasks) todo.subtasks = [];
  if (todo.subtasks.length > 0) {
    const subList = document.createElement("ul");
    subList.className = "subtask-list";
    subList.dataset.parentIndex = todoIndex;
    todo.subtasks.forEach((sub, subIndex) => {
      const subItem = createSubtaskItem(sub, todoIndex, subIndex);
      subList.appendChild(subItem);
    });
    todoLI.appendChild(subList);
    initSubtaskDrag(subList, todoIndex);
  }

  const subInputRow = document.createElement("div");
  subInputRow.className = "sub-input-row hidden";
  const subInput = document.createElement("input");
  subInput.type = "text";
  subInput.className = "subtask-input";
  subInput.placeholder = "Enter subtask...";
  subInput.autocomplete = "off";
  const subAddBtn = document.createElement("button");
  subAddBtn.className = "sub-add-confirm";
  subAddBtn.textContent = "ADD";
  const subCancelBtn = document.createElement("button");
  subCancelBtn.className = "sub-cancel-btn";
  subCancelBtn.textContent = "✕";
  subInputRow.appendChild(subInput);
  subInputRow.appendChild(subAddBtn);
  subInputRow.appendChild(subCancelBtn);
  todoLI.appendChild(subInputRow);

  addSubBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    subInputRow.classList.toggle("hidden");
    if (!subInputRow.classList.contains("hidden")) subInput.focus();
  });

  async function confirmAddSubtask() {
    const text = subInput.value.trim();
    if (text.length > 0) {
      if (!allTodos[todoIndex].subtasks) allTodos[todoIndex].subtasks = [];
      allTodos[todoIndex].subtasks.push({ text, completed: false });
      await saveTodo(allTodos[todoIndex]);
      updateTodoList();
    } else {
      subInputRow.classList.add("hidden");
    }
  }

  subAddBtn.addEventListener("click", confirmAddSubtask);
  subInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      confirmAddSubtask();
    }
    if (e.key === "Escape") subInputRow.classList.add("hidden");
  });
  subCancelBtn.addEventListener("click", () => {
    subInput.value = "";
    subInputRow.classList.add("hidden");
  });
  deleteButton.addEventListener("click", async () => {
    await deleteTodoFromDB(todo.id);
    allTodos = allTodos.filter((_, i) => i !== todoIndex);
    updateTodoList();
  });

  return todoLI;
}

function createSubtaskItem(sub, parentIndex, subIndex) {
  const subID = "sub-" + parentIndex + "-" + subIndex;
  const subLI = document.createElement("li");
  subLI.className = "subtask";
  subLI.dataset.subIndex = subIndex;
  subLI.dataset.parentIndex = parentIndex;

  const dragHandle = document.createElement("span");
  dragHandle.className = "drag-handle drag-handle--sub";
  dragHandle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="16px" viewBox="0 -960 960 960" width="16px" fill="currentColor"><path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z"/></svg>`;

  const numberLabel = document.createElement("span");
  numberLabel.className = "task-number task-number--sub";
  numberLabel.textContent = subIndex + 1 + ".";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = subID;
  checkbox.checked = sub.completed;
  checkbox.addEventListener("change", async () => {
    allTodos[parentIndex].subtasks[subIndex].completed = checkbox.checked;
    await saveTodo(allTodos[parentIndex]);
  });

  const customCheckbox = document.createElement("label");
  customCheckbox.htmlFor = subID;
  customCheckbox.className = "custom-checkbox custom-checkbox--sub";
  customCheckbox.innerHTML = `<svg fill="transparent" xmlns="http://www.w3.org/2000/svg" height="18px" viewBox="0 -960 960 960" width="18px"><path d="m381-240 424-424-57-56-368 367-169-170-57 57 227 226Zm0 113L42-466l169-170 170 170 366-367 172 168-538 538Z"/></svg>`;

  const textLabel = document.createElement("label");
  textLabel.htmlFor = subID;
  textLabel.className = "todo-text subtask-text";
  textLabel.textContent = sub.text;

  const deleteBtn = document.createElement("button");
  deleteBtn.className = "delete-button delete-button--sub";
  deleteBtn.innerHTML = `<svg fill="var(--secondary-color)" xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px"><path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360ZM280-720v520-520Z"/></svg>`;
  deleteBtn.addEventListener("click", async () => {
    allTodos[parentIndex].subtasks = allTodos[parentIndex].subtasks.filter(
      (_, i) => i !== subIndex,
    );
    await saveTodo(allTodos[parentIndex]);
    updateTodoList();
  });

  subLI.appendChild(dragHandle);
  subLI.appendChild(numberLabel);
  subLI.appendChild(checkbox);
  subLI.appendChild(customCheckbox);
  subLI.appendChild(textLabel);
  subLI.appendChild(deleteBtn);

  return subLI;
}

// ── DRAG AND DROP ─────────────────────────────────────────────────────────────
function initTaskDrag() {
  const items = todoListUL.querySelectorAll(":scope > li.todo");
  items.forEach((item) => setupDraggable(item, todoListUL, "task"));
}

function initSubtaskDrag(subList, parentIndex) {
  const items = subList.querySelectorAll(":scope > li.subtask");
  items.forEach((item) => setupDraggable(item, subList, "subtask"));
}

function setupDraggable(item, container, type) {
  item.setAttribute("draggable", "true");

  item.addEventListener("dragstart", (e) => {
    e.stopPropagation();
    item.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
  });

  item.addEventListener("dragend", () => {
    item.classList.remove("dragging");
    removeDropIndicators();
    commitReorder(container, type);
  });

  container.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
    const dragging = container.querySelector(".dragging");
    if (!dragging) return;
    const target = getDragTarget(e.clientY, container, type);
    removeDropIndicators();
    if (target) target.classList.add("drag-over");
  });

  container.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const dragging = container.querySelector(".dragging");
    if (!dragging) return;
    const target = getDragTarget(e.clientY, container, type);
    removeDropIndicators();
    if (target && target !== dragging) {
      const items = [
        ...container.querySelectorAll(
          type === "task" ? ":scope > li.todo" : ":scope > li.subtask",
        ),
      ];
      const fromIdx = items.indexOf(dragging);
      const toIdx = items.indexOf(target);
      if (fromIdx < toIdx) {
        container.insertBefore(dragging, target.nextSibling);
      } else {
        container.insertBefore(dragging, target);
      }
    }
  });

  let touchClone = null;
  let touchOffsetX = 0;
  let touchOffsetY = 0;

  item.addEventListener(
    "touchstart",
    (e) => {
      if (!e.target.closest(".drag-handle")) return;
      e.stopPropagation();
      const touch = e.touches[0];
      const rect = item.getBoundingClientRect();
      touchOffsetX = touch.clientX - rect.left;
      touchOffsetY = touch.clientY - rect.top;
      item.classList.add("dragging");
      touchClone = item.cloneNode(true);
      touchClone.classList.add("touch-drag-clone");
      touchClone.style.width = rect.width + "px";
      touchClone.style.left = touch.clientX - touchOffsetX + "px";
      touchClone.style.top =
        touch.clientY - touchOffsetY + window.scrollY + "px";
      document.body.appendChild(touchClone);
    },
    { passive: true },
  );

  item.addEventListener(
    "touchmove",
    (e) => {
      if (!touchClone) return;
      e.preventDefault();
      const touch = e.touches[0];
      touchClone.style.left = touch.clientX - touchOffsetX + "px";
      touchClone.style.top =
        touch.clientY - touchOffsetY + window.scrollY + "px";
      removeDropIndicators();
      const target = getDragTarget(touch.clientY, container, type);
      if (target && target !== item) target.classList.add("drag-over");
    },
    { passive: false },
  );

  item.addEventListener("touchend", (e) => {
    if (!touchClone) return;
    const touch = e.changedTouches[0];
    removeDropIndicators();
    const target = getDragTarget(touch.clientY, container, type);
    if (target && target !== item) {
      const items = [
        ...container.querySelectorAll(
          type === "task" ? ":scope > li.todo" : ":scope > li.subtask",
        ),
      ];
      const fromIdx = items.indexOf(item);
      const toIdx = items.indexOf(target);
      if (fromIdx < toIdx) {
        container.insertBefore(item, target.nextSibling);
      } else {
        container.insertBefore(item, target);
      }
    }
    item.classList.remove("dragging");
    touchClone.remove();
    touchClone = null;
    commitReorder(container, type);
  });
}

function getDragTarget(clientY, container, type) {
  const selector =
    type === "task"
      ? ":scope > li.todo:not(.dragging)"
      : ":scope > li.subtask:not(.dragging)";
  const items = [...container.querySelectorAll(selector)];
  return (
    items.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const midpoint = box.top + box.height / 2;
      const offset = clientY - midpoint;
      if (offset < 0 && offset > (closest.offset ?? -Infinity)) {
        return { offset, element: child };
      }
      return closest;
    }, {}).element || items[items.length - 1]
  );
}

function removeDropIndicators() {
  document
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
}

async function commitReorder(container, type) {
  if (type === "task") {
    const newOrder = [...container.querySelectorAll(":scope > li.todo")].map(
      (li) => {
        return allTodos[parseInt(li.dataset.index)];
      },
    );
    allTodos = newOrder;
    const updates = allTodos.map((todo, i) => {
      todo.position = i;
      return saveTodo(todo);
    });
    await Promise.all(updates);
    updateTodoList();
  } else {
    const parentIndex = parseInt(container.dataset.parentIndex);
    const newOrder = [...container.querySelectorAll(":scope > li.subtask")].map(
      (li) => {
        return allTodos[parentIndex].subtasks[parseInt(li.dataset.subIndex)];
      },
    );
    allTodos[parentIndex].subtasks = newOrder;
    await saveTodo(allTodos[parentIndex]);
    updateTodoList();
  }
}

/*
 * SERVICE WORKER REGISTRATION — Part of PWA setup.
 * Makes the app installable on phone home screens.
 * TO REMOVE: delete this block, sw.js, manifest.json,
 * and the <link rel="manifest"> line in index.html.
 */
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(() => console.log("Service worker registered"))
      .catch((e) => console.log("Service worker registration failed:", e));
  });
}

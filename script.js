/* =====================================================
   StudyBuddy - script.js
   How it works:
   1. "tasks" is a list (array) that holds every task.
   2. Whenever the list changes, we call render() to
      redraw the page from that list.
   3. Small functions handle each action: add, tick, delete.
   ===================================================== */

// ---------- 1. DATA ----------
// Each task is an object: { id, title, priority, completed }
// priority is "low", "medium" or "high".
const sampleTasks = [
  { id: 1, title: "Finish chemistry homework", priority: "high", completed: false },
  { id: 2, title: "Revise algebra for Friday's test", priority: "high", completed: false },
  { id: 3, title: "Read chapter 4 of Things Fall Apart", priority: "medium", completed: false },
  { id: 4, title: "Prepare computer studies presentation", priority: "medium", completed: false },
  { id: 5, title: "Tidy up Basic Science notes", priority: "low", completed: false },
  { id: 6, title: "Submit English Language essay", priority: "medium", completed: true },
  { id: 7, title: "Practise typing for 15 minutes", priority: "low", completed: true },
  { id: 8, title: "Return library book", priority: "low", completed: true }
];

const STORAGE_KEY = "studybuddy-tasks";

let tasks = loadTasks();           // the current list of tasks
let nextId = findNextId();         // the id the next new task will get
let currentFilter = "all";         // "all", "pending" or "completed"
let searchText = "";               // what is typed in the search box

// ---------- 2. FIND THE HTML ELEMENTS WE NEED ----------
const todayDate = document.getElementById("today-date");

const totalCount = document.getElementById("total-count");
const pendingCount = document.getElementById("pending-count");
const completedCount = document.getElementById("completed-count");
const filterAllCount = document.getElementById("filter-all-count");
const filterPendingCount = document.getElementById("filter-pending-count");
const filterCompletedCount = document.getElementById("filter-completed-count");

const taskForm = document.getElementById("task-form");
const titleInput = document.getElementById("task-title");
const titleError = document.getElementById("title-error");
const titleHint = document.getElementById("title-hint");
const priorityInput = document.getElementById("task-priority");

const searchInput = document.getElementById("search-input");
const filterButtons = document.querySelectorAll(".filter-button");
const taskList = document.getElementById("task-list");
const emptyState = document.getElementById("empty-state");
const emptyTitle = document.getElementById("empty-title");
const emptyText = document.getElementById("empty-text");

// A small trash-can picture used on every delete button
const trashIcon =
  '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"></path></svg>';

// ---------- 3. SAVING AND LOADING ----------
// localStorage keeps the tasks in the browser so they are still
// there after the page is refreshed. (It never leaves this computer.)

function loadTasks() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const list = JSON.parse(saved);
      if (Array.isArray(list)) {
        return list;
      }
    }
  } catch (error) {
    // If storage is blocked, just use the sample tasks
  }
  return sampleTasks.slice();
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    // If saving fails the app still works, it just will not remember
  }
}

// Finds the biggest id in the list and adds 1
function findNextId() {
  let biggest = 0;
  tasks.forEach(function (task) {
    if (task.id > biggest) {
      biggest = task.id;
    }
  });
  return biggest + 1;
}

// ---------- 4. DRAWING THE PAGE ----------

// Works out which tasks to show, based on the filter and the search box.
function getVisibleTasks() {
  return tasks.filter(function (task) {
    const matchesFilter =
      currentFilter === "all" ||
      (currentFilter === "pending" && !task.completed) ||
      (currentFilter === "completed" && task.completed);

    const matchesSearch = task.title.toLowerCase().includes(searchText.toLowerCase());

    return matchesFilter && matchesSearch;
  });
}

// Updates the three summary cards and the numbers on the filter buttons.
function updateCounts() {
  const total = tasks.length;
  let completed = 0;
  tasks.forEach(function (task) {
    if (task.completed) {
      completed++;
    }
  });
  const pending = total - completed;

  totalCount.textContent = total;
  pendingCount.textContent = pending;
  completedCount.textContent = completed;
  filterAllCount.textContent = total;
  filterPendingCount.textContent = pending;
  filterCompletedCount.textContent = completed;
}

// Builds one task row (an <li>) for a single task.
function createTaskItem(task) {
  const item = document.createElement("li");
  item.className = "task-item";
  if (task.completed) {
    item.classList.add("is-completed");
  }

  // Checkbox: ticking it marks the task as done
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.className = "task-checkbox";
  checkbox.checked = task.completed;
  checkbox.setAttribute("aria-label", "Mark as completed: " + task.title);
  checkbox.addEventListener("change", function () {
    toggleTask(task.id);
  });

  // Title and priority label
  const main = document.createElement("div");
  main.className = "task-main";

  const title = document.createElement("span");
  title.className = "task-title";
  title.textContent = task.title;       // textContent is safe for text typed by users

  const pill = document.createElement("span");
  pill.className = "priority-pill priority-" + task.priority;
  pill.textContent = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);

  main.appendChild(title);
  main.appendChild(pill);

  // Delete button
  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-button";
  deleteButton.setAttribute("aria-label", "Delete task: " + task.title);
  deleteButton.innerHTML = trashIcon;
  deleteButton.addEventListener("click", function () {
    deleteTask(task.id);
  });

  item.appendChild(checkbox);
  item.appendChild(main);
  item.appendChild(deleteButton);
  return item;
}

// Redraws the whole task list. Call this after anything changes.
function render() {
  updateCounts();

  const visibleTasks = getVisibleTasks();
  taskList.innerHTML = "";

  visibleTasks.forEach(function (task) {
    taskList.appendChild(createTaskItem(task));
  });

  // Show the empty state when there is nothing to display
  if (visibleTasks.length === 0) {
    emptyState.hidden = false;

    if (tasks.length === 0) {
      emptyTitle.textContent = "No tasks yet";
      emptyText.textContent = "Add your first task and it will show up here.";
    } else if (searchText !== "") {
      emptyTitle.textContent = "No tasks match your search";
      emptyText.textContent = "Try a different word.";
    } else if (currentFilter === "completed") {
      emptyTitle.textContent = "Nothing completed yet";
      emptyText.textContent = "Tick a task to see it here.";
    } else {
      emptyTitle.textContent = "All caught up";
      emptyText.textContent = "You have no pending tasks. Great work!";
    }
  } else {
    emptyState.hidden = true;
  }
}

// ---------- 5. ACTIONS ----------

// Adds a new task if the title is not empty.
function addTask(event) {
  event.preventDefault();                       // stop the page reloading
  const title = titleInput.value.trim();        // trim() removes extra spaces

  // Validation: a title is required
  if (title === "") {
    showTitleError();
    return;
  }

  tasks.unshift({
    id: nextId,
    title: title,
    priority: priorityInput.value,
    completed: false
  });
  nextId++;

  saveTasks();
  clearTitleError();
  taskForm.reset();                             // empties the form
  titleInput.focus();

  // Make sure the new task is visible even if a filter is active
  currentFilter = "all";
  searchText = "";
  searchInput.value = "";
  updateFilterButtons();
  render();
}

// Switches a task between pending and completed.
function toggleTask(id) {
  tasks.forEach(function (task) {
    if (task.id === id) {
      task.completed = !task.completed;
    }
  });
  saveTasks();
  render();
}

// Removes a task from the list.
function deleteTask(id) {
  tasks = tasks.filter(function (task) {
    return task.id !== id;
  });
  saveTasks();
  render();
}

// Shows the red error under the title box.
function showTitleError() {
  titleError.hidden = false;
  titleHint.hidden = true;
  titleInput.classList.add("has-error");
  titleInput.setAttribute("aria-invalid", "true");
  titleInput.focus();
}

// Hides the error again.
function clearTitleError() {
  titleError.hidden = true;
  titleHint.hidden = false;
  titleInput.classList.remove("has-error");
  titleInput.removeAttribute("aria-invalid");
}

// Highlights the filter button that matches currentFilter.
function updateFilterButtons() {
  filterButtons.forEach(function (button) {
    if (button.dataset.filter === currentFilter) {
      button.classList.add("is-active");
    } else {
      button.classList.remove("is-active");
    }
  });
}

// ---------- 6. CONNECT EVERYTHING ----------
taskForm.addEventListener("submit", addTask);

// Remove the error as soon as the student starts typing
titleInput.addEventListener("input", clearTitleError);

// Search box: redraw on every key press
searchInput.addEventListener("input", function () {
  searchText = searchInput.value;
  render();
});

// Filter buttons
filterButtons.forEach(function (button) {
  button.addEventListener("click", function () {
    currentFilter = button.dataset.filter;
    updateFilterButtons();
    render();
  });
});

// Show today's date in the top bar
todayDate.textContent = new Date().toLocaleDateString("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long"
});

// Draw the page for the first time
render();

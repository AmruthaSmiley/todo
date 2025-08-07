// DOM Elements
const taskInput = document.getElementById('task-input');
const prioritySelect = document.getElementById('priority-select');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const filterBtns = document.querySelectorAll('.filter-btn');
const sortSelect = document.getElementById('sort-select');
const tasksCounter = document.getElementById('tasks-counter');
const clearCompletedBtn = document.getElementById('clear-completed');
const taskTemplate = document.getElementById('task-template');
const editModal = document.getElementById('edit-modal');
const closeModal = document.querySelector('.close-modal');
const editTaskInput = document.getElementById('edit-task-input');
const editPrioritySelect = document.getElementById('edit-priority-select');
const saveEditBtn = document.getElementById('save-edit-btn');

// App State
let tasks = [];
let currentFilter = 'all';
let currentSort = 'date-added';
let editingTaskId = null;

// Initialize App
function initApp() {
    loadTasksFromLocalStorage();
    renderTasks();
    updateTasksCounter();
    
    // Event Listeners
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTask();
    });
    
    taskList.addEventListener('click', handleTaskActions);
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            setFilter(btn.dataset.filter);
        });
    });
    
    sortSelect.addEventListener('change', () => {
        setSort(sortSelect.value);
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    // Modal Events
    closeModal.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveTaskEdit);
    window.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
}

// Task Operations
function addTask() {
    const taskText = taskInput.value.trim();
    if (taskText === '') return;
    
    const newTask = {
        id: Date.now().toString(),
        text: taskText,
        completed: false,
        priority: prioritySelect.value,
        date: new Date()
    };
    
    tasks.push(newTask);
    saveTasksToLocalStorage();
    renderTasks();
    updateTasksCounter();
    
    // Reset input
    taskInput.value = '';
    taskInput.focus();
}

function toggleTaskCompletion(taskId) {
    tasks = tasks.map(task => {
        if (task.id === taskId) {
            return { ...task, completed: !task.completed };
        }
        return task;
    });
    
    saveTasksToLocalStorage();
    renderTasks();
    updateTasksCounter();
}

function deleteTask(taskId) {
    tasks = tasks.filter(task => task.id !== taskId);
    saveTasksToLocalStorage();
    renderTasks();
    updateTasksCounter();
}

function editTask(taskId) {
    const task = tasks.find(task => task.id === taskId);
    if (!task) return;
    
    editingTaskId = taskId;
    editTaskInput.value = task.text;
    editPrioritySelect.value = task.priority;
    
    // Show modal
    editModal.style.display = 'flex';
    editTaskInput.focus();
}

function saveTaskEdit() {
    if (!editingTaskId) return;
    
    const editedText = editTaskInput.value.trim();
    if (editedText === '') return;
    
    tasks = tasks.map(task => {
        if (task.id === editingTaskId) {
            return {
                ...task,
                text: editedText,
                priority: editPrioritySelect.value
            };
        }
        return task;
    });
    
    saveTasksToLocalStorage();
    renderTasks();
    closeEditModal();
}

function clearCompletedTasks() {
    tasks = tasks.filter(task => !task.completed);
    saveTasksToLocalStorage();
    renderTasks();
    updateTasksCounter();
}

// Filtering and Sorting
function setFilter(filter) {
    currentFilter = filter;
    
    // Update active filter button
    filterBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.filter === filter);
    });
    
    renderTasks();
}

function setSort(sort) {
    currentSort = sort;
    renderTasks();
}

function getFilteredTasks() {
    return tasks.filter(task => {
        if (currentFilter === 'all') return true;
        if (currentFilter === 'active') return !task.completed;
        if (currentFilter === 'completed') return task.completed;
        return true;
    });
}

function getSortedTasks(filteredTasks) {
    return [...filteredTasks].sort((a, b) => {
        if (currentSort === 'date-added') {
            return new Date(b.date) - new Date(a.date); // Newest first
        }
        if (currentSort === 'alphabetical') {
            return a.text.localeCompare(b.text);
        }
        if (currentSort === 'priority') {
            const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return 0;
    });
}

// UI Updates
function renderTasks() {
    // Clear current list
    taskList.innerHTML = '';
    
    const filteredTasks = getFilteredTasks();
    const sortedTasks = getSortedTasks(filteredTasks);
    
    if (sortedTasks.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.className = 'task-item empty-message';
        emptyMessage.textContent = 'No tasks to display';
        taskList.appendChild(emptyMessage);
        return;
    }
    
    sortedTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        taskList.appendChild(taskElement);
    });
}

function createTaskElement(task) {
    const taskClone = document.importNode(taskTemplate.content, true);
    const taskItem = taskClone.querySelector('.task-item');
    
    // Set task data
    taskItem.dataset.id = task.id;
    if (task.completed) taskItem.classList.add('completed');
    
    // Set task content
    const checkbox = taskItem.querySelector('.task-checkbox');
    checkbox.checked = task.completed;
    
    const taskText = taskItem.querySelector('.task-text');
    taskText.textContent = task.text;
    
    const priorityBadge = taskItem.querySelector('.priority-badge');
    priorityBadge.textContent = task.priority;
    priorityBadge.classList.add(`priority-${task.priority}`);
    
    const taskDate = taskItem.querySelector('.task-date');
    taskDate.textContent = formatDate(task.date);
    
    return taskItem;
}

function updateTasksCounter() {
    const activeTasks = tasks.filter(task => !task.completed).length;
    tasksCounter.textContent = `${activeTasks} task${activeTasks !== 1 ? 's' : ''} left`;
}

function closeEditModal() {
    editModal.style.display = 'none';
    editingTaskId = null;
}

// Event Handlers
function handleTaskActions(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem) return;
    
    const taskId = taskItem.dataset.id;
    
    if (e.target.classList.contains('task-checkbox')) {
        toggleTaskCompletion(taskId);
    } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        deleteTask(taskId);
    } else if (e.target.classList.contains('edit-btn') || e.target.closest('.edit-btn')) {
        editTask(taskId);
    }
}

// Utilities
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Local Storage
function saveTasksToLocalStorage() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function loadTasksFromLocalStorage() {
    const storedTasks = localStorage.getItem('tasks');
    if (storedTasks) {
        tasks = JSON.parse(storedTasks);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
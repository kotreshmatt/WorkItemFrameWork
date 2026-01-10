// Application State
const app = {
    currentUser: null,
    workItems: [],
    currentFilter: 'all',
    gatewayClient: new GatewayClient(),
    workflowClient: new WorkflowClient(),
    selectedWorkItem: null
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const savedUser = sessionStorage.getItem('username');
    if (savedUser) {
        app.currentUser = savedUser;
        showWorklistScreen();
    }

    setupEventListeners();
});

function setupEventListeners() {
    const loginBtn = document.getElementById('loginBtn');
  if (!loginBtn) {
    console.error('[UI] loginBtn not found in DOM');
    return;
  }
    // Login
    loginBtn.addEventListener('click', handleLogin);
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('usernameInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Actions
    document.getElementById('createWorkflowBtn').addEventListener('click', handleCreateWorkflow);
    document.getElementById('refreshBtn').addEventListener('click', loadWorkItems);

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            app.currentFilter = e.target.dataset.filter;
            renderWorkItems();
        });
    });

    // Complete Dialog
    document.getElementById('closeCompleteDialog').addEventListener('click', closeCompleteDialog);
    document.getElementById('cancelCompleteBtn').addEventListener('click', closeCompleteDialog);
    document.getElementById('submitCompleteBtn').addEventListener('click', handleComplete);
}

// Login/Logout
function handleLogin() {
    const username = document.getElementById('usernameInput').value.trim();
    if (!username) {
        showToast('Please enter a username', 'error');
        return;
    }

    app.currentUser = username;
    sessionStorage.setItem('username', username);
    showWorklistScreen();
}

function handleLogout() {
    app.currentUser = null;
    sessionStorage.removeItem('username');
    showLoginScreen();
}

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'block';
    document.getElementById('worklistScreen').style.display = 'none';
    document.getElementById('usernameInput').value = '';
}

function showWorklistScreen() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('worklistScreen').style.display = 'block';
    document.getElementById('username').textContent = app.currentUser;
    loadWorkItems();
}

// Work Items
async function loadWorkItems() {
    const container = document.getElementById('worklistContainer');
    container.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading work items...</p></div>';

    try {
        const response = await app.gatewayClient.getWorkItemsByUser(app.currentUser);
        app.workItems = response.workItems || [];
        renderWorkItems();
    } catch (error) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">⚠️</div>
                <h3>Error Loading Work Items</h3>
                <p>${error.message}</p>
            </div>
        `;
    }
}

function renderWorkItems() {
    const container = document.getElementById('worklistContainer');

    // Filter work items
    let filtered = app.workItems;
    if (app.currentFilter !== 'all') {
        filtered = app.workItems.filter(wi => wi.state === app.currentFilter);
    }

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📋</div>
                <h3>No Work Items Found</h3>
                <p>No work items in your view or offered to you.</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filtered.map(wi => createWorkItemCard(wi)).join('');

    // Attach event listeners
    attachCardEventListeners();
}

function createWorkItemCard(workItem) {
    const actions = getActionsForState(workItem.state, workItem.workitem_id);

    return `
        <div class="workitem-card">
            <div class="workitem-header">
                <div>
                    <div class="workitem-title">${workItem.task_name || 'Work Item'}</div>
                    <div class="workitem-id">ID: ${workItem.workitem_id}</div>
                </div>
                <span class="state-badge state-${workItem.state}">${workItem.state}</span>
            </div>
            <div class="workitem-details">
                <div class="detail-item">
                    <span>🔥</span>
                    <span>Priority: ${workItem.priority || 'N/A'}</span>
                </div>
                <div class="detail-item">
                    <span>📝</span>
                    <span>${workItem.task_type || 'Task'}</span>
                </div>
                <div class="detail-item">
                    <span>🔄</span>
                    <span>Workflow: ${workItem.workflow_id || 'N/A'}</span>
                </div>
            </div>
            <div class="workitem-actions">
                ${actions}
            </div>
        </div>
    `;
}

function getActionsForState(state, workItemId) {
    if (state === 'OFFERED') {
        return `<button class="open-btn" data-action="open" data-id="${workItemId}">Open</button>`;
    } else if (state === 'CLAIMED') {
        return `
            <button class="complete-btn" data-action="complete" data-id="${workItemId}">Complete</button>
            <button class="cancel-btn" data-action="cancel" data-id="${workItemId}">Cancel</button>
        `;
    } else {
        return '<span style="color: #999;">No actions available</span>';
    }
}

function attachCardEventListeners() {
    document.querySelectorAll('[data-action="open"]').forEach(btn => {
        btn.addEventListener('click', (e) => handleOpen(e.target.dataset.id));
    });
    document.querySelectorAll('[data-action="complete"]').forEach(btn => {
        btn.addEventListener('click', (e) => showCompleteDialog(e.target.dataset.id));
    });
    document.querySelectorAll('[data-action="cancel"]').forEach(btn => {
        btn.addEventListener('click', (e) => handleCancel(e.target.dataset.id));
    });
}

// Actions
async function handleOpen(workItemId) {
    const workItem = app.workItems.find(wi => wi.workitem_id == workItemId);
    if (!workItem) return;

    try {
        showToast('Claiming work item...', 'success');

        await app.gatewayClient.claimWorkItem(
            workItemId,
            app.currentUser,
            workItem.workflow_id || 'exception-handling-wf-unknown'
        );

        showToast('Work item claimed successfully!', 'success');
        loadWorkItems();
    } catch (error) {
        showToast(`Failed to claim: ${error.message}`, 'error');
    }
}

function showCompleteDialog(workItemId) {
    app.selectedWorkItem = app.workItems.find(wi => wi.workitem_id == workItemId);
    if (!app.selectedWorkItem) return;

    // Reset form
    document.getElementById('retryParam').value = 'false';
    document.getElementById('commentsParam').value = '';
    document.getElementById('skipErrorParam').value = 'false';

    document.getElementById('completeDialog').style.display = 'flex';
}

function closeCompleteDialog() {
    document.getElementById('completeDialog').style.display = 'none';
    app.selectedWorkItem = null;
}

async function handleComplete() {
    if (!app.selectedWorkItem) return;

    const output = [
        {
            name: 'retry',
            value: document.getElementById('retryParam').value === 'true'
        },
        {
            name: 'comments',
            value: document.getElementById('commentsParam').value
        },
        {
            name: 'skipError',
            value: document.getElementById('skipErrorParam').value === 'true'
        }
    ];

    try {
        closeCompleteDialog();
        showToast('Completing work item...', 'success');

        await app.gatewayClient.completeWorkItem(
            app.selectedWorkItem.workitem_id,
            app.currentUser,
            app.selectedWorkItem.workflow_id || 'exception-handling-wf-unknown',
            output
        );

        showToast('Work item completed successfully!', 'success');
        loadWorkItems();
    } catch (error) {
        showToast(`Failed to complete: ${error.message}`, 'error');
    }
}

async function handleCancel(workItemId) {
    const workItem = app.workItems.find(wi => wi.workitem_id == workItemId);
    if (!workItem) return;

    const reason = prompt('Enter cancellation reason:');
    if (!reason) return;

    try {
        showToast('Canceling work item...', 'success');

        await app.gatewayClient.cancelWorkItem(
            workItemId,
            app.currentUser,
            workItem.workflow_id || 'exception-handling-wf-unknown',
            reason
        );

        showToast('Work item canceled successfully!', 'success');
        loadWorkItems();
    } catch (error) {
        showToast(`Failed to cancel: ${error.message}`, 'error');
    }
}

// Workflow Creation
async function handleCreateWorkflow() {
    try {
        showToast('Creating workflow...', 'success');

        const caseId = `CASE-${Date.now()}`;

        // Call the workflow start script directly via Node.js
        // For demo, we'll use fetch to a new Gateway endpoint
        const response = await fetch('http://localhost:3001/start-workflow', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ caseId })
        });

        if (!response.ok) throw new Error('Failed to start workflow');

        const result = await response.json();

        showToast(`Workflow created! Case ID: ${caseId}`, 'success');

        // Refresh work items after a short delay
        setTimeout(() => loadWorkItems(), 2000);
    } catch (error) {
        showToast(`Failed to create workflow: ${error.message}`, 'error');
    }
}

// Toast Notifications
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = type === 'success' ? '✅' : '❌';

    toast.innerHTML = `
        <span class="toast-icon">${icon}</span>
        <span class="toast-message">${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

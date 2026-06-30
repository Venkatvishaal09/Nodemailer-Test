/* ═══════════════════════════════════════════════════════════
   Nodemailer Test — Frontend Application Logic
   ═══════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  // ─── DOM references ────────────────────────────────────
  const sidebar       = document.getElementById("sidebar");
  const menuToggle    = document.getElementById("menu-toggle");
  const navItems      = document.querySelectorAll(".nav-item");
  const views         = document.querySelectorAll(".view");
  const pageTitle     = document.getElementById("page-title");

  const composeForm   = document.getElementById("composeForm");
  const recipientsEl  = document.getElementById("recipients");
  const subjectEl     = document.getElementById("subject");
  const senderNameEl  = document.getElementById("senderName");
  const replyToEl     = document.getElementById("replyTo");
  const editorEl      = document.getElementById("editor");
  const htmlSourceEl  = document.getElementById("html-source");
  const toggleHtmlEl  = document.getElementById("toggle-html");
  const attachmentEl  = document.getElementById("attachment");
  const fileDropZone  = document.getElementById("file-drop-zone");
  const attachedFile  = document.getElementById("attached-file");
  const attachedFileName = document.getElementById("attached-file-name");
  const btnRemoveFile = document.getElementById("btn-remove-file");
  const recipientCountEl = document.getElementById("recipient-count");
  const btnImportCsv  = document.getElementById("btn-import-csv");
  const csvFileInput  = document.getElementById("csv-file-input");
  const btnPreview    = document.getElementById("btn-preview");
  const btnSend       = document.getElementById("btn-send");
  const statusBody    = document.getElementById("send-status-body");

  const quotaCountEl  = document.getElementById("quota-count");
  const quotaFillEl   = document.getElementById("quota-fill");
  const connectionBadge = document.getElementById("connection-badge");

  // History
  const historyList   = document.getElementById("history-list");
  const btnClearHist  = document.getElementById("btn-clear-history");

  // Contacts
  const contactsList  = document.getElementById("contacts-list");
  const contactSearch = document.getElementById("contacts-search-input");
  const btnAddContact = document.getElementById("btn-add-contact");
  const btnExportContacts = document.getElementById("btn-export-contacts");

  // Modals
  const modalPreview  = document.getElementById("modal-preview");
  const previewTo     = document.getElementById("preview-to");
  const previewSubject = document.getElementById("preview-subject");
  const previewFrom   = document.getElementById("preview-from");
  const previewBody   = document.getElementById("preview-body");

  const modalAddContact = document.getElementById("modal-add-contact");
  const contactNameEl = document.getElementById("contact-name");
  const contactEmailEl = document.getElementById("contact-email");

  // Toast
  const toastContainer = document.getElementById("toast-container");

  // ─── State ─────────────────────────────────────────────
  let sentCount = 0;
  const maxQuota = 500;
  let contacts = JSON.parse(localStorage.getItem("mp_contacts") || "[]");
  let history = JSON.parse(localStorage.getItem("mp_history") || "[]");

  // ─── Navigation ────────────────────────────────────────
  const titles = {
    compose: "Compose Campaign",
    history: "Sent History",
    contacts: "Contacts",
  };

  function switchView(viewName) {
    navItems.forEach((item) => {
      item.classList.toggle("active", item.dataset.view === viewName);
    });
    views.forEach((v) => {
      v.classList.toggle("active", v.id === "view-" + viewName);
    });
    pageTitle.textContent = titles[viewName] || "Nodemailer Test";
    sidebar.classList.remove("open");
  }

  navItems.forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      switchView(item.dataset.view);
    });
  });

  menuToggle.addEventListener("click", () => {
    sidebar.classList.toggle("open");
  });

  // ─── Recipient counter ─────────────────────────────────
  function parseRecipients(text) {
    return text
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
  }

  recipientsEl.addEventListener("input", () => {
    const emails = parseRecipients(recipientsEl.value);
    recipientCountEl.textContent =
      emails.length + (emails.length === 1 ? " recipient" : " recipients");
  });

  // ─── CSV Import ────────────────────────────────────────
  btnImportCsv.addEventListener("click", () => csvFileInput.click());

  csvFileInput.addEventListener("change", () => {
    const file = csvFileInput.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const lines = e.target.result.split(/\r?\n/);
      const emails = [];
      lines.forEach((line) => {
        // Try to extract emails from each line
        const parts = line.split(/[,;\t]+/);
        parts.forEach((part) => {
          const trimmed = part.trim().replace(/^["']|["']$/g, "");
          if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
            emails.push(trimmed);
          }
        });
      });
      if (emails.length) {
        const current = recipientsEl.value.trim();
        recipientsEl.value = current
          ? current + "\n" + emails.join("\n")
          : emails.join("\n");
        recipientsEl.dispatchEvent(new Event("input"));
        showToast("success", `Imported ${emails.length} email(s) from CSV`);
      } else {
        showToast("error", "No valid email addresses found in file");
      }
      csvFileInput.value = "";
    };
    reader.readAsText(file);
  });

  // ─── Rich editor toolbar ───────────────────────────────
  document.querySelectorAll(".toolbar-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const cmd = btn.dataset.cmd;
      if (!cmd) return;
      if (cmd === "createLink") {
        const url = prompt("Enter URL:");
        if (url) document.execCommand(cmd, false, url);
      } else {
        document.execCommand(cmd, false, null);
      }
      editorEl.focus();
    });
  });

  // Toggle HTML source
  toggleHtmlEl.addEventListener("change", () => {
    if (toggleHtmlEl.checked) {
      htmlSourceEl.value = editorEl.innerHTML;
      editorEl.style.display = "none";
      htmlSourceEl.style.display = "block";
    } else {
      editorEl.innerHTML = htmlSourceEl.value;
      htmlSourceEl.style.display = "none";
      editorEl.style.display = "block";
    }
  });

  // ─── File attachment ───────────────────────────────────
  attachmentEl.addEventListener("change", () => {
    if (attachmentEl.files.length) {
      const f = attachmentEl.files[0];
      if (f.size > 5 * 1024 * 1024) {
        showToast("error", "File size exceeds 5 MB limit");
        attachmentEl.value = "";
        return;
      }
      attachedFileName.textContent = f.name + " (" + formatBytes(f.size) + ")";
      attachedFile.style.display = "flex";
      fileDropZone.style.display = "none";
    }
  });

  btnRemoveFile.addEventListener("click", () => {
    attachmentEl.value = "";
    attachedFile.style.display = "none";
    fileDropZone.style.display = "flex";
  });

  // ─── Preview ───────────────────────────────────────────
  btnPreview.addEventListener("click", () => {
    const emails = parseRecipients(recipientsEl.value);
    previewTo.textContent = emails.length
      ? emails.slice(0, 3).join(", ") +
        (emails.length > 3 ? ` (+${emails.length - 3} more)` : "")
      : "(no recipients)";
    previewSubject.textContent = subjectEl.value || "(no subject)";
    previewFrom.textContent = senderNameEl.value || "Default Sender";
    previewBody.innerHTML = toggleHtmlEl.checked
      ? htmlSourceEl.value
      : editorEl.innerHTML;
    modalPreview.style.display = "flex";
  });

  document.getElementById("btn-close-preview").addEventListener("click", () => {
    modalPreview.style.display = "none";
  });
  document.getElementById("btn-close-preview-2").addEventListener("click", () => {
    modalPreview.style.display = "none";
  });

  document.getElementById("btn-send-from-preview").addEventListener("click", () => {
    modalPreview.style.display = "none";
    submitForm();
  });

  modalPreview.addEventListener("click", (e) => {
    if (e.target === modalPreview) modalPreview.style.display = "none";
  });

  // ─── Send form ─────────────────────────────────────────
  composeForm.addEventListener("submit", (e) => {
    e.preventDefault();
    submitForm();
  });

  async function submitForm() {
    const emails = parseRecipients(recipientsEl.value);
    const subject = subjectEl.value.trim();
    const messageBody = toggleHtmlEl.checked
      ? htmlSourceEl.value
      : editorEl.innerHTML;
    const senderName = senderNameEl.value.trim();
    const replyTo = replyToEl.value.trim();

    if (!emails.length) {
      showToast("error", "Please add at least one valid recipient");
      return;
    }
    if (!subject) {
      showToast("error", "Subject line is required");
      return;
    }
    if (!messageBody || messageBody === "<br>" || messageBody === "<div><br></div>") {
      showToast("error", "Message body cannot be empty");
      return;
    }

    // Show progress UI
    btnSend.classList.add("sending");
    btnSend.querySelector(".material-icons-outlined").textContent = "autorenew";
    btnSend.querySelector(".material-icons-outlined").nextSibling.textContent =
      " Sending...";

    let successCount = 0;
    let failCount = 0;
    const logEntries = [];

    // Build status panel
    statusBody.innerHTML = `
      <div class="send-progress">
        <div class="progress-header">
          <span>Progress</span>
          <span id="progress-text">0 / ${emails.length}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" id="progress-fill"></div>
        </div>
      </div>
      <div class="send-stats">
        <div class="stat-card">
          <div class="stat-value" id="stat-total">${emails.length}</div>
          <div class="stat-label">Total</div>
        </div>
        <div class="stat-card success">
          <div class="stat-value" id="stat-success">0</div>
          <div class="stat-label">Sent</div>
        </div>
        <div class="stat-card failed">
          <div class="stat-value" id="stat-failed">0</div>
          <div class="stat-label">Failed</div>
        </div>
      </div>
      <div class="log-list" id="log-list"></div>
    `;

    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const statSuccess = document.getElementById("stat-success");
    const statFailed = document.getElementById("stat-failed");
    const logList = document.getElementById("log-list");

    // Send emails one by one
    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const formData = new FormData();
      formData.append("name", senderName || "Sender");
      formData.append("email", email);
      formData.append("subject", subject);
      formData.append("message", messageBody);
      if (replyTo) formData.append("replyTo", replyTo);
      if (attachmentEl.files.length) {
        formData.append("attachment", attachmentEl.files[0]);
      }

      try {
        const res = await fetch("/send", { method: "POST", body: formData });
        const data = await res.json();

        if (data.success) {
          successCount++;
          logEntries.push({ email, status: "success", time: new Date() });
          appendLog(logList, email, "success");
        } else {
          failCount++;
          logEntries.push({ email, status: "error", error: data.error, time: new Date() });
          appendLog(logList, email, "error", data.error);
        }
      } catch (err) {
        failCount++;
        logEntries.push({ email, status: "error", error: "Network error", time: new Date() });
        appendLog(logList, email, "error", "Network error");
      }

      // Update progress
      const done = i + 1;
      const pct = Math.round((done / emails.length) * 100);
      progressFill.style.width = pct + "%";
      progressText.textContent = `${done} / ${emails.length}`;
      statSuccess.textContent = successCount;
      statFailed.textContent = failCount;
    }

    // Update quota
    sentCount += successCount;
    updateQuota();

    // Save to history
    const entry = {
      id: Date.now(),
      subject,
      date: new Date().toISOString(),
      total: emails.length,
      success: successCount,
      failed: failCount,
    };
    history.unshift(entry);
    localStorage.setItem("mp_history", JSON.stringify(history));
    renderHistory();

    // Reset button
    btnSend.classList.remove("sending");
    btnSend.querySelector(".material-icons-outlined").textContent = "send";
    btnSend.querySelector(".material-icons-outlined").nextSibling.textContent =
      " Send Campaign";

    if (failCount === 0) {
      showToast("success", `All ${successCount} emails sent successfully`);
    } else {
      showToast(
        "error",
        `${successCount} sent, ${failCount} failed out of ${emails.length}`
      );
    }
  }

  function appendLog(container, email, status, errorMsg) {
    const div = document.createElement("div");
    div.className = "log-item " + status;
    const icon = status === "success" ? "check_circle" : "error";
    const timeStr = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    div.innerHTML = `
      <span class="material-icons-outlined">${icon}</span>
      <span class="log-email">${escapeHtml(email)}${
      errorMsg ? '<br><small style="color:var(--gray-400)">' + escapeHtml(errorMsg) + "</small>" : ""
    }</span>
      <span class="log-time">${timeStr}</span>
    `;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  // ─── Quota ─────────────────────────────────────────────
  function updateQuota() {
    quotaCountEl.textContent = `${sentCount} / ${maxQuota}`;
    quotaFillEl.style.width = Math.min((sentCount / maxQuota) * 100, 100) + "%";
  }

  // ─── History ───────────────────────────────────────────
  function renderHistory() {
    if (!history.length) {
      historyList.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined empty-icon">inbox</span>
          <p>No campaigns sent yet.</p>
        </div>`;
      return;
    }
    historyList.innerHTML = history
      .map(
        (h) => `
      <div class="history-card">
        <div class="history-card-header">
          <div class="history-card-title">${escapeHtml(h.subject)}</div>
          <div class="history-card-date">${formatDate(h.date)}</div>
        </div>
        <div class="history-card-stats">
          <span>
            <span class="material-icons-outlined">group</span>
            ${h.total} recipients
          </span>
          <span style="color: var(--green-500)">
            <span class="material-icons-outlined">check_circle</span>
            ${h.success} sent
          </span>
          ${
            h.failed
              ? `<span style="color: var(--red-500)">
              <span class="material-icons-outlined">error</span>
              ${h.failed} failed
            </span>`
              : ""
          }
        </div>
      </div>`
      )
      .join("");
  }

  btnClearHist.addEventListener("click", () => {
    if (confirm("Clear all sent history?")) {
      history = [];
      localStorage.setItem("mp_history", JSON.stringify(history));
      renderHistory();
      showToast("info", "History cleared");
    }
  });

  // ─── Contacts ──────────────────────────────────────────
  function renderContacts(filter) {
    let filtered = contacts;
    if (filter) {
      const q = filter.toLowerCase();
      filtered = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
      );
    }

    if (!filtered.length) {
      contactsList.innerHTML = `
        <div class="empty-state">
          <span class="material-icons-outlined empty-icon">people_outline</span>
          <p>${filter ? "No contacts match your search." : "No contacts saved.<br/>Add contacts manually or import from CSV."}</p>
        </div>`;
      return;
    }

    contactsList.innerHTML = filtered
      .map(
        (c, i) => `
      <div class="contact-row" data-idx="${i}">
        <div class="contact-avatar">${getInitials(c.name || c.email)}</div>
        <div class="contact-info">
          <div class="contact-name">${escapeHtml(c.name || "—")}</div>
          <div class="contact-email">${escapeHtml(c.email)}</div>
        </div>
        <div class="contact-actions">
          <button class="btn-icon btn-use-contact" title="Add to recipients" data-email="${escapeHtml(c.email)}">
            <span class="material-icons-outlined">add_circle_outline</span>
          </button>
          <button class="btn-icon btn-delete-contact" title="Delete" data-idx="${i}">
            <span class="material-icons-outlined">delete_outline</span>
          </button>
        </div>
      </div>`
      )
      .join("");

    // Bind events
    contactsList.querySelectorAll(".btn-use-contact").forEach((btn) => {
      btn.addEventListener("click", () => {
        const email = btn.dataset.email;
        const current = recipientsEl.value.trim();
        recipientsEl.value = current ? current + "\n" + email : email;
        recipientsEl.dispatchEvent(new Event("input"));
        switchView("compose");
        showToast("info", `Added ${email} to recipients`);
      });
    });

    contactsList.querySelectorAll(".btn-delete-contact").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.idx);
        contacts.splice(idx, 1);
        localStorage.setItem("mp_contacts", JSON.stringify(contacts));
        renderContacts(contactSearch.value);
      });
    });
  }

  contactSearch.addEventListener("input", () => {
    renderContacts(contactSearch.value);
  });

  btnAddContact.addEventListener("click", () => {
    contactNameEl.value = "";
    contactEmailEl.value = "";
    modalAddContact.style.display = "flex";
    contactEmailEl.focus();
  });

  document.getElementById("btn-close-add-contact").addEventListener("click", () => {
    modalAddContact.style.display = "none";
  });

  document.getElementById("btn-cancel-add-contact").addEventListener("click", () => {
    modalAddContact.style.display = "none";
  });

  modalAddContact.addEventListener("click", (e) => {
    if (e.target === modalAddContact) modalAddContact.style.display = "none";
  });

  document.getElementById("btn-save-contact").addEventListener("click", () => {
    const name = contactNameEl.value.trim();
    const email = contactEmailEl.value.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("error", "Please enter a valid email");
      return;
    }
    if (contacts.some((c) => c.email.toLowerCase() === email.toLowerCase())) {
      showToast("error", "This contact already exists");
      return;
    }
    contacts.push({ name, email });
    localStorage.setItem("mp_contacts", JSON.stringify(contacts));
    renderContacts(contactSearch.value);
    modalAddContact.style.display = "none";
    showToast("success", "Contact saved");
  });

  btnExportContacts.addEventListener("click", () => {
    if (!contacts.length) {
      showToast("error", "No contacts to export");
      return;
    }
    const csv = "Name,Email\n" + contacts.map((c) => `"${c.name}","${c.email}"`).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "contacts.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  });

  // ─── Toast ─────────────────────────────────────────────
  function showToast(type, message) {
    const div = document.createElement("div");
    div.className = "toast " + type;
    const icons = { success: "check_circle", error: "error", info: "info" };
    div.innerHTML = `
      <span class="material-icons-outlined">${icons[type] || "info"}</span>
      <span>${escapeHtml(message)}</span>
    `;
    toastContainer.appendChild(div);
    setTimeout(() => {
      div.style.opacity = "0";
      div.style.transform = "translateX(30px)";
      div.style.transition = "opacity .3s, transform .3s";
      setTimeout(() => div.remove(), 300);
    }, 4000);
  }

  // ─── Helpers ───────────────────────────────────────────
  function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / 1048576).toFixed(1) + " MB";
  }

  function formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function getInitials(str) {
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return str.substring(0, 2).toUpperCase();
  }

  // ─── Init ──────────────────────────────────────────────
  renderHistory();
  renderContacts();
  updateQuota();

  // Check server connectivity
  fetch("/send", { method: "OPTIONS" })
    .then(() => {
      connectionBadge.querySelector("span:last-child").textContent = "Connected";
      connectionBadge.classList.remove("error");
    })
    .catch(() => {
      connectionBadge.querySelector("span:last-child").textContent = "Offline";
      connectionBadge.classList.add("error");
    });
})();

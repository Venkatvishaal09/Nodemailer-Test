import { useState, useRef, useCallback } from "react";
import PreviewModal from "./PreviewModal";

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

function parseRecipients(text) {
  return text
    .split(/[\n,;]+/)
    .map((e) => e.trim())
    .filter((e) => e && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));
}

export default function ComposeView({ showToast, onEmailsSent, token }) {
  const [recipients, setRecipients] = useState("");
  const [subject, setSubject] = useState("");
  const [senderName, setSenderName] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [htmlMode, setHtmlMode] = useState(false);
  const [htmlSource, setHtmlSource] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [statusPanel, setStatusPanel] = useState(null);

  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const csvInputRef = useRef(null);

  const emails = parseRecipients(recipients);
  const recipientCount = emails.length;

  const execCommand = useCallback((cmd) => {
    if (cmd === "createLink") {
      const url = prompt("Enter URL:");
      if (url) document.execCommand(cmd, false, url);
    } else {
      document.execCommand(cmd, false, null);
    }
    editorRef.current?.focus();
  }, []);

  const handleHtmlToggle = useCallback(() => {
    if (!htmlMode) {
      setHtmlSource(editorRef.current?.innerHTML || "");
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlSource;
      }
    }
    setHtmlMode((prev) => !prev);
  }, [htmlMode, htmlSource]);

  const handleCsvImport = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const lines = ev.target.result.split(/\r?\n/);
        const found = [];
        lines.forEach((line) => {
          const parts = line.split(/[,;\t]+/);
          parts.forEach((part) => {
            const trimmed = part.trim().replace(/^["']|["']$/g, "");
            if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
              found.push(trimmed);
            }
          });
        });
        if (found.length) {
          setRecipients((prev) => {
            const current = prev.trim();
            return current ? current + "\n" + found.join("\n") : found.join("\n");
          });
          showToast("success", `Imported ${found.length} email(s) from CSV`);
        } else {
          showToast("error", "No valid email addresses found in file");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    },
    [showToast]
  );

  const handleFileChange = useCallback(
    (e) => {
      const f = e.target.files[0];
      if (!f) return;
      if (f.size > 5 * 1024 * 1024) {
        showToast("error", "File size exceeds 5 MB limit");
        e.target.value = "";
        return;
      }
      setAttachment(f);
    },
    [showToast]
  );

  const removeAttachment = useCallback(() => {
    setAttachment(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const getMessageBody = useCallback(() => {
    return htmlMode ? htmlSource : editorRef.current?.innerHTML || "";
  }, [htmlMode, htmlSource]);

  const previewData = {
    to: emails.length
      ? emails.slice(0, 3).join(", ") +
        (emails.length > 3 ? ` (+${emails.length - 3} more)` : "")
      : "(no recipients)",
    subject: subject || "(no subject)",
    from: senderName || "Default Sender",
    body: getMessageBody(),
  };

  const submitForm = useCallback(async () => {
    const messageBody = getMessageBody();

    if (!emails.length) {
      showToast("error", "Please add at least one valid recipient");
      return;
    }
    if (!subject.trim()) {
      showToast("error", "Subject line is required");
      return;
    }
    if (
      !messageBody ||
      messageBody === "<br>" ||
      messageBody === "<div><br></div>"
    ) {
      showToast("error", "Message body cannot be empty");
      return;
    }

    setSending(true);

    let successCount = 0;
    let failCount = 0;
    const logs = [];

    setStatusPanel({
      total: emails.length,
      done: 0,
      success: 0,
      failed: 0,
      logs: [],
    });

    for (let i = 0; i < emails.length; i++) {
      const email = emails[i];
      const formData = new FormData();
      formData.append("name", senderName || "Sender");
      formData.append("email", email);
      formData.append("subject", subject);
      formData.append("message", messageBody);
      if (replyTo.trim()) formData.append("replyTo", replyTo);
      if (attachment) formData.append("attachment", attachment);

      let logEntry;
      try {
        const res = await fetch("/send", { 
          method: "POST", 
          headers: {
            "Authorization": `Bearer ${token}`
          },
          body: formData 
        });
        const data = await res.json();
        if (data.success) {
          successCount++;
          logEntry = { email, status: "success", time: new Date() };
        } else {
          failCount++;
          logEntry = {
            email,
            status: "error",
            error: data.error,
            time: new Date(),
          };
        }
      } catch {
        failCount++;
        logEntry = {
          email,
          status: "error",
          error: "Network error",
          time: new Date(),
        };
      }

      logs.push(logEntry);
      setStatusPanel({
        total: emails.length,
        done: i + 1,
        success: successCount,
        failed: failCount,
        logs: [...logs],
      });
    }

    setSending(false);
    onEmailsSent(successCount, subject, emails.length, failCount);

    if (failCount === 0) {
      showToast("success", `All ${successCount} emails sent successfully`);
    } else {
      showToast(
        "error",
        `${successCount} sent, ${failCount} failed out of ${emails.length}`
      );
    }
  }, [
    emails,
    subject,
    senderName,
    replyTo,
    attachment,
    getMessageBody,
    showToast,
    onEmailsSent,
  ]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitForm();
  };

  return (
    <section className="view active" id="view-compose">
      <div className="compose-layout">
        <div className="compose-form-wrapper">
          <form id="composeForm" encType="multipart/form-data" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="recipients">
                Recipients <span className="required">*</span>
              </label>
              <div className="recipients-input-wrapper">
                <textarea
                  id="recipients"
                  name="recipients"
                  rows="3"
                  placeholder={"Enter email addresses separated by commas or new lines\ne.g. john@example.com, jane@company.org"}
                  required
                  value={recipients}
                  onChange={(e) => setRecipients(e.target.value)}
                />
                <div className="recipients-actions">
                  <button
                    type="button"
                    className="btn-text"
                    id="btn-import-csv"
                    title="Import from CSV"
                    onClick={() => csvInputRef.current?.click()}
                  >
                    <span className="material-icons-outlined">upload_file</span>
                    Import CSV
                  </button>
                  <span className="recipient-count" id="recipient-count">
                    {recipientCount}{" "}
                    {recipientCount === 1 ? "recipient" : "recipients"}
                  </span>
                </div>
              </div>
              <input
                type="file"
                ref={csvInputRef}
                style={{ display: "none" }}
                accept=".csv,.txt"
                onChange={handleCsvImport}
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">
                Subject <span className="required">*</span>
              </label>
              <input
                type="text"
                id="subject"
                name="subject"
                placeholder="e.g. Monthly Newsletter — July 2026"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label htmlFor="senderName">Sender Name</label>
                <input
                  type="text"
                  id="senderName"
                  name="senderName"
                  placeholder="e.g. Acme Corp"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div className="form-group flex-1">
                <label htmlFor="replyTo">Reply-To (optional)</label>
                <input
                  type="email"
                  id="replyTo"
                  name="replyTo"
                  placeholder="replies@yourcompany.com"
                  value={replyTo}
                  onChange={(e) => setReplyTo(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="editor">
                Message Body <span className="required">*</span>
              </label>
              <div className="editor-toolbar">
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Bold"
                  onClick={() => execCommand("bold")}
                >
                  <b>B</b>
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Italic"
                  onClick={() => execCommand("italic")}
                >
                  <i>I</i>
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Underline"
                  onClick={() => execCommand("underline")}
                >
                  <u>U</u>
                </button>
                <span className="toolbar-divider" />
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Bullet list"
                  onClick={() => execCommand("insertUnorderedList")}
                >
                  <span
                    className="material-icons-outlined"
                    style={{ fontSize: 16 }}
                  >
                    format_list_bulleted
                  </span>
                </button>
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Numbered list"
                  onClick={() => execCommand("insertOrderedList")}
                >
                  <span
                    className="material-icons-outlined"
                    style={{ fontSize: 16 }}
                  >
                    format_list_numbered
                  </span>
                </button>
                <span className="toolbar-divider" />
                <button
                  type="button"
                  className="toolbar-btn"
                  title="Insert link"
                  onClick={() => execCommand("createLink")}
                >
                  <span
                    className="material-icons-outlined"
                    style={{ fontSize: 16 }}
                  >
                    link
                  </span>
                </button>
                <div className="toolbar-right">
                  <label className="toggle-html-label">
                    <input
                      type="checkbox"
                      id="toggle-html"
                      checked={htmlMode}
                      onChange={handleHtmlToggle}
                    />
                    <span>HTML</span>
                  </label>
                </div>
              </div>
              <div
                ref={editorRef}
                id="editor"
                className="rich-editor"
                contentEditable
                data-placeholder="Write your email content here..."
                style={{ display: htmlMode ? "none" : "block" }}
              />
              <textarea
                id="html-source"
                className="html-source"
                style={{ display: htmlMode ? "block" : "none" }}
                placeholder="Paste raw HTML here..."
                value={htmlSource}
                onChange={(e) => setHtmlSource(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Attachment (optional)</label>
              {!attachment ? (
                <div className="file-drop-zone" id="file-drop-zone">
                  <span className="material-icons-outlined">attach_file</span>
                  <span>
                    Drag & drop or <u>browse</u> — max 5 MB
                  </span>
                  <input
                    type="file"
                    id="attachment"
                    name="attachment"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />
                </div>
              ) : (
                <div className="attached-file" id="attached-file">
                  <span className="material-icons-outlined">description</span>
                  <span id="attached-file-name">
                    {attachment.name} ({formatBytes(attachment.size)})
                  </span>
                  <button
                    type="button"
                    className="btn-icon"
                    id="btn-remove-file"
                    title="Remove"
                    onClick={removeAttachment}
                  >
                    <span className="material-icons-outlined">close</span>
                  </button>
                </div>
              )}
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                id="btn-preview"
                onClick={() => setShowPreview(true)}
              >
                <span className="material-icons-outlined">visibility</span>
                Preview
              </button>
              <button
                type="submit"
                className={`btn btn-primary${sending ? " sending" : ""}`}
                id="btn-send"
              >
                <span className="material-icons-outlined">
                  {sending ? "autorenew" : "send"}
                </span>
                {sending ? " Sending..." : " Send Campaign"}
              </button>
            </div>
          </form>
        </div>

        <div className="status-panel" id="status-panel">
          <div className="panel-header">
            <h3>Delivery Status</h3>
          </div>
          <div className="panel-body" id="send-status-body">
            {!statusPanel ? (
              <div className="empty-state">
                <span className="material-icons-outlined empty-icon">
                  outgoing_mail
                </span>
                <p>
                  No emails sent yet.
                  <br />
                  Compose and send your first campaign.
                </p>
              </div>
            ) : (
              <>
                <div className="send-progress">
                  <div className="progress-header">
                    <span>Progress</span>
                    <span id="progress-text">
                      {statusPanel.done} / {statusPanel.total}
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      id="progress-fill"
                      style={{
                        width: `${Math.round(
                          (statusPanel.done / statusPanel.total) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <div className="send-stats">
                  <div className="stat-card">
                    <div className="stat-value" id="stat-total">
                      {statusPanel.total}
                    </div>
                    <div className="stat-label">Total</div>
                  </div>
                  <div className="stat-card success">
                    <div className="stat-value" id="stat-success">
                      {statusPanel.success}
                    </div>
                    <div className="stat-label">Sent</div>
                  </div>
                  <div className="stat-card failed">
                    <div className="stat-value" id="stat-failed">
                      {statusPanel.failed}
                    </div>
                    <div className="stat-label">Failed</div>
                  </div>
                </div>
                <div className="log-list" id="log-list">
                  {statusPanel.logs.map((log, i) => {
                    const icon =
                      log.status === "success" ? "check_circle" : "error";
                    const timeStr = log.time.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div key={i} className={`log-item ${log.status}`}>
                        <span className="material-icons-outlined">{icon}</span>
                        <span className="log-email">
                          {escapeHtml(log.email)}
                          {log.error && (
                            <>
                              <br />
                              <small style={{ color: "var(--gray-400)" }}>
                                {escapeHtml(log.error)}
                              </small>
                            </>
                          )}
                        </span>
                        <span className="log-time">{timeStr}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <PreviewModal
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onSend={() => {
          setShowPreview(false);
          submitForm();
        }}
        to={previewData.to}
        subject={previewData.subject}
        from={previewData.from}
        body={previewData.body}
      />
    </section>
  );
}

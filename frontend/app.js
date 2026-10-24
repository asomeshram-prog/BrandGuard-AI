
/* ==========================================
   BrandGuard AI — Frontend Application
   ========================================== */

// IMPORTANT: Replace this with your actual Render backend URL.
// Example: https://brandguard-ai-api.onrender.com
const API_BASE_URL = "https://brandguard-ai-frontend.vercel.app/";

/* ---------- State and helpers ---------- */

const $ = (id) => document.getElementById(id);

let token = localStorage.getItem("bg_token") || "";
let reviews = [];
let activeId = null;

const api = async (path, opts = {}) => {
    const headers = {
        ...(opts.headers || {}),
        ...(token ? { Authorization: "Bearer " + token } : {})
    };

    const url =
        `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

    const response = await fetch(url, {
        ...opts,
        headers
    });

    let data = {};

    try {
        data = await response.json();
    } catch {
        // The response may not contain JSON.
    }

    if (!response.ok) {
        throw new Error(
            data.detail ||
            data.message ||
            `Request failed (${response.status})`
        );
    }

    return data;
};

function toast(message) {
    const element = $("toast");

    if (!element) {
        console.log(message);
        return;
    }

    element.textContent = message;
    element.classList.add("show");

    setTimeout(() => {
        element.classList.remove("show");
    }, 2600);
}

function esc(value = "") {
    return String(value).replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function fmt(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "—";

    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function showApp() {
    $("loginView").classList.add("hidden");
    $("appView").classList.remove("hidden");
    loadDashboard();
}

function showLogin() {
    $("appView").classList.add("hidden");
    $("loginView").classList.remove("hidden");
}

/* ---------- Authentication ---------- */

$("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("loginError").textContent = "";

    try {
        const result = await api("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username: $("username").value,
                password: $("password").value
            })
        });

        if (!result.token) {
            throw new Error(
                "Login response did not contain a token."
            );
        }

        token = result.token;
        localStorage.setItem("bg_token", token);

        showApp();
    } catch (error) {
        $("loginError").textContent = error.message;
    }
});

$("logoutBtn").addEventListener("click", () => {
    token = "";
    localStorage.removeItem("bg_token");
    showLogin();
});

/* ---------- Navigation ---------- */

document.querySelectorAll("[data-page], [data-go]").forEach((button) => {
    button.addEventListener("click", () => {
        navigate(button.dataset.page || button.dataset.go);
    });
});

function navigate(page) {
    document.querySelectorAll(".page").forEach((element) => {
        element.classList.add("hidden");
    });

    $("detailPage").classList.add("hidden");

    const target = $(page + "Page");

    if (!target) {
        console.error("Page not found:", page);
        return;
    }

    target.classList.remove("hidden");

    document.querySelectorAll(".nav").forEach((element) => {
        element.classList.toggle(
            "active",
            element.dataset.page === page
        );
    });

    const names = {
        dashboard: "Dashboard",
        upload: "New review",
        reviews: "Review queue",
        detail: "Review report"
    };

    const titles = {
        dashboard: "Good work starts on-brand.",
        upload: "Prepare content for review.",
        reviews: "Make every review count.",
        detail: "Review details"
    };

    $("crumb").textContent = names[page] || page;
    $("pageTitle").textContent = titles[page] || "BrandGuard AI";

    if (page === "reviews") {
        loadDashboard();
    }
}

/* ---------- Review table ---------- */

function rowHtml(review) {
    const name =
        review.content_filename ||
        (review.content_text || "Untitled content").slice(0, 62) ||
        "Untitled content";

    return `
        <tr>
            <td>${esc(name)}</td>
            <td>
                <span class="score-pill">${review.brand_score || 0}</span>
                / 100
            </td>
            <td>
                <span class="status ${esc(review.status)}">
                    ${esc(review.status)}
                </span>
            </td>
            <td>${fmt(review.created_at)}</td>
            <td>
                <button class="open-review" data-open="${review.id}">
                    Open →
                </button>
            </td>
        </tr>
    `;
}

function attachOpen() {
    document.querySelectorAll("[data-open]").forEach((button) => {
        button.onclick = () => {
            openReview(Number(button.dataset.open));
        };
    });
}

/* ---------- Dashboard ---------- */

async function loadDashboard() {
    try {
        const data = await api("/dashboard");

        reviews = data.reviews || [];

        $("totalReviews").textContent = data.total_reviews ?? 0;
        $("approvedCount").textContent = data.approved_content ?? 0;
        $("rejectedCount").textContent = data.rejected_content ?? 0;
        $("avgScore").textContent = data.average_brand_score ?? 0;

        $("avgBar").style.width =
            `${data.average_brand_score ?? 0}%`;

        $("queueCount").textContent = reviews.filter(
            (review) => review.status === "Pending"
        ).length;

        $("recentRows").innerHTML = reviews.length
            ? reviews.slice(0, 6).map(rowHtml).join("")
            : `
                <tr>
                    <td colspan="5" class="empty">
                        No reviews yet. Create your first review.
                    </td>
                </tr>
            `;

        $("allRows").innerHTML = reviews.length
            ? reviews.map(rowHtml).join("")
            : `
                <tr>
                    <td colspan="5" class="empty">
                        No reviews yet.
                    </td>
                </tr>
            `;

        attachOpen();
        filterRows();

    } catch (error) {
        if (
            error.message.includes("401") ||
            error.message.toLowerCase().includes("unauthorized")
        ) {
            token = "";
            localStorage.removeItem("bg_token");
            showLogin();
        } else {
            toast(error.message);
        }
    }
}

function filterRows() {
    const search = $("reviewSearch").value.toLowerCase();
    const status = $("statusFilter").value;

    document.querySelectorAll("#allRows tr").forEach((row) => {
        const text = row.textContent.toLowerCase();

        row.style.display =
            text.includes(search) &&
            (status === "All" || text.includes(status.toLowerCase()))
                ? ""
                : "none";
    });
}

$("reviewSearch").addEventListener("input", filterRows);
$("statusFilter").addEventListener("change", filterRows);

/* ---------- File selection ---------- */

$("guidelineFile").addEventListener("change", () => {
    $("guidelineName").textContent =
        $("guidelineFile").files[0]?.name || "";
});

$("contentFile").addEventListener("change", () => {
    $("contentName").textContent =
        $("contentFile").files[0]?.name ||
        "Choose TXT, MD, or image";
});

/* ---------- Upload and analyze ---------- */

$("uploadForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const button = $("analyzeBtn");
    button.disabled = true;
    button.textContent = "Saving & analyzing…";

    try {
        const formData = new FormData();

        formData.append("content_text", $("contentText").value);

        if ($("contentFile").files[0]) {
            formData.append(
                "content_file",
                $("contentFile").files[0]
            );
        }

        if ($("guidelineFile").files[0]) {
            formData.append(
                "guideline_file",
                $("guidelineFile").files[0]
            );
        }

        const created = await api("/upload", {
            method: "POST",
            body: formData
        });

        const analyzeData = new FormData();
        analyzeData.append("review_id", created.id);

        await api("/analyze", {
            method: "POST",
            body: analyzeData
        });

        toast("Review analyzed successfully");

        $("uploadForm").reset();
        $("guidelineName").textContent = "";
        $("contentName").textContent =
            "Choose TXT, MD, or image";

        await loadDashboard();
        await openReview(created.id);

    } catch (error) {
        toast(error.message);
    } finally {
        button.disabled = false;
        button.innerHTML = 'Save & analyze <span>→</span>';
    }
});

/* ---------- Review report ---------- */

async function openReview(id) {
    try {
        const review = await api("/report/" + id);

        activeId = id;
        navigate("detail");

        const report = review.report || {};
        const issues = report.issues || [];

        $("detailContent").innerHTML = `
            <div class="welcome-row">
                <div>
                    <span class="eyebrow blue">
                        REVIEW #${review.id}
                    </span>

                    <h2>
                        ${esc(review.content_filename || "Content review")}
                    </h2>

                    <p class="muted">
                        Submitted ${fmt(review.created_at)}
                        · Current status
                        <span class="status ${esc(review.status)}">
                            ${esc(review.status)}
                        </span>
                    </p>
                </div>

                <div class="report-score">
                    ${review.brand_score || 0}
                    <small> / 100</small>
                </div>
            </div>

            <div class="detail-grid">
                <div class="panel">
                    <h3>Submitted content</h3>

                    <p class="muted">
                        Review the original copy before deciding.
                    </p>

                    <div class="content-preview">
                        ${esc(
                            review.content_text ||
                            "No extracted text. If this is an image, use the attached file and add a text description for analysis."
                        )}
                    </div>

                    ${
                        review.content_filename
                            ? `
                                <p>
                                    <button
                                        class="text-button"
                                        id="viewContentFile"
                                    >
                                        ↗ View uploaded file
                                    </button>
                                </p>
                            `
                            : ""
                    }
                </div>

                <div class="panel">
                    <div class="report-head">
                        <div>
                            <h3>AI brand report</h3>
                            <p class="muted">
                                ${esc(report.verdict || "Not analyzed")}
                            </p>
                        </div>

                        <span class="status ${
                            review.brand_score >= 80
                                ? "Approved"
                                : review.brand_score >= 55
                                    ? "Pending"
                                    : "Rejected"
                        }">
                            ${issues.length}
                            issue${issues.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div class="summary">
                        ${esc(report.summary || "No report available.")}
                    </div>

                    ${
                        issues.length
                            ? issues.map((issue) => `
                                <div class="issue">
                                    <div class="issue-top">
                                        <h4>${esc(issue.type)}</h4>

                                        <span class="severity ${esc(issue.severity)}">
                                            ${esc(issue.severity)}
                                        </span>
                                    </div>

                                    <p>
                                        <b>Detected:</b>
                                        ${esc(issue.detected)}
                                    </p>

                                    <p>
                                        <b>Why:</b>
                                        ${esc(issue.why)}
                                    </p>

                                    <p class="suggestion">
                                        <b>Suggested correction:</b>
                                        ${esc(issue.suggestion)}
                                    </p>
                                </div>
                            `).join("")
                            : `
                                <div class="issue">
                                    <h4>No issues detected ✦</h4>
                                    <p>
                                        The analysis did not flag any issues.
                                        Please still review before approval.
                                    </p>
                                </div>
                            `
                    }
                </div>

                <div class="panel" style="grid-column: 1 / -1">
                    <h3>Reviewer decision</h3>

                    <p class="muted">
                        Add context for the content creator or future reviewers.
                    </p>

                    <textarea
                        id="reviewComment"
                        rows="3"
                        placeholder="Add a comment or explain your decision…"
                    >${esc(review.reviewer_comment || "")}</textarea>

                    <div class="decision-actions">
                        <button class="primary" id="approveBtn">
                            ✓ Approve content
                        </button>

                        <button class="reject-btn" id="rejectBtn">
                            × Reject content
                        </button>
                    </div>
                </div>
            </div>
        `;

        if ($("viewContentFile")) {
            $("viewContentFile").onclick = () => {
                downloadFile(id, "content");
            };
        }

        $("approveBtn").onclick = () => decision("approve", id);
        $("rejectBtn").onclick = () => decision("reject", id);

    } catch (error) {
        toast(error.message);
    }
}

/* ---------- Download uploaded file ---------- */

async function downloadFile(id, kind) {
    try {
        const url =
            `${API_BASE_URL.replace(/\/+$/, "")}/files/${id}/${kind}`;

        const response = await fetch(url, {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!response.ok) {
            throw new Error("File unavailable");
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = objectUrl;
        link.download = "brandguard-content";

        document.body.appendChild(link);
        link.click();
        link.remove();

        URL.revokeObjectURL(objectUrl);

    } catch (error) {
        toast(error.message);
    }
}

/* ---------- Approve or reject ---------- */

async function decision(action, id) {
    try {
        await api("/" + action + "/" + id, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                comment: $("reviewComment").value
            })
        });

        toast(
            action === "approve"
                ? "Content approved"
                : "Content rejected"
        );

        await loadDashboard();
        await openReview(id);

    } catch (error) {
        toast(error.message);
    }
}

/* ---------- Start application ---------- */

if (token) {
    showApp();
} else {
    showLogin();
}


const API_BASE_URL = "brandguard-ai-frontend.vercel.app";

const api = async (path, opts = {}) => {
  const headers = {
    ...(opts.headers || {}),
    ...(token ? { Authorization: "Bearer " + token } : {})
  };

  const cleanPath = path.replace(/^\/+/, "");
  const url = `${API_BASE_URL.replace(/\/+$/, "")}/${cleanPath}`;

  const response = await fetch(url, {
    ...opts,
    headers
  });

  let data = {};

  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(
      data.detail || `Request failed (${response.status})`
    );
  }

  return data;
};




const $=id=>document.getElementById(id);
let token=localStorage.getItem('bg_token')||'', reviews=[], activeId=null;
const api=async(path,opts={})=>{opts.headers={...(opts.headers||{}),...(token?{Authorization:'Bearer '+token}:{})};const r=await fetch(path,opts);let data={};try{data=await r.json()}catch{}if(!r.ok)throw new Error(data.detail||'Something went wrong');return data};
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2600)}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function showApp(){ $('loginView').classList.add('hidden');$('appView').classList.remove('hidden');loadDashboar
const API_BASE_URL = "https://brandguard-ai-frontend.vercel.app/";

const $ = id => document.getElementById(id);

let token = localStorage.getItem("bg_token") || "";
let reviews = [];
let activeId = null;

// API helper: send all backend requests to Render
const api = async (path, opts = {}) => {
    const headers = {
        ...(opts.headers || {}),
        ...(token ? { Authorization: "Bearer " + token } : {})
    };

    const url = `${API_BASE_URL.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;

    const r = await fetch(url, { ...opts, headers });

    let data = {};
    try {
        data = await r.json();
    } catch {}

    if (!r.ok) {
        throw new Error(data.detail || `Request failed (${r.status})`);
    }

    return data;
};

function toast(msg) {
    const t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2600);
}

function esc(s = "") {
    return String(s).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    }[c]));
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

// Login
$("loginForm").addEventListener("submit", async e => {
    e.preventDefault();
    $("loginError").textContent = "";

    try {
        const d = await api("/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                username: $("username").value,
                password: $("password").value
            })
        });

        if (!d.token) {
            throw new Error("Login response did not contain a token.");
        }

        token = d.token;
        localStorage.setItem("bg_token", token);
        showApp();
    } catch (err) {
        $("loginError").textContent = err.message;
    }
});

// Logout
$("logoutBtn").onclick = () => {
    token = "";
    localStorage.removeItem("bg_token");
    showLogin();
};

document.querySelectorAll("[data-page],[data-go]").forEach(b => {
    b.addEventListener("click", () => {
        navigate(b.dataset.page || b.dataset.go);
    });
});

function navigate(page) {
    document.querySelectorAll(".page").forEach(p =>
        p.classList.add("hidden")
    );

    $("detailPage").classList.add("hidden");

    const target = $(page + "Page");
    if (!target) {
        console.error("Page not found:", page);
        return;
    }

    target.classList.remove("hidden");

    document.querySelectorAll(".nav").forEach(n => {
        n.classList.toggle("active", n.dataset.page === page);
    });

    const names = {
        dashboard: "Dashboard",
        upload: "New review",
        reviews: "Review queue",
        detail: "Review report"
    };

    $("crumb").textContent = names[page] || page;

    $("pageTitle").textContent = ({
        dashboard: "Good work starts on-brand.",
        upload: "Prepare content for review.",
        reviews: "Make every review count.",
        detail: "Review details"
    })[page] || "BrandGuard AI";

    if (page === "reviews") loadDashboard();
}

function fmt(s) {
    if (!s) return "—";
    return new Date(s).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
    });
}

function rowHtml(r) {
    const name = r.content_filename ||
        ((r.content_text || "Untitled content").slice(0, 62)) ||
        "Untitled content";

    return `<tr>
        <td>${esc(name)}</td>
        <td><span class="score-pill">${r.brand_score || 0}</span> / 100</td>
        <td><span class="status ${esc(r.status)}">${esc(r.status)}</span></td>
        <td>${fmt(r.created_at)}</td>
        <td><button class="open-review" data-open="${r.id}">Open →</button></td>
    </tr>`;
}

function attachOpen() {
    document.querySelectorAll("[data-open]").forEach(b => {
        b.onclick = () => openReview(Number(b.dataset.open));
    });
}

// Dashboard
async function loadDashboard() {
    try {
        const d = await api("/dashboard");

        reviews = d.reviews || [];

        $("totalReviews").textContent = d.total_reviews ?? 0;
        $("approvedCount").textContent = d.approved_content ?? 0;
        $("rejectedCount").textContent = d.rejected_content ?? 0;
        $("avgScore").textContent = d.average_brand_score ?? 0;
        $("avgBar").style.width = (d.average_brand_score ?? 0) + "%";

        $("queueCount").textContent =
            reviews.filter(r => r.status === "Pending").length;

        $("recentRows").innerHTML = reviews.length
            ? reviews.slice(0, 6).map(rowHtml).join("")
            : '<tr><td colspan="5" class="empty">No reviews yet. Create your first review.</td></tr>';

        $("allRows").innerHTML = reviews.map(rowHtml).join("") ||
            '<tr><td colspan="5" class="empty">No reviews yet.</td></tr>';

        attachOpen();
        filterRows();
    } catch (e) {
        if (e.message.toLowerCase().includes("log in") ||
            e.message.includes("401")) {
            token = "";
            localStorage.removeItem("bg_token");
            showLogin();
        } else {
            toast(e.message);
        }
    }
}

function filterRows() {
    const q = $("reviewSearch").value.toLowerCase();
    const s = $("statusFilter").value;

    document.querySelectorAll("#allRows tr").forEach(tr => {
        const text = tr.textContent.toLowerCase();
        tr.style.display =
            (text.includes(q) &&
            (s === "All" || text.includes(s.toLowerCase())))
                ? ""
                : "none";
    });
}

$("reviewSearch").oninput = filterRows;
$("statusFilter").onchange = filterRows;

$("guidelineFile").onchange = () => {
    $("guidelineName").textContent =
        $("guidelineFile").files[0]?.name || "";
};

$("contentFile").onchange = () => {
    $("contentName").textContent =
        $("contentFile").files[0]?.name || "Choose TXT, MD, or image";
};

// Upload and analyze
$("uploadForm").addEventListener("submit", async e => {
    e.preventDefault();

    const btn = $("analyzeBtn");
    btn.disabled = true;
    btn.textContent = "Saving & analyzing…";

    try {
        const fd = new FormData();

        fd.append("content_text", $("contentText").value);

        if ($("contentFile").files[0]) {
            fd.append("content_file", $("contentFile").files[0]);
        }

        if ($("guidelineFile").files[0]) {
            fd.append("guideline_file", $("guidelineFile").files[0]);
        }

        const created = await api("/upload", {
            method: "POST",
            body: fd
        });

        const analyzeFd = new FormData();
        analyzeFd.append("review_id", created.id);

        await api("/analyze", {
            method: "POST",
            body: analyzeFd
        });

        toast("Review analyzed successfully");

        $("uploadForm").reset();
        $("guidelineName").textContent = "";
        $("contentName").textContent = "Choose TXT, MD, or image";

        await loadDashboard();
        await openReview(created.id);
    } catch (err) {
        toast(err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = 'Save & analyze <span>→</span>';
    }
});

// Open a review report
async function openReview(id) {
    try {
        const r = await api("/report/" + id);

        activeId = id;
        navigate("detail");

        const report = r.report;
        const issues = report?.issues || [];

        $("detailContent").innerHTML = `
            <div class="welcome-row">
                <div>
                    <span class="eyebrow blue">REVIEW #${r.id}</span>
                    <h2>${esc(r.content_filename || "Content review")}</h2>
                    <p class="muted">
                        Submitted ${fmt(r.created_at)} · Current status
                        <span class="status ${esc(r.status)}">${esc(r.status)}</span>
                    </p>
                </div>
                <div class="report-score">
                    ${r.brand_score || 0}<small> / 100</small>
                </div>
            </div>

            <div class="detail-grid">
                <div class="panel">
                    <h3>Submitted content</h3>
                    <p class="muted">Review the original copy before deciding.</p>
                    <div class="content-preview">
                        ${esc(r.content_text || "No extracted text. If this is an image, use the attached file and add a text description for analysis.")}
                    </div>
                    ${r.content_filename
                        ? '<p><button class="text-button" id="viewContentFile">↗ View uploaded file</button></p>'
                        : ""}
                </div>

                <div class="panel">
                    <div class="report-head">
                        <div>
                            <h3>AI brand report</h3>
                            <p class="muted">${esc(report?.verdict || "Not analyzed")}</p>
                        </div>
                        <span class="status ${r.brand_score >= 80 ? "Approved" : r.brand_score >= 55 ? "Pending" : "Rejected"}">
                            ${issues.length} issue${issues.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div class="summary">${esc(report?.summary || "No report available.")}</div>

                    ${issues.length
                        ? issues.map(i => `
                            <div class="issue">
                                <div class="issue-top">
                                    <h4>${esc(i.type)}</h4>
                                    <span class="severity ${esc(i.severity)}">${esc(i.severity)}</span>
                                </div>
                                <p><b>Detected:</b> ${esc(i.detected)}</p>
                                <p><b>Why:</b> ${esc(i.why)}</p>
                                <p class="suggestion"><b>Suggested correction:</b> ${esc(i.suggestion)}</p>
                            </div>
                        `).join("")
                        : `<div class="issue">
                            <h4>No issues detected ✦</h4>
                            <p>The analysis did not flag any issues. Please still review before approval.</p>
                        </div>`
                    }
                </div>

                <div class="panel" style="grid-column:1/-1">
                    <h3>Reviewer decision</h3>
                    <p class="muted">Add context for the content creator or future reviewers.</p>
                    <textarea id="reviewComment" rows="3" placeholder="Add a comment or explain your decision…">${esc(r.reviewer_comment || "")}</textarea>
                    <div class="decision-actions">
                        <button class="primary" id="approveBtn">✓ Approve content</button>
                        <button class="reject-btn" id="rejectBtn">× Reject content</button>
                    </div>
                </div>
            </div>
        `;

        if ($("viewContentFile")) {
            $("viewContentFile").onclick = () => downloadFile(id, "content");
        }

        $("approveBtn").onclick = () => decision("approve", id);
        $("rejectBtn").onclick = () => decision("reject", id);
    } catch (e) {
        toast(e.message);
    }
}

// Download file from Render
async function downloadFile(id, kind) {
    try {
        const url = `${API_BASE_URL.replace(/\/+$/, "")}/files/${id}/${kind}`;

        const r = await fetch(url, {
            headers: {
                Authorization: "Bearer " + token
            }
        });

        if (!r.ok) throw new Error("File unavailable");

        const blob = await r.blob();
        const objectUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = objectUrl;
        a.download = "brandguard-content";
        document.body.appendChild(a);
        a.click();
        a.remove();

        URL.revokeObjectURL(objectUrl);
    } catch (e) {
        toast(e.message);
    }
}

// Approve or reject
async function decision(action, id) {
    try {
        await api("/" + action + "/" + id, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                comment: $("reviewComment").value
            })
        });

        toast(action === "approve" ? "Content approved" : "Content rejected");

        await loadDashboard();
        await openReview(id);
    } catch (e) {
        toast(e.message);
    }
}

// Initial page
if (token) {
    showApp();
} else {
    showLogin();
}
d() }
function showLogin(){ $('appView').classList.add('hidden');$('loginView').classList.remove('hidden') }
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';try{const d=await api('/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('username').value,password:$('password').value})});token=d.token;localStorage.setItem('bg_token',token);showApp()}catch(err){$('loginError').textContent=err.message}});
$('logoutBtn').onclick=()=>{token='';localStorage.removeItem('bg_token');showLogin()};
document.querySelectorAll('[data-page],[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.page||b.dataset.go)));
function navigate(page){document.querySelectorAll('.page').forEach(p=>p.classList.add('hidden'));$('detailPage').classList.add('hidden');$(page+'Page').classList.remove('hidden');document.querySelectorAll('.nav').forEach(n=>n.classList.toggle('active',n.dataset.page===page));const names={dashboard:'Dashboard',upload:'New review',reviews:'Review queue',detail:'Review report'};$('crumb').textContent=names[page]||page;$('pageTitle').textContent=({dashboard:'Good work starts on-brand.',upload:'Prepare content for review.',reviews:'Make every review count.',detail:'Review details'})[page]||'BrandGuard AI';if(page==='reviews')loadDashboard()}
function fmt(s){if(!s)return '—';return new Date(s).toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}
function rowHtml(r){let name=r.content_filename||((r.content_text||'Untitled content').slice(0,62))||'Untitled content';return `<tr><td>${esc(name)}</td><td><span class="score-pill">${r.brand_score||0}</span> / 100</td><td><span class="status ${esc(r.status)}">${esc(r.status)}</span></td><td>${fmt(r.created_at)}</td><td><button class="open-review" data-open="${r.id}">Open →</button></td></tr>`}
function attachOpen(){document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>openReview(Number(b.dataset.open)))}
async function loadDashboard(){try{const d=await api('/dashboard');reviews=d.reviews||[];$('totalReviews').textContent=d.total_reviews;$('approvedCount').textContent=d.approved_content;$('rejectedCount').textContent=d.rejected_content;$('avgScore').textContent=d.average_brand_score;$('avgBar').style.width=d.average_brand_score+'%';$('queueCount').textContent=reviews.filter(r=>r.status==='Pending').length;$('recentRows').innerHTML=reviews.length?reviews.slice(0,6).map(rowHtml).join(''):'<tr><td colspan="5" class="empty">No reviews yet. Create your first review.</td></tr>';$('allRows').innerHTML=reviews.map(rowHtml).join('')||'<tr><td colspan="5" class="empty">No reviews yet.</td></tr>';attachOpen();filterRows()}catch(e){if(e.message.includes('log in')){token='';localStorage.removeItem('bg_token');showLogin()}else toast(e.message)}}
function filterRows(){const q=$('reviewSearch').value.toLowerCase(),s=$('statusFilter').value;document.querySelectorAll('#allRows tr').forEach(tr=>{const text=tr.textContent.toLowerCase();tr.style.display=(text.includes(q)&&(s==='All'||text.includes(s.toLowerCase())))?'':'none'})}
$('reviewSearch').oninput=filterRows;$('statusFilter').onchange=filterRows;
$('guidelineFile').onchange=()=> $('guidelineName').textContent=$('guidelineFile').files[0]?.name||'';
$('contentFile').onchange=()=> $('contentName').textContent=$('contentFile').files[0]?.name||'Choose TXT, MD, or image';
$('uploadForm').addEventListener('submit',async e=>{e.preventDefault();const btn=$('analyzeBtn');btn.disabled=true;btn.textContent='Saving & analyzing…';try{const fd=new FormData();fd.append('content_text',$('contentText').value);if($('contentFile').files[0])fd.append('content_file',$('contentFile').files[0]);if($('guidelineFile').files[0])fd.append('guideline_file',$('guidelineFile').files[0]);const created=await api('/upload',{method:'POST',body:fd});const analyzeFd=new FormData();analyzeFd.append('review_id',created.id);await api('/analyze',{method:'POST',body:analyzeFd});toast('Review analyzed successfully');$('uploadForm').reset();$('guidelineName').textContent='';$('contentName').textContent='Choose TXT, MD, or image';await loadDashboard();openReview(created.id)}catch(err){toast(err.message)}finally{btn.disabled=false;btn.innerHTML='Save & analyze <span>→</span>'}});
async function openReview(id){try{const r=await api('/report/'+id);activeId=id;navigate('detail');const report=r.report;let issues=report?.issues||[];$('detailContent').innerHTML=`<div class="welcome-row"><div><span class="eyebrow blue">REVIEW #${r.id}</span><h2>${esc(r.content_filename||'Content review')}</h2><p class="muted">Submitted ${fmt(r.created_at)} · Current status <span class="status ${esc(r.status)}">${esc(r.status)}</span></p></div><div class="report-score">${r.brand_score||0}<small> / 100</small></div></div><div class="detail-grid"><div class="panel"><h3>Submitted content</h3><p class="muted">Review the original copy before deciding.</p><div class="content-preview">${esc(r.content_text||'No extracted text. If this is an image, use the attached file and add a text description for analysis.')}</div>${r.content_filename?`<p><button class="text-button" id="viewContentFile">↗ View uploaded file</button></p>`:''}</div><div class="panel"><div class="report-head"><div><h3>AI brand report</h3><p class="muted">${esc(report?.verdict||'Not analyzed')}</p></div><span class="status ${r.brand_score>=80?'Approved':r.brand_score>=55?'Pending':'Rejected'}">${issues.length} issue${issues.length===1?'':'s'}</span></div><div class="summary">${esc(report?.summary||'No report available.')}</div>${issues.length?issues.map(i=>`<div class="issue"><div class="issue-top"><h4>${esc(i.type)}</h4><span class="severity ${esc(i.severity)}">${esc(i.severity)}</span></div><p><b>Detected:</b> ${esc(i.detected)}</p><p><b>Why:</b> ${esc(i.why)}</p><p class="suggestion"><b>Suggested correction:</b> ${esc(i.suggestion)}</p></div>`).join(''):'<div class="issue"><h4>No issues detected ✦</h4><p>The analysis did not flag any issues. Please still review before approval.</p></div>'}</div><div class="panel" style="grid-column:1/-1"><h3>Reviewer decision</h3><p class="muted">Add context for the content creator or future reviewers.</p><textarea id="reviewComment" rows="3" placeholder="Add a comment or explain your decision…">${esc(r.reviewer_comment||'')}</textarea><div class="decision-actions"><button class="primary" id="approveBtn">✓ Approve content</button><button class="reject-btn" id="rejectBtn">× Reject content</button></div></div></div>`;if($('viewContentFile'))$('viewContentFile').onclick=()=>downloadFile(id,'content');$('approveBtn').onclick=()=>decision('approve',id);$('rejectBtn').onclick=()=>decision('reject',id)}catch(e){toast(e.message)}}
async function downloadFile(id,kind){try{const r=await fetch(`/files/${id}/${kind}`,{headers:{Authorization:'Bearer '+token}});if(!r.ok)throw Error('File unavailable');const blob=await r.blob(),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='brandguard-content';a.click();URL.revokeObjectURL(url)}catch(e){toast(e.message)}}
async function decision(action,id){try{await api(`/${action}/${id}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({comment:$('reviewComment').value})});toast(action==='approve'?'Content approved':'Content rejected');await loadDashboard();openReview(id)}catch(e){toast(e.message)}}
if(token)showApp();else showLogin();

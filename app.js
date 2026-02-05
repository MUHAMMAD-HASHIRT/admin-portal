/* ==========================================================================
   APP ENGINE (v94.0) - NO OVERLAP & PRO SUITE
   ========================================================================== */

/* --------------------------------------------------------------------------
   YOUR LIVE FIREBASE KEYS
   -------------------------------------------------------------------------- */
const firebaseConfig = {
    apiKey: "AIzaSyDhe2ZNsrpyIZPNJyVwY0wF9c_svtWWTQY",
    authDomain: "academus-portal.firebaseapp.com",
    databaseURL: "https://academus-portal-default-rtdb.firebaseio.com",
    projectId: "academus-portal",
    storageBucket: "academus-portal.firebasestorage.app",
    messagingSenderId: "415564219534",
    appId: "1:415564219534:web:a80d06da98dad38572b5df",
    measurementId: "G-801VB4ZZZ1"
};

if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const dbRef = firebase.database().ref('schoolData');

/* --- MENU & THEME --- */
const Mobile = { toggleMenu: () => { document.getElementById('app-sidebar').classList.toggle('active'); document.getElementById('mobile-backdrop').classList.toggle('active'); } };
const Theme = { init: () => { const t = localStorage.getItem('academus_theme'); if (t === 'dark') { document.body.setAttribute('data-theme', 'dark'); const i = document.getElementById('theme-icon'); if(i) i.className = 'fas fa-sun'; } else { document.body.removeAttribute('data-theme'); const i = document.getElementById('theme-icon'); if(i) i.className = 'fas fa-moon'; } }, toggle: () => { const d = document.body.hasAttribute('data-theme'); if (d) { document.body.removeAttribute('data-theme'); localStorage.setItem('academus_theme', 'light'); document.getElementById('theme-icon').className = 'fas fa-moon'; } else { document.body.setAttribute('data-theme', 'dark'); localStorage.setItem('academus_theme', 'dark'); document.getElementById('theme-icon').className = 'fas fa-sun'; } } };

/* --- CLOUD DATABASE --- */
const DB = {
    defaults: { users: [{ id: 'admin', pass: 'admin', role: 'admin', name: 'Administrator' }], classes: [], subjects: {}, assignments: [], students: [], marks: {} },
    data: {}, 
    sanitize: (val) => {
        if (!val) return DB.defaults;
        if (val.classes) { if (!Array.isArray(val.classes)) val.classes = Object.values(val.classes).filter(x => x); } else { val.classes = []; }
        if (val.students) { if (!Array.isArray(val.students)) val.students = Object.values(val.students).filter(x => x); } else { val.students = []; }
        if (!val.subjects) val.subjects = {};
        if (!val.assignments) val.assignments = [];
        if (!val.marks) val.marks = {};
        if (!val.users) val.users = DB.defaults.users;
        val.classes.forEach(c => { if (!c.subjects) c.subjects = []; if (!c.sections) c.sections = []; if (!Array.isArray(c.subjects)) c.subjects = []; });
        return val;
    },
    init: (callback) => {
        dbRef.once('value', (snapshot) => {
            const val = snapshot.val();
            if (val) { DB.data = DB.sanitize(val); } else { DB.data = DB.defaults; DB.save(); }
            if (callback) callback();
        });
        dbRef.on('value', (snapshot) => {
            const val = snapshot.val();
            if (val) { DB.data = DB.sanitize(val); if (!document.getElementById('view-admin-classes').classList.contains('hidden')) Admin.loadClassesHierarchy(); if (!document.getElementById('view-admin-teachers').classList.contains('hidden')) Admin.loadTeachers(); }
        });
    },
    save: () => { dbRef.set(DB.data).then(() => { console.log("Cloud Saved."); }).catch(e => alert("Save Error: " + e.message)); },
    reset: () => { if(confirm("⚠️ DANGER: This will delete ALL data (Classes, Students, etc) and reset to fresh state.\n\nAre you sure?")) { DB.data = DB.defaults; DB.save(); alert("Database has been reset. Loading fresh..."); location.reload(); } },
    backup: () => { const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(DB.data)); const a = document.createElement('a'); a.href = dataStr; a.download = "backup.json"; a.click(); },
    createDefaultTemplate: (t) => { return { title: t||'REPORT CARD', sub: 'TERM EVALUATION', desc: 'Student performance report.', qTotals: { t1:25, t2:25, mid:50, tot:100 }, items: [] }; }
};

/* --- UI ROUTER --- */
const UI = { show: (id) => { document.querySelectorAll('.page-section').forEach(e => e.classList.add('hidden')); document.getElementById('view-' + id)?.classList.remove('hidden'); if(id === 'admin-dashboard') Admin.loadDashboard(); if(id === 'admin-classes') Admin.loadClassesHierarchy(); if(id === 'admin-teachers') Admin.loadTeachers(); if(id === 'admin-students') Admin.loadStudents(); if(id === 'admin-template') Template.initSelect(); if(id === 'teacher-dashboard') Teacher.init(); } };

/* --- AUTH --- */
const Auth = {
    user: null,
    check: () => {
        const u = sessionStorage.getItem('uid');
        DB.init(() => {
            if (u) {
                Auth.user = DB.data.users.find(x => x.id === u);
                if(Auth.user) {
                    document.getElementById('app-login').style.display = 'none'; 
                    document.getElementById('app-dashboard').classList.remove('hidden'); 
                    document.getElementById('app-dashboard').style.display = 'block'; 
                    document.getElementById('userDisplay').innerText = Auth.user.name; 
                    document.getElementById('roleDisplay').innerText = Auth.user.role; 
                    if (Auth.user.role === 'admin') { document.getElementById('adminNav').classList.remove('hidden'); UI.show('admin-dashboard'); } 
                    else { document.getElementById('teacherNav').classList.remove('hidden'); UI.show('teacher-dashboard'); } 
                    return; 
                }
            }
            document.getElementById('app-dashboard').style.display = 'none'; 
            document.getElementById('app-login').style.display = 'flex';
        });
    },
    login: () => {
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const btn = document.getElementById('login-btn');
        const originalText = btn.innerText;
        btn.innerHTML = '<i class="fas fa-circle-notch fa-spin"></i> Verifying...';
        btn.disabled = true;
        btn.style.opacity = "0.8";
        setTimeout(() => {
            const f = DB.data.users.find(x => x.id === u && x.pass === p);
            if (f) { 
                btn.innerHTML = '<i class="fas fa-check"></i> Success!';
                btn.style.background = "#10b981"; 
                setTimeout(() => { sessionStorage.setItem('uid', f.id); location.reload(); }, 500);
            } else { 
                btn.innerHTML = '<i class="fas fa-times"></i> Failed';
                btn.style.background = "#ef4444"; 
                setTimeout(() => { alert('Invalid Credentials'); btn.innerHTML = originalText; btn.disabled = false; btn.style.background = ""; btn.style.opacity = "1"; }, 500);
            }
        }, 1200); 
    },
    logout: () => { sessionStorage.clear(); location.reload(); }
};

/* --- REPORT ENGINE (PRECISE LAYOUT MATH) --- */
const ReportEngine = {
    calcAvg: (classId, section, field) => { const students = DB.data.students.filter(s => s.classId === classId && s.section === section); if(!students.length) return 0; const total = students.reduce((sum, s) => sum + (parseFloat(s[field]) || 0), 0); return (total / students.length).toFixed(1); },
    radioBehavior: (el) => { if (el.checked) { const rowId = el.id.split('c')[0]; for(let i=1; i<=4; i++) { const siblingId = rowId + 'c' + i; const sibling = document.getElementById(siblingId); if (sibling && sibling !== el) { sibling.checked = false; } } } },
    generateDetailsPage: (s) => { const cls = DB.data.classes.find(c => c.id === s.classId); const avgAgeY = ReportEngine.calcAvg(s.classId, s.section, 'ageY'); const avgHt = ReportEngine.calcAvg(s.classId, s.section, 'height'); const avgWt = ReportEngine.calcAvg(s.classId, s.section, 'weight'); const totalAtt = (parseInt(s.attendanceP)||0) + (parseInt(s.attendanceA)||0); const check = (val) => val ? `<span class="cb-box" style="background:#002060;color:white;">&#10003;</span>` : `<span class="cb-box"></span>`; return `<div class="details-page"><img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="details-content"><div style="height: 30px;"></div> <div class="dt-section"><div class="dt-title">Student Details</div><div class="dt-row"><span class="dt-label">Name</span><span class="dt-value">${s.name}</span></div><div class="dt-row"><span class="dt-label">Parent/Guardian's Name (1)</span><span class="dt-value">${s.parent1}</span></div><div class="dt-row"><span class="dt-label">Parent/Guardian's Name (2)</span><span class="dt-value">${s.parent2}</span></div><div class="dt-row"><span class="dt-label">Level</span><span class="dt-value">${cls.name}</span></div><div class="dt-row"><span class="dt-label">Section</span><span class="dt-value">${s.section}</span></div></div><div class="dt-section"><div class="dt-title">Age & Gender</div><div class="dt-row"><span class="dt-label">Age</span><span class="dt-value">Years: ${s.ageY} &nbsp; Months: ${s.ageM}</span></div><div class="dt-row"><span class="dt-label">Class Average Age</span><span class="dt-value">${avgAgeY} Yrs</span></div><div class="dt-row"><span class="dt-label">Gender</span><div class="checkbox-group"><span class="cb-item">${check(s.gender==='M')} Male</span><span class="cb-item">${check(s.gender==='F')} Female</span></div></div></div><div class="dt-section"><div class="dt-title">Attendance</div><div class="dt-row"><span class="dt-label">Present: ${s.attendanceP}</span> <span class="dt-label">Absent: ${s.attendanceA}</span> <span class="dt-value">Total: ${totalAtt}</span></div></div><div class="dt-section"><div class="dt-title">Physical Measurement</div><div class="dt-row"><span class="dt-label">Height (cm): ${s.height}</span> <span class="dt-label">Weight (Kg): ${s.weight}</span></div><div class="dt-row"><span class="dt-label">Class Average</span> <span class="dt-value">Height: ${avgHt} &nbsp; Weight: ${avgWt}</span></div></div><div class="dt-section"><div class="dt-title">Parent Teacher Conference</div><div class="dt-row"><span class="dt-label">Conference 1</span><div class="checkbox-group"><span class="cb-item">Yes ${check(s.pt1)}</span><span class="cb-item">No ${check(!s.pt1)}</span></div></div><div class="dt-row"><span class="dt-label">Conference 2</span><div class="checkbox-group"><span class="cb-item">Yes ${check(s.pt2)}</span><span class="cb-item">No ${check(!s.pt2)}</span></div></div></div></div></div>`; },
    generateRubricPage: () => { return `<div class="details-page"><img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="content-area"><div style="height: 40px;"></div> <div class="rubric-title">UNDERSTANDING THE REPORT</div><div class="rubric-text"><b>Objectives</b><br>Academus has an academic and co-curricular checkpoints for students...</div><div class="rubric-text"><b>Testing</b><br>Academus has a set standard of assessing its students using formal and informal methods. Our testing is based on year round evaluation and portfolio analysis of students.</div><div class="rubric-text" style="margin-bottom:10px;"><b>Evaluation Rubric</b></div><table class="rubric-table"><thead><tr><th style="width:20%">Key Attributes</th><th style="width:15%">Key Symbol</th><th>Description</th></tr></thead><tbody><tr class="rubric-row-grey"><td class="rubric-col-attr">Exceeds<br>Learning<br>Expectations</td><td class="rubric-col-sym">ELE</td><td class="rubric-col-desc">The child displays impeccable progress towards set objectives and goals. The child achieves all milestones independently.</td></tr><tr class="rubric-row-white"><td class="rubric-col-attr">Meets Learning<br>Expectations</td><td class="rubric-col-sym">MLE</td><td class="rubric-col-desc">The child meets all the learning outcomes with precision and clarity of understanding.</td></tr><tr class="rubric-row-grey"><td class="rubric-col-attr">Progressing</td><td class="rubric-col-sym">P</td><td class="rubric-col-desc">The child is at an intermediate level, and is completing the given tasks in a satisfactory manner.</td></tr><tr class="rubric-row-white"><td class="rubric-col-attr">Needs<br>Improvement</td><td class="rubric-col-sym">NI</td><td class="rubric-col-desc">The child is starting to attempt or is in a phase of development.</td></tr></tbody></table></div></div>`; },
    
    addHeader: (c, t, s, d) => { 
        c.innerHTML += `<div class="main-title">${t}</div>`;
        if (s) c.innerHTML += `<div class="sub-title">${s}</div>`;
        if (d) c.innerHTML += `<div class="description">${d}</div>`; 
        return 60 + (d ? (d.length / 90 * 18) + 20 : 0); 
    },
    createTable: () => { const t = document.createElement('table'); t.className = 'report-table'; t.innerHTML = `<thead><tr class="main-header"><th>AREAS</th><th style="width:30px">ELE</th><th style="width:30px">MLE</th><th style="width:30px">P</th><th style="width:30px">NI</th></tr></thead><tbody></tbody>`; return t; },
    
    render: (c, t, m, a) => {
        const container = document.getElementById(c) || document.createElement('div'); container.innerHTML = '';
        const chk = (id, v) => a ? `<input type="checkbox" id="${id}" class="inp-mark" ${v?'checked':''} onclick="ReportEngine.radioBehavior(this)">` : (v?'<span style="font-family:sans-serif;font-weight:bold;color:#002060;">&#10003;</span>':'');
        const qT = t.qTotals || { t1:25, t2:25, mid:50, tot:100 };
        const qInp = (id, v, max) => a ? `<div style="display:flex;align-items:center;justify-content:center;gap:4px;"><input type="number" id="${id}" class="inp-mark" value="${v||''}" style="width:60px; text-align:center; margin:0; padding:5px; height:35px;" max="${max}" oninput="if(parseInt(this.value)>${max}) this.value=${max}"><span style="font-size:12px; font-weight:bold;">/${max}</span></div>` : `<span style="font-weight:bold;">${v||'-'} / ${max}</span>`;
        const box = (id, v) => a ? `<textarea id="${id}" class="inp-mark" style="width:100%; min-height:40px; border:none; resize:none; background:transparent;" oninput="this.style.height='';this.style.height=this.scrollHeight+'px'">${v||''}</textarea>` : `<div style="padding:5px;white-space:pre-wrap;">${v||''}</div>`;
        
        // --- PRECISE LIMITS FOR A4 SIZE ---
        const LIMIT = 950; // Use 950px as safe content area (Total A4 is ~1123px)
        const FOOTER_REQUIRED_SPACE = 300; // Marks + Remarks need approx 300px
        
        let pg = ReportEngine.pg(), cnt = pg.querySelector('.content-area');
        let y = ReportEngine.addHeader(cnt, t.title, t.sub, t.desc); 
        
        if (t.items && t.items.length > 0) {
            let tbl = ReportEngine.createTable(); 
            cnt.appendChild(tbl); 
            let tbody = tbl.querySelector('tbody');
            y += 40; 
            
            t.items.forEach((i, idx) => { 
                const h = i.type === 'header' ? 45 : 35; 
                
                if (i.type === 'break' || y + h > LIMIT) { 
                    container.appendChild(pg); 
                    pg = ReportEngine.pg(); 
                    cnt = pg.querySelector('.content-area'); 
                    y = ReportEngine.addHeader(cnt, t.title + " (Continued)", "", ""); 
                    
                    tbl = ReportEngine.createTable(); 
                    cnt.appendChild(tbl); 
                    tbody = tbl.querySelector('tbody'); 
                    y += 40; 
                    
                    if (i.type === 'break') return; 
                } 
                
                const tr = document.createElement('tr'); 
                if (i.type === 'header') { 
                    tr.className = 'section-row'; 
                    tr.innerHTML = `<td colspan="5">${i.text}</td>`; 
                } else { 
                    const b = `r${idx}`; 
                    tr.className = 'data-row'; 
                    tr.innerHTML = `<td>${i.text}</td><td class="check-box">${chk(b+'c1',m[b+'c1'])}</td><td class="check-box">${chk(b+'c2',m[b+'c2'])}</td><td class="check-box">${chk(b+'c3',m[b+'c3'])}</td><td class="check-box">${chk(b+'c4',m[b+'c4'])}</td>`; 
                } 
                tbody.appendChild(tr); 
                y += h; 
            });
        }

        // --- FOOTER OVERLAP PREVENTION ---
        // If current position + required footer space > LIMIT, force new page
        if (y + FOOTER_REQUIRED_SPACE > LIMIT) { 
            container.appendChild(pg); 
            pg = ReportEngine.pg(); 
            cnt = pg.querySelector('.content-area'); 
            // New page for footer starts fresh (No header needed, just the block)
        }
        
        cnt.innerHTML += `<div class="footer-block"><div class="quant-header">Quantitative</div><table class="report-table"><tr><th>1st Term</th><th>2nd Term</th><th>Mid Term</th><th>Total</th><th>%</th></tr><tr><td style="text-align:center;">${qInp('sc1',m.sc1, qT.t1)}</td><td style="text-align:center;">${qInp('sc2',m.sc2, qT.t2)}</td><td style="text-align:center;">${qInp('sc3',m.sc3, qT.mid)}</td><td style="text-align:center;">${qInp('sc4',m.sc4, qT.tot)}</td><td style="text-align:center;">${qInp('sc5',m.sc5, 100)}</td></tr></table><div class="remarks-box"><div class="remarks-label">TEACHER REMARKS</div>${box('rem',m.rem)}</div></div>`;
        container.appendChild(pg); return container.innerHTML;
    },
    pg: () => { const d = document.createElement('div'); d.className = 'report-page'; d.innerHTML = `<img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="content-area"></div>`; return d; },
    openPrintView: (sid, subIds) => ReportEngine.buildAndOpen(sid, Array.isArray(subIds) ? subIds : [subIds]),
    openFullPrintView: (sid) => { const s = DB.data.students.find(x => x.id === sid); const cls = DB.data.classes.find(c => c.id === s.classId); ReportEngine.buildAndOpen(sid, cls.subjects); },
    buildAndOpen: (sid, subIds) => { const s = DB.data.students.find(x => x.id === sid); const cls = DB.data.classes.find(c => c.id === s.classId); const cover = `<div class="cover-page"><div class="cover-field cover-name">${s.name}</div><div class="cover-field cover-class">${cls.name} - ${s.section}</div></div>`; const details = ReportEngine.generateDetailsPage(s); const rubric = ReportEngine.generateRubricPage(); let reports = ''; subIds.forEach(id => { const sub = DB.data.subjects[id]; if (sub) { const m = (DB.data.marks[sid] && DB.data.marks[sid][id]) ? DB.data.marks[sid][id] : {}; reports += ReportEngine.render(null, sub.template, m, false); } }); const w = window.open('', '_blank'); w.document.write(`<html><head><title>${s.name}</title><link rel="stylesheet" href="style.css"></head><body><div class="no-print-bar" style="background:#333;padding:10px;text-align:center;"><button onclick="window.print()" class="btn btn-success">PRINT PDF</button></div><div class="print-container">${cover}${details}${rubric}${reports}</div></body></html>`); w.document.close(); }
};

/* --- ADMIN --- */
const Admin = {
    refreshDropdowns: () => { const ids = ['subject-class-select', 'stu-class-select', 'assign-class-select', 'tpl-class-select']; ids.forEach(id => { const el = document.getElementById(id); if(!el) return; const cv = el.value; el.innerHTML = '<option value="">SELECT GRADE</option>'; DB.data.classes.forEach(c => el.innerHTML += `<option value="${c.id}">${c.name}</option>`); if(cv) el.value = cv; }); },
    loadDashboard: () => { const t = document.getElementById('admin-status-table'); if(!t) return; t.innerHTML = ''; let hasStudents = false; DB.data.classes.forEach(cls => { const classStudents = DB.data.students.filter(s => s.classId === cls.id); if (classStudents.length > 0) hasStudents = true; classStudents.forEach(s => { let btns = '', cCount = 0; if(cls.subjects) { cls.subjects.forEach(sid => { const m = (DB.data.marks[s.id] && DB.data.marks[s.id][sid]); if(m && m.completed) cCount++; const sub = DB.data.subjects[sid]; if(sub) { const btnColor = (m && m.completed) ? '#10b981' : '#cbd5e1'; const txtColor = (m && m.completed) ? 'white' : '#333'; btns += `<button onclick="ReportEngine.openPrintView(${s.id}, '${sid}')" class="btn btn-sm" style="background:${btnColor}; color:${txtColor}; margin-right:4px;">${sub.name.substring(0,3)}</button>`; } }); } const st = (cls.subjects && cls.subjects.length > 0 && cCount === cls.subjects.length) ? '<span style="color:#10b981;font-weight:bold">COMPLETED</span>' : '<span style="color:#f59e0b">PENDING</span>'; t.innerHTML += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${cls.name} (${s.section || 'A'})</td><td>${st}</td><td><button onclick="ReportEngine.openFullPrintView(${s.id})" class="btn btn-sm btn-primary">FULL REPORT</button> ${btns}</td></tr>`; }); }); if (!hasStudents) { t.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;">No students found. <br><button onclick="UI.show('admin-students')" class="btn btn-sm btn-accent" style="margin-top:10px;">+ Register Student</button></td></tr>`; } },
    loadClassesHierarchy: () => { 
        const c=document.getElementById('class-hierarchy-view');if(!c)return;c.innerHTML='';Admin.refreshDropdowns();
        
        if (!DB.data.classes || DB.data.classes.length === 0) {
            c.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">No classes created yet. Use "Create Grade" on the right.</div>';
            return;
        }

        DB.data.classes.forEach(cls => {
            try {
                if (!cls.id || !cls.name) return; 
                let subH='';
                if(cls.subjects && Array.isArray(cls.subjects)) {
                    cls.subjects.forEach(sid => {
                        const sb=DB.data.subjects[sid];
                        if(sb) subH+=`<span class="subj-tag">${sb.name} <button onclick="Admin.deleteSubject('${cls.id}','${sid}')" style="border:none;background:none;color:red;cursor:pointer;">&times;</button></span>`
                    });
                }
                if(subH === '') subH='<span style="font-size:11px;color:#999;">No Subj</span>';
                let secH='';
                if (cls.sections && Array.isArray(cls.sections)) {
                    cls.sections.forEach(sec => {
                        secH+=`<div class="tree-section"><div class="tree-sec-name">SECTION ${sec}</div><button onclick="Admin.deleteSection('${cls.id}','${sec}')" class="btn-xs-danger">X</button></div>`
                    });
                }
                c.innerHTML+=`
                <div class="class-tree-item">
                    <div class="tree-header"><span>${cls.name}</span><div><button onclick="Admin.deleteClass('${cls.id}')" class="btn-xs-danger" style="margin-right:5px;">DEL</button><button onclick="Admin.addSectionPrompt('${cls.id}')" class="btn-xs-accent">+SEC</button></div></div>
                    <div class="tree-subjects">${subH}</div>${secH}</div>`;
            } catch(e) { console.error("Skipping broken class:", e); }
        }); 
    },
    addClass: () => { 
        const n=document.getElementById('new-class-name').value.toUpperCase(); 
        if(n){
            const newClass = {id:'c_'+Date.now(),name:n,sections:['A'],subjects:[]};
            if (!DB.data.classes) DB.data.classes = [];
            DB.data.classes.push(newClass);
            DB.save();
            document.getElementById('new-class-name').value = '';
        } 
    },
    deleteClass: (id) => { if(confirm("Delete Class?")){DB.data.classes=DB.data.classes.filter(c=>c.id!==id);DB.save();Admin.loadClassesHierarchy();} },
    addSectionPrompt: (id) => { const s=prompt("Section:"); if(s){const c=DB.data.classes.find(x=>x.id===id); if(!c.sections) c.sections = []; if(!c.sections.includes(s.toUpperCase())){c.sections.push(s.toUpperCase());DB.save();Admin.loadClassesHierarchy();}} },
    deleteSection: (cid, sec) => { if(confirm("Del?")){const c=DB.data.classes.find(x=>x.id===cid);c.sections=c.sections.filter(s=>s!==sec);DB.save();Admin.loadClassesHierarchy();} },
    addSubject: () => { 
        try {
            const cid=document.getElementById('subject-class-select').value;
            const n=document.getElementById('new-subject-name').value.toUpperCase(); 
            if(!cid) { alert("Please Select a Grade first!"); return; }
            if(!n) { alert("Please enter a subject name!"); return; }
            const sid='s_'+Date.now(); 
            if(!DB.data.subjects) DB.data.subjects = {}; 
            DB.data.subjects[sid]={name:n,template:DB.createDefaultTemplate(n)}; 
            const c = DB.data.classes.find(x=>x.id===cid);
            if (!c) { alert("Error: Class ID not found in database."); return; }
            if (!c.subjects || !Array.isArray(c.subjects)) c.subjects = [];
            c.subjects.push(sid); 
            DB.save(); 
            document.getElementById('new-subject-name').value='';
            Admin.loadClassesHierarchy();
        } catch(e) { alert("System Error Adding Subject: " + e.message); }
    },
    deleteSubject: (cid, sid) => { if(confirm("Del Subject?")){const c=DB.data.classes.find(x=>x.id===cid);c.subjects=c.subjects.filter(s=>s!==sid);delete DB.data.subjects[sid];DB.save();Admin.loadClassesHierarchy();} },
    onAssignClassChange: () => { const cid = document.getElementById('assign-class-select').value; const sec = document.getElementById('assign-section-select'); sec.innerHTML='<option value="">Sec</option>'; const sub = document.getElementById('assign-subject-select'); sub.innerHTML='<option value="">Subj</option>'; if(!cid) return; const cls = DB.data.classes.find(c => c.id === cid); cls.sections.forEach(s => sec.innerHTML += `<option value="${s}">${s}</option>`); cls.subjects.forEach(sid => { if(DB.data.subjects[sid]) sub.innerHTML += `<option value="${sid}">${DB.data.subjects[sid].name}</option>`; }); },
    loadTeachers: () => { const t=document.getElementById('teacher-list-body'); const s=document.getElementById('assign-teacher-select'); t.innerHTML=''; s.innerHTML='<option value="">Select</option>'; DB.data.users.filter(u=>u.role==='teacher').forEach(u => { t.innerHTML+=`<tr><td>${u.name}</td><td>${u.id}</td><td>${u.email || '-'}</td><td>${u.pass}</td><td><button onclick="Admin.delTeacher('${u.id}')" class="btn btn-sm btn-danger">X</button></td></tr>`; s.innerHTML+=`<option value="${u.id}">${u.name}</option>`; }); Admin.refreshDropdowns(); Admin.loadAssignmentsList(); },
    generateCreds: () => {
        const randId = 'T-' + Math.floor(1000 + Math.random() * 9000);
        const randPass = Math.random().toString(36).slice(-6);
        document.getElementById('new-t-user').value = randId;
        document.getElementById('new-t-pass').value = randPass;
    },
    addTeacher: () => { 
        const n=document.getElementById('new-t-name').value.toUpperCase();
        const u=document.getElementById('new-t-user').value;
        const p=document.getElementById('new-t-pass').value;
        const e=document.getElementById('new-t-email').value; 
        if(n && u && p) {
            const exists = DB.data.users.find(x => x.id === u);
            if (exists) { alert("Error: This Teacher ID already exists! Click 'Auto Generate' again."); return; }
            DB.data.users.push({id:u, pass:p, role:'teacher', name:n, email:e}); 
            DB.save(); 
            Admin.loadTeachers();
            document.getElementById('new-t-name').value = '';
            document.getElementById('new-t-user').value = '';
            document.getElementById('new-t-pass').value = '';
            document.getElementById('new-t-email').value = '';
        } else { alert("Please fill Name, ID and Password."); }
    },
    delTeacher: (id) => { if(confirm("Del?")){DB.data.users=DB.data.users.filter(x=>x.id!==id); DB.save(); Admin.loadTeachers();} },
    assignTeacher: () => { const tid=document.getElementById('assign-teacher-select').value, cid=document.getElementById('assign-class-select').value, s=document.getElementById('assign-section-select').value, sub=document.getElementById('assign-subject-select').value; if(tid&&cid&&s&&sub){ DB.data.assignments.push({teacherId:tid, classId:cid, section:s, subjectId:sub}); DB.save(); Admin.loadAssignmentsList(); alert("Assigned"); } },
    loadAssignmentsList: () => { const l=document.getElementById('assignment-list-table'); if(l){l.innerHTML=''; DB.data.assignments.forEach((a, i) => { const t=DB.data.users.find(u=>u.id===a.teacherId), c=DB.data.classes.find(x=>x.id===a.classId), s=DB.data.subjects[a.subjectId]; if(t&&c&&s) l.innerHTML+=`<tr><td>${c.name}</td><td>${a.section}</td><td>${s.name}</td><td><span style="font-weight:bold; color:var(--text-main);">${t.name}</span></td><td><button onclick="Admin.remAssign(${i})" class="btn-xs-danger">Remove</button></td></tr>`; });} },
    remAssign: (i) => { DB.data.assignments.splice(i,1); DB.save(); Admin.loadAssignmentsList(); },
    importCSV: () => { const i = document.getElementById('csv-upload'); const f = i.files[0]; if (!f) { alert("Select file"); return; } const r = new FileReader(); r.onload = function(e) { const t = e.target.result; const rows = t.split('\n'); if (rows.length < 2) return; for (let i = 1; i < rows.length; i++) { const row = rows[i].trim(); if (!row) continue; const c = row.split(','); if (c.length < 13) continue; const gName = c[2].toUpperCase().trim(); const sName = c[3].toUpperCase().trim(); let cid = null; let cls = DB.data.classes.find(c => c.name === gName); if (!cls) { cid = 'c_' + Date.now() + Math.random().toString(36).substr(2, 5); cls = { id: cid, name: gName, sections: [sName], subjects: [] }; DB.data.classes.push(cls); } else { cid = cls.id; if (!cls.sections.includes(sName)) { cls.sections.push(sName); } } DB.data.students.push({ id: Date.now() + i, roll: c[0].trim(), name: c[1].trim().toUpperCase(), classId: cid, section: sName, parent1: c[4].trim(), parent2: c[5].trim(), gender: c[6].trim(), ageY: c[7].trim(), ageM: c[8].trim(), height: c[9].trim(), weight: c[10].trim(), attendanceP: c[11].trim(), attendanceA: c[12].trim(), pt1: false, pt2: false }); } DB.save(); alert("Imported!"); Admin.loadStudents(); Admin.loadClassesHierarchy(); }; r.readAsText(f); },
    onStudentClassChange: () => { const cid = document.getElementById('stu-class-select').value; const sec = document.getElementById('stu-section-select'); sec.innerHTML = '<option value="">Sec</option>'; const cls = DB.data.classes.find(c => c.id === cid); if(cls) cls.sections.forEach(s => sec.innerHTML += `<option value="${s}">${s}</option>`); },
    loadStudents: () => { const t = document.getElementById('admin-student-list'); if(!t) return; t.innerHTML = ''; Admin.refreshDropdowns(); DB.data.students.forEach((s, idx) => { const cls = DB.data.classes.find(c => c.id === s.classId)?.name || '-'; t.innerHTML += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${cls} [${s.section}]</td><td>${s.parent1 || '-'}</td><td><button onclick="Admin.delStudent(${idx})" class="btn btn-sm btn-danger">X</button></td></tr>`; }); },
    addStudent: () => { const s = { id: Date.now(), name: document.getElementById('stu-name').value.toUpperCase(), roll: document.getElementById('stu-roll').value, classId: document.getElementById('stu-class-select').value, section: document.getElementById('stu-section-select').value, parent1: document.getElementById('stu-p1').value.toUpperCase(), parent2: document.getElementById('stu-p2').value.toUpperCase(), gender: document.getElementById('stu-gender').value, ageY: document.getElementById('stu-age-y').value, ageM: document.getElementById('stu-age-m').value, height: document.getElementById('stu-height').value, weight: document.getElementById('stu-weight').value, attendanceP: document.getElementById('stu-att-p').value, attendanceA: document.getElementById('stu-att-a').value, pt1: document.getElementById('stu-pt1').value === "Yes", pt2: document.getElementById('stu-pt2').value === "Yes" }; if(!s.classId || !s.section || !s.name) { alert("Missing Details"); return; } DB.data.students.push(s); DB.save(); Admin.loadStudents(); alert("Student Saved"); },
    delStudent: (i) => { if(confirm("Delete?")) { DB.data.students.splice(i, 1); DB.save(); Admin.loadStudents(); } }
};

const Template = { initSelect:()=>{Admin.refreshDropdowns()}, onClassChange:()=>{const c=document.getElementById('tpl-class-select').value,s=document.getElementById('tpl-subject-select');s.innerHTML='<option>Subj</option>';const cl=DB.data.classes.find(x=>x.id===c);if(cl)cl.subjects.forEach(sid=>{if(DB.data.subjects[sid])s.innerHTML+=`<option value="${sid}">${DB.data.subjects[sid].name}</option>`})}, load:()=>{const sid=document.getElementById('tpl-subject-select').value;if(!sid)return;Template.currentSubjectId=sid;const t=DB.data.subjects[sid].template;document.getElementById('tpl-title').value=t.title;document.getElementById('tpl-sub').value=t.sub;document.getElementById('tpl-desc').value=t.desc;const qt=t.qTotals||{t1:25,t2:25,mid:50,tot:100};document.getElementById('qt-1').value=qt.t1;document.getElementById('qt-2').value=qt.t2;document.getElementById('qt-3').value=qt.mid;document.getElementById('qt-4').value=qt.tot;Template.renderRows(t.items);ReportEngine.render('editor-preview',t,{},false)}, syncToDB:()=>{if(!Template.currentSubjectId)return;const i=[];document.querySelectorAll('#template-rows .row-item').forEach(r=>i.push({type:r.dataset.type,text:r.querySelector('input').value}));const t=DB.data.subjects[Template.currentSubjectId].template;t.title=document.getElementById('tpl-title').value;t.sub=document.getElementById('tpl-sub').value;t.desc=document.getElementById('tpl-desc').value;t.items=i;t.qTotals={t1:document.getElementById('qt-1').value,t2:document.getElementById('qt-2').value,mid:document.getElementById('qt-3').value,tot:document.getElementById('qt-4').value}}, liveUpdate:()=>{if(!Template.currentSubjectId)return;Template.syncToDB();ReportEngine.render('editor-preview',DB.data.subjects[Template.currentSubjectId].template,{},false)}, renderRows:(i)=>{const c=document.getElementById('template-rows');c.innerHTML='';i.forEach((item,idx)=>{c.innerHTML+=`<div class="row-item" data-type="${item.type}" style="display:flex;gap:5px;margin-bottom:5px;"><span style="font-size:10px;width:15px;font-weight:bold;">${item.type[0].toUpperCase()}</span><input value="${item.text||''}" oninput="Template.liveUpdate()"><button onclick="Template.delItem(${idx})" style="color:red;border:none;">x</button></div>`})}, add:(t)=>{if(Template.currentSubjectId){Template.syncToDB();DB.data.subjects[Template.currentSubjectId].template.items.push({type:t,text:''});Template.load()}}, delItem:(i)=>{Template.syncToDB();DB.data.subjects[Template.currentSubjectId].template.items.splice(i,1);Template.load()}, save:()=>{if(Template.currentSubjectId){Template.syncToDB();DB.save();alert('Saved')}} };
const Teacher = { init:()=>{const t=Auth.user.id,s=document.getElementById('teacher-subject-select');s.innerHTML='<option>Class</option>';DB.data.assignments.filter(a=>a.teacherId===t).forEach((a,i)=>{const c=DB.data.classes.find(x=>x.id===a.classId),sub=DB.data.subjects[a.subjectId];if(c&&sub)s.innerHTML+=`<option value="${i}">${c.name} (${a.section}) - ${sub.name}</option>`})}, loadStudents:()=>{const i=document.getElementById('teacher-subject-select').value;if(i==="")return;const a=DB.data.assignments.filter(as=>as.teacherId===Auth.user.id)[i];Teacher.currSub=a.subjectId;const l=document.getElementById('teacher-student-list');l.innerHTML='';DB.data.students.filter(s=>s.classId===a.classId&&s.section===a.section).forEach(s=>{const d=DB.data.marks[s.id]?.[a.subjectId]?.completed;l.innerHTML+=`<tr><td>${s.roll}</td><td>${s.name}</td><td>${d?'Done':'Pending'}</td><td><button onclick="Teacher.openReport(${s.id})" class="btn btn-sm btn-accent">Edit</button></td></tr>`})}, openReport:(sid)=>{Teacher.currStudent=sid;const s=DB.data.students.find(x=>x.id===sid),sub=DB.data.subjects[Teacher.currSub];document.getElementById('eval-student-name').innerText=`${s.name} - ${sub.name}`;UI.show('evaluation');const m=DB.data.marks[sid]?.[Teacher.currSub]||{};ReportEngine.render('teacher-workspace',sub.template,m,true)}, saveReport:()=>{const s=Teacher.currStudent,sub=Teacher.currSub;if(!DB.data.marks[s])DB.data.marks[s]={};if(!DB.data.marks[s][sub])DB.data.marks[s][sub]={};const d=DB.data.marks[s][sub];document.querySelectorAll('.inp-mark').forEach(i=>{d[i.id]=i.type==='checkbox'?i.checked:i.value});d.completed=true;DB.save();alert('Saved');UI.show('teacher-dashboard');Teacher.loadStudents()} };

window.onload = () => { DB.init(); Theme.init(); Auth.check(); }; 
document.getElementById('loginForm').addEventListener('submit', (e)=>{ e.preventDefault(); Auth.login(); });

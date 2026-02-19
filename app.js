/* ==========================================================================
   APP ENGINE (v130.0) - SELF REFLECTION GLOBALS
   ========================================================================== */

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

if (!firebase.apps.length) { firebase.initializeApp(firebaseConfig); }
const dbRef = firebase.database().ref('schoolData');

const Mobile = { toggleMenu: () => { document.getElementById('app-sidebar').classList.toggle('active'); document.getElementById('mobile-backdrop').classList.toggle('active'); } };
const Theme = { init: () => { const t = localStorage.getItem('academus_theme'); if (t === 'dark') { document.body.setAttribute('data-theme', 'dark'); const i = document.getElementById('theme-icon'); if(i) i.className = 'fas fa-sun'; } else { document.body.removeAttribute('data-theme'); const i = document.getElementById('theme-icon'); if(i) i.className = 'fas fa-moon'; } }, toggle: () => { const d = document.body.hasAttribute('data-theme'); if (d) { document.body.removeAttribute('data-theme'); localStorage.setItem('academus_theme', 'light'); document.getElementById('theme-icon').className = 'fas fa-moon'; } else { document.body.setAttribute('data-theme', 'dark'); localStorage.setItem('academus_theme', 'dark'); document.getElementById('theme-icon').className = 'fas fa-sun'; } } };

const DB = {
    defaults: { 
        users: [{ id: 'admin', pass: 'admin', role: 'admin', name: 'Administrator' }], 
        classes: [], subjects: {}, assignments: [], students: [], marks: {}, classTeachers: {}, classPhotos: {}, generalRemarks: {}, globalSignatures: {}, classTeacherSignatures: {},
        globalConfig: {
            signatures: [
                { title: "Class Teacher", role: "ct", imgKey: null },
                { title: "Academic Manager", role: "static", imgKey: null },
                { title: "School Directress", role: "static", imgKey: null }
            ],
            // NEW: Default reflection questions
            reflectionEval: [
                "My teachers provide me with feedback about my learning on a regular basis.",
                "My teachers help me to understand the mistakes I have made.",
                "My teachers regularly mark my work and return it to me promptly.",
                "My teachers provide support when I am having difficulties.",
                "I am encouraged to give feedback to teachers on my learning.",
                "In my assignments, I know what I have to do to be successful."
            ],
            reflectionVoice: [
                "Did the lesson/topic achieve its stated aims?",
                "Did you find the work easy?",
                "Were you able to ask for help if you didn't understand something?",
                "Did the feedback you received from the teacher improved your learning?"
            ]
        }
    },
    data: {}, 
    sanitize: (val) => {
        if (!val) return DB.defaults;
        if (!val.classes) val.classes = []; if (!Array.isArray(val.classes)) val.classes = Object.values(val.classes);
        if (!val.students) val.students = []; if (!Array.isArray(val.students)) val.students = Object.values(val.students);
        if (!val.subjects) val.subjects = {};
        if (!val.assignments) val.assignments = [];
        if (!val.marks) val.marks = {};
        if (!val.users) val.users = DB.defaults.users;
        if (!val.classTeachers) val.classTeachers = {};
        if (!val.classPhotos) val.classPhotos = {};
        if (!val.generalRemarks) val.generalRemarks = {};
        if (!val.globalSignatures) val.globalSignatures = {};
        if (!val.classTeacherSignatures) val.classTeacherSignatures = {};
        if (!val.globalConfig) val.globalConfig = DB.defaults.globalConfig;
        if (!val.globalConfig.signatures) val.globalConfig.signatures = DB.defaults.globalConfig.signatures;
        if (!val.globalConfig.reflectionEval) val.globalConfig.reflectionEval = DB.defaults.globalConfig.reflectionEval;
        if (!val.globalConfig.reflectionVoice) val.globalConfig.reflectionVoice = DB.defaults.globalConfig.reflectionVoice;
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
            if (val) { 
                DB.data = DB.sanitize(val); 
                if (!document.getElementById('view-admin-classes').classList.contains('hidden')) Admin.loadClassesHierarchy(); 
                if (!document.getElementById('view-admin-teachers').classList.contains('hidden')) {
                    Admin.loadTeachers(); Admin.loadAssignmentsList(); Admin.loadClassTeachers(); 
                }
            }
        });
    },
    save: () => { dbRef.set(DB.data).then(() => { console.log("Cloud Saved."); }).catch(e => alert("Save Error: " + e.message)); },
    reset: () => { if(confirm("⚠️ DANGER: RESET ALL DATA?")) { DB.data = DB.defaults; DB.save(); alert("Reset."); location.reload(); } },
    createDefaultTemplate: (t) => { return { title: t||'REPORT CARD', sub: 'TERM EVALUATION', desc: 'Student performance report.', qTotals: { t1:25, t2:25, mid:50, tot:100 }, items: [], showQuant: true, showRemarks: true }; }
};

const UI = { 
    show: (id) => { 
        document.querySelectorAll('.page-section').forEach(e => e.classList.add('hidden')); 
        document.getElementById('view-' + id)?.classList.remove('hidden'); 
        if(id === 'admin-dashboard') Admin.loadDashboard(); 
        if(id === 'admin-classes') Admin.loadClassesHierarchy(); 
        if(id === 'admin-teachers') { Admin.loadTeachers(); Admin.loadAssignmentsList(); Admin.loadClassTeachers(); } 
        if(id === 'admin-students') Admin.loadStudents(); 
        if(id === 'admin-template') Template.initSelect(); 
        if(id === 'teacher-dashboard') Teacher.init(); 
    } 
};

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
        btn.innerHTML = 'Verifying...'; btn.disabled = true;
        setTimeout(() => {
            const f = DB.data.users.find(x => x.id === u && x.pass === p);
            if (f) { btn.innerHTML = 'Success!'; setTimeout(() => { sessionStorage.setItem('uid', f.id); location.reload(); }, 500); } 
            else { btn.innerHTML = 'Login'; btn.disabled = false; alert('Invalid Credentials'); }
        }, 1000); 
    },
    logout: () => { sessionStorage.clear(); location.reload(); }
};

/* --- REPORT ENGINE --- */
const ReportEngine = {
    calcAvg: (classId, section, field) => { const students = DB.data.students.filter(s => s.classId === classId && s.section === section); if(!students.length) return 0; const total = students.reduce((sum, s) => sum + (parseFloat(s[field]) || 0), 0); return (total / students.length).toFixed(1); },
    generateDetailsPage: (s) => { 
        const cls = DB.data.classes.find(c => c.id === s.classId) || {name:'Preview Grade'}; 
        const avgAgeY = ReportEngine.calcAvg(s.classId, s.section, 'ageY'); const avgHt = ReportEngine.calcAvg(s.classId, s.section, 'height'); const avgWt = ReportEngine.calcAvg(s.classId, s.section, 'weight'); const totalAtt = (parseInt(s.attendanceP)||0) + (parseInt(s.attendanceA)||0); const check = (val) => `<span class="dt-check ${val?'checked':''}"></span>`; 
        return `<div class="details-page"><img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="details-content"><div class="details-header">Student Details</div><table class="details-table-new"><tr><th>Name</th><td colspan="3">${s.name}</td></tr><tr><th>Parent/Guardian's Name (1)</th><td colspan="3">${s.parent1 || '-'}</td></tr><tr><th>Parent/Guardian's Name (2)</th><td colspan="3">${s.parent2 || '-'}</td></tr><tr><th>Level</th><td>${cls.name}</td><td style="width:25%;">Section:</td><td>${s.section}</td></tr><tr><th>Age</th><td>Years: ${s.ageY}</td><td style="width:25%;">Months: ${s.ageM}</td><td>Class Average: ${avgAgeY} Yrs</td></tr><tr><th>Gender</th><td colspan="3">Male ${check(s.gender==='M')} Female ${check(s.gender==='F')}</td></tr><tr><th>Attendance</th><td>Present: ${s.attendanceP||0}</td><td style="width:25%;">Absent: ${s.attendanceA||0}</td><td>Total: ${totalAtt}</td></tr><tr><th>Physical Measurement</th><td>Height (cm): ${s.height}</td><td style="width:25%;">Weight (Kg): ${s.weight}</td><td>Class Average: <br>H: ${avgHt} | W: ${avgWt}</td></tr><tr><th>Parent Teacher Conference 1</th><td colspan="3">Yes ${check(s.pt1)} No ${check(!s.pt1)}</td></tr><tr><th>Parent Teacher Conference 2</th><td colspan="3">Yes ${check(s.pt2)} No ${check(!s.pt2)}</td></tr></table></div></div>`; 
    },
    generateRubricPage: () => { return `<div class="details-page"><img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="content-area"><div style="height: 40px;"></div> <div class="rubric-title">UNDERSTANDING THE REPORT</div><div class="rubric-text"><b>Objectives</b><br>Academus has an academic and co-curricular checkpoints for students...</div><div class="rubric-text"><b>Testing</b><br>Academus has a set standard of assessing its students using formal and informal methods. Our testing is based on year round evaluation and portfolio analysis of students.</div><div class="rubric-text" style="margin-bottom:10px;"><b>Evaluation Rubric</b></div><table class="rubric-table"><thead><tr><th style="width:20%">Key Attributes</th><th style="width:15%">Key Symbol</th><th>Description</th></tr></thead><tbody><tr class="rubric-row-grey"><td class="rubric-col-attr">Exceeds<br>Learning<br>Expectations</td><td class="rubric-col-sym">ELE</td><td class="rubric-col-desc">The child displays impeccable progress towards set objectives and goals. The child achieves all milestones independently.</td></tr><tr class="rubric-row-white"><td class="rubric-col-attr">Meets Learning<br>Expectations</td><td class="rubric-col-sym">MLE</td><td class="rubric-col-desc">The child meets all the learning outcomes with precision and clarity of understanding.</td></tr><tr class="rubric-row-grey"><td class="rubric-col-attr">Progressing</td><td class="rubric-col-sym">P</td><td class="rubric-col-desc">The child is at an intermediate level, and is completing the given tasks in a satisfactory manner.</td></tr><tr class="rubric-row-white"><td class="rubric-col-attr">Needs<br>Improvement</td><td class="rubric-col-sym">NI</td><td class="rubric-col-desc">The child is starting to attempt or is in a phase of development.</td></tr></tbody></table></div></div>`; },
    
    // --- NEW: GENERATE SELF REFLECTION PAGE ---
    generateReflectionPage: () => {
        const evalQs = DB.data.globalConfig.reflectionEval || [];
        const voiceQs = DB.data.globalConfig.reflectionVoice || [];

        let evalHTML = '';
        evalQs.forEach((q, i) => {
            evalHTML += `<tr><td class="ref-col-num">${i+1}</td><td class="ref-col-q">${q}</td><td><div class="ref-box"></div></td><td><div class="ref-box"></div></td><td><div class="ref-box"></div></td></tr>`;
        });

        let voiceHTML = '';
        voiceQs.forEach((q, i) => {
            voiceHTML += `<tr><td class="ref-col-num">${i+1}</td><td class="ref-col-q">${q}</td><td><div class="ref-box"></div></td><td><div class="ref-box"></div></td><td><div class="ref-box"></div></td></tr>`;
        });

        return `
        <div class="report-page">
            <img src="header footer.png" class="layer-frame">
            <img src="background.png" class="layer-lion">
            <div class="content-area">
                <div class="reflection-title" style="margin-top: 10px;">SELF REFLECTION</div>
                
                <table class="ref-table">
                    <thead>
                        <tr><th></th><th>MY LEARNING EVALUATION</th><th>ALWAYS</th><th>MOST OF THE<br>TIME</th><th>SOMETIMES</th></tr>
                    </thead>
                    <tbody>${evalHTML}</tbody>
                </table>

                <table class="ref-table">
                    <thead>
                        <tr><th></th><th>MY VOICE</th><th>YES</th><th>NO</th><th>MAYBE</th></tr>
                    </thead>
                    <tbody>${voiceHTML}</tbody>
                </table>
            </div>
        </div>`;
    },

    generateLastPage: (s) => {
        const classKey = s.classId && s.section ? `${s.classId}_${s.section}` : null;
        const photo = classKey ? (DB.data.classPhotos[classKey] || '') : ''; 
        const remark = s.id ? (DB.data.generalRemarks[s.id] || '') : 'Remarks will appear here...';
        
        const teacherId = classKey ? DB.data.classTeachers[classKey] : null;
        const ctSigImage = (teacherId && DB.data.classTeacherSignatures[teacherId]) ? DB.data.classTeacherSignatures[teacherId] : null;

        let signaturesHTML = '';
        const sigConfig = DB.data.globalConfig.signatures;
        
        if (sigConfig && Array.isArray(sigConfig)) {
            const count = sigConfig.length;
            const width = count > 0 ? (100 / count) : 100;

            sigConfig.forEach(sig => {
                let imgSrc = '';
                if (sig.role === 'ct') {
                    imgSrc = ctSigImage; 
                } else if (sig.role === 'static' && sig.imgKey && DB.data.globalSignatures[sig.imgKey]) {
                    imgSrc = DB.data.globalSignatures[sig.imgKey]; 
                }
                const imgTag = imgSrc ? `<img src="${imgSrc}" class="sig-image">` : `<span class="fake-sig">Signature</span>`;
                signaturesHTML += `<div class="sig-block" style="width: ${width}%"><div class="sig-line">${imgTag}</div><div class="sig-title">${sig.title}</div></div>`;
            });
        }

        return `<div class="last-page"><img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="last-page-content"><div class="general-remarks-box"><div class="general-remarks-header">TEACHER REMARKS & NOTES</div><div style="margin-top:20px; font-family:'Courier New', cursive; font-size:14pt; line-height:1.5;">${remark || 'Remarks will appear here...'}</div></div><div class="photo-section-header">CLASS PHOTOGRAPH</div><div class="photo-frame">${photo ? `<img src="${photo}">` : '<span style="color:#ccc;">Class Photo Placeholder</span>'}</div><div class="signatures-row">${signaturesHTML}</div><div class="disclaimer-footer">Disclaimer: This report card is copyright property of Academus International School, and privy to all intellectual property rights. This report card is a highly confidential, and pertains to only intended individuals. If lost, please return to Academus International School: ST 4/1-3, Block I, Gulistan e Jauhar, Karachi, Pakistan.<div style="text-align:right; margin-top:5px;">Term-I/2025-26</div></div></div></div>`;
    },

    addHeader: (c, t, s, d) => { c.innerHTML += `<div class="main-title">${t}</div>`; if (s) c.innerHTML += `<div class="sub-title">${s}</div>`; if (d) c.innerHTML += `<div class="description">${d}</div>`; return 60 + (d ? (d.length / 90 * 18) + 20 : 0); },
    createTable: () => { const t = document.createElement('table'); t.className = 'report-table'; t.innerHTML = `<thead><tr class="main-header"><th>AREAS</th><th style="width:30px">ELE</th><th style="width:30px">MLE</th><th style="width:30px">P</th><th style="width:30px">NI</th></tr></thead><tbody></tbody>`; return t; },
    
    render: (c, t, m, a) => {
        const container = document.getElementById(c) || document.createElement('div'); container.innerHTML = '';
        const chk = (id, v) => a ? `<input type="checkbox" id="${id}" class="inp-mark" ${v?'checked':''} onclick="ReportEngine.radioBehavior(this)">` : (v?'<span style="font-family:sans-serif;font-weight:bold;color:#002060;">&#10003;</span>':'');
        const qT = t.qTotals || { t1:25, t2:25, mid:50, tot:100 };
        const qInp = (id, v, max) => a ? `<div style="display:flex;align-items:center;justify-content:center;gap:4px;"><input type="number" id="${id}" class="inp-mark" value="${v||''}" style="width:60px; text-align:center; margin:0; padding:5px; height:35px;" max="${max}" oninput="if(parseInt(this.value)>${max}) this.value=${max}"><span style="font-size:12px; font-weight:bold;">/${max}</span></div>` : `<span style="font-weight:bold;">${v||'-'} / ${max}</span>`;
        const box = (id, v) => a ? `<textarea id="${id}" class="inp-mark" style="width:100%; min-height:40px; border:none; resize:none; background:transparent;" oninput="this.style.height='';this.style.height=this.scrollHeight+'px'">${v||''}</textarea>` : `<div style="padding:5px;white-space:pre-wrap;">${v||''}</div>`;
        const showQuant = t.showQuant !== false; const showRemarks = t.showRemarks !== false;
        let FOOTER_REQUIRED_SPACE = 20 + (showQuant?100:0) + (showRemarks?120:0); const LIMIT = 960; 
        let pg = ReportEngine.pg(), cnt = pg.querySelector('.content-area'); let y = ReportEngine.addHeader(cnt, t.title, t.sub, t.desc); 
        if (t.items && t.items.length > 0) {
            let tbl = ReportEngine.createTable(); cnt.appendChild(tbl); let tbody = tbl.querySelector('tbody'); y += 40; 
            t.items.forEach((i, idx) => { 
                const h = i.type === 'header' ? 45 : 35; 
                if (i.type === 'break' || y + h > LIMIT) { container.appendChild(pg); pg = ReportEngine.pg(); cnt = pg.querySelector('.content-area'); y = 20; tbl = ReportEngine.createTable(); cnt.appendChild(tbl); tbody = tbl.querySelector('tbody'); y += 40; if (i.type === 'break') return; } 
                const tr = document.createElement('tr'); 
                if (i.type === 'header') { tr.className = 'section-row'; tr.innerHTML = `<td colspan="5">${i.text}</td>`; } 
                else { const b = `r${idx}`; tr.className = 'data-row'; tr.innerHTML = `<td>${i.text}</td><td class="check-box">${chk(b+'c1',m[b+'c1'])}</td><td class="check-box">${chk(b+'c2',m[b+'c2'])}</td><td class="check-box">${chk(b+'c3',m[b+'c3'])}</td><td class="check-box">${chk(b+'c4',m[b+'c4'])}</td>`; } 
                tbody.appendChild(tr); y += h; 
            });
        }
        if (y + FOOTER_REQUIRED_SPACE > LIMIT) { container.appendChild(pg); pg = ReportEngine.pg(); cnt = pg.querySelector('.content-area'); }
        let footerHTML = `<div class="footer-block">`;
        if (showQuant) footerHTML += `<div class="quant-header">Quantitative</div><table class="report-table"><tr><th>1st Term</th><th>2nd Term</th><th>Mid Term</th><th>Total</th><th>%</th></tr><tr><td style="text-align:center;">${qInp('sc1',m.sc1, qT.t1)}</td><td style="text-align:center;">${qInp('sc2',m.sc2, qT.t2)}</td><td style="text-align:center;">${qInp('sc3',m.sc3, qT.mid)}</td><td style="text-align:center;">${qInp('sc4',m.sc4, qT.tot)}</td><td style="text-align:center;">${qInp('sc5',m.sc5, 100)}</td></tr></table>`;
        if (showRemarks) footerHTML += `<div class="remarks-box"><div class="remarks-label">TEACHER REMARKS</div>${box('rem',m.rem)}</div>`;
        footerHTML += `</div>`; cnt.innerHTML += footerHTML;
        container.appendChild(pg); return container.innerHTML;
    },
    pg: () => { const d = document.createElement('div'); d.className = 'report-page'; d.innerHTML = `<img src="header footer.png" class="layer-frame"><img src="background.png" class="layer-lion"><div class="content-area"></div>`; return d; },
    openPrintView: (sid, subIds) => ReportEngine.buildAndOpen(sid, Array.isArray(subIds) ? subIds : [subIds]),
    openFullPrintView: (sid) => { const s = DB.data.students.find(x => x.id === sid); const cls = DB.data.classes.find(c => c.id === s.classId); ReportEngine.buildAndOpen(sid, cls.subjects); },
    
    buildAndOpen: (sid, subIds) => { 
        const s = DB.data.students.find(x => x.id === sid); 
        const cls = DB.data.classes.find(c => c.id === s.classId); 
        
        const cover = `
        <div class="cover-page" style="width: 794px; height: 1123px; position: relative; overflow: hidden; display: block;">
            <img src="cover.jpg" onerror="this.style.display='none'" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; z-index: 1;">
            <div style="position: absolute; left: 200px; bottom: 135px; font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 700; color: #002060; z-index: 10;">${s.name}</div>
            <div style="position: absolute; left: 200px; bottom: 75px; font-family: 'Poppins', sans-serif; font-size: 20px; font-weight: 700; color: #002060; z-index: 10;">${cls.name} - ${s.section}</div>
        </div>`; 
        
        const details = ReportEngine.generateDetailsPage(s); 
        const rubric = ReportEngine.generateRubricPage(); 
        let reports = ''; 
        subIds.forEach(id => { const sub = DB.data.subjects[id]; if (sub) { const m = (DB.data.marks[sid] && DB.data.marks[sid][id]) ? DB.data.marks[sid][id] : {}; reports += ReportEngine.render(null, sub.template, m, false); } }); 
        
        // APPEND REFLECTION THEN LAST PAGE
        const reflectionPage = ReportEngine.generateReflectionPage();
        const lastPage = ReportEngine.generateLastPage(s);
        
        const w = window.open('', '_blank'); 
        w.document.write(`<html><head><title>${s.name}</title><link rel="stylesheet" href="style.css"><style>.forced-print-bar { position: fixed; top: 0; left: 0; width: 100%; background: #1e293b; padding: 15px; text-align: center; z-index: 10000; box-shadow: 0 4px 10px rgba(0,0,0,0.3); } .forced-btn { background: #10b981; color: white; border: none; padding: 10px 25px; font-size: 16px; font-weight: bold; border-radius: 6px; cursor: pointer; } @media print { .forced-print-bar { display: none !important; } }</style></head><body><div class="forced-print-bar"><button class="forced-btn" onclick="window.print()">🖨️ PRINT PDF</button></div><div class="print-container">${cover}${details}${rubric}${reports}${reflectionPage}${lastPage}</div></body></html>`); 
        w.document.close(); 
    }
};

/* --- ADMIN --- */
const Admin = {
    refreshDropdowns: () => { const ids = ['subject-class-select', 'stu-class-select', 'assign-class-select', 'tpl-class-select', 'ct-class-select']; ids.forEach(id => { const el = document.getElementById(id); if(!el) return; const cv = el.value; el.innerHTML = '<option value="">SELECT GRADE</option>'; DB.data.classes.forEach(c => el.innerHTML += `<option value="${c.id}">${c.name}</option>`); if(cv) el.value = cv; }); },
    loadDashboard: () => { const t = document.getElementById('admin-status-table'); if(!t) return; t.innerHTML = ''; let hasStudents = false; DB.data.classes.forEach(cls => { const classStudents = DB.data.students.filter(s => s.classId === cls.id); if (classStudents.length > 0) hasStudents = true; classStudents.forEach(s => { let btns = '', cCount = 0; if(cls.subjects) { cls.subjects.forEach(sid => { const m = (DB.data.marks[s.id] && DB.data.marks[s.id][sid]); if(m && m.completed) cCount++; const sub = DB.data.subjects[sid]; if(sub) { const btnColor = (m && m.completed) ? '#10b981' : '#cbd5e1'; const txtColor = (m && m.completed) ? 'white' : '#333'; btns += `<button onclick="ReportEngine.openPrintView(${s.id}, '${sid}')" class="btn btn-sm" style="background:${btnColor}; color:${txtColor}; margin-right:4px;">${sub.name.substring(0,3)}</button>`; } }); } const st = (cls.subjects && cls.subjects.length > 0 && cCount === cls.subjects.length) ? '<span style="color:#10b981;font-weight:bold">COMPLETED</span>' : '<span style="color:#f59e0b">PENDING</span>'; t.innerHTML += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${cls.name} (${s.section || 'A'})</td><td>${st}</td><td><button onclick="ReportEngine.openFullPrintView(${s.id})" class="btn btn-sm btn-primary">FULL REPORT</button> ${btns}</td></tr>`; }); }); if (!hasStudents) { t.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:30px; color:#64748b;">No students found. <br><button onclick="UI.show('admin-students')" class="btn btn-sm btn-accent" style="margin-top:10px;">+ Register Student</button></td></tr>`; } },
    loadClassesHierarchy: () => { 
        const c=document.getElementById('class-hierarchy-view');if(!c)return;c.innerHTML='';Admin.refreshDropdowns();
        if (!DB.data.classes || DB.data.classes.length === 0) { c.innerHTML = '<div style="padding:20px; text-align:center; color:#888;">No classes created yet. Use "Create Grade" on the right.</div>'; return; }
        DB.data.classes.forEach(cls => { try { if (!cls.id || !cls.name) return; let subH=''; if(cls.subjects && Array.isArray(cls.subjects)) { cls.subjects.forEach(sid => { const sb=DB.data.subjects[sid]; if(sb) subH+=`<span class="subj-tag">${sb.name} <button onclick="Admin.deleteSubject('${cls.id}','${sid}')" style="border:none;background:none;color:red;cursor:pointer;">&times;</button></span>` }); } if(subH === '') subH='<span style="font-size:11px;color:#999;">No Subj</span>'; let secH=''; if (cls.sections && Array.isArray(cls.sections)) { cls.sections.forEach(sec => { secH+=`<div class="tree-section"><div class="tree-sec-name">SECTION ${sec}</div><button onclick="Admin.deleteSection('${cls.id}','${sec}')" class="btn-xs-danger">X</button></div>` }); } c.innerHTML+=`<div class="class-tree-item"><div class="tree-header"><span>${cls.name}</span><div><button onclick="Admin.deleteClass('${cls.id}')" class="btn-xs-danger" style="margin-right:5px;">DEL</button><button onclick="Admin.addSectionPrompt('${cls.id}')" class="btn-xs-accent">+SEC</button></div></div><div class="tree-subjects">${subH}</div>${secH}</div>`; } catch(e) { console.error(e); } }); 
    },
    addClass: () => { const n=document.getElementById('new-class-name').value.toUpperCase(); if(n){ const newClass = {id:'c_'+Date.now(),name:n,sections:['A'],subjects:[]}; if (!DB.data.classes) DB.data.classes = []; DB.data.classes.push(newClass); DB.save(); document.getElementById('new-class-name').value = ''; } },
    deleteClass: (id) => { if(confirm("Delete Class?")){DB.data.classes=DB.data.classes.filter(c=>c.id!==id);DB.save();Admin.loadClassesHierarchy();} },
    addSectionPrompt: (id) => { const s=prompt("Section:"); if(s){const c=DB.data.classes.find(x=>x.id===id); if(!c.sections) c.sections = []; if(!c.sections.includes(s.toUpperCase())){c.sections.push(s.toUpperCase());DB.save();Admin.loadClassesHierarchy();}} },
    deleteSection: (cid, sec) => { if(confirm("Del?")){const c=DB.data.classes.find(x=>x.id===cid);c.sections=c.sections.filter(s=>s!==sec);DB.save();Admin.loadClassesHierarchy();} },
    addSubject: () => { try { const cid=document.getElementById('subject-class-select').value; const n=document.getElementById('new-subject-name').value.toUpperCase(); if(!cid) { alert("Select Grade"); return; } if(!n) { alert("Enter Name"); return; } const sid='s_'+Date.now(); if(!DB.data.subjects) DB.data.subjects = {}; DB.data.subjects[sid]={name:n,template:DB.createDefaultTemplate(n)}; const c = DB.data.classes.find(x=>x.id===cid); if (!c) { alert("Error: Class ID not found in database."); return; } if (!c.subjects) c.subjects = []; c.subjects.push(sid); DB.save(); document.getElementById('new-subject-name').value=''; Admin.loadClassesHierarchy(); } catch(e) { alert("Error"); } },
    deleteSubject: (cid, sid) => { if(confirm("Del Subject?")){const c=DB.data.classes.find(x=>x.id===cid);c.subjects=c.subjects.filter(s=>s!==sid);delete DB.data.subjects[sid];DB.save();Admin.loadClassesHierarchy();} },
    onAssignClassChange: () => { const cid = document.getElementById('assign-class-select').value; const sec = document.getElementById('assign-section-select'); sec.innerHTML='<option value="">Sec</option>'; const sub = document.getElementById('assign-subject-select'); sub.innerHTML='<option value="">Subj</option>'; if(!cid) return; const cls = DB.data.classes.find(c => c.id === cid); cls.sections.forEach(s => sec.innerHTML += `<option value="${s}">${s}</option>`); cls.subjects.forEach(sid => { if(DB.data.subjects[sid]) sub.innerHTML += `<option value="${sid}">${DB.data.subjects[sid].name}</option>`; }); },
    loadTeachers: () => { const t=document.getElementById('teacher-list-body'); const s=document.getElementById('assign-teacher-select'); t.innerHTML=''; s.innerHTML='<option value="">Select Teacher</option>'; DB.data.users.filter(u=>u.role==='teacher').forEach(u => { t.innerHTML+=`<tr><td>${u.name}</td><td>${u.id}</td><td>${u.pass}</td><td><button onclick="Admin.delTeacher('${u.id}')" class="btn-xs-danger">X</button></td></tr>`; s.innerHTML+=`<option value="${u.id}">${u.name}</option>`; }); Admin.refreshDropdowns(); Admin.loadAssignmentsList(); Admin.loadClassTeachers(); },
    generateCreds: () => { document.getElementById('new-t-user').value = 'T-' + Math.floor(1000 + Math.random() * 9000); document.getElementById('new-t-pass').value = Math.random().toString(36).slice(-6); },
    addTeacher: () => { const n=document.getElementById('new-t-name').value.toUpperCase(); const u=document.getElementById('new-t-user').value; const p=document.getElementById('new-t-pass').value; if(n && u && p) { const exists = DB.data.users.find(x => x.id === u); if (exists) { alert("Exists!"); return; } DB.data.users.push({id:u, pass:p, role:'teacher', name:n}); DB.save(); Admin.loadTeachers(); } },
    delTeacher: (id) => { if(confirm("Del?")){DB.data.users=DB.data.users.filter(x=>x.id!==id); DB.save(); Admin.loadTeachers();} },
    assignTeacher: () => { 
        const tid=document.getElementById('assign-teacher-select').value;
        const cid=document.getElementById('assign-class-select').value;
        const s=document.getElementById('assign-section-select').value;
        const sub=document.getElementById('assign-subject-select').value; 
        const isClassTeacher = document.getElementById('assign-is-ct').checked;
        if(!tid || !cid || !s) { alert("ERROR: You must select a Grade, Section, and Teacher."); return; }
        if(isClassTeacher) { 
            const key = `${cid}_${s}`; 
            if(!DB.data.classTeachers) DB.data.classTeachers = {};
            if(DB.data.classTeachers[key]) { alert(`Error: This section already has a Class Teacher.`); return; } 
            DB.data.classTeachers[key] = tid; 
            DB.save(); alert("Class Teacher Assigned Successfully!"); Admin.loadClassTeachers(); return; 
        }
        if(!sub) { alert("ERROR: Please select a Subject to assign."); return; }
        if(!DB.data.assignments) DB.data.assignments = [];
        DB.data.assignments.push({teacherId:tid, classId:cid, section:s, subjectId:sub}); 
        DB.save(); Admin.loadAssignmentsList(); alert("Subject Teacher Assigned Successfully!"); 
    },
    loadAssignmentsList: () => { 
        const l=document.getElementById('assignment-list-table'); 
        if(!l) return;
        l.innerHTML=''; 
        if(!DB.data.assignments) return;
        DB.data.assignments.forEach((a, i) => { 
            const t = DB.data.users ? DB.data.users.find(u=>u.id===a.teacherId) : null;
            const c = DB.data.classes ? DB.data.classes.find(x=>x.id===a.classId) : null;
            const s = DB.data.subjects ? DB.data.subjects[a.subjectId] : null;
            const cName = c ? c.name : `<span style="color:red">Data Error</span>`;
            const tName = t ? t.name : `<span style="color:red">Data Error</span>`;
            const sName = s ? s.name : `<span style="color:red">Data Error</span>`;
            l.innerHTML+=`<tr><td>${cName}</td><td>${a.section}</td><td>${sName}</td><td>${tName}</td><td><button onclick="Admin.remAssign(${i})" class="btn-xs-danger">Remove</button></td></tr>`; 
        });
    },
    remAssign: (i) => { DB.data.assignments.splice(i,1); DB.save(); Admin.loadAssignmentsList(); },
    loadClassTeachers: () => {
        const l = document.getElementById('class-teacher-list');
        if(!l) return;
        l.innerHTML = '';
        if(!DB.data.classTeachers) return;
        for(let key in DB.data.classTeachers) {
            const teacherId = DB.data.classTeachers[key];
            const lastIdx = key.lastIndexOf('_');
            const cid = key.substring(0, lastIdx);
            const sec = key.substring(lastIdx + 1);
            const cls = DB.data.classes ? DB.data.classes.find(c => c.id === cid) : null;
            const t = DB.data.users ? DB.data.users.find(u => u.id === teacherId) : null;
            const cName = cls ? cls.name : `<span style="color:red">Data Error</span>`;
            const tName = t ? t.name : `<span style="color:red">Data Error</span>`;
            l.innerHTML += `<tr><td>${cName}</td><td>${sec}</td><td>${tName}</td><td><button onclick="Admin.remClassTeacher('${key}')" class="btn-xs-danger">Remove</button></td></tr>`;
        }
    },
    remClassTeacher: (key) => { if(confirm("Remove Class Teacher?")) { delete DB.data.classTeachers[key]; DB.save(); Admin.loadClassTeachers(); } },

    importCSV: () => { const i = document.getElementById('csv-upload'); const f = i.files[0]; if (!f) { alert("Select file"); return; } const r = new FileReader(); r.onload = function(e) { const t = e.target.result; const rows = t.split('\n'); if (rows.length < 2) return; for (let i = 1; i < rows.length; i++) { const row = rows[i].trim(); if (!row) continue; const c = row.split(','); if (c.length < 13) continue; const gName = c[2].toUpperCase().trim(); const sName = c[3].toUpperCase().trim(); let cid = null; let cls = DB.data.classes.find(c => c.name === gName); if (!cls) { cid = 'c_' + Date.now() + Math.random().toString(36).substr(2, 5); cls = { id: cid, name: gName, sections: [sName], subjects: [] }; DB.data.classes.push(cls); } else { cid = cls.id; if (!cls.sections.includes(sName)) { cls.sections.push(sName); } } DB.data.students.push({ id: Date.now() + i, roll: c[0].trim(), name: c[1].trim().toUpperCase(), classId: cid, section: sName, parent1: c[4].trim(), parent2: c[5].trim(), gender: c[6].trim(), ageY: c[7].trim(), ageM: c[8].trim(), height: c[9].trim(), weight: c[10].trim(), attendanceP: c[11].trim(), attendanceA: c[12].trim(), pt1: false, pt2: false }); } DB.save(); alert("Imported!"); Admin.loadStudents(); Admin.loadClassesHierarchy(); }; r.readAsText(f); },
    onStudentClassChange: () => { const cid = document.getElementById('stu-class-select').value; const sec = document.getElementById('stu-section-select'); sec.innerHTML = '<option value="">Sec</option>'; const cls = DB.data.classes.find(c => c.id === cid); if(cls) cls.sections.forEach(s => sec.innerHTML += `<option value="${s}">${s}</option>`); },
    loadStudents: () => { const t = document.getElementById('admin-student-list'); if(!t) return; t.innerHTML = ''; Admin.refreshDropdowns(); DB.data.students.forEach((s, idx) => { const cls = DB.data.classes.find(c => c.id === s.classId)?.name || '-'; t.innerHTML += `<tr><td>${s.roll}</td><td>${s.name}</td><td>${cls} [${s.section}]</td><td>${s.parent1 || '-'}</td><td><button onclick="Admin.delStudent(${idx})" class="btn btn-sm btn-danger">X</button></td></tr>`; }); },
    addStudent: () => { const s = { id: Date.now(), name: document.getElementById('stu-name').value.toUpperCase(), roll: document.getElementById('stu-roll').value, classId: document.getElementById('stu-class-select').value, section: document.getElementById('stu-section-select').value, parent1: document.getElementById('stu-p1').value.toUpperCase(), parent2: document.getElementById('stu-p2').value.toUpperCase(), gender: document.getElementById('stu-gender').value, ageY: document.getElementById('stu-age-y').value, ageM: document.getElementById('stu-age-m').value, height: document.getElementById('stu-height').value, weight: document.getElementById('stu-weight').value, attendanceP: document.getElementById('stu-att-p').value, attendanceA: document.getElementById('stu-att-a').value, pt1: document.getElementById('stu-pt1').value === "Yes", pt2: document.getElementById('stu-pt2').value === "Yes" }; if(!s.classId || !s.section || !s.name) { alert("Missing Details"); return; } DB.data.students.push(s); DB.save(); Admin.loadStudents(); alert("Student Saved"); },
    delStudent: (i) => { if(confirm("Delete?")) { DB.data.students.splice(i, 1); DB.save(); Admin.loadStudents(); } }
};

const Template = { 
    currentView: 'subject',
    
    initSelect:()=>{Admin.refreshDropdowns()}, 
    onClassChange:()=>{const c=document.getElementById('tpl-class-select').value,s=document.getElementById('tpl-subject-select');s.innerHTML='<option>Subj</option>';const cl=DB.data.classes.find(x=>x.id===c);if(cl)cl.subjects.forEach(sid=>{if(DB.data.subjects[sid])s.innerHTML+=`<option value="${sid}">${DB.data.subjects[sid].name}</option>`})}, 
    scale: 0.42, zoom: (delta) => { Template.scale += delta; if(Template.scale < 0.1) Template.scale = 0.1; if(Template.scale > 2) Template.scale = 2; const el = document.getElementById('editor-preview'); if(el) el.style.transform = `scale(${Template.scale})`; const lbl = document.getElementById('zoom-label'); if(lbl) lbl.innerText = Math.round(Template.scale * 100) + '%'; },
    
    switchView: (view) => {
        Template.currentView = view;
        document.getElementById('tpl-subject-editor').classList.add('hidden');
        document.getElementById('tpl-reflection-editor').classList.add('hidden');
        document.getElementById('tpl-lastpage-editor').classList.add('hidden');
        document.getElementById('tab-btn-subject').className = 'btn btn-accent';
        document.getElementById('tab-btn-reflection').className = 'btn btn-accent';
        document.getElementById('tab-btn-lastpage').className = 'btn btn-accent';

        if(view === 'subject') {
            document.getElementById('tpl-subject-selector-card').classList.remove('hidden');
            document.getElementById('tpl-subject-editor').classList.remove('hidden');
            document.getElementById('tab-btn-subject').className = 'btn btn-primary';
            document.getElementById('preview-title-label').innerText = 'LIVE PREVIEW (SUBJECT TEMPLATE)';
            Template.liveUpdate();
        } else if (view === 'reflection') {
            document.getElementById('tpl-subject-selector-card').classList.add('hidden');
            document.getElementById('tpl-reflection-editor').classList.remove('hidden');
            document.getElementById('tab-btn-reflection').className = 'btn btn-primary';
            document.getElementById('preview-title-label').innerText = 'LIVE PREVIEW (SELF REFLECTION)';
            Template.loadGlobals();
            Template.renderReflectionPreview();
        } else {
            document.getElementById('tpl-subject-selector-card').classList.add('hidden');
            document.getElementById('tpl-lastpage-editor').classList.remove('hidden');
            document.getElementById('tab-btn-lastpage').className = 'btn btn-primary';
            document.getElementById('preview-title-label').innerText = 'LIVE PREVIEW (LAST PAGE)';
            Template.loadGlobals();
            Template.renderLastPagePreview();
        }
    },

    load:()=>{
        const sid=document.getElementById('tpl-subject-select').value;if(!sid)return;Template.currentSubjectId=sid;const t=DB.data.subjects[sid].template; 
        document.getElementById('tpl-title').value=t.title;document.getElementById('tpl-sub').value=t.sub;document.getElementById('tpl-desc').value=t.desc; 
        const qt=t.qTotals||{t1:25,t2:25,mid:50,tot:100};document.getElementById('qt-1').value=qt.t1;document.getElementById('qt-2').value=qt.t2;document.getElementById('qt-3').value=qt.mid;document.getElementById('qt-4').value=qt.tot; 
        document.getElementById('tpl-show-quant').checked = t.showQuant !== false; document.getElementById('tpl-show-remarks').checked = t.showRemarks !== false; 
        Template.renderRows(t.items);
        Template.liveUpdate();
    }, 
    
    syncToDB:()=>{
        if(!Template.currentSubjectId)return;
        const i=[];document.querySelectorAll('#template-rows .row-item').forEach(r=>i.push({type:r.dataset.type,text:r.querySelector('input').value}));
        const t=DB.data.subjects[Template.currentSubjectId].template; 
        t.title=document.getElementById('tpl-title').value;t.sub=document.getElementById('tpl-sub').value;t.desc=document.getElementById('tpl-desc').value;
        t.items=i; 
        t.qTotals={t1:document.getElementById('qt-1').value,t2:document.getElementById('qt-2').value,mid:document.getElementById('qt-3').value,tot:document.getElementById('qt-4').value}; 
        t.showQuant = document.getElementById('tpl-show-quant').checked; t.showRemarks = document.getElementById('tpl-show-remarks').checked; 
    }, 
    
    liveUpdate:()=>{
        if(Template.currentView === 'subject') {
            if(!Template.currentSubjectId)return;
            Template.syncToDB();
            ReportEngine.render('editor-preview', DB.data.subjects[Template.currentSubjectId].template, {}, false);
            document.getElementById('editor-preview').className = 'report-page';
        }
    }, 
    
    renderLastPagePreview: () => {
        const dummyStudent = { id: null, classId: null, section: null, name: "Student Name Preview" };
        const previewContainer = document.getElementById('editor-preview');
        previewContainer.innerHTML = ReportEngine.generateLastPage(dummyStudent);
        previewContainer.className = 'report-page';
    },

    renderReflectionPreview: () => {
        const previewContainer = document.getElementById('editor-preview');
        previewContainer.innerHTML = ReportEngine.generateReflectionPage();
        previewContainer.className = 'report-page';
    },

    renderRows:(i)=>{const c=document.getElementById('template-rows');c.innerHTML='';i.forEach((item,idx)=>{c.innerHTML+=`<div class="row-item" data-type="${item.type}" style="display:flex;gap:5px;margin-bottom:5px;"><span style="font-size:10px;width:15px;font-weight:bold;">${item.type[0].toUpperCase()}</span><input value="${item.text||''}" oninput="Template.liveUpdate()"><button onclick="Template.delItem(${idx})" style="color:red;border:none;">x</button></div>`})}, 
    add:(t)=>{if(Template.currentSubjectId){Template.syncToDB();DB.data.subjects[Template.currentSubjectId].template.items.push({type:t,text:''});Template.load()}}, 
    delItem:(i)=>{Template.syncToDB();DB.data.subjects[Template.currentSubjectId].template.items.splice(i,1);Template.load()}, 
    
    save:()=>{
        if(Template.currentView === 'subject') {
            if(!Template.currentSubjectId) return;
            Template.syncToDB(); DB.save(); alert('Subject Template Saved');
        }
    },

    // --- GLOBAL TEMPLATE LOGIC (Signatures & Reflection) ---
    loadGlobals: () => {
        Template.renderSignatures(DB.data.globalConfig.signatures);
        Template.renderReflectionLists(DB.data.globalConfig.reflectionEval, 'eval');
        Template.renderReflectionLists(DB.data.globalConfig.reflectionVoice, 'voice');
    },
    syncGlobalsToDB: () => {
        const sigs = [];
        document.querySelectorAll('.signature-config-item').forEach(row => {
            sigs.push({
                title: row.querySelector('.sig-title-inp').value,
                role: row.querySelector('.sig-role-select').value,
                imgKey: row.dataset.imgKey || null 
            });
        });
        DB.data.globalConfig.signatures = sigs;

        const evals = [];
        document.querySelectorAll('.ref-eval-item input').forEach(inp => evals.push(inp.value));
        DB.data.globalConfig.reflectionEval = evals;

        const voices = [];
        document.querySelectorAll('.ref-voice-item input').forEach(inp => voices.push(inp.value));
        DB.data.globalConfig.reflectionVoice = voices;

        DB.save();
        if(Template.currentView === 'reflection') Template.renderReflectionPreview();
        if(Template.currentView === 'lastpage') Template.renderLastPagePreview();
        alert('Global Settings Saved!');
    },
    
    // SIGNATURE EDITOR LOGIC
    renderSignatures: (sigs) => {
        const c = document.getElementById('signature-config-list');
        c.innerHTML = '';
        if(!sigs) sigs = [];
        sigs.forEach((sig, idx) => {
            const isStatic = sig.role === 'static';
            const imgUploadStyle = isStatic ? 'display:block' : 'display:none';
            c.innerHTML += `
            <div class="signature-config-item" data-img-key="${sig.imgKey || ''}" style="background:#f8fafc; padding:10px; border:1px solid #e2e8f0; margin-bottom:10px; border-radius:8px;">
                <div style="display:flex; gap:10px; margin-bottom:10px;">
                    <input type="text" class="sig-title-inp" value="${sig.title}" placeholder="Title (e.g., Principal)" style="flex:1; margin:0;" onchange="Template.liveUpdateGlobals()">
                    <select class="sig-role-select" onchange="Template.onSigRoleChange(this)" style="flex:1; margin:0;">
                        <option value="ct" ${sig.role === 'ct' ? 'selected' : ''}>Class Teacher (Automatic)</option>
                        <option value="static" ${sig.role === 'static' ? 'selected' : ''}>Static Image (Fixed)</option>
                    </select>
                    <button onclick="Template.delSignature(${idx})" class="btn-xs-danger">X</button>
                </div>
                <div class="sig-upload-container" style="${imgUploadStyle}">
                     <input type="file" accept="image/*" class="sig-file-inp" style="font-size:11px;">
                     <button onclick="Template.uploadStaticSignature(this, ${idx})" class="btn btn-sm btn-accent">Upload Image</button>
                     <span style="font-size:10px; color:#666; margin-left:5px;">${sig.imgKey ? 'Image set.' : 'No image.'}</span>
                </div>
            </div>`;
        });
    },
    liveUpdateGlobals: () => {
        // Sync silently and update the current preview without showing alerts
        const sigs = [];
        document.querySelectorAll('.signature-config-item').forEach(row => {
            sigs.push({ title: row.querySelector('.sig-title-inp').value, role: row.querySelector('.sig-role-select').value, imgKey: row.dataset.imgKey || null });
        });
        DB.data.globalConfig.signatures = sigs;

        const evals = [];
        document.querySelectorAll('.ref-eval-item input').forEach(inp => evals.push(inp.value));
        DB.data.globalConfig.reflectionEval = evals;

        const voices = [];
        document.querySelectorAll('.ref-voice-item input').forEach(inp => voices.push(inp.value));
        DB.data.globalConfig.reflectionVoice = voices;

        if(Template.currentView === 'reflection') Template.renderReflectionPreview();
        if(Template.currentView === 'lastpage') Template.renderLastPagePreview();
    },
    addSignatureSlot: () => { 
        DB.data.globalConfig.signatures.push({ title: "New Signature", role: "static", imgKey: null }); 
        Template.loadGlobals();
        Template.liveUpdateGlobals();
    },
    delSignature: (i) => { 
        DB.data.globalConfig.signatures.splice(i,1); 
        Template.loadGlobals();
        Template.liveUpdateGlobals();
    },
    onSigRoleChange: (selectEl) => { 
        const container = selectEl.closest('.signature-config-item').querySelector('.sig-upload-container'); 
        container.style.display = selectEl.value === 'static' ? 'block' : 'none'; 
        Template.liveUpdateGlobals(); 
    },
    uploadStaticSignature: (btn, idx) => {
        const fileInp = btn.previousElementSibling; const f = fileInp.files[0];
        if(!f) { alert("Select an image."); return; }
        btn.innerText = "Saving..."; btn.disabled = true;
        const r = new FileReader();
        r.onload = (e) => {
            const imgKey = 'sig_' + Date.now();
            if(!DB.data.globalSignatures) DB.data.globalSignatures = {};
            DB.data.globalSignatures[imgKey] = e.target.result;
            const row = btn.closest('.signature-config-item');
            row.dataset.imgKey = imgKey;
            row.querySelector('span').innerText = "Image saved.";
            btn.innerText = "Upload Image"; btn.disabled = false;
            Template.liveUpdateGlobals(); 
        };
        r.readAsDataURL(f);
    },

    // REFLECTION EDITOR LOGIC
    renderReflectionLists: (list, type) => {
        const c = document.getElementById(`ref-${type}-list`);
        c.innerHTML = '';
        if(!list) list = [];
        list.forEach((q, idx) => {
            c.innerHTML += `
            <div class="ref-${type}-item" style="display:flex; gap:5px; margin-bottom:5px;">
                <input type="text" value="${q}" style="flex:1; margin:0;" oninput="Template.liveUpdateGlobals()">
                <button onclick="Template.delRefRow('${type}', ${idx})" class="btn-xs-danger">X</button>
            </div>`;
        });
    },
    addRefRow: (type) => {
        if(type === 'eval') DB.data.globalConfig.reflectionEval.push("");
        if(type === 'voice') DB.data.globalConfig.reflectionVoice.push("");
        Template.loadGlobals();
        Template.liveUpdateGlobals();
    },
    delRefRow: (type, idx) => {
        if(type === 'eval') DB.data.globalConfig.reflectionEval.splice(idx, 1);
        if(type === 'voice') DB.data.globalConfig.reflectionVoice.splice(idx, 1);
        Template.loadGlobals();
        Template.liveUpdateGlobals();
    }
};

const Teacher = { 
    init:()=>{
        const t=Auth.user.id;
        const s=document.getElementById('teacher-subject-select');
        s.innerHTML='<option>Class</option>';
        
        DB.data.assignments.filter(a=>a.teacherId===t).forEach((a,i)=>{
            const c=DB.data.classes.find(x=>x.id===a.classId),sub=DB.data.subjects[a.subjectId];
            if(c&&sub)s.innerHTML+=`<option value="${i}">${c.name} (${a.section}) - ${sub.name}</option>`
        });

        const ctSections = [];
        if(DB.data.classTeachers) {
            for(let key in DB.data.classTeachers) {
                if(DB.data.classTeachers[key] === t) ctSections.push(key);
            }
        }

        const ctDiv = document.getElementById('class-teacher-section');
        if(ctSections.length > 0) {
            ctDiv.classList.remove('hidden');
            const sel = document.getElementById('ct-class-select');
            sel.innerHTML = '<option value="">Select Section</option>';
            ctSections.forEach(k => {
                const lastIdx = k.lastIndexOf('_');
                const cid = k.substring(0, lastIdx);
                const sec = k.substring(lastIdx + 1);
                const cls = DB.data.classes.find(c => c.id === cid);
                if(cls) {
                    sel.innerHTML += `<option value="${k}">${cls.name} - Section ${sec}</option>`;
                }
            });
            Teacher.loadSignaturePreview();
        } else {
            ctDiv.classList.add('hidden');
        }
    }, 
    loadStudents:()=>{const i=document.getElementById('teacher-subject-select').value;if(i==="")return;const a=DB.data.assignments.filter(as=>as.teacherId===Auth.user.id)[i];Teacher.currSub=a.subjectId;const l=document.getElementById('teacher-student-list');l.innerHTML='';DB.data.students.filter(s=>s.classId===a.classId&&s.section===a.section).forEach(s=>{const d=DB.data.marks[s.id]?.[a.subjectId]?.completed;l.innerHTML+=`<tr><td>${s.roll}</td><td>${s.name}</td><td>${d?'Done':'Pending'}</td><td><button onclick="Teacher.openReport(${s.id})" class="btn btn-sm btn-accent">Edit</button></td></tr>`})}, 
    openReport:(sid)=>{Teacher.currStudent=sid;const s=DB.data.students.find(x=>x.id===sid),sub=DB.data.subjects[Teacher.currSub];document.getElementById('eval-student-name').innerText=`${s.name} - ${sub.name}`;UI.show('evaluation');const m=DB.data.marks[sid]?.[Teacher.currSub]||{};ReportEngine.render('teacher-workspace',sub.template,m,true)}, 
    saveReport:()=>{const s=Teacher.currStudent,sub=Teacher.currSub;if(!DB.data.marks[s])DB.data.marks[s]={};if(!DB.data.marks[s][sub])DB.data.marks[s][sub]={};const d=DB.data.marks[s][sub];document.querySelectorAll('.inp-mark').forEach(i=>{d[i.id]=i.type==='checkbox'?i.checked:i.value});d.completed=true;DB.save();alert('Saved');UI.show('teacher-dashboard');Teacher.loadStudents()},
    
    loadCTStudents: () => {
        const key = document.getElementById('ct-class-select').value;
        if(!key) return;
        const lastIdx = key.lastIndexOf('_');
        const cid = key.substring(0, lastIdx);
        const sec = key.substring(lastIdx + 1);
        
        const photo = DB.data.classPhotos[key];
        const preview = document.getElementById('ct-photo-preview');
        preview.innerHTML = photo ? `<img src="${photo}" style="max-height:100px;">` : 'No photo uploaded yet.';

        const l = document.getElementById('ct-student-list');
        l.innerHTML = '';
        DB.data.students.filter(s => s.classId === cid && s.section === sec).forEach(s => {
            const rem = DB.data.generalRemarks[s.id] || '';
            l.innerHTML += `<tr><td>${s.roll}</td><td>${s.name}</td><td><textarea onchange="Teacher.saveRemark(${s.id}, this.value)" style="width:100%; height:50px;">${rem}</textarea></td></tr>`;
        });
    },
    uploadPhoto: () => {
        const key = document.getElementById('ct-class-select').value;
        if(!key) { alert("Please select a Section first."); return; }
        const f = document.getElementById('ct-photo-upload').files[0];
        if(f) {
            const btn = document.querySelector('#ct-photo-upload + button');
            const orig = btn.innerText; btn.innerText = "Uploading..."; btn.disabled = true;
            const r = new FileReader();
            r.onload = (e) => {
                DB.data.classPhotos[key] = e.target.result;
                DB.save();
                Teacher.loadCTStudents(); 
                alert("Photo Saved Successfully!");
                btn.innerText = orig; btn.disabled = false;
            };
            r.readAsDataURL(f);
        } else {
            alert("Please choose a file to upload.");
        }
    },
    uploadSignature: () => {
        const f = document.getElementById('ct-sig-upload').files[0];
        if(f) {
            const btn = document.querySelector('#ct-sig-upload + button');
            const originalText = btn.innerText;
            btn.innerText = "Saving..."; btn.disabled = true;

            const r = new FileReader();
            r.onload = (e) => {
                const tid = Auth.user.id;
                if(!DB.data.classTeacherSignatures) DB.data.classTeacherSignatures = {};
                DB.data.classTeacherSignatures[tid] = e.target.result;
                DB.save();
                Teacher.loadSignaturePreview();
                alert("Signature Saved Successfully! It will now appear on reports for classes you manage.");
                btn.innerText = originalText; btn.disabled = false;
            };
            r.readAsDataURL(f);
        } else {
            alert("Please select an image file first.");
        }
    },
    loadSignaturePreview: () => {
        const tid = Auth.user.id;
        const sig = (DB.data.classTeacherSignatures && DB.data.classTeacherSignatures[tid]) ? DB.data.classTeacherSignatures[tid] : null;
        const preview = document.getElementById('ct-sig-preview');
        preview.innerHTML = sig ? `<img src="${sig}" style="max-height:50px;">` : 'No signature uploaded yet.';
    },

    saveRemark: (sid, val) => {
        if(!DB.data.generalRemarks) DB.data.generalRemarks = {};
        DB.data.generalRemarks[sid] = val;
        DB.save();
    }
};

window.onload = () => { DB.init(); Theme.init(); Auth.check(); }; 
document.getElementById('loginForm').addEventListener('submit', (e)=>{ e.preventDefault(); Auth.login(); });

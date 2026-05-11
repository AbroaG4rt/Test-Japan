// assets/js/result.js — Redesigned Result Engine

document.addEventListener('DOMContentLoaded', async () => {
    const __lang = window.__resultLang || localStorage.getItem('lang') || 'en';
    const __dashTarget = window.__dashTarget || 'dashboard.html';

    // ── Motivational Feedback Engine ──────────────────────────────────────
    const FEEDBACK = {
        excellent: {
            icon: '🏆', title: 'Outstanding Performance!',
            quote: '努力は必ず報われる — Hard work always pays off. Your dedication to Japanese study is truly remarkable. Keep this momentum going!',
            tips: [
                { icon: '🎯', title: 'Maintain Your Edge', text: 'Challenge yourself with higher difficulty N-level questions and past official JLPT papers to stay sharp.' },
                { icon: '📚', title: 'Deep Dive Reading', text: 'Read native Japanese content — newspapers, manga, light novels — to reinforce your skills naturally.' },
                { icon: '🗣️', title: 'Speaking Practice', text: 'Convert your exam knowledge into real conversation. Find a language partner or use platforms like HelloTalk.' }
            ]
        },
        good: {
            icon: '🌸', title: 'Great Progress!',
            quote: '一歩一歩 — Step by step. You\'re making genuine progress. Each study session brings you closer to your JLPT goal.',
            tips: [
                { icon: '🔁', title: 'Review Weak Sections', text: 'Focus extra study time on the sections where you scored below 60%. Targeted practice yields the fastest gains.' },
                { icon: '⏱️', title: 'Timed Practice', text: 'Practice answering under exam time conditions to improve your speed and reduce second-guessing.' },
                { icon: '📝', title: 'Keep a Mistake Journal', text: 'Write down questions you got wrong and why. Reviewing your mistakes is the #1 most effective study method.' }
            ]
        },
        average: {
            icon: '🌱', title: 'You\'re Growing!',
            quote: '失敗は成功のもと — Failure is the foundation of success. Every attempt is data. Every mistake is a lesson in disguise.',
            tips: [
                { icon: '📖', title: 'Build Your Foundation', text: 'Focus on the core vocabulary and grammar patterns for your JLPT level. A strong foundation makes everything else easier.' },
                { icon: '🎧', title: 'Daily Listening', text: 'Listen to Japanese for at least 20 minutes daily — podcasts, anime, or YouTube. Immersion dramatically improves Choukai scores.' },
                { icon: '🃏', title: 'Flashcard System', text: 'Use Anki or similar spaced-repetition tools for vocabulary and kanji. 30 cards a day = over 10,000 words in a year.' }
            ]
        },
        beginner: {
            icon: '🌟', title: 'Every Expert Starts Here',
            quote: '千里の道も一歩から — A journey of a thousand miles begins with a single step. You\'ve taken that step today. That matters more than the score.',
            tips: [
                { icon: '🎌', title: 'Start with the Basics', text: 'Master hiragana and katakana first. These are the building blocks of everything. Apps like Duolingo or Tofugu can help.' },
                { icon: '📅', title: 'Consistency Over Intensity', text: 'Study 20 minutes daily rather than 4 hours once a week. Consistency is the true secret to language acquisition.' },
                { icon: '🤝', title: 'Join a Community', text: 'Connect with other JLPT learners on Reddit (r/LearnJapanese), Discord servers, or local study groups for motivation.' }
            ]
        }
    };

    const SECTION_TIPS = {
        kanji: { icon: '📖', title: 'Boost Your Kanji Score', text: 'Study kanji using the radical decomposition method. Learn the meaning of common radicals and use them to guess unfamiliar kanji.' },
        bunpou: { icon: '✏️', title: 'Strengthen Your Grammar', text: 'Focus on grammar patterns specific to your JLPT level. Practice sentence construction and fill-in-the-blank exercises daily.' },
        choukai: { icon: '🎧', title: 'Improve Your Listening', text: 'Immerse yourself in native Japanese audio. Try shadowing techniques: listen, pause, repeat. Your ear will train quickly.' }
    };

    const SECTION_META = {
        kanji: { name: 'Kanji', jp: '文字・語彙', icon: '📖', cls: 'kanji' },
        bunpou: { name: 'Bunpou', jp: '文法・読解', icon: '✏️', cls: 'bunpou' },
        choukai: { name: 'Choukai', jp: '聴解', icon: '🎧', cls: 'choukai' }
    };

    // ── Load result data ───────────────────────────────────────────────────
    let user = OmoshiroiUtils.getUser();
    if (!user) user = { name: 'Trial Guest', role: 'guest' };

    let resultData = null;
    let isHistoricalView = false;
    const selectedHistoryId = localStorage.getItem('selected_history_id');

    if (selectedHistoryId) {
        const history = OmoshiroiUtils.getUserHistory(user);
        const item = history.find(h => h.test_id === selectedHistoryId);
        if (item) {
            resultData = {
                level: item.level,
                answers: item.answers.reduce((acc, a) => { acc[a.question_id] = a.user_answer; return acc; }, {}),
                timestamp: new Date(item.date).getTime()
            };
            isHistoricalView = true;
        }
        localStorage.removeItem('selected_history_id');
    }

    if (!resultData) resultData = JSON.parse(localStorage.getItem('omoshiroi_latest_result'));
    if (!resultData) { window.location.href = __dashTarget; return; }

    const { level, answers, timestamp } = resultData;

    // ── Fetch question data ────────────────────────────────────────────────
    let rawData;
    try {
        const res = await fetch(`../data/${level}.json`);
        rawData = await res.json();
    } catch (e) {
        console.error('Failed to load question data:', e);
        alert('Failed to load results data. Please try again.');
        return;
    }

    const sections = rawData.sections || [];
    const allQuestions = sections.flatMap(s => s.questions);
    const totalCount = allQuestions.length;

    // ── Score per section ─────────────────────────────────────────────────
    let totalCorrect = 0;
    const sectionStats = {};
    const evaluation = [];

    sections.forEach(sec => {
        let correct = 0;
        sec.questions.forEach(q => {
            const userAns = answers[q.id];
            const isCorrect = userAns === q.correctAnswer;
            if (isCorrect) { correct++; totalCorrect++; }
            evaluation.push({ id: q.id, question: q.question, sectionId: sec.id, userAns: userAns || null, correctAnswer: q.correctAnswer, isCorrect });
        });
        sectionStats[sec.id] = {
            id: sec.id,
            total: sec.questions.length,
            correct,
            wrong: sec.questions.length - correct,
            pct: sec.questions.length > 0 ? Math.round((correct / sec.questions.length) * 100) : 0
        };
    });

    const totalScore = totalCount > 0 ? (totalCorrect / totalCount) * 100 : 0;

    // ── Save history ───────────────────────────────────────────────────────
    if (!isHistoricalView) {
        const testId = `${level}-${timestamp}`;
        const robustResult = {
            test_id: testId, level, score: totalScore, correct: totalCorrect,
            wrong: totalCount - totalCorrect, total: totalCount,
            date: new Date(timestamp).toISOString(),
            answers: evaluation.map(e => ({ question_id: e.id, user_answer: e.userAns, correct_answer: e.correctAnswer }))
        };
        const history = OmoshiroiUtils.getUserHistory(user);
        if (!history.find(h => h.test_id === testId)) OmoshiroiUtils.saveResult(user, robustResult);
    }

    // ── Populate Hero ──────────────────────────────────────────────────────
    document.getElementById('levelBadge').textContent = level;
    document.getElementById('totalScorePct').textContent = `${totalScore.toFixed(1)}%`;
    document.getElementById('totalFraction').textContent = `${totalCorrect} / ${totalCount}`;
    document.getElementById('resultDate').textContent = new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Animate Score Ring
    const circumference = 2 * Math.PI * 50; // r=50
    const ringFill = document.getElementById('scoreRingFill');
    const offset = circumference - (totalScore / 100) * circumference;
    setTimeout(() => {
        ringFill.style.strokeDashoffset = offset;
        // Color by score
        if (totalScore >= 70) ringFill.style.stroke = '#2ecc71';
        else if (totalScore >= 50) ringFill.style.stroke = '#f39c12';
        else ringFill.style.stroke = '#e74c3c';
    }, 200);

    // Verdict badge
    const verdictBadge = document.getElementById('verdictBadge');
    if (totalScore >= 70) { verdictBadge.textContent = '✓ Passed'; verdictBadge.className = 'verdict-badge verdict-pass'; }
    else if (totalScore >= 50) { verdictBadge.textContent = '~ Keep Going'; verdictBadge.className = 'verdict-badge verdict-avg'; }
    else { verdictBadge.textContent = '✗ Needs Practice'; verdictBadge.className = 'verdict-badge verdict-fail'; }

    // ── Section Cards ──────────────────────────────────────────────────────
    const grid = document.getElementById('sectionCardsGrid');
    const sectionOrder = ['kanji', 'bunpou', 'choukai'];
    const circumSmall = 2 * Math.PI * 44; // r=44

    sectionOrder.forEach((secId, idx) => {
        const st = sectionStats[secId];
        if (!st) return;
        const meta = SECTION_META[secId];
        const offset = circumSmall - (st.pct / 100) * circumSmall;

        const card = document.createElement('div');
        card.className = `sec-card ${meta.cls}`;
        card.innerHTML = `
            <div class="sec-card-header">
                <div class="sec-card-icon">${meta.icon}</div>
                <div>
                    <div class="sec-card-title">${meta.name}</div>
                    <div class="sec-card-jp">${meta.jp}</div>
                </div>
            </div>
            <div class="sec-ring-wrap">
                <svg class="sec-ring-svg" viewBox="0 0 100 100">
                    <circle class="sec-ring-bg" cx="50" cy="50" r="44"/>
                    <circle class="sec-ring-fill sec-fill-${secId}" cx="50" cy="50" r="44"
                        stroke-dasharray="${circumSmall}"
                        stroke-dashoffset="${circumSmall}"/>
                </svg>
                <div class="sec-ring-label">
                    <span class="sec-ring-pct">${st.pct}%</span>
                    <span class="sec-ring-sub">correct</span>
                </div>
            </div>
            <div class="sec-stats">
                <div>
                    <span class="sec-stat-val sec-correct-val">${st.correct}</span>
                    <span class="sec-stat-label">Correct</span>
                </div>
                <div style="width:1px;background:var(--r-border);"></div>
                <div>
                    <span class="sec-stat-val sec-wrong-val">${st.wrong}</span>
                    <span class="sec-stat-label">Wrong</span>
                </div>
                <div style="width:1px;background:var(--r-border);"></div>
                <div>
                    <span class="sec-stat-val">${st.total}</span>
                    <span class="sec-stat-label">Total</span>
                </div>
            </div>
        `;
        grid.appendChild(card);

        // Animate ring with stagger
        setTimeout(() => {
            const fillEl = card.querySelector(`.sec-fill-${secId}`);
            if (fillEl) fillEl.style.strokeDashoffset = offset;
        }, 300 + idx * 200);
    });

    // ── Overall Chart ──────────────────────────────────────────────────────
    const ctx = document.getElementById('resultChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Correct', 'Wrong'],
            datasets: [{
                data: [totalCorrect, totalCount - totalCorrect],
                backgroundColor: ['#2ecc71', '#e9ecef'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '72%',
            plugins: { legend: { position: 'bottom', labels: { font: { family: 'Inter' } } } }
        }
    });

    // Summary Rows
    const summaryEl = document.getElementById('summaryRows');
    const summaryData = [
        { icon: '✅', label: 'Total Correct', val: totalCorrect, pct: totalScore },
        ...sectionOrder.map(id => {
            const st = sectionStats[id];
            const m = SECTION_META[id];
            return st ? { icon: m.icon, label: m.name, val: `${st.correct}/${st.total}`, pct: st.pct, color: id } : null;
        }).filter(Boolean)
    ];

    summaryData.forEach(row => {
        const el = document.createElement('div');
        el.className = 'summary-row';
        const barColor = row.pct >= 70 ? '#2ecc71' : row.pct >= 50 ? '#f39c12' : '#e74c3c';
        el.innerHTML = `
            <span class="summary-row-icon">${row.icon}</span>
            <span class="summary-row-label">${row.label}</span>
            <div class="summary-bar-wrap"><div class="summary-bar" style="width:0%;background:${barColor};" data-target="${row.pct}"></div></div>
            <span class="summary-row-val">${row.val}</span>
        `;
        summaryEl.appendChild(el);
    });
    setTimeout(() => {
        summaryEl.querySelectorAll('.summary-bar').forEach(bar => {
            bar.style.width = `${bar.dataset.target}%`;
        });
    }, 400);

    // ── Motivational Tips ──────────────────────────────────────────────────
    let feedbackKey = 'beginner';
    if (totalScore >= 80) feedbackKey = 'excellent';
    else if (totalScore >= 60) feedbackKey = 'good';
    else if (totalScore >= 40) feedbackKey = 'average';

    const feedback = FEEDBACK[feedbackKey];
    document.getElementById('tipsIcon').textContent = feedback.icon;
    document.getElementById('tipsTitle').textContent = feedback.title;
    document.getElementById('tipsSub').textContent = `${totalScore.toFixed(1)}% — ${totalCorrect} correct out of ${totalCount} questions`;
    document.getElementById('tipsQuote').textContent = feedback.quote;

    const tipsGrid = document.getElementById('tipsGrid');
    const allTips = [...feedback.tips];

    // Add weak section tips
    const weakSections = sectionOrder.filter(id => sectionStats[id] && sectionStats[id].pct < 60);
    weakSections.forEach(id => {
        const st = SECTION_TIPS[id];
        if (st) allTips.push(st);
    });

    allTips.forEach(tip => {
        const el = document.createElement('div');
        el.className = 'tip-item';
        el.innerHTML = `
            <div class="tip-item-icon">${tip.icon}</div>
            <div class="tip-item-title">${tip.title}</div>
            <div class="tip-item-text">${tip.text}</div>
        `;
        tipsGrid.appendChild(el);
    });

    // ── Result ID & QR ─────────────────────────────────────────────────────
    const resultId = `OJ-${level}-${timestamp.toString(36).toUpperCase().slice(-8)}`;
    document.getElementById('resultIdText').textContent = `Result ID: ${resultId}`;

    document.getElementById('shareQrBtn').addEventListener('click', () => {
        document.getElementById('qrModalBackdrop').classList.remove('hidden');
        if (!document.querySelector('#qrcode canvas')) {
            const shareUrl = `${window.location.origin}${window.location.pathname.replace('result.html', 'dashboard.html')}?resultId=${resultId}`;
            new QRCode(document.getElementById('qrcode'), {
                text: shareUrl, width: 160, height: 160,
                colorDark: '#1A2035', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    });

    document.getElementById('qrModalClose').addEventListener('click', () => {
        document.getElementById('qrModalBackdrop').classList.add('hidden');
    });

    document.getElementById('qrModalBackdrop').addEventListener('click', e => {
        if (e.target === document.getElementById('qrModalBackdrop')) {
            document.getElementById('qrModalBackdrop').classList.add('hidden');
        }
    });

    document.getElementById('downloadQrBtn').addEventListener('click', () => {
        const canvas = document.querySelector('#qrcode canvas');
        if (canvas) {
            const a = document.createElement('a');
            a.href = canvas.toDataURL('image/png');
            a.download = `omoshiroi_result_${resultId}.png`;
            a.click();
        }
    });

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
        window.location.href = `level.html?level=${level}`;
    });

    // ── PDF Export ─────────────────────────────────────────────────────────
    document.getElementById('downloadPdfBtn').addEventListener('click', async () => {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'mm', format: 'a4' });
        const pw = doc.internal.pageSize.getWidth();
        const ph = doc.internal.pageSize.getHeight();
        const margin = 18;

        // Load logo for watermark
        const logo = new Image();
        logo.src = '../assets/images/logo.png';
        await new Promise(r => { logo.onload = r; logo.onerror = r; });

        // ─ BACKGROUND watermark ─
        if (logo.complete && logo.naturalHeight !== 0) {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.08 }));
            const wSize = 80;
            doc.addImage(logo, 'PNG', (pw - wSize) / 2, (ph - wSize) / 2 - 20, wSize, wSize);
            doc.restoreGraphicsState();
        }

        // ─ HEADER BAR ─
        doc.setFillColor(26, 32, 53);
        doc.rect(0, 0, pw, 30, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('OMOSHIROI JAPAN', margin, 13);

        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text('Official JLPT Simulation Report', margin, 20);

        // Level badge
        doc.setFillColor(192, 57, 43);
        doc.roundedRect(pw - margin - 25, 8, 22, 12, 3, 3, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(level, pw - margin - 14, 16, { align: 'center' });

        // ─ TITLE SECTION ─
        let y = 42;
        doc.setTextColor(26, 32, 53);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('Examination Results', margin, y);

        y += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        doc.text(`Examinee: ${user.name}`, margin, y);
        doc.text(`Date: ${new Date(timestamp).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}`, pw / 2, y);

        // ─ SCORE BOX ─
        y += 12;
        doc.setFillColor(248, 249, 251);
        doc.roundedRect(margin, y, pw - margin * 2, 28, 4, 4, 'F');
        doc.setDrawColor(233, 236, 239);
        doc.roundedRect(margin, y, pw - margin * 2, 28, 4, 4, 'S');

        doc.setTextColor(26, 32, 53);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        const scoreColor = totalScore >= 70 ? [46, 204, 113] : totalScore >= 50 ? [243, 156, 18] : [231, 76, 60];
        doc.setTextColor(...scoreColor);
        doc.text(`${totalScore.toFixed(1)}%`, margin + 8, y + 18);

        doc.setTextColor(108, 117, 125);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`${totalCorrect} / ${totalCount} correct`, margin + 8, y + 24);

        doc.setTextColor(26, 32, 53);
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        const verdictText = totalScore >= 70 ? 'PASSED' : totalScore >= 50 ? 'BORDERLINE' : 'NEEDS PRACTICE';
        doc.text(verdictText, pw - margin - 5, y + 18, { align: 'right' });

        // ─ SECTION BREAKDOWN ─
        y += 38;
        doc.setTextColor(26, 32, 53);
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('Section Performance', margin, y);

        y += 6;
        doc.setDrawColor(233, 236, 239);
        doc.setLineWidth(0.5);
        doc.line(margin, y, pw - margin, y);
        y += 8;

        const secColors = { kanji: [67, 97, 238], bunpou: [114, 9, 183], choukai: [247, 37, 133] };
        const secNames = { kanji: 'Kanji (文字・語彙)', bunpou: 'Bunpou (文法・読解)', choukai: 'Choukai (聴解)' };

        sectionOrder.forEach(secId => {
            const st = sectionStats[secId];
            if (!st) return;
            const col = secColors[secId] || [100, 100, 100];

            // Color bar
            doc.setFillColor(...col);
            doc.roundedRect(margin, y, 3, 14, 1, 1, 'F');

            doc.setTextColor(26, 32, 53);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(secNames[secId], margin + 7, y + 6);

            doc.setFont('helvetica', 'normal');
            doc.setTextColor(108, 117, 125);
            doc.text(`${st.correct} / ${st.total}`, margin + 7, y + 11);

            // Progress bar background
            const barX = pw / 2 + 10;
            const barW = pw - barX - margin;
            doc.setFillColor(233, 236, 239);
            doc.roundedRect(barX, y + 4, barW, 5, 2, 2, 'F');

            // Progress bar fill
            doc.setFillColor(...col);
            doc.roundedRect(barX, y + 4, barW * (st.pct / 100), 5, 2, 2, 'F');

            doc.setTextColor(...col);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${st.pct}%`, pw - margin, y + 10, { align: 'right' });

            y += 20;
        });

        // ─ MOTIVATIONAL QUOTE ─
        y += 5;
        doc.setFillColor(252, 246, 244);
        doc.setDrawColor(192, 57, 43);
        doc.setLineWidth(0.8);
        doc.line(margin, y, margin, y + 18);
        doc.setFillColor(252, 246, 244);
        doc.rect(margin + 2, y - 2, pw - margin * 2 - 2, 22, 'F');

        doc.setTextColor(26, 32, 53);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'italic');
        const quoteLines = doc.splitTextToSize(feedback.quote.replace(/—/g, '-'), pw - margin * 2 - 10);
        doc.text(quoteLines, margin + 6, y + 7);
        y += 28;

        // ─ RESULT ID & QR ─
        y = ph - 40;
        doc.setDrawColor(233, 236, 239);
        doc.line(margin, y, pw - margin, y);

        // Generate QR as canvas and embed
        const qrCanvas = document.querySelector('#qrcode canvas');
        if (qrCanvas) {
            try {
                const qrData = qrCanvas.toDataURL('image/png');
                doc.addImage(qrData, 'PNG', pw - margin - 22, y + 4, 22, 22);
            } catch(e) {}
        }

        doc.setTextColor(108, 117, 125);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`Result ID: ${resultId}`, margin, y + 8);
        doc.text(`OMOSHIROI JAPAN — omoshiroi.jp`, margin, y + 14);
        doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y + 20);

        // Watermark (small, on every page — placed on top of content)
        if (logo.complete && logo.naturalHeight !== 0) {
            doc.saveGraphicsState();
            doc.setGState(new doc.GState({ opacity: 0.2 }));
            doc.addImage(logo, 'PNG', margin, ph - 40 + 26, 8, 8);
            doc.restoreGraphicsState();
        }

        doc.save(`OMOSHIROI_JLPT_${level}_${user.name.replace(/\s+/g, '_')}_${resultId}.pdf`);
    });
});

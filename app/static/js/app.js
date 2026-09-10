// Main frontend application script

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentData = null;
    let customApiKey = localStorage.getItem('GEMINI_CUSTOM_API_KEY') || '';

    // DOM Elements
    const apiKeySection = document.getElementById('apiKeySection');
    const apiKeyToggleBtn = document.getElementById('apiKeyToggleBtn');
    const customApiKeyInput = document.getElementById('customApiKey');
    const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');
    const apiKeyBadge = document.getElementById('apiKeyBadge');

    const optionsToggleBtn = document.getElementById('optionsToggleBtn');
    const advancedOptions = document.getElementById('advancedOptions');
    const optionsChevron = document.getElementById('optionsChevron');

    const transcribeForm = document.getElementById('transcribeForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const modelSelect = document.getElementById('modelSelect');
    const languageHint = document.getElementById('languageHint');
    const submitBtn = document.getElementById('submitBtn');

    const progressSection = document.getElementById('progressSection');
    const progressStatusTitle = document.getElementById('progressStatusTitle');
    const progressStatusDesc = document.getElementById('progressStatusDesc');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    const resultSection = document.getElementById('resultSection');
    const resThumbnail = document.getElementById('resThumbnail');
    const resTitle = document.getElementById('resTitle');
    const resUploader = document.getElementById('resUploader');
    const resDuration = document.getElementById('resDuration');
    const resLanguage = document.getElementById('resLanguage');
    const downloadAudioBtn = document.getElementById('downloadAudioBtn');
    const audioPlayer = document.getElementById('audioPlayer');

    const tabTranscriptBtn = document.getElementById('tabTranscriptBtn');
    const tabSummaryBtn = document.getElementById('tabSummaryBtn');
    const tabPlainBtn = document.getElementById('tabPlainBtn');
    const tabContentTranscript = document.getElementById('tabContentTranscript');
    const tabContentSummary = document.getElementById('tabContentSummary');
    const tabContentPlain = document.getElementById('tabContentPlain');

    const segmentsList = document.getElementById('segmentsList');
    const resSummary = document.getElementById('resSummary');
    const resKeyPoints = document.getElementById('resKeyPoints');
    const resPlainText = document.getElementById('resPlainText');

    const copyAllBtn = document.getElementById('copyAllBtn');
    const exportTxtBtn = document.getElementById('exportTxtBtn');
    const exportSrtBtn = document.getElementById('exportSrtBtn');
    const exportVttBtn = document.getElementById('exportVttBtn');

    // History DOM Elements
    const historySection = document.getElementById('historySection');
    const historyToggleBtn = document.getElementById('historyToggleBtn');
    const historyCountBadge = document.getElementById('historyCountBadge');
    const historyListContainer = document.getElementById('historyListContainer');
    const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');
    const closeHistoryBtn = document.getElementById('closeHistoryBtn');

    // Init custom API key
    if (customApiKey) {
        customApiKeyInput.value = customApiKey;
        apiKeyBadge.className = 'w-2 h-2 rounded-full bg-emerald-400';
    }

    // Toggle API Key Panel
    apiKeyToggleBtn.addEventListener('click', () => {
        apiKeySection.classList.toggle('hidden');
    });

    // Save Custom API Key
    saveApiKeyBtn.addEventListener('click', () => {
        const val = customApiKeyInput.value.trim();
        if (val) {
            localStorage.setItem('GEMINI_CUSTOM_API_KEY', val);
            customApiKey = val;
            apiKeyBadge.className = 'w-2 h-2 rounded-full bg-emerald-400';
            showToast('Gemini API 키가 저장되었습니다.');
            apiKeySection.classList.add('hidden');
        } else {
            localStorage.removeItem('GEMINI_CUSTOM_API_KEY');
            customApiKey = '';
            showToast('API 키가 삭제되었습니다.');
        }
    });

    // Toggle Advanced Options
    optionsToggleBtn.addEventListener('click', () => {
        const isHidden = advancedOptions.classList.toggle('hidden');
        optionsChevron.style.transform = isHidden ? 'rotate(0deg)' : 'rotate(180deg)';
    });

    // Close Error Alert
    closeErrorBtn.addEventListener('click', () => {
        errorAlert.classList.add('hidden');
    });

    // Step UI update helper
    function updateSteps(step) {
        // Reset
        [step1, step2, step3].forEach((el) => {
            el.className = 'p-2 rounded-lg bg-slate-800/40 border border-slate-700 text-slate-500 flex flex-col items-center gap-1';
        });

        if (step >= 1) {
            step1.className = 'p-2 rounded-lg bg-indigo-950/80 border border-indigo-500 text-indigo-300 flex flex-col items-center gap-1 font-semibold';
            progressStatusTitle.textContent = '1단계: 유튜브 오디오 다운로드 중...';
            progressStatusDesc.textContent = 'yt-dlp를 통해 고음질 오디오 스트림을 추출하여 임시 저장 중입니다.';
        }
        if (step >= 2) {
            step1.className = 'p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex flex-col items-center gap-1';
            step2.className = 'p-2 rounded-lg bg-indigo-950/80 border border-indigo-500 text-indigo-300 flex flex-col items-center gap-1 font-semibold';
            progressStatusTitle.textContent = '2단계: Gemini AI 음성 전사 중...';
            progressStatusDesc.textContent = 'Google AI Studio Gemini 모델이 오디오를 인식하고 타임스탬프를 생성 중입니다.';
        }
        if (step >= 3) {
            step2.className = 'p-2 rounded-lg bg-emerald-950/60 border border-emerald-500/50 text-emerald-300 flex flex-col items-center gap-1';
            step3.className = 'p-2 rounded-lg bg-indigo-950/80 border border-indigo-500 text-indigo-300 flex flex-col items-center gap-1 font-semibold';
            progressStatusTitle.textContent = '3단계: 자막 및 핵심 요약 정격 생성 중...';
            progressStatusDesc.textContent = '화자 분리, SRT/VTT 자막 변환 및 핵심 3줄 요약을 완료하고 있습니다.';
        }
    }

    // Submit Form
    transcribeForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const url = videoUrlInput.value.trim();
        if (!url) return;

        // UI Reset
        errorAlert.classList.add('hidden');
        resultSection.classList.add('hidden');
        progressSection.classList.remove('hidden');
        submitBtn.disabled = true;
        submitBtn.classList.add('opacity-50', 'cursor-not-allowed');

        updateSteps(1);

        // Simulation timer for step 2 & 3 UI feedback
        const stepTimer1 = setTimeout(() => updateSteps(2), 3500);
        const stepTimer2 = setTimeout(() => updateSteps(3), 8500);

        try {
            const payload = {
                url: url,
                api_key: customApiKey || null,
                model_name: modelSelect.value,
                language_hint: languageHint.value.trim() || null,
            };

            const res = await fetch('/api/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            clearTimeout(stepTimer1);
            clearTimeout(stepTimer2);

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.detail || '요청 처리 중 오류가 발생했습니다.');
            }

            currentData = data;
            renderResults(data);
            await loadHistory();
            showToast('트랜스크립트 추출 완료 & 히스토리에 저장되었습니다.');

        } catch (err) {
            clearTimeout(stepTimer1);
            clearTimeout(stepTimer2);
            errorMessage.textContent = err.message || '서버와의 통신에 실패했습니다.';
            errorAlert.classList.remove('hidden');
        } finally {
            progressSection.classList.add('hidden');
            submitBtn.disabled = false;
            submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
        }
    });

    // Render result data to UI
    function renderResults(data) {
        const { video, transcript } = data;

        // 1. Video Card
        resThumbnail.src = video.thumbnail || '';
        resTitle.textContent = video.title || '영상 제목';
        resUploader.textContent = video.uploader || '채널';
        resDuration.textContent = video.duration_string || '00:00';
        resLanguage.textContent = transcript.detected_language || '언어 자동감지';

        audioPlayer.src = video.audio_url;
        downloadAudioBtn.href = video.audio_url;
        downloadAudioBtn.download = video.audio_filename;

        // 2. Render Segments Timeline
        segmentsList.innerHTML = '';
        const segments = transcript.segments || [];

        if (segments.length === 0) {
            segmentsList.innerHTML = `<div class="p-4 text-center text-slate-400 text-sm">트랜스크립트 세그먼트가 없습니다.</div>`;
        } else {
            segments.forEach((seg, idx) => {
                const segEl = document.createElement('div');
                segEl.className = 'segment-item p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3 cursor-pointer group';
                segEl.dataset.seconds = seg.seconds || 0;
                segEl.id = `segment-${idx}`;

                const speakerBadge = seg.speaker ? `<span class="px-2 py-0.5 rounded bg-indigo-900/60 text-indigo-300 text-[11px] font-semibold">${escapeHtml(seg.speaker)}</span>` : '';

                segEl.innerHTML = `
                    <button type="button" class="jump-btn px-2.5 py-1 rounded-md bg-slate-800 group-hover:bg-indigo-600 text-indigo-300 group-hover:text-white font-mono text-xs font-semibold flex items-center gap-1 shrink-0 transition" title="이 위치로 재생">
                        <i data-lucide="play" class="w-3 h-3"></i>
                        <span>${seg.timestamp || seg.start}</span>
                    </button>
                    <div class="flex-1 space-y-1">
                        ${speakerBadge}
                        <p class="text-sm text-slate-200 leading-relaxed">${escapeHtml(seg.text)}</p>
                    </div>
                `;

                // Click jump
                segEl.addEventListener('click', () => {
                    if (seg.seconds !== undefined) {
                        audioPlayer.currentTime = parseFloat(seg.seconds);
                        audioPlayer.play();
                    }
                });

                segmentsList.appendChild(segEl);
            });
        }

        // 3. Render Summary & Key Points
        resSummary.textContent = transcript.summary || '요약 정보가 없습니다.';
        resKeyPoints.innerHTML = '';
        (transcript.key_points || []).forEach((kp) => {
            const li = document.createElement('li');
            li.className = 'flex items-start gap-2';
            li.innerHTML = `<i data-lucide="check" class="w-4 h-4 text-indigo-400 shrink-0 mt-0.5"></i> <span>${escapeHtml(kp)}</span>`;
            resKeyPoints.appendChild(li);
        });

        // 4. Render Plain Text
        resPlainText.value = transcript.full_text || '';

        // Show result section
        resultSection.classList.remove('hidden');
        lucide.createIcons();

        // Scroll to results
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Audio time update sync with segment highlight
    audioPlayer.addEventListener('timeupdate', () => {
        if (!currentData || !currentData.transcript || !currentData.transcript.segments) return;
        const currentSec = audioPlayer.currentTime;
        const segments = currentData.transcript.segments;

        let activeIdx = -1;
        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const nextSeg = segments[i + 1];
            const start = seg.seconds || 0;
            const end = nextSeg ? (nextSeg.seconds || start + 5) : start + 10;
            if (currentSec >= start && currentSec < end) {
                activeIdx = i;
                break;
            }
        }

        document.querySelectorAll('.segment-item').forEach((el, idx) => {
            if (idx === activeIdx) {
                el.classList.add('active-segment');
            } else {
                el.classList.remove('active-segment');
            }
        });
    });

    // Tab Switch Handlers
    function switchTab(activeTab) {
        tabTranscriptBtn.classList.remove('active', 'bg-indigo-600', 'text-white');
        tabSummaryBtn.classList.remove('active', 'bg-indigo-600', 'text-white');
        tabPlainBtn.classList.remove('active', 'bg-indigo-600', 'text-white');

        tabTranscriptBtn.classList.add('text-slate-400');
        tabSummaryBtn.classList.add('text-slate-400');
        tabPlainBtn.classList.add('text-slate-400');

        tabContentTranscript.classList.add('hidden');
        tabContentSummary.classList.add('hidden');
        tabContentPlain.classList.add('hidden');

        if (activeTab === 'transcript') {
            tabTranscriptBtn.classList.add('active');
            tabTranscriptBtn.classList.remove('text-slate-400');
            tabContentTranscript.classList.remove('hidden');
        } else if (activeTab === 'summary') {
            tabSummaryBtn.classList.add('active');
            tabSummaryBtn.classList.remove('text-slate-400');
            tabContentSummary.classList.remove('hidden');
        } else if (activeTab === 'plain') {
            tabPlainBtn.classList.add('active');
            tabPlainBtn.classList.remove('text-slate-400');
            tabContentPlain.classList.remove('hidden');
        }
    }

    tabTranscriptBtn.addEventListener('click', () => switchTab('transcript'));
    tabSummaryBtn.addEventListener('click', () => switchTab('summary'));
    tabPlainBtn.addEventListener('click', () => switchTab('plain'));

    // Export Handlers
    function downloadFile(filename, content, type = 'text/plain;charset=utf-8') {
        const blob = new Blob([content], { type: type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function getBaseFilename() {
        if (!currentData || !currentData.video) return 'transcript';
        const title = currentData.video.title || 'transcript';
        return title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 40);
    }

    exportTxtBtn.addEventListener('click', () => {
        if (!currentData) return;
        const text = currentData.transcript.full_text || '';
        downloadFile(`${getBaseFilename()}.txt`, text);
    });

    exportSrtBtn.addEventListener('click', () => {
        if (!currentData) return;
        const srt = currentData.transcript.srt || '';
        downloadFile(`${getBaseFilename()}.srt`, srt);
    });

    exportVttBtn.addEventListener('click', () => {
        if (!currentData) return;
        const vtt = currentData.transcript.vtt || '';
        downloadFile(`${getBaseFilename()}.vtt`, vtt, 'text/vtt;charset=utf-8');
    });

    copyAllBtn.addEventListener('click', async () => {
        if (!currentData) return;
        const text = currentData.transcript.full_text || '';
        try {
            await navigator.clipboard.writeText(text);
            showToast('전체 트랜스크립트가 클립보드에 복사되었습니다.');
        } catch (e) {
            showToast('복사에 실패했습니다.');
        }
    });

    // ==================== History Management ====================
    historyToggleBtn.addEventListener('click', () => {
        const isHidden = historySection.classList.toggle('hidden');
        if (!isHidden) {
            loadHistory();
        }
    });

    closeHistoryBtn.addEventListener('click', () => {
        historySection.classList.add('hidden');
    });

    clearAllHistoryBtn.addEventListener('click', async () => {
        if (!confirm('정말 모든 히스토리를 삭제하시겠습니까?')) return;
        try {
            await fetch('/api/history', { method: 'DELETE' });
            showToast('히스토리가 전체 삭제되었습니다.');
            loadHistory();
        } catch (e) {
            showToast('히스토리 삭제 중 오류가 발생했습니다.');
        }
    });

    async function loadHistory() {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            const history = data.history || [];

            historyCountBadge.textContent = history.length;

            if (history.length === 0) {
                historyListContainer.innerHTML = `
                    <div class="text-center py-8 text-slate-500 text-xs">
                        <i data-lucide="inbox" class="w-8 h-8 mx-auto mb-2 text-slate-600"></i>
                        <p>저장된 히스토리가 없습니다.</p>
                    </div>
                `;
                lucide.createIcons();
                return;
            }

            historyListContainer.innerHTML = '';
            history.forEach((item) => {
                const video = item.video || {};
                const transcript = item.transcript || {};
                const card = document.createElement('div');
                card.className = 'p-3 rounded-xl bg-slate-950/80 hover:bg-slate-800/60 border border-slate-800 hover:border-indigo-500/40 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group';

                card.innerHTML = `
                    <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer item-click-target">
                        <img src="${video.thumbnail || ''}" class="w-16 h-10 object-cover rounded-lg border border-slate-700 shrink-0" alt="thumb">
                        <div class="min-w-0 flex-1">
                            <h4 class="text-xs font-semibold text-slate-100 group-hover:text-indigo-300 truncate">${escapeHtml(video.title || '제목 없음')}</h4>
                            <div class="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                <span>${escapeHtml(video.uploader || '')}</span>
                                <span>•</span>
                                <span>${video.duration_string || ''}</span>
                                <span>•</span>
                                <span class="text-slate-500">${item.created_at || ''}</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button type="button" class="load-history-btn px-2.5 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-medium flex items-center gap-1 transition">
                            <i data-lucide="external-link" class="w-3.5 h-3.5"></i>
                            <span>열기</span>
                        </button>
                        <button type="button" class="delete-history-btn p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition" title="삭제">
                            <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                        </button>
                    </div>
                `;

                // Item Click / Open
                const openHistory = () => {
                    currentData = item;
                    renderResults(item);
                    historySection.classList.add('hidden');
                    showToast('히스토리에서 항목을 불러왔습니다.');
                };

                card.querySelector('.item-click-target').addEventListener('click', openHistory);
                card.querySelector('.load-history-btn').addEventListener('click', openHistory);

                // Delete Item
                card.querySelector('.delete-history-btn').addEventListener('click', async (e) => {
                    e.stopPropagation();
                    const videoId = video.id;
                    if (!videoId) return;
                    try {
                        await fetch(`/api/history/${videoId}`, { method: 'DELETE' });
                        showToast('항목이 삭제되었습니다.');
                        loadHistory();
                    } catch (err) {
                        showToast('삭제 실패');
                    }
                });

                historyListContainer.appendChild(card);
            });

            lucide.createIcons();

        } catch (err) {
            historyListContainer.innerHTML = `<div class="text-center py-4 text-rose-400 text-xs">히스토리를 불러오지 못했습니다.</div>`;
        }
    }

    // Initial history load
    loadHistory();

    // Helper: Toast notification
    function showToast(msg) {
        const toast = document.createElement('div');
        toast.className = 'fixed bottom-6 right-6 px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl z-50 animate-fade-in transition';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    // Helper: Escape HTML
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
});

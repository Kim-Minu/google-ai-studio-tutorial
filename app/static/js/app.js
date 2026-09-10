// YouTube Audio & Transcript Application Script (Watch Page Layout)

document.addEventListener('DOMContentLoaded', () => {
    // State
    let currentData = null;
    let currentSegments = [];

    // DOM Elements - Header & Forms
    const transcribeForm = document.getElementById('transcribeForm');
    const videoUrlInput = document.getElementById('videoUrl');
    const submitBtn = document.getElementById('submitBtn');

    const historyToggleBtn = document.getElementById('historyToggleBtn');
    const mobileHistoryToggleBtn = document.getElementById('mobileHistoryToggleBtn');
    const historyCountBadge = document.getElementById('historyCountBadge');
    const mobileHistoryCountBadge = document.getElementById('mobileHistoryCountBadge');
    const historyDrawer = document.getElementById('historyDrawer');
    const closeDrawerBtn = document.getElementById('closeDrawerBtn');
    const drawerHistoryList = document.getElementById('drawerHistoryList');

    const progressSection = document.getElementById('progressSection');
    const progressStatusTitle = document.getElementById('progressStatusTitle');
    const progressStatusDesc = document.getElementById('progressStatusDesc');
    const step1 = document.getElementById('step1');
    const step2 = document.getElementById('step2');
    const step3 = document.getElementById('step3');

    const errorAlert = document.getElementById('errorAlert');
    const errorMessage = document.getElementById('errorMessage');
    const closeErrorBtn = document.getElementById('closeErrorBtn');

    // DOM Elements - Home & History
    const welcomeHero = document.getElementById('welcomeHero');
    const homeHistorySection = document.getElementById('homeHistorySection');
    const homeHistoryGrid = document.getElementById('homeHistoryGrid');
    const homeHistoryCount = document.getElementById('homeHistoryCount');

    // DOM Elements - Watch Layout
    const watchLayout = document.getElementById('watchLayout');
    const ytPlayerIframe = document.getElementById('ytPlayerIframe');
    const audioPlayer = document.getElementById('audioPlayer');
    const resTitle = document.getElementById('resTitle');
    const resUploader = document.getElementById('resUploader');
    const resDuration = document.getElementById('resDuration');
    const resLanguage = document.getElementById('resLanguage');
    const channelInitial = document.getElementById('channelInitial');

    const downloadAudioBtn = document.getElementById('downloadAudioBtn');
    const exportSrtBtn = document.getElementById('exportSrtBtn');
    const exportVttBtn = document.getElementById('exportVttBtn');
    const exportTxtBtn = document.getElementById('exportTxtBtn');
    const copyAllBtn = document.getElementById('copyAllBtn');

    const descriptionBox = document.getElementById('descriptionBox');
    const descToggleText = document.getElementById('descToggleText');
    const resSummary = document.getElementById('resSummary');
    const expandedDescContent = document.getElementById('expandedDescContent');
    const resKeyPoints = document.getElementById('resKeyPoints');

    const segmentsList = document.getElementById('segmentsList');
    const segmentCountBadge = document.getElementById('segmentCountBadge');
    const transcriptSearchInput = document.getElementById('transcriptSearchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const sidebarHistoryList = document.getElementById('sidebarHistoryList');
    const sidebarClearHistoryBtn = document.getElementById('sidebarClearHistoryBtn');

    if (closeErrorBtn) {
        closeErrorBtn.addEventListener('click', () => {
            if (errorAlert) errorAlert.classList.add('hidden');
        });
    }

    // ==================== Form Submit / Transcribe ====================
    if (transcribeForm) {
        transcribeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const url = videoUrlInput ? videoUrlInput.value.trim() : '';
            if (!url) return;

            if (errorAlert) errorAlert.classList.add('hidden');
            if (progressSection) progressSection.classList.remove('hidden');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.classList.add('opacity-50', 'cursor-not-allowed');
            }

            updateSteps(1);
            const stepTimer1 = setTimeout(() => updateSteps(2), 3500);
            const stepTimer2 = setTimeout(() => updateSteps(3), 8500);

            try {
                const payload = {
                    url: url,
                    model_name: 'gemini-3.7-flash',
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
                if (errorMessage) errorMessage.textContent = err.message || '서버와의 통신에 실패했습니다.';
                if (errorAlert) errorAlert.classList.remove('hidden');
            } finally {
                if (progressSection) progressSection.classList.add('hidden');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.classList.remove('opacity-50', 'cursor-not-allowed');
                }
            }
        });
    }

    const progressBarFill = document.getElementById('progressBarFill');

    function updateSteps(stepNumber) {
        const steps = [
            { el: step1, title: '오디오 추출 중...', desc: '고음질 스트림을 분석하고 다운로드합니다.', width: '30%' },
            { el: step2, title: 'Gemini AI 음성 인식 중...', desc: '화자 분리 및 타임스탬프 자막을 정밀 추출합니다.', width: '65%' },
            { el: step3, title: '자막 및 3줄 요약 생성 중...', desc: 'SRT/VTT 자막과 핵심 요약을 정리하고 있습니다.', width: '90%' },
        ];

        [step1, step2, step3].forEach((s, idx) => {
            if (!s) return;
            if (idx + 1 < stepNumber) {
                s.className = 'p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500 text-emerald-300 flex flex-col items-center gap-1.5 font-semibold transition shadow-sm';
            } else if (idx + 1 === stepNumber) {
                s.className = 'p-2.5 rounded-xl bg-indigo-950/90 border border-indigo-400 text-indigo-200 flex flex-col items-center gap-1.5 font-semibold transition shadow-lg ring-2 ring-indigo-500/50 scale-105';
            } else {
                s.className = 'p-2.5 rounded-xl bg-[#272727] border border-[#383838] text-slate-500 flex flex-col items-center gap-1.5 transition opacity-60';
            }
        });

        if (steps[stepNumber - 1]) {
            if (progressStatusTitle) progressStatusTitle.textContent = steps[stepNumber - 1].title;
            if (progressStatusDesc) progressStatusDesc.textContent = steps[stepNumber - 1].desc;
            if (progressBarFill) progressBarFill.style.width = steps[stepNumber - 1].width;
        }

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==================== Render Results ====================
    function renderResults(data) {
        if (!data || !data.video || !data.transcript) return;
        const { video, transcript } = data;
        currentSegments = transcript.segments || [];

        // 1. Switch Views: Hide Welcome, Show Watch Layout
        if (welcomeHero) welcomeHero.classList.add('hidden');
        if (watchLayout) watchLayout.classList.remove('hidden');

        // 2. Video & Audio Player
        if (video.id && ytPlayerIframe) {
            ytPlayerIframe.src = `https://www.youtube.com/embed/${video.id}?enablejsapi=1`;
        }
        if (video.audio_url && audioPlayer) {
            audioPlayer.src = video.audio_url;
            if (downloadAudioBtn) {
                downloadAudioBtn.href = video.audio_url;
                downloadAudioBtn.download = video.audio_filename || `${video.title || 'audio'}.mp3`;
            }
        }

        // 3. Metadata
        if (resTitle) resTitle.textContent = video.title || '제목 없음';
        if (resUploader) resUploader.textContent = video.uploader || '알 수 없음';
        if (resDuration) resDuration.textContent = video.duration_string || '00:00';
        if (resLanguage) resLanguage.textContent = transcript.detected_language || '한국어';
        if (channelInitial) channelInitial.textContent = (video.uploader || 'Y').charAt(0).toUpperCase();

        // 4. Description / AI Summary
        if (resSummary) resSummary.textContent = transcript.summary || '요약이 생성되지 않았습니다.';
        if (resKeyPoints) {
            resKeyPoints.innerHTML = '';
            if (transcript.key_points && transcript.key_points.length > 0) {
                transcript.key_points.forEach((kp) => {
                    const li = document.createElement('li');
                    li.className = 'flex items-start gap-2';
                    li.innerHTML = `<span class="text-indigo-400 font-bold">•</span><span>${escapeHtml(kp)}</span>`;
                    resKeyPoints.appendChild(li);
                });
            }
        }

        // 5. Render Transcript Segments
        renderSegments(currentSegments);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // ==================== Transcript Segments Render & Filter ====================
    function renderSegments(segments) {
        if (!segmentsList) return;
        segmentsList.innerHTML = '';
        if (segmentCountBadge) segmentCountBadge.textContent = `${segments.length}개 항목`;

        if (segments.length === 0) {
            segmentsList.innerHTML = `
                <div class="text-center py-12 text-slate-500 text-xs">
                    <p>검색 결과가 없거나 자막이 비어있습니다.</p>
                </div>
            `;
            return;
        }

        segments.forEach((seg, index) => {
            const div = document.createElement('div');
            div.className = 'transcript-segment flex items-start gap-3 text-xs leading-relaxed';
            div.dataset.seconds = seg.seconds || 0;
            div.dataset.index = index;

            div.innerHTML = `
                <span class="segment-timestamp shrink-0">${seg.timestamp || '00:00'}</span>
                <div class="flex-1">
                    <div class="flex items-center gap-1.5 mb-0.5">
                        <span class="font-bold text-slate-400 text-[11px]">${escapeHtml(seg.speaker || '화자')}</span>
                    </div>
                    <span class="segment-text text-slate-200">${escapeHtml(seg.text || '')}</span>
                </div>
            `;

            // Click timestamp: seek audio & YouTube iframe
            div.addEventListener('click', () => {
                seekToTime(seg.seconds || 0);
            });

            segmentsList.appendChild(div);
        });
    }

    // Seek player
    function seekToTime(seconds) {
        if (audioPlayer && audioPlayer.src) {
            audioPlayer.currentTime = seconds;
            audioPlayer.play().catch(() => {});
        }

        if (ytPlayerIframe && ytPlayerIframe.contentWindow) {
            ytPlayerIframe.contentWindow.postMessage(
                JSON.stringify({
                    event: 'command',
                    func: 'seekTo',
                    args: [seconds, true],
                }),
                '*'
            );
        }
    }

    // Audio timeupdate -> highlight matching segment & auto-scroll
    if (audioPlayer) {
        audioPlayer.addEventListener('timeupdate', () => {
            const currentTime = audioPlayer.currentTime;
            const segmentElements = document.querySelectorAll('.transcript-segment');

            let activeIndex = -1;
            for (let i = 0; i < currentSegments.length; i++) {
                const seg = currentSegments[i];
                const nextSeg = currentSegments[i + 1];
                const start = seg.seconds || 0;
                const end = nextSeg ? nextSeg.seconds : start + 10;

                if (currentTime >= start && currentTime < end) {
                    activeIndex = i;
                    break;
                }
            }

            segmentElements.forEach((el, idx) => {
                if (idx === activeIndex) {
                    if (!el.classList.contains('active-segment')) {
                        el.classList.add('active-segment');
                        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    }
                } else {
                    el.classList.remove('active-segment');
                }
            });
        });
    }

    // Transcript Search Filter
    if (transcriptSearchInput) {
        transcriptSearchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();
            if (query) {
                if (clearSearchBtn) clearSearchBtn.classList.remove('hidden');
                const filtered = currentSegments.filter(s => (s.text || '').toLowerCase().includes(query) || (s.speaker || '').toLowerCase().includes(query));
                renderSegments(filtered);
            } else {
                if (clearSearchBtn) clearSearchBtn.classList.add('hidden');
                renderSegments(currentSegments);
            }
        });
    }

    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            if (transcriptSearchInput) transcriptSearchInput.value = '';
            clearSearchBtn.classList.add('hidden');
            renderSegments(currentSegments);
        });
    }

    // Description Expand / Collapse Toggle
    if (descriptionBox) {
        descriptionBox.addEventListener('click', () => {
            if (expandedDescContent) {
                const isHidden = expandedDescContent.classList.toggle('hidden');
                if (descToggleText) descToggleText.textContent = isHidden ? '더보기' : '간략히';
            }
        });
    }

    // ==================== Export & Copy Handlers ====================
    function downloadFile(filename, text, mimeType = 'text/plain;charset=utf-8') {
        const blob = new Blob([text], { type: mimeType });
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
        const title = (currentData && currentData.video && currentData.video.title) ? currentData.video.title : 'transcript';
        return title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 40);
    }

    if (exportTxtBtn) {
        exportTxtBtn.addEventListener('click', () => {
            if (!currentData || !currentData.transcript) return;
            downloadFile(`${getBaseFilename()}.txt`, currentData.transcript.full_text || '');
        });
    }

    if (exportSrtBtn) {
        exportSrtBtn.addEventListener('click', () => {
            if (!currentData || !currentData.transcript) return;
            downloadFile(`${getBaseFilename()}.srt`, currentData.transcript.srt || '');
        });
    }

    if (exportVttBtn) {
        exportVttBtn.addEventListener('click', () => {
            if (!currentData || !currentData.transcript) return;
            downloadFile(`${getBaseFilename()}.vtt`, currentData.transcript.vtt || '', 'text/vtt;charset=utf-8');
        });
    }

    if (copyAllBtn) {
        copyAllBtn.addEventListener('click', async () => {
            if (!currentData || !currentData.transcript) return;
            try {
                await navigator.clipboard.writeText(currentData.transcript.full_text || '');
                showToast('전체 트랜스크립트가 클립보드에 복사되었습니다.');
            } catch (e) {
                showToast('복사에 실패했습니다.');
            }
        });
    }

    // ==================== History Management ====================
    if (historyToggleBtn && historyDrawer) {
        historyToggleBtn.addEventListener('click', () => {
            historyDrawer.classList.remove('hidden');
        });
    }

    if (mobileHistoryToggleBtn && historyDrawer) {
        mobileHistoryToggleBtn.addEventListener('click', () => {
            historyDrawer.classList.remove('hidden');
        });
    }

    if (closeDrawerBtn && historyDrawer) {
        closeDrawerBtn.addEventListener('click', () => {
            historyDrawer.classList.add('hidden');
        });
    }

    if (historyDrawer) {
        historyDrawer.addEventListener('click', (e) => {
            if (e.target === historyDrawer) {
                historyDrawer.classList.add('hidden');
            }
        });
    }

    if (sidebarClearHistoryBtn) {
        sidebarClearHistoryBtn.addEventListener('click', async () => {
            if (!confirm('정말 모든 최근 기록을 삭제하시겠습니까?')) return;
            try {
                await fetch('/api/history', { method: 'DELETE' });
                showToast('히스토리가 전체 삭제되었습니다.');
                loadHistory();
            } catch (e) {
                showToast('히스토리 삭제 실패');
            }
        });
    }

    async function loadHistory() {
        try {
            const res = await fetch('/api/history');
            const data = await res.json();
            const history = data.history || [];

            if (historyCountBadge) historyCountBadge.textContent = history.length;
            if (mobileHistoryCountBadge) mobileHistoryCountBadge.textContent = history.length;
            if (homeHistoryCount) homeHistoryCount.textContent = `${history.length}개 저장됨`;

            renderHomeHistory(history);
            renderSidebarHistory(history);
            renderDrawerHistory(history);

        } catch (err) {
            console.error('History load failed:', err);
        }
    }

    // 1. Render Home Welcome Grid History
    function renderHomeHistory(history) {
        if (!homeHistoryGrid) return;
        homeHistoryGrid.innerHTML = '';

        if (history.length === 0) {
            if (homeHistorySection) homeHistorySection.classList.add('hidden');
            return;
        }

        if (homeHistorySection) homeHistorySection.classList.remove('hidden');

        history.forEach((item) => {
            const video = item.video || {};
            const transcript = item.transcript || {};
            const card = document.createElement('div');
            card.className = 'rounded-2xl bg-[#1e1e1e] hover:bg-[#262626] border border-[#2e2e2e] hover:border-indigo-500/40 p-3.5 transition flex flex-col justify-between space-y-3 cursor-pointer group shadow-lg';

            card.innerHTML = `
                <div class="space-y-2.5">
                    <div class="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#333]">
                        <img src="${video.thumbnail || ''}" class="w-full h-full object-cover group-hover:scale-105 transition duration-300" alt="thumb">
                        <span class="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-black/80 text-[11px] font-mono font-bold text-white">
                            ${video.duration_string || '00:00'}
                        </span>
                    </div>
                    <div>
                        <h4 class="text-xs sm:text-sm font-bold text-white group-hover:text-indigo-300 line-clamp-2 leading-snug">
                            ${escapeHtml(video.title || '제목 없음')}
                        </h4>
                        <p class="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                            <span>${escapeHtml(video.uploader || '')}</span>
                            <span>•</span>
                            <span class="text-slate-500">${item.created_at || ''}</span>
                        </p>
                    </div>
                    <p class="text-xs text-slate-300 line-clamp-2 bg-[#171717] p-2 rounded-lg border border-[#282828] leading-relaxed">
                        ${escapeHtml(transcript.summary || '요약 없음')}
                    </p>
                </div>
                <div class="pt-2 border-t border-[#2a2a2a] flex items-center justify-between">
                    <span class="text-[11px] text-indigo-400 font-semibold flex items-center gap-1">
                        <i data-lucide="play-circle" class="w-3.5 h-3.5"></i>
                        <span>지금 재생하기</span>
                    </span>
                    <button class="home-del-btn text-slate-500 hover:text-rose-400 p-1 transition" title="삭제">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>
            `;

            card.addEventListener('click', () => {
                currentData = item;
                renderResults(item);
                showToast('히스토리에서 영상을 불러왔습니다.');
            });

            const delBtn = card.querySelector('.home-del-btn');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (video.id) {
                        await fetch(`/api/history/${video.id}`, { method: 'DELETE' });
                        showToast('히스토리에서 삭제되었습니다.');
                        loadHistory();
                    }
                });
            }

            homeHistoryGrid.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    // 2. Render YouTube 'Up Next' style sidebar history
    function renderSidebarHistory(history) {
        if (!sidebarHistoryList) return;
        sidebarHistoryList.innerHTML = '';
        if (history.length === 0) {
            sidebarHistoryList.innerHTML = `<p class="text-xs text-slate-500 text-center py-4">최근 변환 기록이 없습니다.</p>`;
            return;
        }

        history.forEach((item) => {
            const video = item.video || {};
            const card = document.createElement('div');
            card.className = 'p-2 rounded-xl hover:bg-[#272727] transition flex items-center gap-2.5 cursor-pointer group';

            card.innerHTML = `
                <img src="${video.thumbnail || ''}" class="w-20 h-12 object-cover rounded-lg border border-[#333333] shrink-0" alt="thumb">
                <div class="min-w-0 flex-1">
                    <h5 class="text-xs font-semibold text-slate-200 group-hover:text-[#3ea6ff] line-clamp-2 leading-tight">
                        ${escapeHtml(video.title || '제목 없음')}
                    </h5>
                    <div class="text-[11px] text-slate-400 mt-0.5 truncate">${escapeHtml(video.uploader || '')}</div>
                </div>
            `;

            card.addEventListener('click', () => {
                currentData = item;
                renderResults(item);
                showToast('기록에서 영상을 불러왔습니다.');
            });

            sidebarHistoryList.appendChild(card);
        });
    }

    // 3. Render Drawer history
    function renderDrawerHistory(history) {
        if (!drawerHistoryList) return;
        drawerHistoryList.innerHTML = '';
        if (history.length === 0) {
            drawerHistoryList.innerHTML = `<p class="text-xs text-slate-500 text-center py-8">저장된 기록이 없습니다.</p>`;
            return;
        }

        history.forEach((item) => {
            const video = item.video || {};
            const card = document.createElement('div');
            card.className = 'p-3 rounded-xl bg-[#272727] hover:bg-[#303030] border border-[#383838] transition flex items-center justify-between gap-3 group';

            card.innerHTML = `
                <div class="flex items-center gap-3 flex-1 min-w-0 cursor-pointer item-open-target">
                    <img src="${video.thumbnail || ''}" class="w-16 h-10 object-cover rounded-lg shrink-0 border border-[#444]" alt="thumb">
                    <div class="min-w-0 flex-1">
                        <h4 class="text-xs font-semibold text-white group-hover:text-[#3ea6ff] truncate">${escapeHtml(video.title || '')}</h4>
                        <p class="text-[11px] text-slate-400">${escapeHtml(video.uploader || '')} • ${video.duration_string || ''}</p>
                    </div>
                </div>
                <button class="delete-history-btn p-1.5 text-slate-400 hover:text-rose-400 transition" title="삭제">
                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                </button>
            `;

            const openTarget = card.querySelector('.item-open-target');
            if (openTarget) {
                openTarget.addEventListener('click', () => {
                    currentData = item;
                    renderResults(item);
                    if (historyDrawer) historyDrawer.classList.add('hidden');
                    showToast('기록에서 영상을 불러왔습니다.');
                });
            }

            const delBtn = card.querySelector('.delete-history-btn');
            if (delBtn) {
                delBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    if (video.id) {
                        await fetch(`/api/history/${video.id}`, { method: 'DELETE' });
                        showToast('항목이 삭제되었습니다.');
                        loadHistory();
                    }
                });
            }

            drawerHistoryList.appendChild(card);
        });

        if (typeof lucide !== 'undefined') lucide.createIcons();
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

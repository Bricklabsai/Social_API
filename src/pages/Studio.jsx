import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUploadCloud,
  FiFilm,
  FiZap,
  FiTrash2,
  FiLayers,
  FiClock,
  FiCheckCircle,
  FiAlertCircle,
  FiSend,
  FiCalendar,
} from 'react-icons/fi';
import { FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { studio as studioApi } from '../services/api';
import {
  PLATFORM_DISPLAY_NAMES,
  PLATFORM_IDS,
  getPlatformIcon,
} from '../constants/platforms';
import { useAuth } from '../context/AuthContext';
import { isPremiumPlan } from '../utils/plan';
import UpgradeGate from '../components/UpgradeGate';

const POLL_MS = 4000;

const formatTime = (sec) => {
  if (sec == null || Number.isNaN(sec)) return '—';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
};

const statusLabel = {
  queued: 'Queued…',
  transcribing: 'Transcribing audio…',
  analyzing: 'AI repurposing for platforms…',
  ready: 'Ready',
  failed: 'Failed',
};

const buildDraftFromOutput = (out, platform, mediaUrl) => {
  const tags = (out.hashtags || [])
    .map((t) => `#${String(t).replace(/^#/, '')}`)
    .join(' ');
  const content = [out.caption, tags].filter(Boolean).join('\n\n');
  return {
    content,
    platforms: [platform],
    mediaUrl: mediaUrl || null,
    mediaType: mediaUrl ? 'video' : null,
  };
};

export default function Studio() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canUseStudio = isPremiumPlan(user?.plan);
  const fileInputRef = useRef(null);
  const pollRef = useRef(null);

  const [jobs, setJobs] = useState([]);
  const [activeJob, setActiveJob] = useState(null);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [activePlatform, setActivePlatform] = useState(PLATFORM_IDS[0]);
  const [sendingBoard, setSendingBoard] = useState(false);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [manualTranscript, setManualTranscript] = useState('');
  const [submittingTranscript, setSubmittingTranscript] = useState(false);
  const [mockMode, setMockMode] = useState(false);

  const loadJobs = useCallback(async () => {
    if (!canUseStudio) {
      setLoadingJobs(false);
      return;
    }
    try {
      const res = await studioApi.listJobs();
      setJobs(res.data?.jobs || []);
      setApiUnavailable(false);
    } catch (e) {
      console.error(e);
      if (e.response?.status === 404) {
        setApiUnavailable(true);
      } else if (e.response?.status === 403) {
        setJobs([]);
      }
    } finally {
      setLoadingJobs(false);
    }
  }, [canUseStudio]);

  const loadJob = useCallback(async (id) => {
    const res = await studioApi.getJob(id);
    setActiveJob(res.data);
    return res.data;
  }, []);

  useEffect(() => {
    loadJobs();
    if (canUseStudio) {
      studioApi
        .getPlatforms()
        .then((res) => setMockMode(Boolean(res.data?.mock_mode)))
        .catch(() => {});
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [loadJobs, canUseStudio]);

  const handoffToComposer = (out, mode) => {
    const draft = buildDraftFromOutput(out, activePlatform, activeJob?.source_media_url);
    if (mode === 'schedule') {
      navigate('/schedule', { state: { compose: true, studioDraft: draft } });
    } else {
      navigate('/dashboard', { state: { compose: true, studioDraft: draft } });
    }
  };

  useEffect(() => {
    if (!activeJob?.id) return;
    const processing = ['queued', 'transcribing', 'analyzing'].includes(activeJob.status);
    if (!processing) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(async () => {
      try {
        const updated = await loadJob(activeJob.id);
        if (updated.status === 'ready') {
          toast.success('Repurposing complete!');
          loadJobs();
        } else if (updated.status === 'failed') {
          toast.error(updated.error_message || 'Studio job failed');
        }
      } catch {
        /* ignore poll errors */
      }
    }, POLL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeJob?.id, activeJob?.status, loadJob, loadJobs]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
      toast.error('Please upload a video or audio file');
      return;
    }
    setSelectedFile(file);
    if (!title) setTitle(file.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Select a video or podcast file first');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title || selectedFile.name);
      formData.append('context', context);
      const res = await studioApi.createJob(formData);
      const job = res.data?.job;
      setActiveJob(job);
      setSelectedFile(null);
      setTitle('');
      setContext('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Upload started — AI is analyzing your content');
      loadJobs();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Delete this Studio project?')) return;
    try {
      await studioApi.deleteJob(id);
      if (activeJob?.id === id) setActiveJob(null);
      loadJobs();
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSendToBoard = async () => {
    if (!activeJob?.id) return;
    setSendingBoard(true);
    try {
      const res = await studioApi.sendToBoard(activeJob.id, { platform: activePlatform });
      toast.success(res.data?.message || 'Sent to Create board');
      navigate('/create');
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to send to board');
    } finally {
      setSendingBoard(false);
    }
  };

  const handleSubmitTranscript = async () => {
    const text = manualTranscript.trim();
    if (text.length < 20) {
      toast.error('Paste a longer transcript (at least a few sentences)');
      return;
    }
    setSubmittingTranscript(true);
    try {
      let res;
      if (activeJob?.id && activeJob.status === 'failed') {
        res = await studioApi.fromTranscript(activeJob.id, { transcript: text });
      } else {
        res = await studioApi.createFromTranscript({
          transcript: text,
          title: title || 'Transcript project',
          context,
        });
      }
      setActiveJob(res.data?.job);
      setManualTranscript('');
      toast.success('Repurposing started from your transcript');
      loadJobs();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to start from transcript');
    } finally {
      setSubmittingTranscript(false);
    }
  };

  const platformOutputs = activeJob?.platform_outputs?.[activePlatform] || [];
  const clips = activeJob?.clips || [];
  const isProcessing = activeJob && ['queued', 'transcribing', 'analyzing'].includes(activeJob.status);
  const isQuotaFailure =
    activeJob?.status === 'failed' &&
    /quota|billing|whisper/i.test(activeJob?.error_message || '');

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[#168eea] mb-2">
            <FiFilm size={22} />
            <span className="text-sm font-semibold uppercase tracking-wide">Studio</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">AI Content Repurposing</h1>
          <p className="text-gray-500 mt-1 max-w-2xl">
            Upload a long video or podcast. Our AI transcribes it and generates clips, captions,
            and edits tailored for Reels, Shorts, TikTok, LinkedIn, and every channel you use.
          </p>
        </div>
      </div>

      {!canUseStudio ? (
        <UpgradeGate feature="Studio AI" />
      ) : (
        <>
      {mockMode && (
        <div className="rounded-xl border border-[#168eea]/25 bg-[#168eea]/5 px-4 py-3 text-sm text-gray-700">
          <strong className="text-[#168eea]">Simulation mode</strong> — Studio is using mock
          transcripts and captions (no OpenAI spend). Set{' '}
          <code className="text-xs bg-white px-1 rounded border">MOCK_STUDIO=false</code> in
          backend env to go live.
        </div>
      )}

      {apiUnavailable && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Studio API is not available on the backend yet (<code className="text-xs">/api/v1/studio</code>).
          Redeploy <strong>Unified-Social-API</strong> (Render and/or BrickDeploy) with the latest
          commit that includes Studio routes, then refresh this page.
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upload panel */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FiUploadCloud className="text-[#168eea]" />
              Upload source
            </h2>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-[#168eea]/50 hover:bg-[#168eea]/5 transition-colors"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*,audio/*"
                className="hidden"
                onChange={handleFileChange}
              />
              {selectedFile ? (
                <div>
                  <p className="font-medium text-gray-800 text-sm truncate">{selectedFile.name}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                  </p>
                </div>
              ) : (
                <>
                  <FiUploadCloud className="mx-auto text-gray-300 mb-2" size={36} />
                  <p className="text-sm text-gray-600">MP4, MOV, WebM, or audio</p>
                  <p className="text-xs text-gray-400 mt-1">Podcasts, webinars, interviews</p>
                </>
              )}
            </div>
            <input
              type="text"
              placeholder="Project title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              placeholder="Context for AI (topic, audience, tone…)"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
            />
            <button
              onClick={handleUpload}
              disabled={uploading || !selectedFile}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-[#168eea] hover:bg-[#1378d4] disabled:opacity-50 text-white font-medium rounded-xl py-2.5 text-sm transition-colors"
            >
              {uploading ? (
                <>
                  <FaSpinner className="animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <FiZap /> Repurpose with AI
                </>
              )}
            </button>

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Or paste transcript
              </p>
              <textarea
                placeholder="Paste podcast / interview transcript here to skip Whisper transcription…"
                value={manualTranscript}
                onChange={(e) => setManualTranscript(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm resize-none"
              />
              <button
                onClick={handleSubmitTranscript}
                disabled={submittingTranscript || manualTranscript.trim().length < 20}
                className="mt-2 w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-[#168eea]/40 hover:bg-[#168eea]/5 disabled:opacity-50 text-gray-700 font-medium rounded-xl py-2.5 text-sm transition-colors"
              >
                {submittingTranscript ? (
                  <>
                    <FaSpinner className="animate-spin" /> Starting…
                  </>
                ) : (
                  'Repurpose from transcript'
                )}
              </button>
            </div>
          </div>

          {/* Past projects */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3 text-sm">Recent projects</h3>
            {loadingJobs ? (
              <p className="text-sm text-gray-400">Loading…</p>
            ) : jobs.length === 0 ? (
              <p className="text-sm text-gray-400">No projects yet</p>
            ) : (
              <ul className="space-y-2 max-h-64 overflow-y-auto">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <button
                      onClick={() => loadJob(job.id)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-center justify-between gap-2 ${
                        activeJob?.id === job.id
                          ? 'bg-[#168eea]/10 text-[#168eea]'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="truncate font-medium">{job.title || `Project #${job.id}`}</span>
                      <StatusPill status={job.status} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Results panel */}
        <div className="lg:col-span-2 space-y-4">
          {!activeJob ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
              <FiFilm className="mx-auto text-gray-200 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No project selected</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                Upload a long-form video to get AI-suggested clips and platform-ready captions for
                Instagram Reels, TikTok, YouTube Shorts, LinkedIn, X, and more.
              </p>
            </div>
          ) : (
            <>
              {/* Job header */}
              <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{activeJob.title}</h2>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <StatusPill status={activeJob.status} />
                      {activeJob.provider && (
                        <span>via {activeJob.provider}</span>
                      )}
                      {activeJob.source_duration_sec && (
                        <span className="flex items-center gap-1">
                          <FiClock size={12} />
                          {formatTime(activeJob.source_duration_sec)}
                        </span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => handleDeleteJob(activeJob.id)}
                    className="text-gray-400 hover:text-red-500 p-2"
                    title="Delete project"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>

                {isProcessing && (
                  <div className="mt-4 flex items-center gap-3 p-4 rounded-xl bg-[#168eea]/5 border border-[#168eea]/20">
                    <FaSpinner className="animate-spin text-[#168eea]" />
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {statusLabel[activeJob.status]}
                      </p>
                      <p className="text-xs text-gray-500">
                        Transcribing with Whisper, then generating multi-platform outputs…
                      </p>
                    </div>
                  </div>
                )}

                {activeJob.status === 'failed' && (
                  <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm space-y-3">
                    <div className="flex gap-2">
                      <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                      <span>{activeJob.error_message || 'Processing failed'}</span>
                    </div>
                    {isQuotaFailure && (
                      <div className="text-amber-900 bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs leading-relaxed">
                        <strong>Quick workaround:</strong> paste the transcript in the left panel
                        and click “Repurpose from transcript” — that skips Whisper and still uses
                        your chat model for clips/captions.
                        <br />
                        <br />
                        <strong>To fix billing:</strong> open{' '}
                        <a
                          href="https://platform.openai.com/settings/organization/billing"
                          target="_blank"
                          rel="noreferrer"
                          className="underline"
                        >
                          OpenAI Billing
                        </a>{' '}
                        for the <em>exact project</em> that owns the <code>OPENAI_API_KEY</code> in
                        your backend env (org $100 limit ≠ every project/key has quota).
                      </div>
                    )}
                  </div>
                )}

                {activeJob.summary && activeJob.status === 'ready' && (
                  <p className="mt-4 text-sm text-gray-600 leading-relaxed">{activeJob.summary}</p>
                )}
              </div>

              {/* Clips timeline */}
              {clips.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <h3 className="font-semibold text-gray-900 mb-3">Suggested clips</h3>
                  <div className="space-y-3">
                    {clips.map((clip) => (
                      <div
                        key={clip.id}
                        className="p-4 rounded-xl border border-gray-100 hover:border-[#168eea]/20 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium text-gray-900 text-sm">{clip.title}</span>
                          <span className="text-xs text-gray-400 font-mono">
                            {formatTime(clip.start_sec)} – {formatTime(clip.end_sec)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600">{clip.hook}</p>
                        {clip.reason && (
                          <p className="text-xs text-gray-400 mt-1">{clip.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Platform outputs */}
              {activeJob.status === 'ready' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Platform outputs</h3>
                    <button
                      onClick={handleSendToBoard}
                      disabled={sendingBoard}
                      className="flex items-center gap-1.5 text-xs font-medium text-[#168eea] hover:text-[#1378d4] disabled:opacity-50"
                    >
                      {sendingBoard ? (
                        <FaSpinner className="animate-spin" />
                      ) : (
                        <FiLayers size={14} />
                      )}
                      Send to Create board
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1 p-3 border-b border-gray-100 bg-gray-50/50">
                    {PLATFORM_IDS.map((p) => (
                      <button
                        key={p}
                        onClick={() => setActivePlatform(p)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          activePlatform === p
                            ? 'bg-white shadow-sm text-[#168eea] ring-1 ring-[#168eea]/30'
                            : 'text-gray-600 hover:bg-white/80'
                        }`}
                      >
                        {getPlatformIcon(p, 14)}
                        {PLATFORM_DISPLAY_NAMES[p]}
                        {(activeJob.platform_outputs?.[p]?.length || 0) > 0 && (
                          <span className="bg-[#168eea]/10 text-[#168eea] px-1.5 rounded-full text-[10px]">
                            {activeJob.platform_outputs[p].length}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                  <div className="p-5 space-y-4 max-h-[420px] overflow-y-auto">
                    {platformOutputs.length === 0 ? (
                      <p className="text-sm text-gray-400">No outputs for this platform</p>
                    ) : (
                      platformOutputs.map((out, i) => (
                        <div
                          key={i}
                          className="group relative p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-[#168eea]/30 transition-colors"
                        >
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{out.caption}</p>
                          {out.hashtags?.length > 0 && (
                            <p className="text-xs text-[#168eea] mt-2">
                              {out.hashtags.map((t) => `#${t.replace(/^#/, '')}`).join(' ')}
                            </p>
                          )}
                          {out.edit_notes && (
                            <p className="text-xs text-gray-500 mt-2 flex items-start gap-1">
                              <FiFilm className="flex-shrink-0 mt-0.5" size={12} />
                              {out.edit_notes}
                            </p>
                          )}
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-xl bg-white/90 opacity-0 transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => handoffToComposer(out, 'post')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#168eea] hover:bg-[#1378d4] text-white text-sm font-medium shadow-sm"
                              >
                                <FiSend size={14} />
                                Post
                              </button>
                              <button
                                type="button"
                                onClick={() => handoffToComposer(out, 'schedule')}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white border border-gray-200 hover:border-[#168eea]/40 text-gray-800 text-sm font-medium shadow-sm"
                              >
                                <FiCalendar size={14} />
                                Schedule
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const styles = {
    ready: 'bg-emerald-100 text-emerald-700',
    failed: 'bg-red-100 text-red-700',
    queued: 'bg-amber-100 text-amber-700',
    transcribing: 'bg-amber-100 text-amber-700',
    analyzing: 'bg-amber-100 text-amber-700',
  };
  return (
    <span
      className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full flex-shrink-0 ${
        styles[status] || 'bg-gray-100 text-gray-600'
      }`}
    >
      {status === 'ready' && <FiCheckCircle className="inline mr-0.5" size={10} />}
      {statusLabel[status] || status}
    </span>
  );
}

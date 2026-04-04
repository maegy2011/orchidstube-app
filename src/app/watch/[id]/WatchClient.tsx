/* Video Watch Page — Enhanced */
"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import {
  Clock,
  ArrowUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VideoNote } from '@/lib/types';
import { useWatchLater } from '@/hooks/useWatchLater';
import { useNotes } from '@/hooks/useNotes';
import { useUser } from '@/hooks/use-user';
import { useI18n } from '@/lib/i18n-context';
import { usePrayer } from '@/lib/prayer-times-context';
import { useWellBeing } from '@/lib/well-being-context';
import { useTopPadding } from '@/hooks/use-top-padding';
import Masthead from '@/components/sections/masthead';
import SidebarGuide from '@/components/sections/sidebar-guide';
import ShareModal from '@/components/ui/share-modal';
import ConfirmModal from '@/components/ui/confirm-modal';
import { EyeProtection } from '@/components/ui/eye-protection';
import AddToPlaylistModal from '@/components/playlists/AddToPlaylistModal';
import PlaylistQueue from '@/components/playlists/PlaylistQueue';
import { usePlaylistQueue } from '@/lib/playlist-queue-context';

import type { WatchClientProps } from './types';
import { formatDuration, extractChapters } from './utils/format.tsx';
import { isValidDateString } from './utils/time';
import { useVideoPlayer } from './hooks/useVideoPlayer';
import { useNotesManagement } from './hooks/useNotesManagement';
import { useVideoData } from './hooks/useVideoData';
import NotesSection from './components/NotesSection';
import WatchSkeleton from './components/WatchSkeleton';
import WatchErrorStates from './components/WatchErrorStates';
import VideoPlayerSection from './components/VideoPlayerSection';
import VideoInfoSection from './components/VideoInfoSection';
import RelatedVideos from './components/RelatedVideos';
import MiniPlayer from './components/MiniPlayer';
import ShortcutsDialog from './components/ShortcutsDialog';

// ─── Main Component ────────────────────────────────────────

export default function WatchClient({
  initialVideo,
  initialError,
  initialBlocked,
  initialBlockReason,
}: WatchClientProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const videoId = params.id as string;
  const startTime = searchParams.get('t');

  const { t, direction, language, location } = useI18n();
  const { isPrayerTime } = usePrayer();
  const mainPaddingTop = useTopPadding();
  const { userId } = useUser();
  const { toggleWatchLater, isInWatchLater } = useWatchLater();
  const playlistQueue = usePlaylistQueue();
  const { getNotesByVideoId, isLoaded } = useNotes();
  useWellBeing();

  // ─── Shared refs ───
  const activeNoteRangeRef = useRef<{ start: number; end: number } | null>(null);
  const loopNoteEnabledRef = useRef(false);
  const videoLoopEnabledRef = useRef(false);

  // ─── Video data hook ───
  const {
    video,
    loading,
    error,
    blocked,
    blockReason,
    isSubscribed,
    subscribing,
    toggleSubscription,
  } = useVideoData({
    videoId, userId, language, location, t,
    initialVideo, initialError, initialBlocked, initialBlockReason,
  });

  // ─── Local UI state ───
  const [showDescription, setShowDescription] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [isWatchLocked, setIsWatchLocked] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showMiniPlayer, setShowMiniPlayer] = useState(false);
  const [miniPlayerDismissed, setMiniPlayerDismissed] = useState(false);

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const notesCount = useRef(0);

  // ─── Player hook ───
  const player = useVideoPlayer({
    videoId, activeNoteRangeRef, loopNoteEnabledRef, videoLoopEnabledRef, isPrayerTime,
  });

  // ─── Notes ───
  const videoNotes: VideoNote[] = isLoaded ? getNotesByVideoId(videoId) : [];

  useEffect(() => {
    notesCount.current = videoNotes.length;
  }, [videoNotes.length]);

  const notes = useNotesManagement({
    videoId, video, videoNotes,
    playerRef: player.playerRef,
    currentTime: player.currentTime,
    isWatchLocked,
    isPlayerInteractive: player.isPlayerInteractive,
  });

  // ─── Auto-advance playlist ───
  useEffect(() => {
    if (player.playerState === 0 && playlistQueue.autoplay && playlistQueue.items.length > 0 && playlistQueue.currentVideoId === videoId) {
      const next = playlistQueue.nextVideo();
      if (next) {
        router.push(`/watch/${next.videoId}`);
      }
    }
  }, [player.playerState]);

  // Sync state → shared refs
  useEffect(() => { activeNoteRangeRef.current = notes.activeNoteRange; }, [notes.activeNoteRange]);
  useEffect(() => { loopNoteEnabledRef.current = notes.loopNoteEnabled; }, [notes.loopNoteEnabled]);
  useEffect(() => { videoLoopEnabledRef.current = notes.videoLoopEnabled; }, [notes.videoLoopEnabled]);

  // ─── Page title with progress ───
  useEffect(() => {
    if (!video || !player.currentTime || player.playerState !== 1) return;
    const progress = video.duration > 0 ? Math.round((player.currentTime / video.duration) * 100) : 0;
    document.title = `${progress}% — ${video.title}`;
  }, [player.currentTime, video, player.playerState]);

  useEffect(() => {
    return () => { document.title = video?.title || 'Video'; };
  }, [video]);

  // ─── Mini player: IntersectionObserver ───
  useEffect(() => {
    if (!videoContainerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!miniPlayerDismissed) {
          setShowMiniPlayer(!entry.isIntersecting && player.playerState === 1);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(videoContainerRef.current);
    return () => observer.disconnect();
  }, [player.playerState, miniPlayerDismissed]);

  // Hide mini player when user scrolls back
  useEffect(() => {
    const handleScroll = () => {
      if (!contentRef.current) return;
      const rect = contentRef.current.getBoundingClientRect();
      setShowBackToTop(rect.top < -300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ─── Keyboard shortcuts handler ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setTheaterMode(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Smooth scroll to top on video change ───
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [videoId]);

  const activeSubtitleNote = videoNotes.find(note =>
    player.currentTime >= note.startTime && player.currentTime <= note.endTime
  );

  // ─── Handlers ───
  const handleWatchLater = () => {
    if (!video) return;
    const added = toggleWatchLater({
      videoId: video.id, title: video.title, thumbnail: video.thumbnail,
      channelName: video.channelName, duration: String(video.duration),
    });
    toast.success(added ? t('added_to_watch_later') : t('removed_from_watch_later'), {
      icon: <Clock className="w-4 h-4 text-green-500" />, duration: 2000,
    });
  };

  const handleSearch = (query: string) => {
    if (query.trim()) router.push(`/?search=${encodeURIComponent(query)}`);
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
  const scrollToPlayer = () => videoContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const handleSeekTo = (seconds: number) => {
    player.playerRef.current?.seekTo(seconds, true);
    player.playerRef.current?.playVideo();
  };

  // ─── Derived data ───
  const chapters = useMemo(() => {
    if (!video?.description) return [];
    return extractChapters(video.description);
  }, [video?.description]);

  const videoProgress = (video?.duration && video.duration > 0) ? (player.currentTime / video.duration) * 100 : 0;
  const hasValidDate = isValidDateString(video?.uploadDate);
  const hasValidDuration = video?.duration && video.duration > 0;
  const hasValidSubscribers = video?.channelSubscribers && video.channelSubscribers.length > 0 && video.channelSubscribers !== '0';
  const hasValidViews = video?.views && video.views !== '0';
  const hasValidLikes = video?.likes && video.likes !== '0';
  const channelUrl = video?.channelId ? `https://www.youtube.com/channel/${video.channelId}` : null;

  // ─── Notes section props ───
  const notesSectionProps = {
    noteSearch: notes.noteSearch, setNoteSearch: notes.setNoteSearch,
    loopNoteEnabled: notes.loopNoteEnabled, setLoopNoteEnabled: notes.setLoopNoteEnabled,
    quickCapture: notes.quickCapture, currentTime: player.currentTime,
    isCapturing: notes.isCapturing, startCapture: notes.startCapture,
    stopCapture: notes.stopCapture, captureStartTime: notes.captureStartTime,
    quickNotes: notes.quickNotes, activeNoteId: notes.activeNoteId,
    playNoteSegment: notes.playNoteSegment, saveQuickNote: notes.saveQuickNote,
    editQuickNote: notes.editQuickNote, deleteQuickNote: notes.deleteQuickNote,
    showNoteForm: notes.showNoteForm, setShowNoteForm: notes.setShowNoteForm,
    editingNote: notes.editingNote, setEditingNote: notes.setEditingNote,
    setIsCapturing: notes.setIsCapturing, setCaptureStartTime: notes.setCaptureStartTime,
    noteContent: notes.noteContent, setNoteContent: notes.setNoteContent,
    noteHashtags: notes.noteHashtags, setNoteHashtags: notes.setNoteHashtags,
    noteStartTime: notes.noteStartTime, setNoteStartTime: notes.setNoteStartTime,
    noteEndTime: notes.noteEndTime, setNoteEndTime: notes.setNoteEndTime,
    captureCurrentTime: notes.captureCurrentTime, handleAddNote: notes.handleAddNote,
    handleCancelEdit: notes.handleCancelEdit, handlePreviewNote: notes.handlePreviewNote,
    filteredNotes: notes.filteredNotes, handleEditNote: notes.handleEditNote,
    handleDeleteNote: notes.handleDeleteNote,
    videoLoopEnabled: notes.videoLoopEnabled, setVideoLoopEnabled: notes.setVideoLoopEnabled,
    playerState: player.playerState,
    autoPauseOnNote: notes.autoPauseOnNote, setAutoPauseOnNote: notes.setAutoPauseOnNote,
    runNoteSystemTest: () => {},
  };

  // ═══════════════════════════════════════════════════════════
  // Loading / Error states
  // ═══════════════════════════════════════════════════════════

  if (loading) return <WatchSkeleton direction={direction} mainPaddingTop={mainPaddingTop} onSearch={handleSearch} />;
  if (error || blocked || !video) return <WatchErrorStates direction={direction} t={t} error={error} blocked={blocked} blockReason={blockReason} video={video} />;

  // ═══════════════════════════════════════════════════════════
  // Main Render
  // ═══════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-background" dir={direction}>
      <Masthead onSearch={handleSearch} />
      <SidebarGuide forceOverlay={true} />

      {/* ─── Top Progress Bar ─── */}
      <div className="fixed top-0 left-0 right-0 z-[100] h-[3px] bg-transparent pointer-events-none">
        <motion.div className="h-full bg-primary origin-left" style={{ width: `${Math.min(100, videoProgress)}%` }} transition={{ duration: 0.3, ease: 'linear' }} />
      </div>

      <main ref={contentRef} className={`${mainPaddingTop} px-0 lg:px-6 xl:px-24 pb-16`}>
        <div className={cn("max-w-[1800px] mx-auto flex flex-col lg:flex-row gap-0 transition-all duration-500", theaterMode ? "lg:gap-0" : "lg:gap-6")}>

          {/* ═══════ Left Column ═══════ */}
          <div className={cn("flex-1 min-w-0 transition-all duration-500", theaterMode ? "lg:max-w-full" : "lg:max-w-[calc(100%-406px)]")}>

            <VideoPlayerSection
              videoId={videoId} startTime={startTime}
              isWatchLocked={isWatchLocked} setIsWatchLocked={setIsWatchLocked}
              theaterMode={theaterMode} setTheaterMode={setTheaterMode}
              player={player} activeSubtitleNote={activeSubtitleNote}
              language={language} videoContainerRef={videoContainerRef}
            />

            <VideoInfoSection
              videoId={videoId} video={video} t={t} language={language} direction={direction}
              showDescription={showDescription} setShowDescription={setShowDescription}
              theaterMode={theaterMode} setTheaterMode={setTheaterMode}
              handleWatchLater={handleWatchLater} isInWatchLater={isInWatchLater}
              toggleSubscription={toggleSubscription} subscribing={subscribing} isSubscribed={isSubscribed}
              showShareModal={showShareModal} setShowShareModal={setShowShareModal}
              showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts}
              chapters={chapters}
              videoContainerRef={videoContainerRef}
              hasValidViews={hasValidViews} hasValidLikes={hasValidLikes}
              hasValidDate={hasValidDate} hasValidSubscribers={hasValidSubscribers}
              channelUrl={channelUrl} onSeekTo={handleSeekTo} isPlayerInteractive={player.isPlayerInteractive}
              onShowPlaylist={() => setShowPlaylistModal(true)}
            />

            {/* ── Smart Notes ── */}
            <div className="px-4 lg:px-0 mt-4">
              <NotesSection {...notesSectionProps} />
            </div>
          </div>

          {/* ═══════ Right Sidebar ═══════ */}
          <div className="w-full lg:w-[406px] shrink-0 space-y-4">
            <PlaylistQueue />
            <RelatedVideos video={video} t={t} direction={direction} language={language} theaterMode={theaterMode} chapters={chapters} onSeekTo={handleSeekTo} isPlayerInteractive={player.isPlayerInteractive} onScrollToPlayer={scrollToPlayer} />
          </div>
        </div>
      </main>

      <MiniPlayer video={video} videoId={videoId} player={player} showMiniPlayer={showMiniPlayer} setShowMiniPlayer={setShowMiniPlayer} setMiniPlayerDismissed={setMiniPlayerDismissed} scrollToPlayer={scrollToPlayer} />

      {/* ─── Back to Top ─── */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button initial={{ opacity: 0, scale: 0.8, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.8, y: 20 }} onClick={scrollToTop} className="fixed bottom-6 end-6 z-[60] flex items-center gap-2 p-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/30 hover:bg-primary/90 transition-all active:scale-95" title={language === 'ar' ? 'العودة للأعلى' : 'Back to top'}>
            <ArrowUp size={18} />
            {hasValidDuration && <span className="text-xs font-mono font-bold tabular-nums">{formatDuration(player.currentTime)} / {formatDuration(video.duration)}</span>}
          </motion.button>
        )}
      </AnimatePresence>

      <ShortcutsDialog showShortcuts={showShortcuts} setShowShortcuts={setShowShortcuts} language={language} />

      {/* ─── Modals ─── */}
      {showShareModal && video && <ShareModal isOpen={showShareModal} onClose={() => setShowShareModal(false)} videoId={videoId} videoTitle={video.title} thumbnail={video.thumbnail} />}
      {showPlaylistModal && video && (
        <AddToPlaylistModal
          open={showPlaylistModal}
          onOpenChange={setShowPlaylistModal}
          video={{
            videoId: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            channelName: video.channelName,
            duration: String(video.duration),
          }}
        />
      )}
      <ConfirmModal isOpen={notes.deleteModalOpen} onClose={() => { notes.setDeleteModalOpen(false); notes.setItemToDelete(null); }} onConfirm={notes.confirmDelete} title={t('delete_note_title')} description={t('delete_note_desc')} confirmText={t('delete_confirm_btn')} variant="danger" />
      <EyeProtection showModalInitially={true} />
    </div>
  );
}

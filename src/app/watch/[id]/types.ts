import { VideoDetails, VideoNote } from '@/lib/types';
import type { TranslationKeys } from '@/lib/translations';

export interface WatchClientProps {
  initialVideo: VideoDetails | null;
  initialError: string | null;
  initialBlocked: boolean;
  initialBlockReason: string | null;
}

export interface NotesSectionProps {
  noteSearch: string;
  setNoteSearch: (v: string) => void;
  loopNoteEnabled: boolean;
  setLoopNoteEnabled: (v: boolean) => void;
  quickCapture: () => void;
  currentTime: number;
  isCapturing: boolean;
  startCapture: () => void;
  stopCapture: () => void;
  captureStartTime: number | null;
  quickNotes: { id: string; startTime: number; endTime: number; createdAt: number }[];
  activeNoteId: string | null;
  playNoteSegment: (note: { id: string; startTime: number; endTime: number }) => void;
  saveQuickNote: (note: { id: string; startTime: number; endTime: number }) => void;
  editQuickNote: (note: { id: string; startTime: number; endTime: number }) => void;
  deleteQuickNote: (id: string) => void;
  showNoteForm: boolean;
  setShowNoteForm: (v: boolean) => void;
  editingNote: string | null;
  setEditingNote: (v: string | null) => void;
  setIsCapturing: (v: boolean) => void;
  setCaptureStartTime: (v: number | null) => void;
  noteContent: string;
  setNoteContent: (v: string) => void;
  noteHashtags: string;
  setNoteHashtags: (v: string) => void;
  noteStartTime: string;
  setNoteStartTime: (v: string) => void;
  noteEndTime: string;
  setNoteEndTime: (v: string) => void;
  captureCurrentTime: (type: 'start' | 'end') => void;
  handleAddNote: () => void;
  handleCancelEdit: () => void;
  handlePreviewNote: () => void;
  filteredNotes: VideoNote[];
  handleEditNote: (note: VideoNote) => void;
  handleDeleteNote: (id: string) => void;
  videoLoopEnabled: boolean;
  setVideoLoopEnabled: (v: boolean) => void;
  playerState: number;
  autoPauseOnNote: boolean;
  setAutoPauseOnNote: (v: boolean) => void;
  runNoteSystemTest: () => void;
}

export interface UseVideoPlayerOptions {
  videoId: string;
  activeNoteRangeRef: React.MutableRefObject<{ start: number; end: number } | null>;
  loopNoteEnabledRef: React.MutableRefObject<boolean>;
  videoLoopEnabledRef: React.MutableRefObject<boolean>;
  isPrayerTime: boolean;
}

export interface UseVideoPlayerReturn {
  playerRef: React.MutableRefObject<any>;
  currentTime: number;
  playerState: number;
  playerReady: boolean;
  onPlayerReady: (event: any) => void;
  onPlayerStateChange: (event: any) => void;
  onPlaybackQualityChange: (event: any) => void;
  getCurrentPlayerTime: () => number;
  isPlayerInteractive: () => boolean;
}

export interface UseNotesManagementOptions {
  videoId: string;
  video: VideoDetails | null;
  videoNotes: VideoNote[];
  playerRef: React.MutableRefObject<any>;
  currentTime: number;
  isWatchLocked: boolean;
  isPlayerInteractive: () => boolean;
}

export interface UseNotesManagementReturn {
  showNoteForm: boolean;
  setShowNoteForm: (v: boolean) => void;
  noteContent: string;
  setNoteContent: (v: string) => void;
  noteHashtags: string;
  setNoteHashtags: (v: string) => void;
  noteStartTime: string;
  setNoteStartTime: (v: string) => void;
  noteEndTime: string;
  setNoteEndTime: (v: string) => void;
  editingNote: string | null;
  setEditingNote: (v: string | null) => void;
  setIsCapturing: (v: boolean) => void;
  setCaptureStartTime: (v: number | null) => void;
  activeNoteId: string | null;
  activeNoteRange: { start: number; end: number } | null;
  noteSearch: string;
  setNoteSearch: (v: string) => void;
  isCapturing: boolean;
  captureStartTime: number | null;
  quickNotes: { id: string; startTime: number; endTime: number; createdAt: number }[];
  loopNoteEnabled: boolean;
  setLoopNoteEnabled: (v: boolean) => void;
  videoLoopEnabled: boolean;
  setVideoLoopEnabled: (v: boolean) => void;
  autoPauseOnNote: boolean;
  setAutoPauseOnNote: (v: boolean) => void;
  deleteModalOpen: boolean;
  setDeleteModalOpen: (v: boolean) => void;
  itemToDelete: { id: string; type: 'note' | 'quickNote' } | null;
  setItemToDelete: (v: { id: string; type: 'note' | 'quickNote' } | null) => void;
  quickCapture: () => void;
  startCapture: () => void;
  stopCapture: () => void;
  runNoteSystemTest: () => void;
  editQuickNote: (note: { id: string; startTime: number; endTime: number }) => void;
  deleteQuickNote: (id: string) => void;
  confirmDelete: () => void;
  saveQuickNote: (note: { id: string; startTime: number; endTime: number }) => void;
  handleAddNote: () => void;
  handleCancelEdit: () => void;
  handlePreviewNote: () => void;
  handleEditNote: (note: VideoNote) => void;
  handleDeleteNote: (id: string) => void;
  playNoteSegment: (note: { id: string; startTime: number; endTime: number }) => void;
  captureCurrentTime: (type: 'start' | 'end') => void;
  filteredNotes: VideoNote[];
}

export interface UseVideoDataOptions {
  videoId: string;
  userId: string | null;
  language: string;
  location: string;
  t: (key: TranslationKeys) => string;
  initialVideo: VideoDetails | null;
  initialError: string | null;
  initialBlocked: boolean;
  initialBlockReason: string | null;
}

export interface UseVideoDataReturn {
  video: VideoDetails | null;
  setVideo: React.Dispatch<React.SetStateAction<VideoDetails | null>>;
  loading: boolean;
  error: string | null;
  blocked: boolean;
  blockReason: string | null;
  isSubscribed: boolean;
  subscribing: boolean;
  toggleSubscription: () => void;
  isMounted: React.MutableRefObject<boolean>;
}

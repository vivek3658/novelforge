import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { studioApi, chaptersApi, engagementApi } from '../services/api';
import ImageUploader from '../components/ImageUploader';
import PostCard from '../components/PostCard';
import StudioInviteCollaborator from '../components/StudioInviteCollaborator';
import TagInput from '../components/TagInput';

const INITIAL_STUDIO_FORM = {
  studioName: '',
  studioHandle: '',
  description: '',
  profileImageName: '',
  bannerImageName: '',
  visibilityType: 'PUBLIC',
};

const INITIAL_NOVEL_FORM = {
  title: '',
  synopsis: '',
  categoryType: 'FICTION',
  genres: '',
  tags: '',
  coverImageUrl: '',
};

export default function StudioEditor() {
  const { user, isAuthenticated, isCreator, convertToCreator, fetchMe } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [studios, setStudios] = useState([]);
  const [discoverQuery, setDiscoverQuery] = useState('');
  const [discoverStudios, setDiscoverStudios] = useState([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [discoverError, setDiscoverError] = useState('');
  const [activeStudioSection, setActiveStudioSection] = useState('mine');
  const [currentStudio, setCurrentStudio] = useState(null);
  const [studioVisibility, setStudioVisibility] = useState('PUBLIC');
  const [novels, setNovels] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedNovel, setSelectedNovel] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [editingBlockId, setEditingBlockId] = useState(null);
  const [editingBlockText, setEditingBlockText] = useState('');
  const [chapterViewMode, setChapterViewMode] = useState('write');
  const [chapterFocusMode, setChapterFocusMode] = useState(true);
  const manuscriptRef = useRef(null);

  // Forms
  const [studioForm, setStudioForm] = useState(INITIAL_STUDIO_FORM);
  const [novelForm, setNovelForm] = useState(INITIAL_NOVEL_FORM);
  const [chapterMeta, setChapterMeta] = useState({ chapterNumber: 1, title: '' });

  // Novel Edit State
  const [editingNovel, setEditingNovel] = useState(null);
  const [editNovelForm, setEditNovelForm] = useState(INITIAL_NOVEL_FORM);
  const [showEditNovelModal, setShowEditNovelModal] = useState(false);

  // Studio Community / Broadcast State (YouTube Studio Style)
  const [studioPosts, setStudioPosts] = useState([]);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastMediaUrl, setBroadcastMediaUrl] = useState('');
  const [broadcastTags, setBroadcastTags] = useState([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // Block Creator state
  const [blockTypeToAdd, setBlockTypeToAdd] = useState('TEXT');
  const [passageText, setPassageText] = useState('');
  const [quoteText, setQuoteText] = useState('');
  const [quoteAttribution, setQuoteAttribution] = useState('');
  const [illustrationForm, setIllustrationForm] = useState({ imageUrl: '', caption: '', altText: '' });
  const [scheduleTime, setScheduleTime] = useState('');

  // Modals & Loaders
  const [showStudioModal, setShowStudioModal] = useState(false);
  const [showNovelModal, setShowNovelModal] = useState(false);
  const [isNovelComposerOpen, setIsNovelComposerOpen] = useState(false);
  const [novelSearch, setNovelSearch] = useState('');
  const [showChapterModal, setShowChapterModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);

  // Studio Ownership & Join Constraints
  const ownsStudio = studios.some((s) => s.ownerUserId === user?.id || s.myRole === 'OWNER');
  const maxStudiosReached = studios.length >= 5;
  const publishedNovelCount = novels.filter((novel) => novel.publicationState === 'PUBLISHED').length;
  const visibleNovels = novels.filter((novel) => `${novel.title || ''} ${(novel.genres || []).join(' ')} ${(novel.tags || []).join(' ')}`.toLowerCase().includes(novelSearch.trim().toLowerCase()));

  const runAsync = async (action, onSuccess) => {
    setIsSubmitting(true);
    try {
      const res = await action();
      if (typeof onSuccess === 'function') {
        await onSuccess(res);
      }
      return res;
    } catch (err) {
      error(err.message || 'Operation failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadStudios = useCallback(async () => {
    try {
      const res = await studioApi.mine();
      const list = Array.isArray(res) ? res : res?.content || [];
      setStudios(list);
      if (list.length > 0 && !currentStudio) {
        setCurrentStudio(list[0]);
      }
    } catch (err) {
      console.warn('Could not load studios:', err);
    }
  }, [currentStudio]);

  const loadNovels = useCallback(
    async (studioId) => {
      if (!studioId) return;
      try {
        const res = await studioApi.novels(studioId);
        const list = Array.isArray(res) ? res : res?.content || [];
        setNovels(list);
        setSelectedNovel((previous) => list.find((item) => item.id === previous?.id) || list[0] || null);
      } catch (err) {
        console.warn('Could not load novels:', err);
      }
    },
    []
  );

  const loadChapters = useCallback(async (studioId, novelId) => {
    if (!studioId || !novelId) return;
    setIsLoadingChapters(true);
    try {
      const res = await chaptersApi.listForStudio(studioId, novelId, 0, 100);
      const list = res?.content || [];
      setChapters(list);
      if (list.length > 0) {
        const fullChapter = await chaptersApi.getForStudio(studioId, novelId, list[0].id);
        setSelectedChapter(fullChapter);
      } else {
        setSelectedChapter(null);
      }
    } catch (err) {
      console.warn('Could not load chapters:', err);
    } finally {
      setIsLoadingChapters(false);
    }
  }, []);

  const loadTeam = useCallback(async (studioId) => {
    if (!studioId) return;
    try {
      const membersRes = await studioApi.getMembers(studioId).catch(() => []);
      setTeamMembers(membersRes?.content || (Array.isArray(membersRes) ? membersRes : []));
    } catch (err) {
      console.warn('Could not load team members:', err);
    }
  }, []);

  const loadStudioPosts = useCallback(async (studioId) => {
    if (!studioId) return;
    setIsLoadingPosts(true);
    try {
      const res = await engagementApi.posts(0);
      const list = res?.content || [];
      const filtered = list.filter(
        (p) => p.authorType === 'STUDIO' && String(p.authorId) === String(studioId)
      );
      setStudioPosts(filtered);
    } catch (err) {
      console.warn('Could not load studio posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadStudios();
    }
  }, [isAuthenticated, loadStudios]);

  useEffect(() => {
    if (activeStudioSection !== 'discover') return undefined;
    const timer = setTimeout(async () => {
      setIsDiscovering(true);
      setDiscoverError('');
      try {
        const response = await studioApi.search(discoverQuery.trim(), 0, 12);
        setDiscoverStudios(response?.content || []);
      } catch (err) {
        setDiscoverError(err.message || 'Could not find studios. Try again.');
      } finally {
        setIsDiscovering(false);
      }
    }, discoverQuery ? 250 : 0);
    return () => clearTimeout(timer);
  }, [activeStudioSection, discoverQuery]);

  useEffect(() => {
    if (currentStudio) {
      setStudioVisibility(currentStudio.visibilityType || 'PUBLIC');
      loadNovels(currentStudio.id);
      loadTeam(currentStudio.id);
      loadStudioPosts(currentStudio.id);
    }
  }, [currentStudio, loadNovels, loadTeam, loadStudioPosts]);

  const saveStudioVisibility = async () => {
    if (!currentStudio) return;
    const payload = {
      studioName: currentStudio.studioName,
      studioHandle: currentStudio.studioHandle,
      profileImageName: currentStudio.profileImageName || null,
      bannerImageName: currentStudio.bannerImageName || null,
      description: currentStudio.description || '',
      visibilityType: studioVisibility,
    };
    runAsync(() => studioApi.update(currentStudio.id, payload), async (updated) => {
      setCurrentStudio(updated);
      setStudios((items) => items.map((item) => item.id === updated.id ? updated : item));
      success('Studio visibility updated.');
    });
  };

  useEffect(() => {
    if (currentStudio && selectedNovel) {
      loadChapters(currentStudio.id, selectedNovel.id);
    }
  }, [currentStudio, selectedNovel, loadChapters]);

  useEffect(() => {
    const handleChapterShortcuts = (event) => {
      if (activeTab !== 'chapters') return;
      if (event.key === 'Escape') {
        event.preventDefault();
        setActiveTab('dashboard');
        return;
      }

      if (event.altKey && !event.ctrlKey && !event.metaKey) {
        if (event.key === '1') {
          event.preventDefault();
          setChapterViewMode('write');
          manuscriptRef.current?.focus();
        } else if (event.key === '2') {
          event.preventDefault();
          setChapterViewMode('preview');
        }
        return;
      }

      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter' && event.target.closest?.('.chapter-workspace-card')) {
        const form = document.querySelector('.chapter-writing-form');
        if (form) {
          event.preventDefault();
          form.requestSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleChapterShortcuts);
    return () => window.removeEventListener('keydown', handleChapterShortcuts);
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'chapters' && selectedChapter && chapterViewMode === 'write' && blockTypeToAdd === 'TEXT') {
      manuscriptRef.current?.focus();
    }
  }, [activeTab, selectedChapter, chapterViewMode, blockTypeToAdd]);

  // Handle Studio Creation
  const handleCreateStudio = async (e) => {
    e.preventDefault();
    if (ownsStudio) {
      error('An account can only create 1 Studio.');
      return;
    }
    if (maxStudiosReached) {
      error('You have reached the maximum limit of 5 joined Studios.');
      return;
    }

    runAsync(
      async () => {
        if (!isCreator && convertToCreator) {
          try {
            await convertToCreator();
            if (typeof fetchMe === 'function') await fetchMe();
          } catch {
            // Studio creation below returns the actionable server error if activation is unavailable.
          }
        }
        const payload = {
          ...studioForm,
          studioHandle: studioForm.studioHandle.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-'),
        };
        if (payload.studioName.trim().length < 3 || payload.studioHandle.length < 3) {
          throw new Error('Studio name and handle must each contain at least 3 characters.');
        }
        return await studioApi.create(payload);
      },
      async (created) => {
        success(`Studio "${created.studioName}" created successfully!`);
        setStudioForm(INITIAL_STUDIO_FORM);
        setShowStudioModal(false);
        await loadStudios();
        setCurrentStudio(created);
      }
    );
  };

  // Handle Novel Creation
  const handleCreateNovel = async (e) => {
    e.preventDefault();
    if (!currentStudio) return;

    const payload = {
      ...novelForm,
      genres: novelForm.genres.split(',').map((s) => s.trim()).filter(Boolean),
      tags: novelForm.tags.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean),
    };

    runAsync(
      async () => await studioApi.createNovel(currentStudio.id, payload),
      async (novel) => {
        success('Novel draft created!');
        setNovelForm(INITIAL_NOVEL_FORM);
        setShowNovelModal(false);
        setIsNovelComposerOpen(false);
        await loadNovels(currentStudio.id);
        setSelectedNovel(novel);
        setActiveTab('content');
      }
    );
  };

  // Handle Open Edit Novel Modal
  const handleOpenEditNovel = (novel) => {
    setEditingNovel(novel);
    setEditNovelForm({
      title: novel.title || '',
      synopsis: novel.synopsis || '',
      categoryType: novel.categoryType || 'FICTION',
      genres: Array.isArray(novel.genres) ? novel.genres.join(', ') : '',
      tags: Array.isArray(novel.tags) ? novel.tags.join(', ') : '',
      coverImageUrl: novel.coverImageUrl || '',
    });
    setShowEditNovelModal(true);
  };

  // Handle Updating Novel Metadata
  const handleUpdateNovel = async (e) => {
    e.preventDefault();
    if (!editingNovel) return;

    const payload = {
      ...editNovelForm,
      genres: editNovelForm.genres.split(',').map((s) => s.trim()).filter(Boolean),
      tags: editNovelForm.tags.split(',').map((s) => s.trim().replace(/^#/, '')).filter(Boolean),
    };

    runAsync(
      async () => await studioApi.updateNovel(editingNovel.id, payload),
      async (updated) => {
        success('Novel details updated successfully!');
        setShowEditNovelModal(false);
        setEditingNovel(null);
        await loadNovels(currentStudio.id);
        if (selectedNovel?.id === updated.id) {
          setSelectedNovel(updated);
        }
      }
    );
  };

  // Handle Deleting Novel
  const handleDeleteNovel = async (novelId) => {
    if (!window.confirm('Are you sure you want to delete this novel? This cannot be undone.')) return;

    runAsync(
      async () => await studioApi.deleteNovel(novelId),
      async () => {
        success('Novel deleted.');
        if (selectedNovel?.id === novelId) {
          setSelectedNovel(null);
          setChapters([]);
          setSelectedChapter(null);
        }
        await loadNovels(currentStudio.id);
      }
    );
  };

  // Handle Publishing Novel
  const handlePublishNovel = async (novelId) => {
    runAsync(
      async () => await studioApi.publishNovel(novelId),
      async (published) => {
        success(`Novel "${published.title}" published!`);
        setNovels((items) => items.map((item) => item.id === published.id ? published : item));
        setSelectedNovel((item) => item?.id === published.id ? published : item);
      }
    );
  };

  // Handle Chapter Creation
  const handleCreateChapter = async (e) => {
    e.preventDefault();
    if (!selectedNovel) return;

    runAsync(
      async () =>
        await chaptersApi.create(selectedNovel.id, {
          chapterNumber: Number(chapterMeta.chapterNumber),
          title: chapterMeta.title.trim(),
        }),
      async (ch) => {
        success(`Chapter ${ch.chapterNumber} draft created!`);
        setShowChapterModal(false);
        await loadChapters(currentStudio.id, selectedNovel.id);
        setSelectedChapter(ch);
        setChapterMeta({
          chapterNumber: Number(chapterMeta.chapterNumber) + 1,
          title: '',
        });
        setActiveTab('chapters');
        setChapterViewMode('write');
        setBlockTypeToAdd('TEXT');
        setPassageText('');
      }
    );
  };

  // Handle Adding Text Block
  const handleAddTextBlock = async (e) => {
    e.preventDefault();
    if (!selectedChapter || !passageText.trim()) return;

    runAsync(
      async () =>
        await chaptersApi.addBlock(selectedNovel.id, selectedChapter.id, {
          position: selectedChapter.blocks?.length || 0,
          type: 'TEXT',
          text: passageText.trim(),
        }),
      async () => {
        setPassageText('');
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        success('Text paragraph block added!');
      }
    );
  };

  // Handle Adding Quote Block
  const handleAddQuoteBlock = async (e) => {
    e.preventDefault();
    if (!selectedChapter || !quoteText.trim()) return;

    runAsync(
      async () =>
        await chaptersApi.addBlock(selectedNovel.id, selectedChapter.id, {
          position: selectedChapter.blocks?.length || 0,
          type: 'TEXT',
          text: `> ${quoteText.trim()}`,
          caption: quoteAttribution.trim() || undefined,
        }),
      async () => {
        setQuoteText('');
        setQuoteAttribution('');
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        success('Quote block added!');
      }
    );
  };

  const handleSaveTextBlock = (block) => {
    const text = editingBlockText.trim();
    if (!selectedChapter || !text) return;

    runAsync(
      async () =>
        await chaptersApi.updateBlock(selectedNovel.id, selectedChapter.id, block.id, {
          position: block.position,
          type: block.type,
          text,
          imageUrl: block.imageUrl,
          caption: block.caption,
          altText: block.altText,
        }),
      async () => {
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        setEditingBlockId(null);
        success('Chapter text updated.');
      }
    );
  };

  // Handle Adding Illustration Block
  const handleAddIllustrationBlock = async (e) => {
    e.preventDefault();
    if (!selectedChapter || !illustrationForm.imageUrl.trim()) return;

    runAsync(
      async () =>
        await chaptersApi.addBlock(selectedNovel.id, selectedChapter.id, {
          position: selectedChapter.blocks?.length || 0,
          type: 'ILLUSTRATION',
          ...illustrationForm,
        }),
      async () => {
        setIllustrationForm({ imageUrl: '', caption: '', altText: '' });
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        success('Illustration block added!');
      }
    );
  };

  // Handle Deleting a Block
  const handleDeleteBlock = async (blockId) => {
    if (!selectedChapter || !blockId) return;
    if (!window.confirm('Delete this block from the chapter?')) return;

    runAsync(
      async () => await chaptersApi.deleteBlock(selectedNovel.id, selectedChapter.id, blockId),
      async () => {
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        success('Block deleted.');
      }
    );
  };

  // Handle Moving a Block Up or Down in the Sequence
  const handleMoveBlock = async (index, direction) => {
    if (!selectedChapter?.blocks) return;
    const blocks = [...selectedChapter.blocks];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    const currentBlock = blocks[index];
    const targetBlock = blocks[targetIndex];

    runAsync(
      async () => {
        const currentPayload = { position: currentBlock.position, type: currentBlock.type, text: currentBlock.text, imageUrl: currentBlock.imageUrl, caption: currentBlock.caption, altText: currentBlock.altText };
        const targetPayload = { position: targetBlock.position, type: targetBlock.type, text: targetBlock.text, imageUrl: targetBlock.imageUrl, caption: targetBlock.caption, altText: targetBlock.altText };
        await chaptersApi.updateBlock(selectedNovel.id, selectedChapter.id, currentBlock.id, {
          ...currentPayload,
          position: targetIndex,
        });
        await chaptersApi.updateBlock(selectedNovel.id, selectedChapter.id, targetBlock.id, {
          ...targetPayload,
          position: index,
        });
      },
      async () => {
        const updated = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, selectedChapter.id);
        setSelectedChapter(updated);
        success('Block sequence updated!');
      }
    );
  };

  // Handle Publishing Chapter
  const handlePublishChapter = async () => {
    if (!selectedChapter) return;
    runAsync(
      async () => await chaptersApi.publish(selectedNovel.id, selectedChapter.id),
      async (published) => {
        setSelectedChapter(published);
        success(`Chapter ${published.chapterNumber} is now live!`);
        setChapters((items) => items.map((item) => item.id === published.id ? published : item));
      }
    );
  };

  // Handle Scheduling Chapter
  const handleScheduleChapter = async (e) => {
    e.preventDefault();
    if (!selectedChapter || !scheduleTime) return;
    runAsync(
      async () => await chaptersApi.schedule(selectedNovel.id, selectedChapter.id, new Date(scheduleTime).toISOString()),
      async (scheduled) => {
        setSelectedChapter(scheduled);
        success(`Chapter scheduled for release on ${new Date(scheduleTime).toLocaleString()}`);
        setScheduleTime('');
        await loadChapters(currentStudio.id, selectedNovel.id);
      }
    );
  };

  const handleCancelChapterSchedule = async () => {
    if (!selectedChapter) return;
    runAsync(
      async () => await chaptersApi.cancelSchedule(selectedNovel.id, selectedChapter.id),
      async (updated) => {
        setSelectedChapter(updated);
        setChapters((items) => items.map((item) => item.id === updated.id ? updated : item));
        success('Scheduled release cancelled. The chapter is back in drafts.');
      }
    );
  };

  // Handle Broadcasting Post to Community (YouTube Studio Style)
  const handleCreateBroadcast = async (e) => {
    e.preventDefault();
    if (!currentStudio || !broadcastContent.trim()) return;

    runAsync(
      async () =>
        await engagementApi.createPost({
          authorType: 'STUDIO',
          authorId: String(currentStudio.id),
          content: broadcastContent.trim(),
          imageUrl: broadcastMediaUrl.trim() || null,
          tags: broadcastTags,
        }),
      async () => {
        success('Announcement broadcasted to readers and community feed!');
        setBroadcastContent('');
        setBroadcastMediaUrl('');
        setBroadcastTags([]);
        await loadStudioPosts(currentStudio.id);
      }
    );
  };

  const submitBroadcastOnShortcut = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const sortedBlocks = [...(selectedChapter?.blocks || [])].sort((a, b) => (a.position || 0) - (b.position || 0));
  const hasPublishableText = sortedBlocks.some((block) => block.type === 'TEXT' && block.text?.trim());

  return (
    <div className={`product-page studio-page-container${activeTab === 'chapters' ? ' chapter-editor-fullscreen' : ''}`}>
        <div className="yt-studio-layout yt-studio-root">
        {/* Left Creator Studio Sidebar (YouTube Studio Style) */}
        <aside className="yt-studio-sidebar yt-sidebar">
          <div className="yt-sidebar-header yt-channel-badge">
            <div className="yt-channel-avatar">
              <span className="yt-channel-avatar-text">
                {(currentStudio?.studioName || 'S').slice(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="yt-channel-info">
              <strong className="yt-channel-title">
                {currentStudio?.studioName || 'Creator Studio'}
              </strong>
              <small className="yt-channel-handle">
                @{currentStudio?.studioHandle || 'studio'}
              </small>
            </div>
          </div>

          {/* Studios Selector / Dropdown */}
          {studios.length > 1 && (
            <div style={{ padding: '0.75rem 1rem 0' }}>
              <select
                className="ig-comment-input"
                style={{ width: '100%', fontSize: '0.82rem' }}
                value={currentStudio?.id || ''}
                onChange={(e) => {
                  const found = studios.find((s) => s.id === e.target.value);
                  if (found) setCurrentStudio(found);
                }}
              >
                {studios.map((s) => (
                  <option key={s.id} value={s.id}>
                    Studio: {s.studioName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Studio Creation / Limits Alert */}
          <div className="studio-discovery-toggle" role="group" aria-label="Your studios or discover studios">
            <button type="button" className={activeStudioSection === 'mine' ? 'active' : ''} onClick={() => setActiveStudioSection('mine')}>My studios</button>
            <button type="button" className={activeStudioSection === 'discover' ? 'active' : ''} onClick={() => setActiveStudioSection('discover')}>Discover</button>
          </div>
          {activeStudioSection === 'discover' && <section className="studio-discover-panel">
            <label className="studio-discover-search"><span aria-hidden="true">⌕</span><input value={discoverQuery} onChange={(event) => setDiscoverQuery(event.target.value)} placeholder="Search public studios" aria-label="Search public studios" /></label>
            <p className="studio-discover-note">Search public studios by name or handle. To join, ask the owner for an invitation.</p>
          </section>}
          {activeStudioSection === 'mine' && <>
          <div style={{ padding: '0.75rem 1rem' }}>
            {ownsStudio ? (
              <button
                type="button"
                className="cr-btn-secondary"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed', fontSize: '0.8rem' }}
                onClick={() => error('An account can only create 1 Studio.')}
                title="Single studio creation limit reached"
              >
                ✓ Studio Created (1/1 Limit)
              </button>
            ) : maxStudiosReached ? (
              <button
                type="button"
                className="cr-btn-secondary"
                style={{ width: '100%', opacity: 0.6, cursor: 'not-allowed', fontSize: '0.8rem' }}
                onClick={() => error('You have joined the maximum limit of 5 Studios.')}
                title="Max studio membership reached"
              >
                Max Studios Joined (5/5)
              </button>
            ) : (
              <button
                type="button"
                className="cr-btn-primary"
                style={{ width: '100%', fontSize: '0.82rem', padding: '0.45rem' }}
                onClick={() => setShowStudioModal(true)}
              >
                ＋ Create New Studio
              </button>
            )}
          </div>

          <nav className="yt-nav-list" aria-label="Studio menu">
            <button
              type="button"
              className={`yt-nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              📊 Studio Overview
            </button>
            <button
              type="button"
              className={`yt-nav-item ${activeTab === 'content' ? 'active' : ''}`}
              onClick={() => setActiveTab('content')}
            >
              📚 Novel Catalog ({novels.length})
            </button>
            <button
              type="button"
              className={`yt-nav-item ${activeTab === 'chapters' ? 'active' : ''}`}
              onClick={() => setActiveTab('chapters')}
            >
              ✍️ Chapter & Block Editor
            </button>
            <button
              type="button"
              className={`yt-nav-item ${activeTab === 'community' ? 'active' : ''}`}
              onClick={() => setActiveTab('community')}
            >
              📢 Studio Community ({studioPosts.length})
            </button>
            <button
              type="button"
              className={`yt-nav-item ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              👥 Team & Collaborators
            </button>
          </nav>
          </>}
        </aside>

        {/* Main Studio Work Area */}
        <main className="yt-studio-main yt-main">
          {activeStudioSection === 'discover' && <section className="studio-discover-main"><p className="eyebrow">FIND YOUR PEOPLE</p><h2>Discover publishing studios</h2><p>Explore public channels and find creators working in your favorite genres. Ask studio owners for an invitation to collaborate.</p>{discoverError && <p className="studio-discover-error" role="alert">{discoverError}</p>}{isDiscovering ? <div className="loading-row"><span className="spinner"/>Finding studios…</div> : discoverStudios.length ? <div className="studio-discover-grid">{discoverStudios.map((studio) => <article className="studio-discover-card" key={studio.id}><div className="studio-discover-avatar">{studio.profileImageName ? <img src={studio.profileImageName} alt=""/> : (studio.studioName || 'S').slice(0, 1).toUpperCase()}</div><div className="studio-discover-info"><strong>{studio.studioName}</strong><span>@{studio.studioHandle}</span><small>Public studio · {studio.status || 'Active'}</small><p>{studio.description || 'A NovelForge publishing studio.'}</p></div><span className="studio-discover-link">Public</span></article>)}</div> : <div className="studio-discover-empty">No public studios found. Try another name, or start your own studio.</div>}<p className="studio-discover-note">Public studios appear in search. Unlisted studios are hidden from search; private studios are visible only to members.</p></section>}
          {activeStudioSection === 'mine' && <>
          {/* Header Action Bar */}
          <header className="yt-main-header yt-topbar">
            <div>
              <p className="eyebrow">Creator Studio</p>
              <h1 className="yt-main-heading yt-title">
                {activeTab === 'dashboard' && 'Channel dashboard'}
                {activeTab === 'content' && 'Your novels'}
                {activeTab === 'chapters' && 'Chapter editor'}
                {activeTab === 'community' && 'Reader community'}
                {activeTab === 'team' && 'Team members'}
              </h1>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {activeTab === 'chapters' ? (
                <button type="button" className="cr-btn-secondary chapter-exit-editor" onClick={() => setActiveTab('dashboard')} aria-keyshortcuts="Escape">
                  Exit editor <kbd>Esc</kbd>
                </button>
              ) : currentStudio && activeTab !== 'content' && (
                <button
                  type="button"
                  className="cr-btn-primary"
                  onClick={() => { setActiveStudioSection('mine'); setActiveTab('content'); setIsNovelComposerOpen(true); }}
                >
                  ＋ Draft New Novel
                </button>
              )}
            </div>
          </header>

          {/* TAB 1: Studio Dashboard */}
          {activeTab === 'dashboard' && (
            <div>
              {currentStudio ? (
                <>
                  <div className="yt-stats-grid yt-metrics-grid" style={{ marginBottom: '2rem' }}>
                    <div className="cr-card yt-stat-card yt-metric-card">
                      <span className="yt-stat-label yt-metric-label">Published novels</span>
                      <strong className="yt-stat-val yt-metric-val">{publishedNovelCount}</strong>
                    </div>
                    <div className="cr-card yt-stat-card yt-metric-card">
                      <span className="yt-stat-label yt-metric-label">Chapters in selected novel</span>
                      <strong className="yt-stat-val yt-metric-val">
                        {chapters.length > 0 ? chapters.length : '—'}
                      </strong>
                    </div>
                    <div className="cr-card yt-stat-card yt-metric-card">
                      <span className="yt-stat-label yt-metric-label">Team members</span>
                      <strong className="yt-stat-val yt-metric-val">{teamMembers.length || 1}</strong>
                    </div>
                    <div className="cr-card yt-stat-card yt-metric-card">
                      <span className="yt-stat-label yt-metric-label">Community posts</span>
                      <strong className="yt-stat-val yt-metric-val">{studioPosts.length}</strong>
                    </div>
                  </div>

                  <div className="cr-card" style={{ padding: '1.75rem' }}>
                    <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem' }}>
                      About {currentStudio.studioName}
                    </h3>
                    <p style={{ color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>
                      {currentStudio.description ||
                        'No studio bio configured yet. Use studio settings to customize your channel description.'}
                    </p>
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="cr-btn-secondary"
                        onClick={() => setActiveTab('content')}
                      >
                        View Serialized Novels →
                      </button>
                      <button
                        type="button"
                        className="cr-btn-secondary"
                        onClick={() => setActiveTab('community')}
                      >
                        Broadcast to Readers →
                      </button>
                    </div>
                    <div className="studio-visibility-settings">
                      <div><strong>Studio discovery</strong><p>Choose whether readers can find your channel.</p></div>
                      <select aria-label="Studio visibility" value={studioVisibility} onChange={(event) => setStudioVisibility(event.target.value)}>
                        <option value="PUBLIC">Public · listed in search</option>
                        <option value="UNLISTED">Unlisted · share by link</option>
                        <option value="PRIVATE">Private · members only</option>
                      </select>
                      <button type="button" className="cr-btn-primary" onClick={saveStudioVisibility} disabled={isSubmitting || studioVisibility === currentStudio.visibilityType}>{isSubmitting ? 'Saving…' : 'Save visibility'}</button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="cr-card" style={{ padding: '3rem', textAlign: 'center' }}>
                  <h2>Welcome to NovelForge Creator Studio</h2>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '520px', margin: '0.75rem auto 1.5rem' }}>
                    A Studio is your dedicated production hub for crafting serialized fiction, organizing chapters into blocks, and collaborating with writers and editors.
                  </p>
                  <button
                    type="button"
                    className="cr-btn-primary"
                    onClick={() => setShowStudioModal(true)}
                  >
                    🚀 Create Your Studio Channel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Novel Catalog & Workspace */}
          {activeTab === 'content' && (
            <div>
              <div className="studio-novel-toolbar"><div><p className="eyebrow">YOUR LIBRARY</p><h2>Novel catalog</h2><p>Create, organize, and publish your serialized stories.</p></div><button type="button" className="cr-btn-primary" onClick={() => setIsNovelComposerOpen((open) => !open)}>{isNovelComposerOpen ? 'Close form' : '＋ Create novel'}</button></div>
              <label className="studio-novel-search"><span aria-hidden="true">⌕</span><input value={novelSearch} onChange={(event) => setNovelSearch(event.target.value)} placeholder="Search your novels" aria-label="Search your novels" /></label>
              {isNovelComposerOpen && <form className="studio-novel-create" onSubmit={handleCreateNovel}>
                <div className="studio-novel-create-heading"><div><p className="eyebrow">NEW STORY</p><h3>Start a novel</h3><p>Set up the story page first. You can add chapters as soon as it’s created.</p></div><span>Draft</span></div>
                <label>Title<input required maxLength={200} value={novelForm.title} onChange={(event) => setNovelForm({...novelForm,title:event.target.value})} placeholder="Give your story a memorable title"/></label>
                <div className="studio-novel-create-row"><label>Category<select value={novelForm.categoryType} onChange={(event) => setNovelForm({...novelForm,categoryType:event.target.value})}><option value="FICTION">Fiction</option><option value="NONFICTION">Nonfiction</option></select></label><label>Genres<input value={novelForm.genres} onChange={(event) => setNovelForm({...novelForm,genres:event.target.value})} placeholder="Fantasy, adventure"/></label><label>Tags<input value={novelForm.tags} onChange={(event) => setNovelForm({...novelForm,tags:event.target.value})} placeholder="magic, found family"/></label></div>
                <label>Synopsis<textarea rows={4} maxLength={2000} value={novelForm.synopsis} onChange={(event) => setNovelForm({...novelForm,synopsis:event.target.value})} placeholder="What makes readers want to turn the first page?"/></label>
                <ImageUploader value={novelForm.coverImageUrl} onChange={(url) => setNovelForm({...novelForm,coverImageUrl:url})} label="Cover artwork" hint="Choose the image readers will see on the book card."/>
                <div className="studio-novel-create-actions"><button type="button" className="cr-btn-secondary" onClick={() => setIsNovelComposerOpen(false)}>Cancel</button><button type="submit" className="cr-btn-primary" disabled={isSubmitting || !novelForm.title.trim()}>{isSubmitting ? 'Creating…' : 'Create draft and write chapters →'}</button></div>
              </form>}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
                {visibleNovels.map((novel) => (
                  <div key={novel.id} className="cr-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem' }}>
                      {novel.coverImageUrl ? (
                        <img
                          src={novel.coverImageUrl}
                          alt={novel.title}
                          style={{ width: '70px', height: '100px', objectFit: 'cover', borderRadius: '4px', border: '1px solid var(--border-color)' }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '70px',
                            height: '100px',
                            borderRadius: '4px',
                            background: 'linear-gradient(135deg, #f47521, #9333ea)',
                            display: 'grid',
                            placeItems: 'center',
                            fontSize: '1.2rem',
                            fontWeight: 900,
                            color: '#fff',
                          }}
                        >
                          {novel.title.slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                          <span className="cr-badge-orange" style={{ fontSize: '0.72rem' }}>
                            {novel.categoryType || 'FICTION'}
                          </span>
                          <span
                            className="yt-status-badge"
                            style={{
                              background: novel.publicationState === 'PUBLISHED' ? 'rgba(16,185,129,0.15)' : 'rgba(244,117,33,0.15)',
                              color: novel.publicationState === 'PUBLISHED' ? '#10b981' : '#f47521',
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              fontWeight: 700,
                            }}
                          >
                            {novel.publicationState || 'ONGOING'}
                          </span>
                        </div>
                        <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.05rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {novel.title}
                        </h3>
                        {novel.genres?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {novel.genres.slice(0, 2).map((g) => (
                              <span key={g} className="cr-tag" style={{ fontSize: '0.7rem', padding: '0.1rem 0.35rem' }}>
                                #{g}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.5, margin: '0 0 1rem', height: '3.6em', overflow: 'hidden' }}>
                      {novel.synopsis || 'No synopsis added.'}
                    </p>

                    <div style={{ marginTop: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="cr-btn-primary"
                        style={{ padding: '0.45rem', fontSize: '0.82rem', gridColumn: '1 / -1' }}
                        onClick={() => {
                          setSelectedNovel(novel);
                          setActiveTab('chapters');
                        }}
                      >
                        ✍️ Open Chapter Editor
                      </button>
                      <button
                        type="button"
                        className="cr-btn-secondary"
                        style={{ padding: '0.4rem', fontSize: '0.8rem' }}
                        onClick={() => handleOpenEditNovel(novel)}
                      >
                        ⚙️ Edit Info
                      </button>
                      {novel.publicationState !== 'PUBLISHED' && (
                        <button
                          type="button"
                          className="cr-btn-secondary"
                          style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#10b981', borderColor: '#10b981' }}
                          onClick={() => handlePublishNovel(novel.id)}
                        >
                          🚀 Publish
                        </button>
                      )}
                      <Link
                        to={`/novels/${novel.id}`}
                        className="cr-btn-secondary"
                        style={{ padding: '0.4rem', fontSize: '0.8rem', textAlign: 'center' }}
                      >
                        👁️ View Public
                      </Link>
                      <button
                        type="button"
                        className="cr-btn-secondary"
                        style={{ padding: '0.4rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#ef4444' }}
                        onClick={() => handleDeleteNovel(novel.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {visibleNovels.length === 0 && (
                <div className="cr-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {novels.length ? 'No novels match that search.' : 'No novels in this studio yet. Create your first story to get started.'}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Chapter & Sequential Block Editor */}
          {activeTab === 'chapters' && (
            <div>
              {selectedNovel ? (
                <div className={`chapter-editor-layout${chapterFocusMode ? ' focus-mode' : ''}`}>
                  {/* Left Chapters List */}
                  {!chapterFocusMode && <div className="cr-card chapter-list-panel" style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.95rem' }}>Chapters</h4>
                      <button
                        type="button"
                        className="cr-btn-primary"
                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
                        onClick={() => {
                          const nextChapterNumber = chapters.reduce(
                            (max, chapter) => Math.max(max, Number(chapter.chapterNumber) || 0),
                            0
                          ) + 1;
                          setChapterMeta({ chapterNumber: nextChapterNumber, title: '' });
                          setShowChapterModal(true);
                        }}
                      >
                        ＋ New Ch.
                      </button>
                    </div>

                    <div style={{ display: 'grid', gap: '0.4rem', maxHeight: '600px', overflowY: 'auto' }}>
                      {chapters.map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          className={`studio-select-row ${selectedChapter?.id === ch.id ? 'selected' : ''}`}
                          onClick={async () => {
                            const full = await chaptersApi.getForStudio(currentStudio.id, selectedNovel.id, ch.id);
                            setSelectedChapter(full);
                          }}
                          style={{
                            textAlign: 'left',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '6px',
                            border: selectedChapter?.id === ch.id ? '1px solid #f47521' : '1px solid transparent',
                            background: selectedChapter?.id === ch.id ? 'rgba(244,117,33,0.1)' : 'rgba(255,255,255,0.02)',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                            Ch. {ch.chapterNumber}: {ch.title}
                          </div>
                          <span style={{ fontSize: '0.72rem', color: ch.publicationState === 'PUBLISHED' ? '#10b981' : 'var(--text-muted)' }}>
                            {ch.publicationState || 'DRAFT'}
                          </span>
                        </button>
                      ))}
                      {chapters.length === 0 && !isLoadingChapters && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', margin: 0 }}>
                          No chapters yet. Click ＋ New Ch.
                        </p>
                      )}
                    </div>
                  </div>}

                  {/* Right Chapter Blocks Sequencer */}
                  {selectedChapter ? (
                    <div className="cr-card chapter-workspace-card" style={{ padding: '1.75rem' }}>
                      <div className="chapter-editor-heading">
                        <div>
                          <p className="eyebrow">CHAPTER {selectedChapter.chapterNumber}</p>
                          <h2>{selectedChapter.title}</h2>
                        </div>
                        <div className="chapter-heading-actions">
                          <span className={`chapter-release-state state-${(selectedChapter.publicationState || 'DRAFT').toLowerCase()}`}>
                            {selectedChapter.publicationState || 'DRAFT'}
                          </span>
                          {selectedChapter.publicationState === 'PUBLISHED' ? (
                            <Link to={`/novels/${selectedNovel.id}/read/${selectedChapter.id}`} className="cr-btn-secondary">
                              Open public chapter
                            </Link>
                          ) : (
                            <button type="button" className="cr-btn-secondary" onClick={() => setChapterViewMode('preview')}>
                              Preview draft
                            </button>
                          )}
                        </div>
                      </div>

                      <section className="chapter-release-panel" aria-labelledby="chapter-release-title">
                        <div className="chapter-release-summary">
                          <div>
                            <p className="eyebrow">PUBLISHING</p>
                            <h3 id="chapter-release-title">Release this chapter</h3>
                            <p>Published chapters appear in the novel’s public table of contents.</p>
                          </div>
                          <span className={`chapter-release-state state-${(selectedChapter.publicationState || 'DRAFT').toLowerCase()}`}>
                            {selectedChapter.publicationState || 'DRAFT'}
                          </span>
                        </div>
                        <div className="chapter-release-checks">
                          <span className={selectedNovel.publicationState === 'PUBLISHED' ? 'complete' : ''}>
                            {selectedNovel.publicationState === 'PUBLISHED' ? 'Ready' : 'Needs attention'} · Novel is published
                          </span>
                          <span className={hasPublishableText ? 'complete' : ''}>
                            {hasPublishableText ? 'Ready' : 'Needs attention'} · At least one text block is saved
                          </span>
                        </div>
                        {selectedChapter.publicationState === 'PUBLISHED' ? (
                          <p className="chapter-release-feedback">
                            Live{selectedChapter.publishedAt ? ` since ${new Date(selectedChapter.publishedAt).toLocaleString()}` : ''}. Readers can open this chapter from the public novel page.
                          </p>
                        ) : selectedChapter.publicationState === 'SCHEDULED' ? (
                          <div className="chapter-release-feedback">
                            <p>Scheduled for {selectedChapter.scheduledAt ? new Date(selectedChapter.scheduledAt).toLocaleString() : 'publication'}.</p>
                            <button type="button" className="cr-btn-secondary" onClick={handleCancelChapterSchedule} disabled={isSubmitting}>
                              Cancel scheduled release
                            </button>
                          </div>
                        ) : (
                          <div className="chapter-release-actions">
                            {selectedNovel.publicationState !== 'PUBLISHED' && (
                              <button type="button" className="cr-btn-secondary" onClick={() => handlePublishNovel(selectedNovel.id)} disabled={isSubmitting}>
                                Publish novel first
                              </button>
                            )}
                            <button
                              type="button"
                              className="cr-btn-primary"
                              onClick={handlePublishChapter}
                              disabled={isSubmitting || !hasPublishableText || selectedNovel.publicationState !== 'PUBLISHED'}
                            >
                              Publish now
                            </button>
                            <form onSubmit={handleScheduleChapter} className="chapter-schedule-form">
                              <label htmlFor="chapter-publish-time">Schedule release</label>
                              <input
                                id="chapter-publish-time"
                                type="datetime-local"
                                className="ig-comment-input"
                                value={scheduleTime}
                                onChange={(e) => setScheduleTime(e.target.value)}
                                required
                              />
                              <button type="submit" className="cr-btn-secondary" disabled={isSubmitting || !scheduleTime || !hasPublishableText || selectedNovel.publicationState !== 'PUBLISHED'}>
                                Schedule
                              </button>
                            </form>
                          </div>
                        )}
                      </section>

                      <div className="chapter-mode-toolbar">
                        <div><strong>Chapter workspace</strong><span><kbd>Alt+1</kbd> Write · <kbd>Alt+2</kbd> Preview · <kbd>Ctrl+Enter</kbd> Save passage · <kbd>Esc</kbd> Exit editor</span></div>
                        <div className="chapter-toolbar-actions">
                          <div role="tablist" aria-label="Chapter workspace mode">
                            <button type="button" role="tab" aria-selected={chapterViewMode === 'write'} className={chapterViewMode === 'write' ? 'active' : ''} onClick={() => setChapterViewMode('write')}>Write</button>
                            <button type="button" role="tab" aria-selected={chapterViewMode === 'preview'} className={chapterViewMode === 'preview' ? 'active' : ''} onClick={() => setChapterViewMode('preview')}>Preview</button>
                          </div>
                          <button type="button" className="cr-btn-secondary chapter-focus-toggle" aria-pressed={chapterFocusMode} onClick={() => setChapterFocusMode((focused) => !focused)}>
                            {chapterFocusMode ? 'Exit focus' : 'Focus writing'}
                          </button>
                        </div>
                      </div>
                      {chapterViewMode === 'preview' ? <article className="chapter-reader-preview"><p className="eyebrow">CHAPTER {selectedChapter.chapterNumber}</p><h2>{selectedChapter.title}</h2>{sortedBlocks.map((block, index) => block.type === 'ILLUSTRATION' ? <figure key={block.id || index}><img src={block.imageUrl} alt={block.altText || block.caption || 'Chapter illustration'}/>{block.caption && <figcaption>{block.caption}</figcaption>}</figure> : block.text?.startsWith('>') ? <blockquote key={block.id || index}>{block.text.replace(/^>\s*/, '')}{block.caption && <cite>— {block.caption}</cite>}</blockquote> : <p key={block.id || index}>{block.text}</p>)}{sortedBlocks.length === 0 && <p className="chapter-preview-empty">Your chapter is empty. Switch to Write to add the first block.</p>}</article> : <>
                      <details className="chapter-structure-details">
                        <summary>
                          <span>Chapter structure</span>
                          <span>{sortedBlocks.length} content blocks · reorder, edit, or remove</span>
                        </summary>
                        <div className="chapter-blocks-sequence" style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong style={{ fontSize: '0.95rem' }}>
                            Chapter Blocks ({sortedBlocks.length})
                          </strong>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Blocks are serialized in reader in this exact sequence
                          </span>
                        </div>

                        {sortedBlocks.map((block, idx) => (
                          <div
                            key={block.id || idx}
                            className="block-card"
                            style={{
                              background: 'var(--input-bg, #1e293b)',
                              border: '1px solid var(--border-color)',
                              borderRadius: '8px',
                              padding: '1rem 1.25rem',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#f47521', textTransform: 'uppercase' }}>
                                #{idx + 1} • {block.type} BLOCK
                              </span>

                              {/* Block Reorder & Delete Controls */}
                              <div style={{ display: 'flex', gap: '0.35rem' }}>
                                {block.type === 'TEXT' && editingBlockId !== block.id && (
                                  <button
                                    type="button"
                                    className="cr-btn-secondary"
                                    style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                    disabled={isSubmitting}
                                    onClick={() => {
                                      setEditingBlockId(block.id);
                                      setEditingBlockText(block.text || '');
                                    }}
                                  >
                                    Edit text
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className="cr-btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  disabled={idx === 0 || isSubmitting}
                                  onClick={() => handleMoveBlock(idx, -1)}
                                  title="Move block up in sequence"
                                >
                                  ▲ Up
                                </button>
                                <button
                                  type="button"
                                  className="cr-btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
                                  disabled={idx === sortedBlocks.length - 1 || isSubmitting}
                                  onClick={() => handleMoveBlock(idx, 1)}
                                  title="Move block down in sequence"
                                >
                                  ▼ Down
                                </button>
                                <button
                                  type="button"
                                  className="cr-btn-secondary"
                                  style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', borderColor: '#ef4444' }}
                                  disabled={isSubmitting}
                                  onClick={() => handleDeleteBlock(block.id)}
                                  title="Delete block"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            </div>

                            {/* Block Content Display */}
                            {editingBlockId === block.id ? (
                              <div style={{ display: 'grid', gap: '0.65rem' }}>
                                <textarea
                                  rows={10}
                                  className="ig-composer-textarea chapter-manuscript"
                                  value={editingBlockText}
                                  onChange={(event) => setEditingBlockText(event.target.value)}
                                  aria-label={`Edit text block ${idx + 1}`}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                  <button
                                    type="button"
                                    className="cr-btn-secondary"
                                    disabled={isSubmitting}
                                    onClick={() => setEditingBlockId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="cr-btn-primary"
                                    disabled={isSubmitting || !editingBlockText.trim()}
                                    onClick={() => handleSaveTextBlock(block)}
                                  >
                                    {isSubmitting ? 'Saving…' : 'Save text'}
                                  </button>
                                </div>
                              </div>
                            ) : block.type === 'ILLUSTRATION' ? (
                              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <img
                                  src={block.imageUrl}
                                  alt={block.altText || 'Block illustration'}
                                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '6px' }}
                                />
                                <div>
                                  {block.caption && <strong>Caption: {block.caption}</strong>}
                                  {block.altText && <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>Alt: {block.altText}</p>}
                                </div>
                              </div>
                            ) : block.text?.startsWith('>') ? (
                              <blockquote style={{ margin: 0, paddingLeft: '1rem', borderLeft: '3px solid #f47521', fontStyle: 'italic' }}>
                                {block.text.replace(/^>\s*/, '')}
                                {block.caption && <cite style={{ display: 'block', fontSize: '0.8rem', marginTop: '0.25rem', color: 'var(--text-muted)' }}>— {block.caption}</cite>}
                              </blockquote>
                            ) : (
                              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {block.text}
                              </p>
                            )}
                          </div>
                        ))}

                        {sortedBlocks.length === 0 && (
                          <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                            No content blocks yet. Choose a block type below to add to the sequence!
                          </div>
                        )}
                        </div>
                      </details>

                      {/* Sequential Block Adder */}
                      <div className="chapter-block-adder" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                          <button
                            type="button"
                            className={`cr-btn-secondary ${blockTypeToAdd === 'TEXT' ? 'cr-btn-primary' : ''}`}
                            onClick={() => setBlockTypeToAdd('TEXT')}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                          >
                            ＋ Text Paragraph
                          </button>
                          <button
                            type="button"
                            className={`cr-btn-secondary ${blockTypeToAdd === 'ILLUSTRATION' ? 'cr-btn-primary' : ''}`}
                            onClick={() => setBlockTypeToAdd('ILLUSTRATION')}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                          >
                            🖼️ Upload Illustration
                          </button>
                          <button
                            type="button"
                            className={`cr-btn-secondary ${blockTypeToAdd === 'QUOTE' ? 'cr-btn-primary' : ''}`}
                            onClick={() => setBlockTypeToAdd('QUOTE')}
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
                          >
                            ❝ Quote / Callout
                          </button>
                        </div>

                        {/* Form for TEXT block */}
                        {blockTypeToAdd === 'TEXT' && (
                          <form className="chapter-block-adder-form chapter-writing-form" onSubmit={handleAddTextBlock}>
                            <div className="chapter-writing-paper">
                              <div className="chapter-writing-page-heading">
                                <span>CHAPTER {selectedChapter.chapterNumber}</span>
                                <strong>{selectedChapter.title}</strong>
                              </div>
                              <label htmlFor="chapter-manuscript-input">Continue your manuscript</label>
                              <textarea
                                id="chapter-manuscript-input"
                                rows={24}
                                className="ig-composer-textarea chapter-manuscript"
                                placeholder="Write the next passage here. Your line breaks are preserved for readers."
                                value={passageText}
                                onChange={(e) => setPassageText(e.target.value)}
                                ref={manuscriptRef}
                                aria-label="Write chapter text"
                                spellCheck="true"
                                required
                              />
                              <div className="chapter-writing-meta">
                                <span>{passageText.trim() ? passageText.trim().split(/\s+/).length : 0} words</span>
                                <span>Saved as text block {sortedBlocks.length + 1} in chapter order</span>
                              </div>
                            </div>
                            <div className="chapter-writing-actions">
                              <span>Text saves to your chapter when you add it.</span>
                              <button type="submit" className="cr-btn-primary" disabled={isSubmitting || !passageText.trim()}>
                                {isSubmitting ? 'Saving…' : 'Add passage to chapter'}
                              </button>
                            </div>
                          </form>
                        )}

                        {/* Form for ILLUSTRATION block (with Image Upload!) */}
                        {blockTypeToAdd === 'ILLUSTRATION' && (
                          <form className="chapter-block-adder-form" onSubmit={handleAddIllustrationBlock}>
                            <ImageUploader
                              value={illustrationForm.imageUrl}
                              onChange={(url) => setIllustrationForm({ ...illustrationForm, imageUrl: url })}
                              label="Upload Illustration File (Drag & Drop or Browse)"
                              hint="Upload high resolution character art, maps, or manga panels"
                            />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.75rem' }}>
                              <input
                                type="text"
                                className="ig-comment-input"
                                placeholder="Caption (e.g. The ancient gate at twilight)"
                                value={illustrationForm.caption}
                                onChange={(e) => setIllustrationForm({ ...illustrationForm, caption: e.target.value })}
                              />
                              <input
                                type="text"
                                className="ig-comment-input"
                                placeholder="Alt description for screen readers"
                                value={illustrationForm.altText}
                                onChange={(e) => setIllustrationForm({ ...illustrationForm, altText: e.target.value })}
                              />
                            </div>
                            <button
                              type="submit"
                              className="cr-btn-primary"
                              style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                              disabled={isSubmitting || !illustrationForm.imageUrl.trim()}
                            >
                              {isSubmitting ? 'Saving…' : '＋ Append Illustration Block'}
                            </button>
                          </form>
                        )}

                        {/* Form for QUOTE block */}
                        {blockTypeToAdd === 'QUOTE' && (
                          <form className="chapter-block-adder-form" onSubmit={handleAddQuoteBlock}>
                            <label style={{ display: 'grid', gap: '0.4rem', fontWeight: 700, fontSize: '0.88rem' }}>
                              Quote / Dialogue Excerpt:
                              <textarea
                                rows={2}
                                className="ig-composer-textarea"
                                placeholder="Enter an illuminated excerpt, prophecy, or memorable line…"
                                value={quoteText}
                                onChange={(e) => setQuoteText(e.target.value)}
                                required
                              />
                            </label>
                            <input
                              type="text"
                              className="ig-comment-input"
                              placeholder="Attribution / Speaker (Optional, e.g. Lord Eldrin)"
                              value={quoteAttribution}
                              onChange={(e) => setQuoteAttribution(e.target.value)}
                              style={{ marginTop: '0.5rem' }}
                            />
                            <button
                              type="submit"
                              className="cr-btn-primary"
                              style={{ marginTop: '0.75rem', padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                              disabled={isSubmitting || !quoteText.trim()}
                            >
                              {isSubmitting ? 'Saving…' : '＋ Append Quote Block'}
                            </button>
                          </form>
                        )}
                      </div>

                      </>}
                    </div>
                  ) : (
                    <div className="cr-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      Select a chapter from the left to start editing content blocks.
                    </div>
                  )}
                </div>
              ) : (
                <div className="cr-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <p>Select a novel to open its chapter manuscript.</p>
                    <button type="button" className="cr-btn-secondary" onClick={() => setActiveTab('content')}>
                      Open novel catalog
                    </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Channel Community & Reader Broadcasts (YouTube Studio Style) */}
          {activeTab === 'community' && currentStudio && (
            <div className="studio-community-workspace">
              {/* Broadcast Composer */}
              <section className="studio-publish-panel">
                <div className="studio-publish-heading"><div><p className="eyebrow">CHANNEL COMMUNITY</p><h2>Create a post</h2><p>Share a release note, art, or a behind-the-scenes moment with your readers.</p></div><span className="studio-channel-chip">● @{currentStudio.studioHandle}</span></div>
                <form onSubmit={handleCreateBroadcast} className="studio-publish-form">
                  <textarea
                    rows={8}
                    maxLength={3000}
                    className="ig-composer-textarea"
                    placeholder={`Tell readers what’s happening in ${currentStudio.studioName}…`}
                    value={broadcastContent}
                    onChange={(e) => setBroadcastContent(e.target.value)}
                    onKeyDown={submitBroadcastOnShortcut}
                    aria-label="Write a studio announcement"
                    required
                  />
                  <div className="studio-compose-meta"><span>{broadcastContent.length}/3000 characters</span><span>Ctrl/⌘ + Enter to publish</span></div>
                  <ImageUploader
                    value={broadcastMediaUrl}
                    onChange={(url) => setBroadcastMediaUrl(url)}
                    label="Attach Teaser Image / Artwork (Optional)"
                    hint="PNG or JPG image preview for your community post"
                  />

                  <TagInput
                    tags={broadcastTags}
                    onChange={setBroadcastTags}
                    hint="Up to 20 hashtags. Press Enter or comma after each tag."
                  />

                  <div className="studio-publish-footer">
                    <span>Your post will appear on the community feed.</span>
                    <button
                      type="submit"
                      className="cr-btn-primary"
                      disabled={isSubmitting || !broadcastContent.trim()}
                    >
                      {isSubmitting ? 'Publishing…' : 'Publish post'}
                    </button>
                  </div>
                </form>
              </section>

              <aside className="studio-post-preview"><p className="eyebrow">LIVE PREVIEW</p><h3>How readers will see it</h3><article className="studio-preview-card"><div className="studio-preview-author"><span>{(currentStudio.studioName || 'S').slice(0, 1).toUpperCase()}</span><div><strong>{currentStudio.studioName}</strong><small>Studio update · just now</small></div></div>{broadcastMediaUrl && <img src={broadcastMediaUrl} alt="Post preview"/>}<p>{broadcastContent || 'Your announcement preview will appear here as you write.'}</p>{broadcastTags.length > 0 && <div className="studio-preview-tags">{broadcastTags.map((tag) => <span key={tag}>#{tag}</span>)}</div>}</article></aside>

              {/* Studio's Live Broadcasts Feed */}
              <div>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.1rem' }}>
                  Studio Broadcasts ({studioPosts.length})
                </h3>
                <div style={{ display: 'grid', gap: '1.25rem' }}>
                  {studioPosts.map((post) => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onDelete={() => loadStudioPosts(currentStudio.id)}
                    />
                  ))}
                  {studioPosts.length === 0 && !isLoadingPosts && (
                    <div className="cr-card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No community broadcasts from this studio yet. Share your first update using the composer above!
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Team Collaboration */}
          {activeTab === 'team' && currentStudio && (
            <div className="studio-team-layout">
              <div className="cr-card" style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem', fontSize: '1.15rem' }}>Studio Collaborators</h3>
                <div style={{ display: 'grid', gap: '0.75rem' }}>
                  {teamMembers.map((m) => (
                    <div
                      key={m.id || m.userId}
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '8px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <strong>Studio collaborator</strong>
                        <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Joined: {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString() : 'Pending'}
                        </span>
                      </div>
                      <span className="cr-badge-orange" style={{ fontSize: '0.75rem' }}>
                        {m.role}
                      </span>
                    </div>
                  ))}
                  {teamMembers.length === 0 && (
                    <p style={{ color: 'var(--text-muted)', margin: 0 }}>
                      No collaborators invited yet.
                    </p>
                  )}
                </div>
              </div>

              {/* P0 — Studio collaborator invitation using safe search and role selection */}
              <StudioInviteCollaborator
                studioId={currentStudio?.id}
                currentMembers={teamMembers}
                onInviteSent={() => {
                  if (currentStudio?.id) {
                    loadTeam(currentStudio.id);
                  }
                }}
              />
            </div>
          )}
          </>}
        </main>
      </div>

      {/* Modal 1: Create Studio Modal */}
      {showStudioModal && (
        <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="cr-card" style={{ width: '90%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 0.5rem', fontSize: '1.35rem' }}>Create Studio Channel</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              Each account can create 1 dedicated Studio. Maximum 5 total studio memberships per account.
            </p>
            <form onSubmit={handleCreateStudio} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Studio Name:
                <input
                  required
                  minLength={3}
                  maxLength={50}
                  className="ig-comment-input"
                  placeholder="e.g. Moonlight Publishing Studio"
                  value={studioForm.studioName}
                  onChange={(e) => setStudioForm({ ...studioForm, studioName: e.target.value })}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Unique Studio Handle:
                <input
                  required
                  minLength={3}
                  maxLength={50}
                  className="ig-comment-input"
                  placeholder="e.g. moonlight-studio"
                  value={studioForm.studioHandle}
                  onChange={(e) => setStudioForm({ ...studioForm, studioHandle: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                />
              </label>

              <ImageUploader
                value={studioForm.profileImageName}
                onChange={(url) => setStudioForm({ ...studioForm, profileImageName: url })}
                label="Studio Avatar / Icon (Upload File)"
                hint="PNG or JPG icon for your studio"
              />

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                About Studio:
                <textarea
                  rows={2}
                  maxLength={500}
                  className="ig-composer-textarea"
                  placeholder="Describe your studio and genres…"
                  value={studioForm.description}
                  onChange={(e) => setStudioForm({ ...studioForm, description: e.target.value })}
                />
              </label>

              <fieldset className="studio-visibility-options">
                <legend>Who can discover this studio?</legend>
                {[
                  ['PUBLIC', 'Public', 'Anyone can discover this studio in search.'],
                  ['UNLISTED', 'Unlisted', 'Only people with the studio link can find it.'],
                  ['PRIVATE', 'Private', 'Keep the studio private to its members.'],
                ].map(([value, label, description]) => <label key={value} className={studioForm.visibilityType === value ? 'selected' : ''}>
                  <input type="radio" name="studio-visibility" value={value} checked={studioForm.visibilityType === value} onChange={() => setStudioForm({ ...studioForm, visibilityType: value })} />
                  <span><strong>{label}</strong><small>{description}</small></span>
                </label>)}
              </fieldset>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="cr-btn-secondary" onClick={() => setShowStudioModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cr-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating Studio…' : 'Create Studio Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Draft Novel Modal */}
      {showNovelModal && (
        <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="cr-card" style={{ width: '90%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.35rem' }}>Draft Novel for {currentStudio?.studioName}</h2>
            <form onSubmit={handleCreateNovel} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Title:
                <input
                  required
                  maxLength={200}
                  className="ig-comment-input"
                  placeholder="e.g. Chronicles of the Silver Star"
                  value={novelForm.title}
                  onChange={(e) => setNovelForm({ ...novelForm, title: e.target.value })}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Category:
                <select
                  className="ig-comment-input"
                  value={novelForm.categoryType}
                  onChange={(e) => setNovelForm({ ...novelForm, categoryType: e.target.value })}
                >
                  <option value="FICTION">Fiction</option>
                  <option value="NONFICTION">Nonfiction</option>
                </select>
              </label>

              <ImageUploader
                value={novelForm.coverImageUrl}
                onChange={(url) => setNovelForm({ ...novelForm, coverImageUrl: url })}
                label="Novel Book Cover (Upload File)"
                hint="Vertical cover artwork (ratio ~ 2:3)"
              />

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Synopsis:
                <textarea
                  rows={3}
                  maxLength={2000}
                  className="ig-composer-textarea"
                  placeholder="Hook readers with the premise of the novel…"
                  value={novelForm.synopsis}
                  onChange={(e) => setNovelForm({ ...novelForm, synopsis: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="ig-comment-input"
                  placeholder="Genres: Fantasy, Sci-Fi"
                  value={novelForm.genres}
                  onChange={(e) => setNovelForm({ ...novelForm, genres: e.target.value })}
                />
                <input
                  type="text"
                  className="ig-comment-input"
                  placeholder="Tags: magic, hero"
                  value={novelForm.tags}
                  onChange={(e) => setNovelForm({ ...novelForm, tags: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="cr-btn-secondary" onClick={() => setShowNovelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cr-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating…' : 'Create Novel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Edit Novel Metadata Modal */}
      {showEditNovelModal && editingNovel && (
        <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="cr-card" style={{ width: '90%', maxWidth: '520px', padding: '1.75rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.35rem' }}>Edit Novel: {editingNovel.title}</h2>
            <form onSubmit={handleUpdateNovel} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Title:
                <input
                  required
                  maxLength={200}
                  className="ig-comment-input"
                  value={editNovelForm.title}
                  onChange={(e) => setEditNovelForm({ ...editNovelForm, title: e.target.value })}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Category:
                <select
                  className="ig-comment-input"
                  value={editNovelForm.categoryType}
                  onChange={(e) => setEditNovelForm({ ...editNovelForm, categoryType: e.target.value })}
                >
                  <option value="FICTION">Fiction</option>
                  <option value="NONFICTION">Nonfiction</option>
                </select>
              </label>

              <ImageUploader
                value={editNovelForm.coverImageUrl}
                onChange={(url) => setEditNovelForm({ ...editNovelForm, coverImageUrl: url })}
                label="Update Book Cover Art"
                hint="Vertical cover artwork (ratio ~ 2:3)"
              />

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Synopsis:
                <textarea
                  rows={3}
                  maxLength={2000}
                  className="ig-composer-textarea"
                  value={editNovelForm.synopsis}
                  onChange={(e) => setEditNovelForm({ ...editNovelForm, synopsis: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="ig-comment-input"
                  placeholder="Genres: Fantasy, Sci-Fi"
                  value={editNovelForm.genres}
                  onChange={(e) => setEditNovelForm({ ...editNovelForm, genres: e.target.value })}
                />
                <input
                  type="text"
                  className="ig-comment-input"
                  placeholder="Tags: magic, hero"
                  value={editNovelForm.tags}
                  onChange={(e) => setEditNovelForm({ ...editNovelForm, tags: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="cr-btn-secondary" onClick={() => setShowEditNovelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cr-btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: New Chapter Modal */}
      {showChapterModal && (
        <div className="cr-modal-backdrop" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'grid', placeItems: 'center', zIndex: 1000 }}>
          <div className="cr-card" style={{ width: '90%', maxWidth: '420px', padding: '1.75rem' }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>Add Chapter Draft</h2>
            <form onSubmit={handleCreateChapter} style={{ display: 'grid', gap: '1rem' }}>
              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Chapter Number:
                <input
                  type="number"
                  min="1"
                  required
                  className="ig-comment-input"
                  value={chapterMeta.chapterNumber}
                  onChange={(e) => setChapterMeta({ ...chapterMeta, chapterNumber: Number(e.target.value) })}
                />
              </label>

              <label style={{ display: 'grid', gap: '0.35rem', fontWeight: 600, fontSize: '0.85rem' }}>
                Chapter Title:
                <input
                  type="text"
                  required
                  maxLength={200}
                  className="ig-comment-input"
                  placeholder="e.g. The Awakening of the Dragon"
                  value={chapterMeta.title}
                  onChange={(e) => setChapterMeta({ ...chapterMeta, title: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button type="button" className="cr-btn-secondary" onClick={() => setShowChapterModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="cr-btn-primary" disabled={isSubmitting}>
                  Create Chapter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

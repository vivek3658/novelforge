import { DUMMY_NOVELS } from './dummyNovels';
import { novelApi } from '../features/novels/api/novels.api';
import { chaptersApi } from '../features/chapters/api/chapters.api';

const pageContent = (page) => Array.isArray(page) ? page : page?.content || [];

export const novelStore = {
  async loadAllNovels({ query = '', page = 0 } = {}) {
    try {
      const result = query ? await novelApi.searchNovels({ query, page }) : await novelApi.getAllNovels({ page });
      return { novels: pageContent(result), page: result, isLiveBackendAvailable: true, isDemo: false };
    } catch (error) {
      return { novels: query ? DUMMY_NOVELS.filter((novel) => novel.title.toLowerCase().includes(query.toLowerCase())) : DUMMY_NOVELS, isLiveBackendAvailable: false, isDemo: true, backendStatusMessage: error.message };
    }
  },
  searchNovels(query = '') { return this.loadAllNovels({ query }); },
  async getNovelById(id) {
    try { return { ...(await novelApi.getNovel(id)), isDemo: false }; }
    catch { return DUMMY_NOVELS.find((novel) => String(novel.id) === String(id)) ? { ...DUMMY_NOVELS.find((novel) => String(novel.id) === String(id)), isDemo: true } : null; }
  },
  async getChapter(novelId, chapterId) {
    const novel = await this.getNovelById(novelId);
    if (novel?.isDemo) {
      const chapter = novel.chapters?.find((item) => String(item.id) === String(chapterId) || String(item.chapterNumber) === String(chapterId));
      return chapter ? { novel, chapter: { ...chapter, blocks: (chapter.paragraphs || []).map((text, position) => ({ type: 'TEXT', text, position })) } } : null;
    }
    const [chapter, chapters] = await Promise.all([chaptersApi.getChapter(novelId, chapterId), chaptersApi.getChapters(novelId)]);
    return { novel, chapter, chapters: pageContent(chapters) };
  },
};

export default novelStore;

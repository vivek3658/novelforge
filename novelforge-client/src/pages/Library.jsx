import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { engagementApi } from '../features/engagement/api/engagement.api';
import './ProductPages.css';

export default function Library() {
  const [collections, setCollections] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState('');
  const loadCollections = useCallback(async () => { try { const result = await engagementApi.getCollections(); const list = Array.isArray(result) ? result : result?.content || []; setCollections(list); const active = selected ? list.find((collection) => collection.id === selected.id) : list[0]; if (active) { setSelected(active); const page = await engagementApi.getCollectionItems(active.id); setItems(page?.content || []); } } catch (err) { setError(err.message || 'Sign in to open your library.'); } }, [selected]);
  useEffect(() => { loadCollections(); }, [loadCollections]);
  const openCollection = async (collection) => { setSelected(collection); try { const page = await engagementApi.getCollectionItems(collection.id); setItems(page?.content || []); } catch (err) { setError(err.message); } };
  const createCollection = async () => { const name = window.prompt('Name your collection'); if (!name?.trim()) return; try { await engagementApi.createCollection({ name: name.trim() }); await loadCollections(); } catch (err) { setError(err.message || 'Could not create collection.'); } };
  const remove = async (item) => { try { await engagementApi.removeCollectionItem(selected.id, item.id); setItems((current) => current.filter((saved) => saved.id !== item.id)); } catch (err) { setError(err.message || 'Could not remove saved story.'); } };
  return <main className="product-page library-page"><header className="product-heading"><div><p className="eyebrow">YOUR SHELF</p><h1>Library</h1><p>Keep stories close and organize your next reads.</p></div><button className="product-button" onClick={createCollection}>New collection</button></header>{error && <p className="inline-error" role="alert">{error}</p>}<div className="library-layout"><aside className="collection-list" aria-label="Collections">{collections.map((collection) => <button key={collection.id} className={selected?.id === collection.id ? 'collection-link selected' : 'collection-link'} onClick={() => openCollection(collection)}><span>{collection.name}</span><small>{collection.itemCount}</small></button>)}</aside><section className="library-items"><h2>{selected?.name || 'Your saved stories'}</h2>{items.length ? items.map((item) => <article className="saved-row" key={item.id}><div><p className="eyebrow">{item.targetType}</p><h3><Link to={item.targetType === 'NOVEL' ? `/novels/${item.targetId}` : '#'}>{item.targetType === 'NOVEL' ? `Novel ${item.targetId}` : `Chapter ${item.targetId}`}</Link></h3><small>Saved {item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'recently'}</small></div><button className="quiet-button" onClick={() => remove(item)}>Remove</button></article>) : <div className="empty-state"><h3>Your reading shelf starts here</h3><p>Save a novel with “Watch later” and it will appear here.</p><Link to="/novels" className="product-button">Explore novels</Link></div>}</section></div></main>;
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { CopyToClipboard } from 'react-copy-to-clipboard';
import database from '../../database.json';

const STORAGE_KEY = 'jd-customer-service-kb-v1';

const emptyForm = {
  title: '',
  category: database.categories[0],
  tagsText: '',
  imageUrl: '',
  content: ''
};

function todayText() {
  return new Date().toISOString().slice(0, 10);
}

function buildCopyText(item) {
  return `${item.title}\n\n${item.content}`;
}

export default function HomePage() {
  // 纯前端状态机：所有新增、编辑、删除只改浏览器内存和 localStorage。
  // 局限说明：localStorage 只保存在当前浏览器，换电脑或清缓存会丢失演示数据。
  // 二期如需跨设备永久保存，再接入免费云数据库或企业内部接口。
  const [items, setItems] = useState(database.items);
  const [selectedCategory, setSelectedCategory] = useState('全部资料');
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(database.items[0]?.id || '');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [copyTip, setCopyTip] = useState('');

  useEffect(() => {
    const cache = window.localStorage.getItem(STORAGE_KEY);
    if (cache) {
      try {
        const parsed = JSON.parse(cache);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setSelectedId(parsed[0].id);
        }
      } catch (error) {
        console.warn('localStorage 数据解析失败，已回退到 database.json 初始数据', error);
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const filteredItems = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const hitCategory = selectedCategory === '全部资料' || item.category === selectedCategory;
      const haystack = `${item.title} ${item.category} ${item.tags?.join(' ') || ''} ${item.content}`.toLowerCase();
      const hitKeyword = !keyword || haystack.includes(keyword);
      return hitCategory && hitKeyword;
    });
  }, [items, query, selectedCategory]);

  const selectedItem = useMemo(() => {
    return items.find((item) => item.id === selectedId) || filteredItems[0] || items[0];
  }, [items, selectedId, filteredItems]);

  const latestItems = useMemo(() => {
    return [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 3);
  }, [items]);

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      category: item.category,
      tagsText: item.tags?.join('，') || '',
      imageUrl: item.imageUrl || '',
      content: item.content
    });
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  }

  function saveItem(event) {
    event.preventDefault();
    const normalized = {
      title: form.title.trim(),
      category: form.category,
      tags: form.tagsText
        .split(/[,，]/)
        .map((tag) => tag.trim())
        .filter(Boolean),
      imageUrl: form.imageUrl.trim(),
      content: form.content.trim(),
      updatedAt: todayText()
    };

    if (!normalized.title || !normalized.content) {
      window.alert('标题和 Markdown 正文不能为空。');
      return;
    }

    if (editingId) {
      setItems((current) =>
        current.map((item) => (item.id === editingId ? { ...item, ...normalized } : item))
      );
      setSelectedId(editingId);
    } else {
      const nextItem = {
        id: `local-${Date.now()}`,
        ...normalized
      };
      setItems((current) => [nextItem, ...current]);
      setSelectedId(nextItem.id);
    }

    closeModal();
  }

  function deleteItem(item) {
    // TODO: 二期登录拦截/权限控制
    // 位置 ②：未来在这里判断 currentUser.role 是否为 admin。
    // 管理员允许编辑/删除，普通客服只允许查看和复制。
    // 当前 MVP 按要求全员开放，所以不做任何权限判断。
    const confirmed = window.confirm(`确定删除「${item.title}」吗？此操作只会删除当前浏览器缓存里的演示数据。`);
    if (!confirmed) return;
    setItems((current) => current.filter((entry) => entry.id !== item.id));
    setSelectedId(items.find((entry) => entry.id !== item.id)?.id || '');
  }

  function resetLocalDemoData() {
    const confirmed = window.confirm('确定恢复 database.json 初始数据吗？当前浏览器里的新增和编辑内容会被覆盖。');
    if (!confirmed) return;
    setItems(database.items);
    setSelectedId(database.items[0]?.id || '');
    setQuery('');
    setSelectedCategory('全部资料');
  }

  return (
    <main className="flex min-h-screen bg-paper">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-line bg-[#f5f2ee] px-5 py-6 lg:block">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">JD Service KB</p>
          <h1 className="mt-2 text-2xl font-bold tracking-normal">客服知识库</h1>
          <p className="mt-2 text-sm leading-6 text-muted">纯静态部署，零服务器，话术检索靠浏览器本地完成。</p>
        </div>

        <nav className="space-y-2">
          {['全部资料', ...database.categories].map((category) => (
            <button
              key={category}
              onClick={() => {
                setSelectedCategory(category);
                setSelectedId('');
              }}
              className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition ${
                selectedCategory === category
                  ? 'bg-white font-semibold text-ink shadow-sm'
                  : 'text-muted hover:bg-white/70 hover:text-ink'
              }`}
            >
              <span>{category}</span>
              <span className="text-xs text-muted">
                {category === '全部资料' ? items.length : items.filter((item) => item.category === category).length}
              </span>
            </button>
          ))}
        </nav>

        <button
          onClick={resetLocalDemoData}
          className="absolute bottom-6 left-5 right-5 rounded-md border border-line bg-white px-3 py-2 text-sm text-muted hover:text-ink"
        >
          恢复初始演示数据
        </button>
      </aside>

      <section className="min-w-0 flex-1 lg:pl-72">
        <header className="sticky top-0 z-20 border-b border-line bg-paper/95 px-5 py-4 backdrop-blur lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 xl:flex-row xl:items-center">
            <div className="flex-1">
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜索标题、正文、标签，例如：催发货 / 破损 / 差价"
                className="h-12 w-full rounded-md border border-line bg-white px-4 text-base outline-none transition focus:border-ink focus:ring-4 focus:ring-stone-200"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={openCreateModal}
                className="h-12 rounded-md bg-jd px-5 text-sm font-semibold text-white shadow-soft transition hover:bg-[#c91f17]"
              >
                新增资料
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto grid max-w-6xl gap-6 px-5 py-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
          <section className="space-y-4">
            <div className="rounded-md border border-line bg-white p-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">检索结果</h2>
                <span className="text-sm text-muted">{filteredItems.length} 条</span>
              </div>
              <div className="mt-4 space-y-2">
                {filteredItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`w-full rounded-md border p-3 text-left transition ${
                      selectedItem?.id === item.id
                        ? 'border-jd bg-red-50'
                        : 'border-line bg-white hover:border-stone-300 hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="line-clamp-1 text-sm font-semibold">{item.title}</h3>
                      <span className="shrink-0 rounded bg-stone-100 px-2 py-1 text-xs text-muted">{item.category}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-xs leading-5 text-muted">
                      {item.content.replace(/[#>*`-]/g, '').slice(0, 86)}
                    </p>
                  </button>
                ))}

                {filteredItems.length === 0 && (
                  <div className="rounded-md border border-dashed border-line p-6 text-center text-sm text-muted">
                    没搜到，直接点「新增资料」把这条 SOP 补进去。
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-md border border-line bg-white p-4">
              <h2 className="font-semibold">最新录入 SOP</h2>
              <div className="mt-3 space-y-2">
                {latestItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-stone-50"
                  >
                    <span className="line-clamp-1">{item.title}</span>
                    <span className="shrink-0 text-xs text-muted">{item.updatedAt}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          <article className="min-w-0 rounded-md border border-line bg-white p-6 shadow-soft">
            {selectedItem ? (
              <>
                <div className="mb-6 border-b border-line pb-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-jd">{selectedItem.category}</p>
                      <h2 className="mt-2 text-2xl font-bold tracking-normal">{selectedItem.title}</h2>
                      <p className="mt-2 text-sm text-muted">最后更新：{selectedItem.updatedAt}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <CopyToClipboard
                        text={buildCopyText(selectedItem)}
                        onCopy={() => {
                          setCopyTip('已复制到剪贴板');
                          window.setTimeout(() => setCopyTip(''), 1600);
                        }}
                      >
                        <button className="rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-black">
                          一键复制话术
                        </button>
                      </CopyToClipboard>
                      <button
                        onClick={() => openEditModal(selectedItem)}
                        className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-stone-50"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => deleteItem(selectedItem)}
                        className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-jd hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {copyTip && <p className="mt-3 text-sm font-medium text-green-700">{copyTip}</p>}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {selectedItem.tags?.map((tag) => (
                      <span key={tag} className="rounded bg-stone-100 px-2 py-1 text-xs text-muted">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedItem.imageUrl && (
                  <img
                    src={selectedItem.imageUrl}
                    alt={`${selectedItem.title} 图片预览`}
                    className="mb-5 max-h-80 w-full rounded-md border border-line object-cover"
                  />
                )}

                <div className="markdown-body">
                  <ReactMarkdown>{selectedItem.content}</ReactMarkdown>
                </div>
              </>
            ) : (
              <div className="py-20 text-center">
                <h2 className="text-2xl font-bold">欢迎使用客服知识库</h2>
                <p className="mt-3 text-muted">左侧选择分类，或在顶部搜索框输入关键词开始检索。</p>
              </div>
            )}
          </article>
        </div>
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form onSubmit={saveItem} className="max-h-[92vh] w-full max-w-3xl overflow-auto rounded-md bg-white p-6 shadow-soft">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-bold">{editingId ? '编辑资料' : '新增资料'}</h2>
              <button type="button" onClick={closeModal} className="rounded-md px-3 py-2 text-sm text-muted hover:bg-stone-100">
                关闭
              </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold">标题</span>
                <input
                  value={form.title}
                  onChange={(event) => setForm({ ...form, title: event.target.value })}
                  className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  placeholder="例如：客户催发货标准话术"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-semibold">分类</span>
                <select
                  value={form.category}
                  onChange={(event) => setForm({ ...form, category: event.target.value })}
                  className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                >
                  {database.categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold">标签，多个标签用逗号分隔</span>
                <input
                  value={form.tagsText}
                  onChange={(event) => setForm({ ...form, tagsText: event.target.value })}
                  className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  placeholder="例如：催发货，物流，安抚"
                />
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold">图片 URL，可留空</span>
                <input
                  value={form.imageUrl}
                  onChange={(event) => setForm({ ...form, imageUrl: event.target.value })}
                  className="h-11 w-full rounded-md border border-line px-3 outline-none focus:border-ink"
                  placeholder="https://example.com/demo.jpg"
                />
              </label>

              {form.imageUrl && (
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-semibold">图片预览</p>
                  <img src={form.imageUrl} alt="图片 URL 预览" className="max-h-56 w-full rounded-md border border-line object-cover" />
                </div>
              )}

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-semibold">Markdown 正文</span>
                <textarea
                  value={form.content}
                  onChange={(event) => setForm({ ...form, content: event.target.value })}
                  className="min-h-64 w-full resize-y rounded-md border border-line px-3 py-3 leading-7 outline-none focus:border-ink"
                  placeholder={'### 适用场景\n客户咨询...\n\n### 标准话术\n亲爱的...\n\n### 处理 SOP\n1. ...'}
                />
              </label>
            </div>

            <div className="mt-5 rounded-md border border-line bg-stone-50 p-4">
              <p className="mb-3 text-sm font-semibold">Markdown 实时预览</p>
              <div className="markdown-body rounded-md bg-white p-4">
                <ReactMarkdown>{form.content || '这里会实时预览 Markdown 内容。'}</ReactMarkdown>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={closeModal} className="rounded-md border border-line px-4 py-2 text-sm font-semibold hover:bg-stone-50">
                取消
              </button>
              <button type="submit" className="rounded-md bg-jd px-5 py-2 text-sm font-semibold text-white hover:bg-[#c91f17]">
                保存到本机浏览器
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}

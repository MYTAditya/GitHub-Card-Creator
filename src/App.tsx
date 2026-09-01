import React, { useState } from 'react';
import { Copy, CheckCircle, AlertCircle, ExternalLink, Image as ImageIcon, Download } from 'lucide-react';
import { FaGithub } from 'react-icons/fa';

type CardType = 'repository' | 'issue' | 'pull-request' | 'discussion' | 'release' | 'app' | 'commit' | 'project';

interface FormData {
  type: CardType;
  user?: string;
  repo?: string;
  num?: number;
  tag?: string;
  appname?: string;
  commitid?: string;
  acctype?: 'users' | 'orgs';
}

interface CodeData {
  url: string;
  markdown: string;
  rst: string;
  asciidoc: string;
  html: string;
}

// Encodes a single path segment so user input can't inject extra path parts, query strings, or fragments into the generated URLs.
const encodeSegment = (value: string | number | undefined): string =>
  encodeURIComponent(String(value ?? ''));

// Escapes special characters
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeMarkdown = (value: string): string =>
  value
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29')
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D');

const escapeAsciidoc = (value: string): string =>
  value
    .replace(/\[/g, '%5B')
    .replace(/\]/g, '%5D')
    .replace(/"/g, '%22');

// Allowlist patterns matching what GitHub itself permits for each field.
const VALIDATION_PATTERNS: Record<string, RegExp> = {
  // GitHub usernames/orgs: alphanumeric and single hyphens, 1-39 chars.
  user: /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/,
  // Repo names: alphanumeric, hyphens, underscores, periods.
  repo: /^[a-zA-Z0-9._-]{1,100}$/,
  // Issue/PR/discussion/project numbers: digits only.
  num: /^[0-9]{1,10}$/,
  // Marketplace app slugs: lowercase alphanumeric and hyphens.
  appname: /^[a-z0-9-]{1,100}$/,
  // Commit SHAs: Either SHA-1 or SHA-256 hex only.
  commitid: /^[a-f0-9]{40}$|^[a-f0-9]{64}$/i,
};

// GitHub tags: Git's ref-name rules (git-check-ref-format).
const isValidGitTag = (value: string): boolean => {
  if (!value || value.length > 200) return false;
  if (/[\x00-\x1F\x7F ~^:?*[\\]/.test(value)) return false;
  if (value.includes('..')) return false;
  if (value.includes('@{')) return false;
  if (value.startsWith('.') || value.endsWith('.')) return false;
  if (value.endsWith('/') || value.endsWith('.lock')) return false;
  if (value === '@') return false;
  if (value.startsWith('-')) return false;
  return true;
};

const validateField = (field: keyof typeof VALIDATION_PATTERNS, value: string): boolean =>
  VALIDATION_PATTERNS[field].test(value);

function App() {
  const [formData, setFormData] = useState<FormData>({
    type: 'repository',
    user: '',
    repo: '',
    num: '',
    tag: '',
    appname: '',
    commitid: '',
    acctype: 'users'
  });

  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState<string>('');
  const [codeData, setCodeData] = useState<CodeData>({ url: '', markdown: '', rst: '', asciidoc: '', html: '' });
  const [error, setError] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string>('');

  const cardTypes = [
    { id: 'repository', label: 'Repository', icon: '📁' },
    { id: 'issue', label: 'Issue', icon: '🐛' },
    { id: 'pull-request', label: 'Pull Request', icon: '🔄' },
    { id: 'discussion', label: 'Discussion', icon: '💬' },
    { id: 'release', label: 'Release', icon: '🚀' },
    { id: 'app', label: 'Marketplace App', icon: '🔌' },
    { id: 'commit', label: 'Commit', icon: '🔨' },
    { id: 'project', label: 'Project', icon: '🗺️' }
  ];

  const generateUrls = () => {
    const { type, user, repo, num, tag, appname, commitid, acctype } = formData;

    if ((type !== 'app' && type !== 'project') && (!user || !repo)) {
      setError('User and repository are required');
      return;
    }

    if ((type === 'issue' || type === 'pull-request' || type === 'discussion') && !num) {
      setError('Number is required for this type');
      return;
    }

    if (type === 'release' && !tag) {
      setError('Tag is required for Releases');
      return;
    }

    if (type === 'app' && !appname) {
      setError('App name is required for Marketplace Apps');
      return;
    }

    if (type === 'commit' && !commitid) {
      setError('Commit ID is required for Commits');
      return;
    }

    if (type === 'project' && (!user || !acctype || !num)) {
      setError('User, Account Type and Project Number is required for Projects');
      return;
    }

    // Allowlist validation: reject anything that doesn't look like a real GitHub username, repo, number, tag, app slug, or commit SHA.
    if (user && !validateField('user', user)) {
      setError('Username can only contain letters, numbers, and single hyphens');
      return;
    }
    if (repo && !validateField('repo', repo)) {
      setError('Repository name can only contain letters, numbers, periods, hyphens, and underscores');
      return;
    }
    if (num !== undefined && String(num) !== '' && !validateField('num', String(num))) {
      setError('Number must contain digits only');
      return;
    }
    if (tag && !isValidGitTag(tag)) {
      setError('Tag can only contain letters, numbers, periods, hyphens, and underscores');
      return;
    }
    if (appname && !validateField('appname', appname)) {
      setError('App name can only contain lowercase letters, numbers, and hyphens');
      return;
    }
    if (commitid && !validateField('commitid', commitid)) {
      setError('Commit ID must be a valid hex SHA (7-40 characters)');
      return;
    }

    setError('');

    let imageUrl = '';
    let githubUrl = '';
    // These are the constant URLs.
    const imageUrlConst = 'https://opengraph.githubassets.com/54c6dafcd9f93d895328fdc57409345555ea517c7c4d4ad9b75d0a4208404735';
    const githubUrlConst = 'https://github.com';

    switch (type) {
      case 'repository':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}`;
        break;
      case 'issue':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/issues/${encodeSegment(num)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/issues/${encodeSegment(num)}`;
        break;
      case 'pull-request':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/pull/${encodeSegment(num)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/pull/${encodeSegment(num)}`;
        break;
      case 'discussion':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/discussions/${encodeSegment(num)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/discussions/${encodeSegment(num)}`;
        break;
      case 'release':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/releases/tag/${encodeSegment(tag)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/releases/tag/${encodeSegment(tag)}`;
        break;
      case 'app':
        imageUrl = `${imageUrlConst}/marketplace/${encodeSegment(appname)}`;
        githubUrl = `${githubUrlConst}/marketplace/${encodeSegment(appname)}`;
        break;
      case 'commit':
        imageUrl = `${imageUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/commit/${encodeSegment(commitid)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(user)}/${encodeSegment(repo)}/commit/${encodeSegment(commitid)}`;
        break;
      case 'project':
        imageUrl = `${imageUrlConst}/${encodeSegment(acctype)}/${encodeSegment(user)}/projects/${encodeSegment(num)}`;
        githubUrl = `${githubUrlConst}/${encodeSegment(acctype)}/${encodeSegment(user)}/projects/${encodeSegment(num)}`;
        break;
    }

    setPreviewUrl(imageUrl);
    setGithubUrl(githubUrl);
    setImageLoaded(false);

    // Generate code data
    const markdown = `[![GitHub Card](${escapeMarkdown(imageUrl)})](${escapeMarkdown(githubUrl)})`;
    const rst = `.. image:: ${imageUrl}
   :alt: GitHub Card
   :target: ${githubUrl}`;
    const asciidoc = `image:${escapeAsciidoc(imageUrl)}[GitHub Card,link="${escapeAsciidoc(githubUrl)}"]`;
    const html = `<a href="${escapeHtml(githubUrl)}" target="_blank"><img src="${escapeHtml(imageUrl)}" alt="GitHub Card" /></a>`;

    setCodeData({
      url: imageUrl,
      markdown,
      rst,
      asciidoc,
      html
    });
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedType(type);
      setTimeout(() => setCopiedType(''), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleImageError = () => {
    setError(`429 Error came from GitHub. Please try again later.`);
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setError('');
  };

  const openInNewTab = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleDownloadImage = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `github-card-${formData.type}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err) {
      console.error('Failed to download image: ', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <FaGithub className="w-8 h-8 text-lime-400" />
            <h1 className="text-4xl font-bold text-lime-400 bg-clip-text">
              GitHub Card Creator
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Generate official GitHub cards for Repos, Issues, PRs, Discussions, Releases, and more!
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Form Section */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 text-lime-400">Card Configuration</h2>

            {/* Note */}
            <div className="mb-8 p-4 bg-yellow-400/10 border border-yellow-500/40 rounded-xl">
              <div className="flex items-start gap-2 text-yellow-300">
                <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                <span className="text-sm">
                  Note: Always enter correct, existing GitHub information (username, repository, number, tag, etc.). Incorrect details will cause GitHub to return an error banner image instead of a valid card. Links point to public GitHub content not controlled by this app.
                </span>
              </div>
            </div>

            {/* Card Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-4">Card Type</label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cardTypes.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => handleInputChange('type', type.id as CardType)}
                    className={`p-4 rounded-xl text-center transition-all duration-200 border-2 ${
                      formData.type === type.id
                        ? 'border-lime-400 bg-lime-400/10 text-lime-400'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="text-2xl mb-1">{type.icon}</div>
                    <div className="text-sm font-medium">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.type !== 'app' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Username
                  </label>
                  <input
                    type="text"
                    value={formData.user}
                    onChange={(e) => handleInputChange('user', e.target.value)}
                    placeholder="octocat"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}

              {(formData.type !== 'app' && formData.type !== 'project') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Repository Name
                  </label>
                  <input
                    type="text"
                    value={formData.repo}
                    onChange={(e) => handleInputChange('repo', e.target.value)}
                    placeholder="Hello-World"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}

              {(formData.type === 'issue' || formData.type === 'pull-request' || formData.type === 'discussion' || formData.type === 'project') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.type === 'issue' ? 'Issue Number' : 
                     formData.type === 'pull-request' ? 'Pull Request Number' :
                     formData.type === 'project' ? 'Project Number' : 'Discussion Number'}
                  </label>
                  <input
                    type="number"
                    value={formData.num}
                    onChange={(e) => handleInputChange('num', e.target.value)}
                    placeholder="1"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}

              {formData.type === 'release' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Release Tag
                  </label>
                  <input
                    type="text"
                    value={formData.tag}
                    onChange={(e) => handleInputChange('tag', e.target.value)}
                    placeholder="1.0.0"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}

              {formData.type === 'app' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    GitHub Marketplace App Name
                  </label>
                  <input
                    type="text"
                    value={formData.appname}
                    onChange={(e) => handleInputChange('appname', e.target.value)}
                    placeholder="microsoft-teams-for-github"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
               )}

              {formData.type === 'commit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Commit ID
                  </label>
                  <input
                    type="text"
                    value={formData.commitid}
                    onChange={(e) => handleInputChange('commitid', e.target.value)}
                    placeholder="b7f7be05b18944b1332b4564e6d399bb556797a8"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}

              {formData.type === 'project' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Account Type
                  </label>
                  <select
                    value={formData.acctype}
                    onChange={(e) => handleInputChange('acctype', e.target.value as 'users' | 'orgs')}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  >
                    <option value="users">User</option>
                    <option value="orgs">Organization</option>
                  </select>
                </div>
              )}
            </div>

            {/* Generate Card Button */}
            <div className="mt-8 text-center">
              <button
                onClick={generateUrls}
                style={{ backgroundColor: '#a9e43a', color: '#000000' }}
                className="px-8 py-3 rounded-xl font-semibold hover:opacity-90 active:scale-95 transition-all duration-200 shadow-lg"
              >
                Generate Card
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-6 p-4 bg-red-900/20 border border-red-500 rounded-xl">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* Preview Section */}
          {previewUrl && !error && (
            <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Card Preview</h2>

              <div className="text-center">
                <div className="inline-block relative">
                  <img
                    src={previewUrl}
                    alt="GitHub Card Preview"
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className="rounded-xl shadow-lg cursor-pointer hover:shadow-2xl transition-all duration-300 hover:scale-105 max-w-full h-auto"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
                  <button
                    onClick={() => openInNewTab(githubUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-xl transition-colors duration-200 border border-lime-400/30"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="text-sm font-medium">Open Link</span>
                  </button>
                  <button
                    onClick={() => openInNewTab(previewUrl)}
                    className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-xl transition-colors duration-200 border border-lime-400/30"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span className="text-sm font-medium">Open Image</span>
                  </button>
                  <button
                    onClick={handleDownloadImage}
                    className="flex items-center gap-2 px-4 py-2 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-xl transition-colors duration-200 border border-lime-400/30"
                  >
                    <Download className="w-4 h-4" />
                    <span className="text-sm font-medium">Download Image</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Code Section */}
          {previewUrl && imageLoaded && (
            <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Card Codes</h2>

              <div className="space-y-6">
                {/* URL */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">URL</label>
                    <button
                      onClick={() => copyToClipboard(codeData.url, 'url')}
                      className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-lg transition-colors duration-200"
                    >
                      {copiedType === 'url' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedType === 'url' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <code className="text-sm text-gray-300 break-all">{codeData.url}</code>
                  </div>
                </div>

                {/* Markdown */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">Markdown</label>
                    <button
                      onClick={() => copyToClipboard(codeData.markdown, 'markdown')}
                      className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-lg transition-colors duration-200"
                    >
                      {copiedType === 'markdown' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedType === 'markdown' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <code className="text-sm text-gray-300 break-all">{codeData.markdown}</code>
                  </div>
                </div>

                {/* rSt */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">rSt</label>
                    <button
                      onClick={() => copyToClipboard(codeData.rst, 'rst')}
                      className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-lg transition-colors duration-200"
                    >
                      {copiedType === 'rst' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedType === 'rst' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700" style={{ whiteSpace: 'pre-wrap'}}>
                    <code className="text-sm text-gray-300 break-all">{codeData.rst}</code>
                  </div>
                </div>

                {/* AsciiDoc */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">AsciiDoc</label>
                    <button
                      onClick={() => copyToClipboard(codeData.asciidoc, 'asciidoc')}
                      className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-lg transition-colors duration-200"
                    >
                      {copiedType === 'asciidoc' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedType === 'asciidoc' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <code className="text-sm text-gray-300 break-all">{codeData.asciidoc}</code>
                  </div>
                </div>

                {/* HTML */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-gray-300">HTML</label>
                    <button
                      onClick={() => copyToClipboard(codeData.html, 'html')}
                      className="flex items-center gap-2 px-3 py-1 bg-lime-400/10 hover:bg-lime-400/20 text-lime-400 rounded-lg transition-colors duration-200"
                    >
                      {copiedType === 'html' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-sm">{copiedType === 'html' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <code className="text-sm text-gray-300 break-all">{codeData.html}</code>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-16 text-gray-500">
          <p>By&nbsp;
            <a href="https://github.com/MYTAditya" target="dev" className="dev-link">
              Mastered YT Aditya
            </a>
            .
          </p>
          <div align='center'>
            <a href="https://github.com/MYTAditya/GitHub-Card-Creator" target="source">
              <!-- The GitHub Badge is made by me and available under public domain. "GitHub" and the Octocat design are trademarks of GitHub, Inc -->
              <img width="250" alt="GitHub Badge" src="data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiIHN0YW5kYWxvbmU9Im5vIj8+CjxzdmcKICAgaWQ9InN2ZzUxIgogICB3aWR0aD0iMTgwIgogICBoZWlnaHQ9IjUzLjMzMyIKICAgdmVyc2lvbj0iMS4xIgogICB2aWV3Qm94PSIwIDAgMTgwIDUzLjMzMyIKICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgc29kaXBvZGk6ZG9jbmFtZT0iR2l0SHViLnN2ZyIKICAgaW5rc2NhcGU6dmVyc2lvbj0iMS40LjIgKGY0MzI3ZjQsIDIwMjUtMDUtMTMpIgogICB4bWxuczppbmtzY2FwZT0iaHR0cDovL3d3dy5pbmtzY2FwZS5vcmcvbmFtZXNwYWNlcy9pbmtzY2FwZSIKICAgeG1sbnM6c29kaXBvZGk9Imh0dHA6Ly9zb2RpcG9kaS5zb3VyY2Vmb3JnZS5uZXQvRFREL3NvZGlwb2RpLTAuZHRkIgogICB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnN2Zz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciCiAgIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyIKICAgeG1sbnM6Y2M9Imh0dHA6Ly9jcmVhdGl2ZWNvbW1vbnMub3JnL25zIyIKICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIj48ZGVmcwogICAgIGlkPSJkZWZzMSI+PGNsaXBQYXRoCiAgICAgICBpZD0iY2xpcDBfNzMwXzI3MTM2Ij48cmVjdAogICAgICAgICB3aWR0aD0iOTgiCiAgICAgICAgIGhlaWdodD0iOTYiCiAgICAgICAgIGZpbGw9IiNmZmZmZmYiCiAgICAgICAgIGlkPSJyZWN0MSIKICAgICAgICAgeD0iMCIKICAgICAgICAgeT0iMCIgLz48L2NsaXBQYXRoPjwvZGVmcz48c29kaXBvZGk6bmFtZWR2aWV3CiAgICAgaWQ9Im5hbWVkdmlldzEiCiAgICAgcGFnZWNvbG9yPSIjZmZmZmZmIgogICAgIGJvcmRlcmNvbG9yPSIjMDAwMDAwIgogICAgIGJvcmRlcm9wYWNpdHk9IjAuMjUiCiAgICAgaW5rc2NhcGU6c2hvd3BhZ2VzaGFkb3c9IjIiCiAgICAgaW5rc2NhcGU6cGFnZW9wYWNpdHk9IjAuMCIKICAgICBpbmtzY2FwZTpwYWdlY2hlY2tlcmJvYXJkPSIwIgogICAgIGlua3NjYXBlOmRlc2tjb2xvcj0iI2QxZDFkMSIKICAgICBpbmtzY2FwZTp6b29tPSIzLjM5NDQ0NDUiCiAgICAgaW5rc2NhcGU6Y3g9IjEyMy44Nzg4OSIKICAgICBpbmtzY2FwZTpjeT0iMjUuMTg4MjE2IgogICAgIGlua3NjYXBlOndpbmRvdy13aWR0aD0iMTM2NiIKICAgICBpbmtzY2FwZTp3aW5kb3ctaGVpZ2h0PSI3MDUiCiAgICAgaW5rc2NhcGU6d2luZG93LXg9Ii04IgogICAgIGlua3NjYXBlOndpbmRvdy15PSItOCIKICAgICBpbmtzY2FwZTp3aW5kb3ctbWF4aW1pemVkPSIxIgogICAgIGlua3NjYXBlOmN1cnJlbnQtbGF5ZXI9InN2ZzUxIiAvPjxtZXRhZGF0YQogICAgIGlkPSJtZXRhZGF0YTkiPjxyZGY6UkRGPjxjYzpXb3JrCiAgICAgICAgIHJkZjphYm91dD0iIj48ZGM6Zm9ybWF0PmltYWdlL3N2Zyt4bWw8L2RjOmZvcm1hdD48ZGM6dHlwZQogICAgICAgICAgIHJkZjpyZXNvdXJjZT0iaHR0cDovL3B1cmwub3JnL2RjL2RjbWl0eXBlL1N0aWxsSW1hZ2UiIC8+PC9jYzpXb3JrPjwvcmRmOlJERj48L21ldGFkYXRhPjxwYXRoCiAgICAgaWQ9InBhdGgxMSIKICAgICBkPSJtMTczLjMzIDUzLjMzM2gtMTY2LjY2Yy0zLjY2NjYgMC02LjY2NjUtMi45OTk5LTYuNjY2NS02LjY2NjV2LTM5Ljk5OWMwLTMuNjY2NiAyLjk5OTktNi42NjY1IDYuNjY2NS02LjY2NjVoMTY2LjY2YzMuNjY2NiAwIDYuNjY2NSAyLjk5OTkgNi42NjY1IDYuNjY2NXYzOS45OTljMCAzLjY2NjYtMi45OTk5IDYuNjY2NS02LjY2NjUgNi42NjY1IgogICAgIGZpbGw9IiMxMDBmMGQiCiAgICAgc3Ryb2tlLXdpZHRoPSIuMTMzMzMiIC8+PGcKICAgICBjbGlwLXBhdGg9InVybCgjY2xpcDBfNzMwXzI3MTM2KSIKICAgICBpZD0iZzIiCiAgICAgdHJhbnNmb3JtPSJtYXRyaXgoMC4zNTk2OTgwNSwwLDAsMC4zNTk2OTgwNSwxMS4wNDMyNzYsOS41ODI5MTcxKSI+PHBhdGgKICAgICAgIGQ9Ik0gNDEuNDM5NSw2OS4zODQ4IEMgMjguODA2Niw2Ny44NTM1IDE5LjkwNjIsNTguNzYxNyAxOS45MDYyLDQ2Ljk5MDIgYyAwLC00Ljc4NTEgMS43MjI3LC05Ljk1MzEgNC41OTM4LC0xMy4zOTg0IC0xLjI0NDEsLTMuMTU4MiAtMS4wNTI3LC05Ljg1NzQgMC4zODI4LC0xMi42MzI4IDMuODI4MSwtMC40Nzg1IDguOTk2MSwxLjUzMTIgMTIuMDU4Niw0LjMwNjYgMy42MzY3LC0xLjE0ODQgNy40NjQ4LC0xLjcyMjYgMTIuMTU0MywtMS43MjI2IDQuNjg5NSwwIDguNTE3NiwwLjU3NDIgMTEuOTYyOSwxLjYyNjkgMi45NjY4LC0yLjY3OTcgOC4yMzA1LC00LjY4OTQgMTIuMDU4NiwtNC4yMTA5IDEuMzM5OCwyLjU4NCAxLjUzMTIsOS4yODMyIDAuMjg3MSwxMi41MzcxIDMuMDYyNSwzLjYzNjcgNC42ODk0LDguNTE3NiA0LjY4OTQsMTMuNDk0MSAwLDExLjc3MTUgLTguOTAwMywyMC42NzE5IC0yMS43MjQ2LDIyLjI5ODkgMy4yNTM5LDIuMTA1NCA1LjQ1NTEsNi42OTkyIDUuNDU1MSwxMS45NjI5IHYgOS45NTMxIGMgMCwyLjg3MTEgMi4zOTI2LDQuNDk4IDUuMjYzNywzLjM0OTYgQyA4NC40MTAyLDg3Ljk1MTIgOTgsNzAuNjI4OSA5OCw0OS4xOTE0IDk4LDIyLjEwNzQgNzUuOTg4Myw2LjY5NTM5ZS03IDQ4LjkwNDMsNC4zMDllLTcgMjEuODIwMywxLjkyMjYxZS03IC0xLjk0NzllLTcsMjIuMTA3NCAtNC4zMzQzZS03LDQ5LjE5MTQgLTYuMjA2MzFlLTcsNzAuNDM3NSAxMy40OTQxLDg4LjA0NjkgMzEuNjc3Nyw5NC42NTA0IGMgMi41ODQsMC45NTcgNS4wNzIzLC0wLjc2NTYgNS4wNzIzLC0zLjM0OTYgdiAtNy42NTYzIGMgLTEuMzM5OCwwLjU3NDMgLTMuMDYyNSwwLjk1NzEgLTQuNTkzOCwwLjk1NzEgLTYuMzE2NCwwIC0xMC4wNDg4LC0zLjQ0NTMgLTEyLjcyODUsLTkuODU3NSAtMS4wNTI3LC0yLjU4MzkgLTIuMjAxMSwtNC4xMTUyIC00LjQwMjMsLTQuNDAyMyAtMS4xNDg0LC0wLjA5NTcgLTEuNTMxMywtMC41NzQyIC0xLjUzMTMsLTEuMTQ4NCAwLC0xLjE0ODUgMS45MTQxLC0yLjAwOTggMy44MjgyLC0yLjAwOTggMi43NzU0LDAgNS4xNjc5LDEuNzIyNyA3LjY1NjIsNS4yNjM3IDEuOTE0MSwyLjc3NTQgMy45MjM4LDQuMDE5NSA2LjMxNjQsNC4wMTk1IDIuMzkyNiwwIDMuOTIzOCwtMC44NjEzIDYuMTI1LC0zLjA2MjUgMS42MjcsLTEuNjI3IDIuODcxMSwtMy4wNjI1IDQuMDE5NiwtNC4wMTk1IHoiCiAgICAgICBmaWxsPSIjZmZmZmZmIgogICAgICAgaWQ9InBhdGgxLTgiIC8+PC9nPjxwYXRoCiAgICAgaWQ9InBhdGgxMyIKICAgICBkPSJtMTczLjMzIDFlLTNoLTE2Ni42NmMtMy42NjY2IDAtNi42NjY1IDIuOTk5OS02LjY2NjUgNi42NjY1djM5Ljk5OWMwIDMuNjY2NiAyLjk5OTkgNi42NjY1IDYuNjY2NSA2LjY2NjVoMTY2LjY2YzMuNjY2NiAwIDYuNjY2NS0yLjk5OTkgNi42NjY1LTYuNjY2NXYtMzkuOTk5YzAtMy42NjY2LTIuOTk5OS02LjY2NjUtNi42NjY1LTYuNjY2NXptMCAxLjA2NjFjMy4wODc5IDAgNS41OTk5IDIuNTEyNSA1LjU5OTkgNS42MDA0djM5Ljk5OWMwIDMuMDg3OS0yLjUxMTkgNS42MDA0LTUuNTk5OSA1LjYwMDRoLTE2Ni42NmMtMy4wODc5IDAtNS41OTkzLTIuNTEyNS01LjU5OTMtNS42MDA0di0zOS45OTljMC0zLjA4NzkgMi41MTE0LTUuNjAwNCA1LjU5OTMtNS42MDA0aDE2Ni42NiIKICAgICBmaWxsPSIjYTJhMmExIgogICAgIHN0cm9rZS13aWR0aD0iLjEzMzMzIiAvPjx0ZXh0CiAgICAgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIKICAgICBzdHlsZT0iZm9udC1zdHlsZTpub3JtYWw7Zm9udC12YXJpYW50Om5vcm1hbDtmb250LXdlaWdodDpib2xkO2ZvbnQtc3RyZXRjaDpub3JtYWw7Zm9udC1zaXplOjExLjUwNTVweDtmb250LWZhbWlseTonR29vZ2xlIFNhbnMnOy1pbmtzY2FwZS1mb250LXNwZWNpZmljYXRpb246J0dvb2dsZSBTYW5zIEJvbGQnO3RleHQtYWxpZ246c3RhcnQ7d3JpdGluZy1tb2RlOmxyLXRiO2RpcmVjdGlvbjpsdHI7dGV4dC1hbmNob3I6c3RhcnQ7ZmlsbDojMDAwMDAwO3N0cm9rZS13aWR0aDowLjk1ODc5IgogICAgIHg9IjU2Ljc2NDMzOSIKICAgICB5PSIyMC43ODI2NzMiCiAgICAgaWQ9InRleHQxIgogICAgIHRyYW5zZm9ybT0ic2NhbGUoMC45NTg3ODk4NywxLjA0Mjk4MTQpIj48dHNwYW4KICAgICAgIHNvZGlwb2RpOnJvbGU9ImxpbmUiCiAgICAgICBpZD0idHNwYW4xIgogICAgICAgeD0iNTYuNzY0MzM5IgogICAgICAgeT0iMjAuNzgyNjczIgogICAgICAgc3R5bGU9ImZpbGw6I2Y5ZjlmOTtzdHJva2Utd2lkdGg6MC45NTg3OSI+U09VUkNFIENPREUgT048L3RzcGFuPjwvdGV4dD48cGF0aAogICAgIGQ9Ik0gNzIuNDA3Mzg3LDQyLjAyMTQzMSBWIDI5Ljc4OTU4NyBoIDMuNDM4NjY4IHYgMTIuMjMxODQ0IHogbSAxMC4xMDU2NjcsMCBjIC0yLjI4NTE0NywwIC0zLjE3NzY1NSwtMC45Nzk0MjIgLTMuMTc3NjU1LC0zLjA0NzA3NSB2IC02LjMxMTgxNyBoIC0yLjE3NjQxMiB2IC0yLjg3Mjk1MiBoIDIuMTc2NDEyIHYgLTIuNDM3NjcgbCAzLjQzODkxMiwtMC44MDUzIHYgMy4yNDI5NyBoIDIuNTQ2NDAyIHYgMi44NzI5NTIgaCAtMi41NDY0MDIgdiA1LjU1MDAzNSBjIDAsMC42NzQ3MiAwLjMwNDgwMSwwLjkzNTkwNCAwLjk3OTM0OSwwLjkzNTkwNCBoIDEuNTY3MDUzIHYgMi44NzI5NTMgeiBtIDIzLjk3NDIzNiwwLjIxNzY0MSBjIC0yLjY3NzA0LDAgLTQuMTM1MzYsLTEuNDc5OTk1IC00LjEzNTM2LC00LjE3ODg0OSB2IC04LjI3MDYzNiBoIDMuNDYwODEgdiA3LjM1NjUyOCBjIDAsMS41MDE3NjcgMC42NzQ1NSwyLjMyODgzNyAxLjk1ODcsMi4zMjg4MzcgMS40Nzk5NywwIDIuNjExODQsLTEuMzcxMTg2IDIuNjExODQsLTMuMjQyOTY5IHYgLTYuNDQyMzk2IGggMy40NjA1NiB2IDEyLjIzMTg0NCBoIC0zLjQ2MDU2IHYgLTIuMDY3NjUzIGMgLTAuNjUyOSwxLjMyNzY0NCAtMi4yMTk5NSwyLjI4NTI5NCAtMy44OTU5OSwyLjI4NTI5NCB6IG0gMTYuNTE3NTUsMCBjIC0xLjY2ODE2LDAgLTMuMTkxNjgsLTAuOTU3NjUgLTMuOTE3ODgsLTIuMzI4ODM3IHYgMi4xMTExOTYgaCAtMy40Mzg2NyBWIDI0Ljk1Nzc4OSBoIDMuNDYwNTcgdiA3LjA3MzU3NCBjIDAuNzA0MywtMS40ODAwMiAyLjI5MzI2LC0yLjUyNDczMiAzLjg5NTk4LC0yLjUyNDczMiAzLjMzNzgxLDAgNS4xMDA5NCwyLjMwNzA5IDQuOTg0MDgsNi4zNzcxMDYgMC4xMTY4Niw0LjAyNjQ5OCAtMS43MTE0Niw2LjM1NTMzNSAtNC45ODQwOCw2LjM1NTMzNSB6IG0gLTEuMjE4OTUsLTIuODk0NzI0IGMgMS43OTI2NCwwIDIuNzcxOTksLTEuMzI3NjQzIDIuNjU1MzksLTMuNDYwNjExIDAuMTE2NiwtMi4xNTQ3MTQgLTAuODYyNzUsLTMuNDgyMzgyIC0yLjY1NTM5LC0zLjQ4MjM4MiAtMS40Mjg1NiwwIC0yLjU2MDE5LDEuMzkyOTU4IC0yLjY3NzAzLDMuMzA4MjYgdiAwLjE5NTg5NCBjIDAuMTE2ODQsMS45ODA1OTEgMS4yNDg0NywzLjQzODgzOSAyLjY3NzAzLDMuNDM4ODM5IHogTSA5Ni45NTgwMTIsMjQuOTU3Nzg5IHYgNi45MjEyMjIgaCAtNi40ODU5MzkgdiAtNi45MjEyMjIgaCAtMy42OTk5MjcgdiAxNy4wNjM2NDIgaCAzLjY5OTkyNyBWIDM1LjE4NzI3IGggNi40ODU5MzkgdiA2LjgzNDE2MSBoIDMuNzAwMTY4IFYgMjQuOTU3Nzg5IFogTSA2Mi45ODMxNTYsNDIuMzQ3OTA1IGMgLTUuMDQ5NTEyLDAgLTguMjI3MTY3LC0zLjQ2MDYxMSAtOC4yMjcxNjcsLTguODgwMDY2IDAsLTUuNDE5NDU2IDMuMjQzMDkzLC04LjgzNjUyNCA4LjM3OTQ0NSwtOC44MzY1MjQgNC4xNzg4OTgsMCA2LjcwMzY1NCwxLjc4NDY5OCA3LjUwODgzMSw0Ljc4ODI1NSBsIC0zLjc0MzQ2OSwwLjg5MjM2IGMgLTAuNDU3MDc4LC0xLjYzMjM3IC0xLjc2Mjg3NiwtMi41MjQ3MzEgLTMuNzY1MzYyLC0yLjUyNDczMSAtMi45ODE4MzUsMCAtNC41OTI0MzQsMS45NTg4NDQgLTQuNTkyNDM0LDUuNjgwNjQgMCwzLjcyMTc5NSAxLjU2NzA1Niw1LjcyNDE1OCA0LjUwNTM0OCw1LjcyNDE1OCAyLjY5ODkyOCwwIDQuMzA5NTI3LC0xLjY1NDExOCA0LjMwOTUyNywtNC40NjE4MDUgdiAtMC42NTI5MjMgbCAwLjk1NzcsMS4zMjc2NDMgaCAtNS41NzE3ODIgdiAtMy4xMzQxMzcgaCA4LjM1NzU1IHYgMS45ODA1OTIgYyAwLDUuMjAxODE0IC0zLjAyNTEzMSw4LjA5NjUzOCAtOC4xMTgxODcsOC4wOTY1MzggeiBNIDc0LjEyNjcyMSwyOC42MzYwNDIgYyAxLjE1MzUyLDAgMi4wNDYwMjksLTAuODkyMzYxIDIuMDQ2MDI5LC0yLjA0NTkwNyAwLC0xLjE1MzUyIC0wLjg5MjUwOSwtMi4wNDU4ODEgLTIuMDQ2MDI5LC0yLjA0NTg4MSAtMS4xNTM1MjEsMCAtMi4wNDU3ODMsMC44OTIzNjEgLTIuMDQ1NzgzLDIuMDQ1ODgxIDAsMS4xNTM1NDYgMC44OTIyNjIsMi4wNDU5MDcgMi4wNDU3ODMsMi4wNDU5MDcgeiIKICAgICBmaWxsPSIjZmZmZmZmIgogICAgIGlkPSJwYXRoMiIKICAgICBzdHlsZT0ic3Ryb2tlLXdpZHRoOjAuMjQ2MDA2IiAvPjwvc3ZnPgo=" 
                />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { Github, Copy, CheckCircle, AlertCircle } from 'lucide-react';

type CardType = 'repository' | 'issue' | 'pull-request' | 'discussion' | 'release';

interface FormData {
  type: CardType;
  user: string;
  repo: string;
  num?: number;
  tag?: string;
}

interface CodeData {
  url: string;
  markdown: string;
  rst: string;
  asciidoc: string;
  html: string;
}

function App() {
  const [formData, setFormData] = useState<FormData>({
    type: 'repository',
    user: '',
    repo: '',
    num: '',
    tag: ''
  });
  
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [redirectUrl, setRedirectUrl] = useState<string>('');
  const [codeData, setCodeData] = useState<CodeData>({ url: '', markdown: '', html: '' });
  const [error, setError] = useState<string>('');
  const [imageLoaded, setImageLoaded] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<string>('');

  const cardTypes = [
    { id: 'repository', label: 'Repository', icon: '📁' },
    { id: 'issue', label: 'Issue', icon: '🐛' },
    { id: 'pull-request', label: 'Pull Request', icon: '🔄' },
    { id: 'discussion', label: 'Discussion', icon: '💬' },
    { id: 'release', label: 'Release', icon: '🚀' }
  ];

  const generateUrls = () => {
    const { type, user, repo, num, tag } = formData;
    
    if (!user || !repo) {
      setError('User and repository are required');
      return;
    }

    if ((type === 'issue' || type === 'pull-request' || type === 'discussion') && !num) {
      setError('Number is required for this type');
      return;
    }

    if (type === 'release' && !tag) {
      setError('Tag is required for releases');
      return;
    }

    setError('');
    
    let imageUrl = '';
    let githubUrl = '';

    switch (type) {
      case 'repository':
        imageUrl = `https://opengraph.githubassets.com/54c6dafcd9f93d895328fdc57409345555ea517c7c4d4ad9b75d0a4208404735/${user}/${repo}`;
        githubUrl = `https://github.com/${user}/${repo}`;
        break;
      case 'issue':
        imageUrl = `https://opengraph.githubassets.com/b6a06c2c07355775735f11a24ef1d78d281fed7ede1bb44404de8b132b2ef3a2/${user}/${repo}/issues/${num}`;
        githubUrl = `https://github.com/${user}/${repo}/issues/${num}`;
        break;
      case 'pull-request':
        imageUrl = `https://opengraph.githubassets.com/b6a06c2c07355775735f11a24ef1d78d281fed7ede1bb44404de8b132b2ef3a2/${user}/${repo}/pull/${num}`;
        githubUrl = `https://github.com/${user}/${repo}/pull/${num}`;
        break;
      case 'discussion':
        imageUrl = `https://opengraph.githubassets.com/b615556068ae0a4eac8cdf43913fe90633b0ffb071313f8cbfb13265f1e9e52c/${user}/${repo}/discussions/${num}`;
        githubUrl = `https://github.com/${user}/${repo}/discussions/${num}`;
        break;
      case 'release':
        imageUrl = `https://opengraph.githubassets.com/b615556068ae0a4eac8cdf43913fe90633b0ffb071313f8cbfb13265f1e9e52c/${user}/${repo}/releases/tag/${tag}`;
        githubUrl = `https://github.com/${user}/${repo}/releases/tag/${tag}`;
        break;
    }

    setPreviewUrl(imageUrl);
    setRedirectUrl(githubUrl);
    setImageLoaded(false);

    // Generate code data
    const markdown = `[![GitHub Card](${imageUrl})](${githubUrl})`;
    const rst = `.. image:: ${imageUrl}
   :alt: GitHub Card
   :target: ${githubUrl}`;
    const asciidoc = `image:${imageUrl}[GitHub Card,link="${githubUrl}"]`;
    const html = `<a href="${githubUrl}" target="_blank"><img src="${imageUrl}" alt="GitHub Card" /></a>`;
    
    setCodeData({
      url: imageUrl,
      markdown,
      rst,
      asciidoc,
      html
    });
  };

  useEffect(() => {
    if (formData.user && formData.repo) {
      generateUrls();
    }
  }, [formData]);

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
    setError('Failed to load image. Please check if the repository/issue/PR exists.');
    setImageLoaded(false);
  };

  const handleImageLoad = () => {
    setImageLoaded(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Github className="w-8 h-8 text-lime-400" />
            <h1 className="text-4xl font-bold text-lime-400 bg-clip-text">
              GitHub Card Creator
            </h1>
          </div>
          <p className="text-gray-400 text-lg">
            Generate official GitHub cards for Repos, Issues, PRs, Discussions & Releases.
          </p>
        </header>

        <div className="max-w-4xl mx-auto">
          {/* Form Section */}
          <div className="bg-gray-800 rounded-2xl p-8 mb-8 shadow-xl">
            <h2 className="text-2xl font-semibold mb-6 text-lime-400">Configure Your Card</h2>
            
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
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  value={formData.user}
                  onChange={(e) => handleInputChange('user', e.target.value)}
                  placeholder="e.g., octocat"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Repository Name
                </label>
                <input
                  type="text"
                  value={formData.repo}
                  onChange={(e) => handleInputChange('repo', e.target.value)}
                  placeholder="e.g., Hello-World"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                />
              </div>

              {(formData.type === 'issue' || formData.type === 'pull-request' || formData.type === 'discussion') && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    {formData.type === 'issue' ? 'Issue Number' : 
                     formData.type === 'pull-request' ? 'Pull Request Number' : 'Discussion Number'}
                  </label>
                  <input
                    type="number"
                    value={formData.num}
                    onChange={(e) => handleInputChange('num', e.target.value)}
                    placeholder="e.g., 1"
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
                    placeholder="e.g., 1.0.0"
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20 transition-all duration-200"
                  />
                </div>
              )}
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
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Preview</h2>
              
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
              </div>
            </div>
          )}

          {/* Code Section */}
          {previewUrl && imageLoaded && (
            <div className="bg-gray-800 rounded-2xl p-8 shadow-xl">
              <h2 className="text-2xl font-semibold mb-6 text-lime-400">Generated Code</h2>
              
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
                  <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
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
          <p>By &nbsp;
            <a href="https://github.com/MYTAditya" target="dev">
              Mastered YT Aditya
            </a>
            .
          </p>
          <div align='center'>
            <a href="https://github.com/MYTAditya/GitHub-Card-Creator" target="source">
              <img src="data:image/png;base64,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" alt="source" width="250" 
                />
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;

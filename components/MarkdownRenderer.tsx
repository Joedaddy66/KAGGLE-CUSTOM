// components/MarkdownRenderer.tsx
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Basic markdown rendering. For a production app, a library like 'react-markdown' would be used.
const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className }) => {
  const renderContent = () => {
    // Replace code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let htmlContent = content.replace(codeBlockRegex, (match, lang, code) => {
      const language = lang || 'text'; // Default to 'text' if no language specified
      return `<pre class="bg-gray-800 text-white p-3 rounded-md overflow-x-auto my-2 text-sm"><code class="language-${language}">${code.trim()}</code></pre>`;
    });

    // Basic replacements for bold and italics
    htmlContent = htmlContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    htmlContent = htmlContent.replace(/\*(.*?)\*/g, '<em>$1</em>');
    htmlContent = htmlContent.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>');
    htmlContent = htmlContent.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold my-2">$1</h1>');
    htmlContent = htmlContent.replace(/^## (.*$)/gim, '<h2 class="text-xl font-semibold my-2">$1</h2>');
    htmlContent = htmlContent.replace(/^### (.*$)/gim, '<h3 class="text-lg font-medium my-2">$1</h3>');
    htmlContent = htmlContent.replace(/^\* (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    htmlContent = htmlContent.replace(/^- (.*$)/gim, '<li class="ml-4 list-disc">$1</li>');
    htmlContent = htmlContent.replace(/(\n){2,}/g, '</p><p>'); // Multiple newlines to paragraphs
    htmlContent = `<p>${htmlContent}</p>`; // Wrap in initial paragraph

    return <div dangerouslySetInnerHTML={{ __html: htmlContent }} />;
  };

  return (
    <div className={`prose max-w-none ${className}`}>
      {renderContent()}
    </div>
  );
};

export default MarkdownRenderer;

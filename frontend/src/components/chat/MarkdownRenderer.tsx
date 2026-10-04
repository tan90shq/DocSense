import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, Terminal, ExternalLink } from "lucide-react";

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock: React.FC<CodeBlockProps> = ({ language, code }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-3 rounded-lg overflow-hidden border border-nexus-border/80 bg-[#0a0c12] shadow-sm select-text">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#121622] border-b border-nexus-border/60 text-[10px] font-mono text-nexus-muted select-none">
        <div className="flex items-center space-x-1.5 text-nexus-cyan">
          <Terminal className="w-3 h-3 text-nexus-cyan" />
          <span className="uppercase tracking-wider font-semibold font-mono text-[10px]">
            {language || "CODE"}
          </span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 px-2 py-0.5 rounded hover:bg-nexus-card text-nexus-muted hover:text-white transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-nexus-emerald" />
              <span className="text-nexus-emerald text-[10px] font-mono">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="text-[10px] font-mono">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-3 overflow-x-auto text-[11.5px] font-mono leading-relaxed text-slate-200">
        <pre className="m-0 p-0 font-mono">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = "" }) => {
  return (
    <div className={`docsense-markdown text-xs leading-relaxed text-nexus-text ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-base font-bold text-white mt-4 mb-2 pb-1.5 border-b border-nexus-border/70 flex items-center gap-2">
              <span className="w-1.5 h-3.5 bg-nexus-cyan rounded-sm inline-block flex-shrink-0" />
              <span>{children}</span>
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold text-nexus-cyan-bright mt-3.5 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-nexus-cyan rounded-full inline-block flex-shrink-0" />
              <span>{children}</span>
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-semibold text-nexus-violet-bright mt-3 mb-1 uppercase tracking-wider font-mono">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs font-medium text-white/90 mt-2 mb-1">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-xs font-medium text-nexus-muted mt-1.5 mb-0.5">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-[11px] font-medium text-nexus-muted/80 uppercase tracking-wide mt-1.5 mb-0.5">
              {children}
            </h6>
          ),

          // Paragraphs & Text
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-nexus-text first:mt-0 last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold text-white">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-200">
              {children}
            </em>
          ),
          del: ({ children }) => (
            <del className="line-through text-nexus-muted">
              {children}
            </del>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1.5 text-nexus-text marker:text-nexus-cyan">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1.5 text-nexus-text marker:text-nexus-violet-bright font-normal">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed pl-0.5">
              {children}
            </li>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-nexus-cyan bg-nexus-cyan/5 rounded-r-md px-3.5 py-2 my-2.5 italic text-slate-200 text-xs leading-relaxed">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr className="border-0 h-px bg-gradient-to-r from-transparent via-nexus-border to-transparent my-3.5" />
          ),

          // Links
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-nexus-cyan hover:text-nexus-cyan-bright underline decoration-nexus-cyan/40 hover:decoration-nexus-cyan transition-colors inline-flex items-center gap-0.5"
            >
              <span>{children}</span>
              <ExternalLink className="w-2.5 h-2.5 inline-block opacity-70" />
            </a>
          ),

          // Tables (GFM)
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-lg border border-nexus-border bg-nexus-card/40 shadow-inner">
              <table className="w-full text-left border-collapse text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#121622] border-b border-nexus-border text-[11px] font-mono text-nexus-cyan uppercase tracking-wider font-semibold">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-nexus-border/40">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-nexus-card/50 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 text-nexus-cyan font-mono font-medium text-[11px] whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 text-nexus-text leading-relaxed align-top">
              {children}
            </td>
          ),

          // Code blocks & inline code
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const codeString = String(children).replace(/\n$/, "");
            const isMultiLine = codeString.includes("\n");
            const isCodeBlock = match || isMultiLine;

            if (isCodeBlock) {
              return (
                <CodeBlock
                  language={match ? match[1] : ""}
                  code={codeString}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-nexus-card border border-nexus-border text-nexus-cyan font-mono text-[11px] font-medium selection:bg-nexus-cyan/20"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Task lists / Checkboxes
          input: ({ type, checked, disabled }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  readOnly
                  className="rounded border-nexus-border bg-nexus-card text-nexus-cyan mr-1.5 align-middle accent-cyan-500 cursor-default"
                />
              );
            }
            return <input type={type} checked={checked} disabled={disabled} />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

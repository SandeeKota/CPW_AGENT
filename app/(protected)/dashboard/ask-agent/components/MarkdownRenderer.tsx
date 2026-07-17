"use client";

import React, { useEffect, useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import { FileText, Download, Copy, Check, RefreshCw, BarChart2, PieChart as PieChartIcon } from "lucide-react";
import { generateAgentReport } from "@/app/_services/agent.service";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  onSendMessage?: (content: string) => void;
  messageCreatedAt?: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

const CodeBlock = ({ node, inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || "");
  const [copied, setCopied] = useState(false);
  const codeString = String(children).replace(/\n$/, "");

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!inline && match && (match[1] === "chart" || match[1] === "json")) {
    try {
      const parsedData = JSON.parse(codeString);
      if (parsedData.type === "bar" || parsedData.type === "pie") {
        return (
          <div className="w-full my-6 p-6 bg-white border border-gray-100 rounded-xl shadow-sm not-prose">
            <div className="flex items-center gap-2 mb-6">
              {parsedData.type === "bar" ? <BarChart2 className="text-blue-500" size={20} /> : <PieChartIcon className="text-purple-500" size={20} />}
              <h3 className="text-sm font-semibold text-gray-800">{parsedData.title || "Data Chart"}</h3>
            </div>
            <div className="w-full h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                {parsedData.type === "bar" ? (
                  <BarChart data={parsedData.data} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6b7280" }} dx={-10} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                      cursor={{ fill: '#f9fafb' }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                ) : (
                  <PieChart>
                    <Pie
                      data={parsedData.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {parsedData.data.map((entry: any, index: number) => (
                        <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  </PieChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    } catch (e) {
      // Not a chart JSON, fallback to standard code block
    }
  }

  if (!inline && match) {
    return (
      <div className="relative group rounded-lg bg-gray-900 my-4 overflow-hidden shadow-md">
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800/80 border-b border-gray-700">
          <span className="text-xs font-mono text-gray-400">{match[1]}</span>
          <button
            onClick={handleCopy}
            className="text-gray-400 hover:text-white transition-colors"
            title="Copy code"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
          </button>
        </div>
        <pre className="p-4 overflow-x-auto text-sm text-gray-100 font-mono">
          <code className={className} {...props}>
            {children}
          </code>
        </pre>
      </div>
    );
  }

  return (
    <code className="bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
      {children}
    </code>
  );
};

const MarkdownRenderer = ({ content, isStreaming, onSendMessage, messageCreatedAt }: MarkdownRendererProps) => {
  const [displayedContent, setDisplayedContent] = useState("");
  const contentRef = useRef(content);
  const isStreamingRef = useRef(isStreaming);

  useEffect(() => {
    contentRef.current = content;
    isStreamingRef.current = isStreaming;
  }, [content, isStreaming]);

  useEffect(() => {
    if (!isStreaming) {
      setDisplayedContent(content);
      return;
    }

    let i = displayedContent.length;
    const interval = setInterval(() => {
      const target = contentRef.current;
      if (i < target.length) {
        // Fast forward 2 chars at a time to catch up if behind, else 1
        const step = target.length - i > 10 ? 3 : 1;
        i = Math.min(i + step, target.length);
        setDisplayedContent(target.slice(0, i));
      } else if (!isStreamingRef.current) {
        clearInterval(interval);
      }
    }, 15); // Smooth typing feel

    return () => clearInterval(interval);
  }, [isStreaming]); // only re-run on streaming state change

  const { processedContent, isLinkLoading } = React.useMemo(() => {
    const raw = isStreaming ? displayedContent : content;
    if (!raw) return { processedContent: "", isLinkLoading: false };

    let cleanRaw = raw;
    let linkLoading = false;

    // Detect if there's an incomplete markdown link structure to reports at the end of the text
    const lastOpenBracket = raw.lastIndexOf("[");
    const lastCloseParenthesis = raw.lastIndexOf(")");

    if (lastOpenBracket > lastCloseParenthesis) {
      const potentialLink = raw.substring(lastOpenBracket);
      if (potentialLink.includes("/agent/reports/generate")) {
        linkLoading = true;
        cleanRaw = raw.substring(0, lastOpenBracket);
      }
    }

    // Regular expression to identify /agent/reports/generate links and dynamically URL-encode their raw data payloads if they are not encoded.
    const repaired = cleanRaw.replace(/\[([^\]]+)\]\((\/agent\/reports\/generate\?format=[a-z]+&data=)([^\)]+)\)/g, (match, label, prefix, dataVal) => {
      try {
        if (!dataVal.startsWith("%")) {
          const decoded = decodeURIComponent(dataVal);
          let jsonParsed;
          try {
            jsonParsed = JSON.parse(decoded);
          } catch {
            jsonParsed = JSON.parse(dataVal);
          }
          const cleanEncoded = encodeURIComponent(JSON.stringify(jsonParsed));
          return `[${label}](${prefix}${cleanEncoded})`;
        }
      } catch (e) {
        try {
          return `[${label}](${prefix}${encodeURIComponent(dataVal)})`;
        } catch {
          return match;
        }
      }
      return match;
    });

    return { processedContent: repaired, isLinkLoading: linkLoading };
  }, [content, displayedContent, isStreaming]);

  // Add the cursor character to the displayed content if streaming
  const renderContent = isStreaming ? processedContent + "▍" : processedContent;

  return (
    <div className="prose prose-sm max-w-none prose-headings:text-gray-900 prose-headings:font-semibold prose-p:text-gray-700 prose-p:leading-relaxed prose-strong:text-gray-900 prose-ul:list-disc prose-ol:list-decimal prose-li:text-gray-700 text-sm">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          code: CodeBlock,
          a: ({ node, href, children, ...props }) => {
            const isPdf = href ? (
              href.toLowerCase().split('?')[0].endsWith(".pdf") || 
              href.startsWith("data:application/pdf")
            ) : false;

            const isReportLink = href ? href.startsWith("/agent/reports/generate") : false;
            const isS3ReportLink = href ? href.includes(".s3.") && href.includes("amazonaws.com") && href.includes(".csv") : false;

            if (isS3ReportLink && href) {
              const isExpired = messageCreatedAt ? (Date.now() - messageCreatedAt > 2 * 60 * 1000) : false;
              if (isExpired) {
                return (
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      onSendMessage?.("Please regenerate the previous report.");
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors text-sm font-medium not-prose"
                  >
                    <RefreshCw size={16} />
                    Report Expired (Regenerate)
                  </button>
                );
              } else {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors text-sm font-medium not-prose no-underline"
                  >
                    <Download size={16} />
                    {children || "Download Report"} (Expires in 2 mins)
                  </a>
                );
              }
            }

            if (isReportLink && href) {
              return <ReportButton href={href} label={String(children || "Generate Report")} />;
            }

            if (isPdf) {
              const filename = href ? href.substring(href.lastIndexOf("/") + 1).split("?")[0] : "document.pdf";
              return (
                <span className="block my-2 not-prose">
                  {children && <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{children}</span>}
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all group w-full max-w-sm decoration-transparent"
                  >
                    <span className="p-2 bg-red-50 text-red-500 rounded-lg group-hover:bg-red-100 transition-colors block">
                      <FileText size={20} />
                    </span>
                    <span className="flex-1 min-w-0 block">
                      <span className="text-sm font-semibold text-gray-800 truncate block">{filename}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium block">PDF Document</span>
                    </span>
                    <Download size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors block shrink-0" />
                  </a>
                </span>
              );
            }
            return (
              <a href={href} className="text-blue-600 no-underline hover:underline font-medium" target="_blank" rel="noopener noreferrer" {...props}>
                {children}
              </a>
            );
          },
          img: ({ node, src, alt, ...props }) => {
            return (
              <span className="block my-6 rounded-xl overflow-hidden border border-gray-100 shadow-sm bg-gray-50 flex flex-col">
                <img src={src} alt={alt} className="w-full max-h-[400px] object-contain m-0" loading="lazy" />
                {alt && <span className="block px-4 py-2 bg-white border-t border-gray-100 text-xs text-gray-500 text-center">{alt}</span>}
              </span>
            );
          },
          li: ({ node, children, ...props }) => {
            const childrenArray = React.Children.toArray(children);

            // 2. Detect if it is a detail list item with a **Key**: Value shape
            const firstChild = childrenArray[0] as any;
            const isStrongKey = firstChild && (firstChild.type === "strong" || firstChild.props?.node?.tagName === "strong");

            if (isStrongKey) {
              const keyText = String(firstChild.props?.children || firstChild.props?.node?.children?.[0]?.value || "").trim();
              
              // Highlight properties based on name
              const isAmount = keyText.toLowerCase().includes("amount") || 
                               keyText.toLowerCase().includes("raised") || 
                               keyText.toLowerCase().includes("cost");
              const isStatus = keyText.toLowerCase().includes("status");

              // Clean value (slice strong child and remove leading colons/whitespace)
              const rawValue = childrenArray.slice(1);
              const cleanedValue = rawValue.map((child: any) => {
                if (typeof child === "string") {
                  return child.replace(/^\s*:\s*/, "");
                }
                return child;
              });

              return (
                <span className="flex items-start py-1.5 border-b border-gray-50/50 last:border-0 text-sm not-prose">
                  <span className="text-gray-400 font-medium w-32 shrink-0 select-none block">{keyText}</span>
                  <span className={`flex-1 font-semibold block ${
                    isAmount ? "text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md text-xs font-bold w-fit" :
                    isStatus ? "text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md text-xs font-bold w-fit" :
                    "text-gray-700"
                  }`}>
                    {cleanedValue}
                  </span>
                </span>
              );
            }

            // 3. Fallback standard list item (simple lists)
            return (
              <li className="text-gray-600 my-1 list-disc ml-4" {...props}>
                {children}
              </li>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full text-left text-sm m-0 border-collapse" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-gray-50/80 text-gray-600 font-medium border-b border-gray-200" {...props} />
          ),
          th: ({ node, ...props }) => <th className="px-4 py-3 border-b-0 whitespace-nowrap" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-3 border-t border-gray-100" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-gray-50/50 transition-colors" {...props} />
        }}
      >
        {renderContent}
      </ReactMarkdown>
      {isLinkLoading && (
        <div className="mt-3 p-3.5 rounded-xl border border-blue-100 bg-blue-50/20 flex items-center gap-3 animate-pulse max-w-sm not-prose">
          <RefreshCw className="animate-spin text-blue-500 shrink-0" size={16} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold text-blue-900 tracking-tight">Compiling Report Document...</div>
            <div className="text-[10px] text-blue-600/80 font-medium mt-0.5">Structuring metadata and formatting tables</div>
          </div>
        </div>
      )}
    </div>
  );
};

const ReportButton = ({ href, label }: { href: string; label: string }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Parse parameters from href. Since href is relative, resolve it with window.location.origin
      const url = new URL(href, window.location.origin);
      const format = url.searchParams.get("format") || "pdf";
      const dataStr = url.searchParams.get("data");

      let blob;
      let filename = "Report";

      if (dataStr) {
        let parsedData;
        try {
          parsedData = JSON.parse(dataStr);
        } catch (e) {
          parsedData = JSON.parse(decodeURIComponent(dataStr));
        }
        filename = parsedData.title || "Report";
        blob = await generateAgentReport({ format, data: parsedData });
      } else {
        const entity = url.searchParams.get("entity") || "donations";
        const filtersStr = url.searchParams.get("filters") || "{}";
        filename = url.searchParams.get("title") || "Report";
        const filters = JSON.parse(filtersStr);
        blob = await generateAgentReport({ format, entity, filters, title: filename });
      }

      const blobUrl = URL.createObjectURL(blob);

      if (format === "pdf") {
        // Open PDF preview in a new window/tab
        window.open(blobUrl, "_blank");
      } else {
        // Trigger Excel file download
        const link = document.createElement("a");
        link.href = blobUrl;
        link.setAttribute("download", `${filename}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (err: any) {
      console.error("Report generation failed:", err);
      setError(err.message || "Failed to generate report");
    } finally {
      setLoading(false);
    }
  };

  const isPdf = href.includes("format=pdf");

  return (
    <span className="block my-2 not-prose">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`inline-flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md hover:border-blue-300 transition-all group w-full max-w-sm text-left disabled:opacity-75 disabled:cursor-wait ${
          loading ? "bg-gray-50/40" : ""
        }`}
      >
        <span className={`p-2 rounded-lg transition-colors block ${
          isPdf ? "bg-red-50 text-red-500 group-hover:bg-red-100" : "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100"
        }`}>
          {loading ? (
            <RefreshCw className="animate-spin text-blue-600" size={20} />
          ) : (
            <FileText size={20} />
          )}
        </span>
        <span className="flex-1 min-w-0 block">
          <span className="text-sm font-semibold text-gray-800 truncate block">{label}</span>
          <span className="text-[10px] text-gray-500 uppercase tracking-wider font-medium block font-sans">
            {loading
              ? (isPdf ? "Generating PDF Preview..." : "Compiling Excel Sheet...")
              : (isPdf ? "PDF Document — View Preview" : "Excel Spreadsheet — Download")}
          </span>
        </span>
        {loading ? (
          <RefreshCw className="animate-spin text-blue-500 block shrink-0" size={16} />
        ) : (
          <Download size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors block shrink-0" />
        )}
      </button>
      {error && (
        <span className="text-xs text-red-500 mt-1 block px-1 font-sans">{error}</span>
      )}
    </span>
  );
};

export default MarkdownRenderer;

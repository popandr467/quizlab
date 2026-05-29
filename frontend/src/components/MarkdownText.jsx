import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

const allowedElements = [
  "p",
  "br",
  "strong",
  "em",
  "del",
  "code",
  "pre",
  "blockquote",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tr",
  "th",
  "td",
];

function safeUrlTransform(url, key) {
  if (key === "src") {
    if (url.startsWith("/uploads/")) return url;
    if (/^https?:\/\//i.test(url)) return url;
    return "";
  }

  if (key === "href") {
    if (url.startsWith("/")) return url;
    if (/^https?:\/\//i.test(url)) return url;
    if (/^mailto:/i.test(url)) return url;
    return "";
  }

  return url;
}

export default function MarkdownText({ children }) {
  return (
    <div className="markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        skipHtml
        allowedElements={allowedElements}
        urlTransform={safeUrlTransform}
        components={{
          a({ href, children }) {
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            );
          },
          img({ src, alt, title }) {
            return (
              <img
                src={src}
                alt={alt ?? ""}
                title={title}
                loading="lazy"
                className="img-fluid rounded my-2"
              />
            );
          },
        }}
      >
        {children ?? ""}
      </ReactMarkdown>
    </div>
  );
}

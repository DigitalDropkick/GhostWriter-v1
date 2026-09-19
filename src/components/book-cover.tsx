import { Feather } from "lucide-react";

export function BookCover({
  title,
  author,
  detail,
}: {
  title: string;
  author?: string;
  detail?: string;
}) {
  return (
    <div className="book-cover">
      <div className="cover-frame">
        <span className="cover-edition">A Ghostwriter book</span>
        <Feather className="cover-feather" aria-hidden="true" />
        <p className="cover-title">{title}</p>
        {author && <p className="cover-author">{author}</p>}
        {detail && <p className="cover-detail">{detail}</p>}
      </div>
    </div>
  );
}

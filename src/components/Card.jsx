// `flush` removes the body padding, for cards that hold a table or a filter bar.
// `fill` makes the card take the height left on a .fill-page; its table then scrolls inside it.
export default function Card({ title, actions, flush = false, fill = false, children }) {
  return (
    <section className={`rounded-lg border border-slate-200 bg-surface shadow-sm ${fill ? 'card-fill fill-grow' : ''}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
          {title && <h2 className="text-[15px] font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className={`card-body ${flush ? '' : 'p-5'}`}>{children}</div>
    </section>
  );
}

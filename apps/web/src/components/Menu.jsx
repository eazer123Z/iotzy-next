export default function Menu({ items, active, onChange }) {
  return (
    <nav className="menu">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          className={active === item.key ? 'menu-btn active' : 'menu-btn'}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

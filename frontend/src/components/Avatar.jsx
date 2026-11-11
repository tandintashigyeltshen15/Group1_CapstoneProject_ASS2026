export const API_ORIGIN =
  (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/api\/?$/, "");

export const photoSrc = (p) => (!p ? "" : /^https?:/.test(p) ? p : `${API_ORIGIN}${p}`);

const initialsOf = (name = "") =>
  name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

export default function Avatar({ name = "", photoUrl = "", size = "h-16 w-16", text = "text-xl", className = "" }) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoSrc(photoUrl)}
        alt={name}
        className={`${size} shrink-0 rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`flex ${size} ${text} shrink-0 items-center justify-center rounded-full bg-sidebar font-semibold text-white ${className}`}
    >
      {initialsOf(name) || "?"}
    </div>
  );
}
const getInitials = (name = "") => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "U";
  }

  if (parts.length === 1) {
    return parts[0]
      .charAt(0)
      .toUpperCase();
  }

  return `${parts[0].charAt(0)}${parts[
    parts.length - 1
  ].charAt(0)}`.toUpperCase();
};


const UserAvatar = ({
  name,
  imageUrl = "",
  size = "md",
}) => {

  const sizeClasses = {
    sm: "h-9 w-9 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const avatarSize =
    sizeClasses[size] ||
    sizeClasses.md;


  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={`${name || "User"} profile`}
        className={`
          ${avatarSize}
          shrink-0
          rounded-full
          object-cover
          ring-2
          ring-white
        `}
      />
    );
  }


  // ==========================================
  // INITIALS FALLBACK
  // ==========================================

  return (
    <div
      className={`
        ${avatarSize}
        flex
        shrink-0
        items-center
        justify-center
        rounded-full
        bg-orange-100
        font-bold
        text-orange-700
        ring-2
        ring-white
      `}
      aria-label={`${name || "User"} avatar`}
    >
      {getInitials(name)}
    </div>
  );
};


export default UserAvatar;
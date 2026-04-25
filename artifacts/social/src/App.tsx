import { useEffect, useMemo, useRef, useState } from "react";
import {
  Switch,
  Route,
  Redirect,
  Link,
  useLocation,
  useParams,
  useSearch,
  Router as WouterRouter,
} from "wouter";
import {
  QueryClient,
  QueryClientProvider,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ClerkProvider,
  SignIn,
  SignUp,
  Show,
  useUser,
  useClerk,
} from "@clerk/react";
import { shadcn } from "@clerk/themes";
import { formatDistanceToNow } from "date-fns";
import {
  Home,
  Compass,
  Search as SearchIcon,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Heart,
  MessageCircle,
  ImagePlus,
  Send,
  UserPlus,
  UserMinus,
  Trash2,
  ArrowLeft,
  Sparkles,
  Users as UsersIcon,
  TrendingUp,
} from "lucide-react";
import {
  useGetMe,
  useUpdateMe,
  useGetFeed,
  useGetExplore,
  useGetTrending,
  useGetSuggestedUsers,
  useGetNotifications,
  useGetUserByUsername,
  useGetUserPosts,
  useGetFollowers,
  useGetFollowing,
  useSearchUsers,
  useFollowUser,
  useUnfollowUser,
  useCreatePost,
  useGetPost,
  useDeletePost,
  useLikePost,
  useUnlikePost,
  useGetComments,
  useCreateComment,
  useDeleteComment,
  getGetFeedQueryKey,
  getGetExploreQueryKey,
  getGetTrendingQueryKey,
  getGetSuggestedUsersQueryKey,
  getGetUserByUsernameQueryKey,
  getGetUserPostsQueryKey,
  getGetFollowersQueryKey,
  getGetFollowingQueryKey,
  getGetMeQueryKey,
  getGetPostQueryKey,
  getGetCommentsQueryKey,
  getGetNotificationsQueryKey,
} from "@workspace/api-client-react";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL as string | undefined;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(p: string): string {
  return basePath && p.startsWith(basePath)
    ? p.slice(basePath.length) || "/"
    : p;
}

function timeAgo(iso: string) {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return "";
  }
}

function initials(name?: string | null) {
  if (!name) return "??";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "??";
}

function Avatar({
  url,
  name,
  size = 40,
}: {
  url?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [broken, setBroken] = useState(false);
  if (url && !broken) {
    return (
      <img
        src={url}
        alt={name ?? ""}
        onError={() => setBroken(true)}
        style={{ width: size, height: size }}
        className="rounded-full object-cover bg-rose-100 ring-2 ring-white shadow-sm"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className="rounded-full bg-gradient-to-br from-[#ff8a76] to-[#f0345e] text-white font-bold flex items-center justify-center ring-2 ring-white shadow-sm"
    >
      {initials(name)}
    </div>
  );
}

const clerkAppearance = {
  theme: shadcn,
  cssLayerName: "clerk",
  options: {
    logoPlacement: "inside" as const,
    logoLinkUrl: basePath || "/",
    logoImageUrl: `${typeof window !== "undefined" ? window.location.origin : ""}${basePath}/logo.svg`,
  },
  variables: {
    colorPrimary: "#f0345e",
    colorForeground: "#2a1717",
    colorMutedForeground: "#7a5b5b",
    colorDanger: "#dc2626",
    colorBackground: "#ffffff",
    colorInput: "#fff8f3",
    colorInputForeground: "#2a1717",
    colorNeutral: "#f3d9d2",
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif",
    borderRadius: "0.85rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox:
      "bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl border border-rose-100",
    card: "!shadow-none !border-0 !bg-transparent !rounded-none",
    footer: "!shadow-none !border-0 !bg-transparent !rounded-none",
    headerTitle: "text-[#2a1717] text-2xl font-bold",
    headerSubtitle: "text-[#7a5b5b]",
    socialButtonsBlockButtonText: "text-[#2a1717] font-medium",
    formFieldLabel: "text-[#2a1717] font-medium",
    footerActionLink: "text-[#f0345e] font-semibold hover:text-[#c91e48]",
    footerActionText: "text-[#7a5b5b]",
    dividerText: "text-[#7a5b5b]",
    identityPreviewEditButton: "text-[#f0345e]",
    formFieldSuccessText: "text-emerald-600",
    alertText: "text-[#2a1717]",
    logoBox: "justify-center mb-2",
    logoImage: "h-10 w-10",
    socialButtonsBlockButton:
      "border border-rose-100 bg-[#fff8f3] hover:bg-[#ffeee5] rounded-xl",
    formButtonPrimary:
      "bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] hover:opacity-95 text-white rounded-xl font-semibold",
    formFieldInput:
      "bg-[#fff8f3] border border-rose-100 text-[#2a1717] rounded-xl",
    footerAction: "text-[#7a5b5b]",
    dividerLine: "bg-rose-100",
    alert: "bg-rose-50 border border-rose-200 rounded-xl",
    otpCodeFieldInput: "bg-[#fff8f3] border border-rose-100",
    formFieldRow: "",
    main: "",
  },
};

function SignInPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#fff8f3] via-[#ffeee5] to-[#ffd9d0] px-4 py-10">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        forceRedirectUrl={`${basePath}/feed`}
      />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-[#fff8f3] via-[#ffeee5] to-[#ffd9d0] px-4 py-10">
      <SignUp
        routing="path"
        path={`${basePath}/sign-up`}
        signInUrl={`${basePath}/sign-in`}
        forceRedirectUrl={`${basePath}/feed`}
      />
    </div>
  );
}

function Landing() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#fff8f3] via-[#ffeee5] to-[#ffd9d0]">
      <header className="flex items-center justify-between px-6 md:px-12 py-6">
        <div className="flex items-center gap-3">
          <img src={`${basePath}/logo.svg`} alt="Connectly" className="h-9 w-9" />
          <span className="text-xl font-extrabold tracking-tight">Connectly</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/sign-in"
            className="px-4 py-2 rounded-full font-semibold text-[#2a1717] hover:bg-white/60 transition"
          >
            Sign in
          </Link>
          <Link
            to="/sign-up"
            className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] hover:opacity-95 shadow-lg shadow-rose-200 transition"
          >
            Join Connectly
          </Link>
        </div>
      </header>

      <main className="px-6 md:px-12 max-w-6xl mx-auto pt-10 pb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/70 border border-rose-200 text-sm font-medium text-[#c91e48] mb-6">
              <Sparkles className="h-3.5 w-3.5" />
              A cozy little corner of the internet
            </div>
            <h1 className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Share moments with the people who{" "}
              <span className="bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] bg-clip-text text-transparent">
                actually matter
              </span>
              .
            </h1>
            <p className="mt-6 text-lg text-[#5a3a3a] max-w-lg">
              Connectly is a warm, modern social space for the friends, family,
              and small communities you love. No noise, no rage bait — just
              moments worth keeping.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/sign-up"
                className="px-7 py-3 rounded-full font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] hover:opacity-95 shadow-xl shadow-rose-200 transition"
              >
                Create your space
              </Link>
              <Link
                to="/sign-in"
                className="px-7 py-3 rounded-full font-semibold text-[#2a1717] bg-white border border-rose-100 hover:bg-[#fff8f3] transition"
              >
                I already have an account
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-[#5a3a3a]">
              <div className="flex -space-x-2">
                {["AM", "JK", "RO", "LE"].map((i, idx) => (
                  <div
                    key={i}
                    className="h-9 w-9 rounded-full ring-2 ring-white text-white text-xs font-bold flex items-center justify-center"
                    style={{
                      background:
                        ["#ff6b5b", "#f0345e", "#ff9a76", "#e0517a"][idx],
                    }}
                  >
                    {i}
                  </div>
                ))}
              </div>
              Loved by small circles all over the world.
            </div>
          </div>

          <div className="relative">
            <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-[#ffd9d0] blur-3xl opacity-70" />
            <div className="absolute -bottom-10 -right-6 h-48 w-48 rounded-full bg-[#ff8a76] blur-3xl opacity-50" />
            <div className="relative bg-white rounded-3xl shadow-2xl shadow-rose-200/50 p-6 border border-rose-100">
              <div className="flex items-center gap-3">
                <Avatar name="Maya Lin" size={44} />
                <div>
                  <div className="font-bold">Maya Lin</div>
                  <div className="text-xs text-[#7a5b5b]">2 minutes ago</div>
                </div>
              </div>
              <p className="mt-4 text-[#2a1717]">
                Sunset walk with the pup. He insisted on stopping to greet every
                single dog on the trail. Worth every minute.
              </p>
              <div className="mt-4 h-44 rounded-2xl bg-gradient-to-br from-[#ffb199] via-[#ff8a76] to-[#f0345e]" />
              <div className="mt-4 flex items-center gap-6 text-sm text-[#7a5b5b]">
                <span className="inline-flex items-center gap-1.5">
                  <Heart className="h-4 w-4 text-[#f0345e]" /> 28
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MessageCircle className="h-4 w-4" /> 5
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-24 grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <UsersIcon className="h-5 w-5" />,
              title: "Just your people",
              text: "Follow friends and small circles. No infinite scroll of strangers.",
            },
            {
              icon: <Heart className="h-5 w-5" />,
              title: "Real moments",
              text: "Photos, words, and small wins — the stuff worth remembering.",
            },
            {
              icon: <Sparkles className="h-5 w-5" />,
              title: "Calm by design",
              text: "Warm colors, gentle rhythm, no algorithmic dread.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-2xl p-6 border border-rose-100 shadow-sm"
            >
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#ff6b5b] to-[#f0345e] text-white flex items-center justify-center mb-4">
                {f.icon}
              </div>
              <div className="font-bold text-lg">{f.title}</div>
              <p className="text-[#5a3a3a] mt-1">{f.text}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="px-6 md:px-12 py-8 text-center text-sm text-[#7a5b5b]">
        Made with care · Connectly
      </footer>
    </div>
  );
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium transition ${
        active
          ? "bg-white text-[#f0345e] shadow-sm"
          : "text-[#5a3a3a] hover:bg-white/70"
      }`}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const me = useGetMe();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  const isActive = (p: string) =>
    location === p || (p !== "/" && location.startsWith(p));

  return (
    <div className="min-h-[100dvh] bg-[#fff8f3] text-[#2a1717]">
      <div className="max-w-6xl mx-auto px-4 md:px-6 grid md:grid-cols-[260px_1fr] gap-6 py-6">
        <aside className="md:sticky md:top-6 md:self-start space-y-2">
          <Link
            to="/feed"
            className="flex items-center gap-3 px-2 py-2 mb-2"
          >
            <img src={`${basePath}/logo.svg`} alt="Connectly" className="h-9 w-9" />
            <span className="text-xl font-extrabold tracking-tight">
              Connectly
            </span>
          </Link>
          <NavItem
            to="/feed"
            icon={<Home className="h-5 w-5" />}
            label="Home"
            active={isActive("/feed")}
          />
          <NavItem
            to="/explore"
            icon={<Compass className="h-5 w-5" />}
            label="Explore"
            active={isActive("/explore")}
          />
          <NavItem
            to="/search"
            icon={<SearchIcon className="h-5 w-5" />}
            label="Search"
            active={isActive("/search")}
          />
          <NavItem
            to="/notifications"
            icon={<Bell className="h-5 w-5" />}
            label="Notifications"
            active={isActive("/notifications")}
          />
          {me.data && (
            <NavItem
              to={`/u/${me.data.username}`}
              icon={
                <Avatar
                  url={me.data.avatarUrl ?? clerkUser?.imageUrl}
                  name={me.data.displayName}
                  size={20}
                />
              }
              label="Profile"
              active={location.startsWith(`/u/${me.data.username}`)}
            />
          )}
          <NavItem
            to="/settings"
            icon={<SettingsIcon className="h-5 w-5" />}
            label="Settings"
            active={isActive("/settings")}
          />
          <button
            onClick={() => signOut({ redirectUrl: `${basePath}/` })}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-medium text-[#5a3a3a] hover:bg-white/70 transition"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
          <a
            href="https://www.paypal.me/oamuoro"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] hover:opacity-95 shadow-md shadow-rose-200 transition text-sm"
          >
            <Heart className="h-4 w-4" />
            Support Connectly
          </a>
          <p className="text-xs text-center text-[#7a5b5b] mt-2 px-2">
            Help keep the lights on — any tip helps cover hosting.
          </p>
        </aside>
        <main className="min-w-0">{children}</main>
      </div>
    </div>
  );
}

type Post = {
  id: number;
  author: {
    id: number;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
};

function PostCard({ post }: { post: Post }) {
  const qc = useQueryClient();
  const like = useLikePost();
  const unlike = useUnlikePost();

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    qc.invalidateQueries({ queryKey: getGetExploreQueryKey() });
    qc.invalidateQueries({ queryKey: getGetTrendingQueryKey() });
    qc.invalidateQueries({ queryKey: getGetPostQueryKey(post.id) });
    qc.invalidateQueries({
      queryKey: getGetUserPostsQueryKey(post.author.username),
    });
  };

  const onLike = () => {
    if (post.likedByMe) {
      unlike.mutate({ id: post.id }, { onSuccess: invalidateAll });
    } else {
      like.mutate({ id: post.id }, { onSuccess: invalidateAll });
    }
  };

  return (
    <article className="bg-white rounded-2xl border border-rose-100 shadow-sm overflow-hidden">
      <div className="p-5">
        <div className="flex items-center gap-3">
          <Link to={`/u/${post.author.username}`}>
            <Avatar
              url={post.author.avatarUrl}
              name={post.author.displayName}
              size={44}
            />
          </Link>
          <div className="min-w-0">
            <Link
              to={`/u/${post.author.username}`}
              className="font-bold hover:underline"
            >
              {post.author.displayName}
            </Link>
            <div className="text-xs text-[#7a5b5b]">
              @{post.author.username} · {timeAgo(post.createdAt)}
            </div>
          </div>
        </div>
        <Link to={`/post/${post.id}`}>
          <p className="mt-3 whitespace-pre-wrap text-[#2a1717] leading-relaxed">
            {post.content}
          </p>
        </Link>
      </div>
      {post.imageUrl && (
        <Link to={`/post/${post.id}`}>
          <img
            src={post.imageUrl}
            alt=""
            className="w-full max-h-[520px] object-cover bg-rose-50"
          />
        </Link>
      )}
      <div className="px-5 py-3 flex items-center gap-5 text-sm text-[#5a3a3a] border-t border-rose-50">
        <button
          onClick={onLike}
          disabled={like.isPending || unlike.isPending}
          className={`inline-flex items-center gap-1.5 transition ${
            post.likedByMe
              ? "text-[#f0345e]"
              : "hover:text-[#f0345e]"
          }`}
        >
          <Heart
            className={`h-5 w-5 transition-transform active:scale-125 ${
              post.likedByMe ? "fill-current" : ""
            }`}
          />
          <span className="font-semibold">{post.likeCount}</span>
        </button>
        <Link
          to={`/post/${post.id}`}
          className="inline-flex items-center gap-1.5 hover:text-[#f0345e]"
        >
          <MessageCircle className="h-5 w-5" />
          <span className="font-semibold">{post.commentCount}</span>
        </Link>
      </div>
    </article>
  );
}

function Composer() {
  const qc = useQueryClient();
  const me = useGetMe();
  const create = useCreatePost();
  const [content, setContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImage, setShowImage] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    create.mutate(
      { data: { content: content.trim(), imageUrl: imageUrl.trim() || undefined } },
      {
        onSuccess: () => {
          setContent("");
          setImageUrl("");
          setShowImage(false);
          qc.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          qc.invalidateQueries({ queryKey: getGetExploreQueryKey() });
          if (me.data)
            qc.invalidateQueries({
              queryKey: getGetUserPostsQueryKey(me.data.username),
            });
        },
      },
    );
  };

  return (
    <form
      onSubmit={submit}
      className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5"
    >
      <div className="flex gap-3">
        <Avatar
          url={me.data?.avatarUrl}
          name={me.data?.displayName}
          size={44}
        />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What's on your mind today?"
            className="w-full resize-none bg-transparent outline-none text-lg placeholder-[#b29a9a] min-h-[60px]"
            rows={2}
          />
          {showImage && (
            <input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="Paste an image URL"
              className="mt-2 w-full bg-[#fff8f3] border border-rose-100 rounded-xl px-3 py-2 outline-none focus:border-rose-300"
            />
          )}
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowImage((s) => !s)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5a3a3a] hover:text-[#f0345e]"
            >
              <ImagePlus className="h-4 w-4" />
              {showImage ? "Hide image" : "Add image"}
            </button>
            <button
              type="submit"
              disabled={!content.trim() || create.isPending}
              className="px-5 py-2 rounded-full font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] disabled:opacity-50 hover:opacity-95 transition shadow-md shadow-rose-200"
            >
              {create.isPending ? "Sharing..." : "Share"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

function FollowButton({
  username,
  isFollowing,
  onChanged,
}: {
  username: string;
  isFollowing: boolean;
  onChanged?: () => void;
}) {
  const qc = useQueryClient();
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const refresh = () => {
    qc.invalidateQueries({ queryKey: getGetUserByUsernameQueryKey(username) });
    qc.invalidateQueries({ queryKey: getGetSuggestedUsersQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFeedQueryKey() });
    onChanged?.();
  };

  if (isFollowing) {
    return (
      <button
        onClick={() => unfollow.mutate({ username }, { onSuccess: refresh })}
        disabled={unfollow.isPending}
        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white border border-rose-200 text-[#5a3a3a] hover:bg-rose-50 font-semibold text-sm transition"
      >
        <UserMinus className="h-4 w-4" /> Following
      </button>
    );
  }
  return (
    <button
      onClick={() => follow.mutate({ username }, { onSuccess: refresh })}
      disabled={follow.isPending}
      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] text-white hover:opacity-95 font-semibold text-sm transition shadow-sm"
    >
      <UserPlus className="h-4 w-4" /> Follow
    </button>
  );
}

function FeedSidebar() {
  const suggestions = useGetSuggestedUsers();
  const trending = useGetTrending();

  return (
    <aside className="space-y-5 hidden lg:block">
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#f0345e]" />
          <h3 className="font-bold">Suggested for you</h3>
        </div>
        {suggestions.isLoading && (
          <div className="text-sm text-[#7a5b5b]">Loading...</div>
        )}
        {suggestions.data && suggestions.data.length === 0 && (
          <div className="text-sm text-[#7a5b5b]">No suggestions yet.</div>
        )}
        <div className="space-y-3">
          {suggestions.data?.slice(0, 5).map((u) => (
            <div key={u.id} className="flex items-center gap-3">
              <Link to={`/u/${u.username}`}>
                <Avatar url={u.avatarUrl} name={u.displayName} size={36} />
              </Link>
              <div className="flex-1 min-w-0">
                <Link
                  to={`/u/${u.username}`}
                  className="font-semibold text-sm truncate hover:underline block"
                >
                  {u.displayName}
                </Link>
                <div className="text-xs text-[#7a5b5b] truncate">
                  @{u.username}
                </div>
              </div>
              <FollowButton username={u.username} isFollowing={false} />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="h-4 w-4 text-[#f0345e]" />
          <h3 className="font-bold">Trending this week</h3>
        </div>
        {trending.isLoading && (
          <div className="text-sm text-[#7a5b5b]">Loading...</div>
        )}
        {trending.data && trending.data.length === 0 && (
          <div className="text-sm text-[#7a5b5b]">Nothing trending yet.</div>
        )}
        <div className="space-y-3">
          {trending.data?.slice(0, 5).map((p) => (
            <Link
              key={p.id}
              to={`/post/${p.id}`}
              className="block group"
            >
              <div className="text-xs text-[#7a5b5b]">
                @{p.author.username}
              </div>
              <div className="text-sm line-clamp-2 group-hover:text-[#f0345e] transition">
                {p.content}
              </div>
              <div className="text-xs text-[#7a5b5b] mt-0.5">
                {p.likeCount} likes
              </div>
            </Link>
          ))}
        </div>
      </div>
    </aside>
  );
}

function FeedPage() {
  const feed = useGetFeed();
  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-6">
      <div className="space-y-5">
        <Composer />
        {feed.isLoading && (
          <div className="text-center text-[#7a5b5b] py-10">
            Warming up your feed...
          </div>
        )}
        {feed.data && feed.data.length === 0 && (
          <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center">
            <Sparkles className="h-8 w-8 mx-auto text-[#f0345e] mb-3" />
            <h3 className="font-bold text-lg">Your feed is just starting</h3>
            <p className="text-[#7a5b5b] mt-1">
              Follow a few people from{" "}
              <Link to="/explore" className="text-[#f0345e] font-semibold">
                Explore
              </Link>{" "}
              to fill it with moments.
            </p>
          </div>
        )}
        {feed.data?.map((p) => <PostCard key={p.id} post={p as Post} />)}
      </div>
      <FeedSidebar />
    </div>
  );
}

function ExplorePage() {
  const explore = useGetExplore();
  return (
    <div className="space-y-5">
      <header className="bg-white rounded-2xl border border-rose-100 p-5">
        <h1 className="text-2xl font-extrabold">Explore</h1>
        <p className="text-[#7a5b5b]">Fresh moments from across Connectly.</p>
      </header>
      {explore.isLoading && (
        <div className="text-center text-[#7a5b5b] py-10">Loading...</div>
      )}
      {explore.data && explore.data.length === 0 && (
        <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-[#7a5b5b]">
          Nothing here yet.
        </div>
      )}
      {explore.data?.map((p) => <PostCard key={p.id} post={p as Post} />)}
    </div>
  );
}

function NotificationsPage() {
  const n = useGetNotifications();
  const labelFor = (t: string) =>
    t === "like"
      ? "liked your post"
      : t === "comment"
      ? "commented on your post"
      : t === "follow"
      ? "started following you"
      : "did something";
  return (
    <div className="space-y-3">
      <header className="bg-white rounded-2xl border border-rose-100 p-5">
        <h1 className="text-2xl font-extrabold">Notifications</h1>
      </header>
      {n.isLoading && (
        <div className="text-center text-[#7a5b5b] py-10">Loading...</div>
      )}
      {n.data && n.data.length === 0 && (
        <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-[#7a5b5b]">
          You're all caught up.
        </div>
      )}
      {n.data?.map((item) => (
        <div
          key={item.id}
          className="bg-white rounded-2xl border border-rose-100 p-4 flex items-center gap-3"
        >
          <Link to={`/u/${item.actor.username}`}>
            <Avatar
              url={item.actor.avatarUrl}
              name={item.actor.displayName}
              size={40}
            />
          </Link>
          <div className="flex-1 min-w-0">
            <div className="text-sm">
              <Link
                to={`/u/${item.actor.username}`}
                className="font-semibold hover:underline"
              >
                {item.actor.displayName}
              </Link>{" "}
              <span className="text-[#5a3a3a]">{labelFor(item.type)}</span>
            </div>
            <div className="text-xs text-[#7a5b5b]">
              {timeAgo(item.createdAt)}
            </div>
          </div>
          {item.postId && (
            <Link
              to={`/post/${item.postId}`}
              className="text-sm font-semibold text-[#f0345e] hover:underline"
            >
              View
            </Link>
          )}
        </div>
      ))}
    </div>
  );
}

function SearchPage() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const initial = params.get("q") ?? "";
  const [, setLocation] = useLocation();
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);

  const result = useSearchUsers({ q: initial || undefined });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocation(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-rose-100 p-4 flex items-center gap-2"
      >
        <SearchIcon className="h-5 w-5 text-[#7a5b5b] ml-2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search people by name or @username"
          className="flex-1 bg-transparent outline-none text-lg placeholder-[#b29a9a]"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-full bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] text-white font-semibold text-sm"
        >
          Search
        </button>
      </form>
      <div className="bg-white rounded-2xl border border-rose-100 p-2">
        {result.isLoading && (
          <div className="p-6 text-center text-[#7a5b5b]">Searching...</div>
        )}
        {result.data && result.data.length === 0 && (
          <div className="p-6 text-center text-[#7a5b5b]">
            {initial ? "No one matched." : "Try searching for someone."}
          </div>
        )}
        {result.data?.map((u) => (
          <Link
            key={u.id}
            to={`/u/${u.username}`}
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fff8f3] transition"
          >
            <Avatar url={u.avatarUrl} name={u.displayName} size={44} />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{u.displayName}</div>
              <div className="text-sm text-[#7a5b5b] truncate">
                @{u.username}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function ProfilePage() {
  const params = useParams<{ username: string }>();
  const username = params.username!;
  const profile = useGetUserByUsername(username);
  const posts = useGetUserPosts(username);
  const [tab, setTab] = useState<"posts" | "followers" | "following">("posts");
  const followers = useGetFollowers(username, {
    query: {
      enabled: tab === "followers",
      queryKey: getGetFollowersQueryKey(username),
    },
  });
  const following = useGetFollowing(username, {
    query: {
      enabled: tab === "following",
      queryKey: getGetFollowingQueryKey(username),
    },
  });

  if (profile.isLoading) {
    return (
      <div className="text-center text-[#7a5b5b] py-10">Loading profile...</div>
    );
  }
  if (!profile.data) {
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center">
        <h2 className="font-bold text-xl">User not found</h2>
        <p className="text-[#7a5b5b] mt-2">
          They may have changed their @ — try searching for them.
        </p>
      </div>
    );
  }
  const p = profile.data;

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-rose-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-br from-[#ffb199] via-[#ff8a76] to-[#f0345e]" />
        <div className="px-6 pb-6 -mt-12">
          <div className="flex items-end justify-between gap-4">
            <Avatar
              url={p.avatarUrl}
              name={p.displayName}
              size={96}
            />
            <div className="mb-2">
              {p.isMe ? (
                <Link
                  to="/settings"
                  className="px-4 py-1.5 rounded-full bg-white border border-rose-200 font-semibold text-sm hover:bg-rose-50"
                >
                  Edit profile
                </Link>
              ) : (
                <FollowButton
                  username={p.username}
                  isFollowing={p.isFollowing}
                />
              )}
            </div>
          </div>
          <div className="mt-3">
            <h1 className="text-2xl font-extrabold">{p.displayName}</h1>
            <div className="text-[#7a5b5b]">@{p.username}</div>
            {p.bio && <p className="mt-3 text-[#2a1717]">{p.bio}</p>}
            <div className="mt-4 flex gap-6 text-sm">
              <button
                onClick={() => setTab("posts")}
                className="hover:text-[#f0345e]"
              >
                <span className="font-bold">{p.postCount}</span>{" "}
                <span className="text-[#7a5b5b]">Posts</span>
              </button>
              <button
                onClick={() => setTab("followers")}
                className="hover:text-[#f0345e]"
              >
                <span className="font-bold">{p.followerCount}</span>{" "}
                <span className="text-[#7a5b5b]">Followers</span>
              </button>
              <button
                onClick={() => setTab("following")}
                className="hover:text-[#f0345e]"
              >
                <span className="font-bold">{p.followingCount}</span>{" "}
                <span className="text-[#7a5b5b]">Following</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(["posts", "followers", "following"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-full font-semibold text-sm transition ${
              tab === t
                ? "bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] text-white shadow"
                : "bg-white border border-rose-100 text-[#5a3a3a] hover:bg-rose-50"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "posts" && (
        <div className="space-y-5">
          {posts.data && posts.data.length === 0 && (
            <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-[#7a5b5b]">
              No posts yet.
            </div>
          )}
          {posts.data?.map((post) => (
            <PostCard key={post.id} post={post as Post} />
          ))}
        </div>
      )}
      {tab === "followers" && (
        <UserList
          users={followers.data ?? []}
          loading={followers.isLoading}
          emptyText="No followers yet."
        />
      )}
      {tab === "following" && (
        <UserList
          users={following.data ?? []}
          loading={following.isLoading}
          emptyText="Not following anyone yet."
        />
      )}
    </div>
  );
}

function UserList({
  users,
  loading,
  emptyText,
}: {
  users: { id: number; username: string; displayName: string; avatarUrl?: string | null; bio?: string | null }[];
  loading: boolean;
  emptyText: string;
}) {
  if (loading)
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-[#7a5b5b]">
        Loading...
      </div>
    );
  if (users.length === 0)
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center text-[#7a5b5b]">
        {emptyText}
      </div>
    );
  return (
    <div className="bg-white rounded-2xl border border-rose-100 p-2">
      {users.map((u) => (
        <Link
          key={u.id}
          to={`/u/${u.username}`}
          className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#fff8f3] transition"
        >
          <Avatar url={u.avatarUrl} name={u.displayName} size={44} />
          <div className="flex-1 min-w-0">
            <div className="font-semibold truncate">{u.displayName}</div>
            <div className="text-sm text-[#7a5b5b] truncate">
              @{u.username}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

function PostPage() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const qc = useQueryClient();
  const [, setLocation] = useLocation();
  const post = useGetPost(id);
  const comments = useGetComments(id);
  const me = useGetMe();
  const create = useCreateComment();
  const del = useDeleteComment();
  const delPost = useDeletePost();
  const [text, setText] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    create.mutate(
      { id, data: { content: text.trim() } },
      {
        onSuccess: () => {
          setText("");
          qc.invalidateQueries({ queryKey: getGetCommentsQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetPostQueryKey(id) });
          qc.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          qc.invalidateQueries({ queryKey: getGetExploreQueryKey() });
        },
      },
    );
  };

  if (post.isLoading)
    return (
      <div className="text-center text-[#7a5b5b] py-10">Loading post...</div>
    );
  if (!post.data)
    return (
      <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center">
        <h2 className="font-bold text-xl">Post not found</h2>
      </div>
    );

  const isMine = me.data?.id === post.data.author.id;

  return (
    <div className="space-y-4">
      <button
        onClick={() => window.history.back()}
        className="inline-flex items-center gap-2 text-sm text-[#5a3a3a] hover:text-[#f0345e]"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <PostCard post={post.data as Post} />
      {isMine && (
        <button
          onClick={() => {
            if (confirm("Delete this post?")) {
              delPost.mutate(
                { id },
                {
                  onSuccess: () => {
                    qc.invalidateQueries({ queryKey: getGetFeedQueryKey() });
                    qc.invalidateQueries({
                      queryKey: getGetExploreQueryKey(),
                    });
                    setLocation("/feed");
                  },
                },
              );
            }
          }}
          className="inline-flex items-center gap-1.5 text-sm text-rose-700 hover:text-rose-900"
        >
          <Trash2 className="h-4 w-4" /> Delete post
        </button>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-rose-100 p-4 flex items-center gap-3"
      >
        <Avatar
          url={me.data?.avatarUrl}
          name={me.data?.displayName}
          size={36}
        />
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a thoughtful comment..."
          className="flex-1 bg-transparent outline-none placeholder-[#b29a9a]"
        />
        <button
          type="submit"
          disabled={!text.trim() || create.isPending}
          className="p-2 rounded-full bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] text-white disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>

      <div className="bg-white rounded-2xl border border-rose-100 divide-y divide-rose-50">
        {comments.isLoading && (
          <div className="p-6 text-center text-[#7a5b5b]">Loading comments...</div>
        )}
        {comments.data && comments.data.length === 0 && (
          <div className="p-6 text-center text-[#7a5b5b]">
            Be the first to say something kind.
          </div>
        )}
        {comments.data?.map((c) => (
          <div key={c.id} className="p-4 flex gap-3">
            <Link to={`/u/${c.author.username}`}>
              <Avatar
                url={c.author.avatarUrl}
                name={c.author.displayName}
                size={36}
              />
            </Link>
            <div className="flex-1 min-w-0">
              <div className="text-sm">
                <Link
                  to={`/u/${c.author.username}`}
                  className="font-semibold hover:underline"
                >
                  {c.author.displayName}
                </Link>{" "}
                <span className="text-xs text-[#7a5b5b]">
                  · {timeAgo(c.createdAt)}
                </span>
              </div>
              <div className="text-[#2a1717] mt-0.5 whitespace-pre-wrap">
                {c.content}
              </div>
            </div>
            {c.author.id === me.data?.id && (
              <button
                onClick={() =>
                  del.mutate(
                    { id: c.id },
                    {
                      onSuccess: () =>
                        qc.invalidateQueries({
                          queryKey: getGetCommentsQueryKey(id),
                        }),
                    },
                  )
                }
                className="text-[#7a5b5b] hover:text-rose-700"
                title="Delete"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsPage() {
  const me = useGetMe();
  const qc = useQueryClient();
  const update = useUpdateMe();
  const [form, setForm] = useState({
    displayName: "",
    username: "",
    bio: "",
    avatarUrl: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (me.data) {
      setForm({
        displayName: me.data.displayName ?? "",
        username: me.data.username ?? "",
        bio: me.data.bio ?? "",
        avatarUrl: me.data.avatarUrl ?? "",
      });
    }
  }, [me.data]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(false);
    update.mutate(
      {
        data: {
          displayName: form.displayName,
          username: form.username,
          bio: form.bio,
          avatarUrl: form.avatarUrl || undefined,
        },
      },
      {
        onSuccess: (next) => {
          qc.invalidateQueries({ queryKey: getGetMeQueryKey() });
          if (next?.username)
            qc.invalidateQueries({
              queryKey: getGetUserByUsernameQueryKey(next.username),
            });
          setSaved(true);
        },
      },
    );
  };

  return (
    <div className="space-y-5">
      <header className="bg-white rounded-2xl border border-rose-100 p-5">
        <h1 className="text-2xl font-extrabold">Settings</h1>
        <p className="text-[#7a5b5b]">Tune up how you show up on Connectly.</p>
      </header>
      <form
        onSubmit={submit}
        className="bg-white rounded-2xl border border-rose-100 p-6 space-y-4"
      >
        <div className="flex items-center gap-4">
          <Avatar
            url={form.avatarUrl || me.data?.avatarUrl}
            name={form.displayName}
            size={72}
          />
          <div className="flex-1">
            <label className="text-sm font-semibold block mb-1">
              Avatar URL
            </label>
            <input
              value={form.avatarUrl}
              onChange={(e) =>
                setForm({ ...form, avatarUrl: e.target.value })
              }
              placeholder="https://..."
              className="w-full bg-[#fff8f3] border border-rose-100 rounded-xl px-3 py-2 outline-none focus:border-rose-300"
            />
          </div>
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">
            Display name
          </label>
          <input
            value={form.displayName}
            onChange={(e) =>
              setForm({ ...form, displayName: e.target.value })
            }
            className="w-full bg-[#fff8f3] border border-rose-100 rounded-xl px-3 py-2 outline-none focus:border-rose-300"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">Username</label>
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="w-full bg-[#fff8f3] border border-rose-100 rounded-xl px-3 py-2 outline-none focus:border-rose-300"
          />
        </div>
        <div>
          <label className="text-sm font-semibold block mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={3}
            className="w-full bg-[#fff8f3] border border-rose-100 rounded-xl px-3 py-2 outline-none focus:border-rose-300 resize-none"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={update.isPending}
            className="px-5 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e] hover:opacity-95 transition shadow-md shadow-rose-200 disabled:opacity-50"
          >
            {update.isPending ? "Saving..." : "Save changes"}
          </button>
          {saved && (
            <span className="text-sm text-emerald-700 font-medium">
              Saved.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}

function NotFound() {
  return (
    <div className="bg-white rounded-2xl border border-rose-100 p-10 text-center">
      <h1 className="text-3xl font-extrabold">Lost in the cozy void</h1>
      <p className="text-[#7a5b5b] mt-2">
        That page doesn't exist. Try heading back home.
      </p>
      <Link
        to="/feed"
        className="inline-block mt-6 px-5 py-2.5 rounded-full font-semibold text-white bg-gradient-to-r from-[#ff6b5b] to-[#f0345e]"
      >
        Take me home
      </Link>
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/feed" />
      </Show>
      <Show when="signed-out">
        <Landing />
      </Show>
    </>
  );
}

function Protected({ children }: { children: React.ReactNode }) {
  // Ensure the user row is created on the backend on first load.
  useGetMe();
  return (
    <>
      <Show when="signed-in">
        <Shell>{children}</Shell>
      </Show>
      <Show when="signed-out">
        <Redirect to="/" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    const unsub = addListener(({ user }) => {
      const id = user?.id ?? null;
      if (prevRef.current !== undefined && prevRef.current !== id) {
        qc.clear();
      }
      prevRef.current = id;
    });
    return unsub;
  }, [addListener, qc]);
  return null;
}

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, refetchOnWindowFocus: false } },
});

function ClerkProviderWithRoutes() {
  const [, setLocation] = useLocation();
  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      appearance={clerkAppearance}
      signInUrl={`${basePath}/sign-in`}
      signUpUrl={`${basePath}/sign-up`}
      localization={{
        signIn: {
          start: {
            title: "Welcome back",
            subtitle: "Sign in to your Connectly account",
          },
        },
        signUp: {
          start: {
            title: "Create your Connectly account",
            subtitle: "Share moments with people you actually know",
          },
        },
      }}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <Switch>
          <Route path="/" component={HomeRedirect} />
          <Route path="/sign-in/*?" component={SignInPage} />
          <Route path="/sign-up/*?" component={SignUpPage} />
          <Route path="/feed">
            <Protected>
              <FeedPage />
            </Protected>
          </Route>
          <Route path="/explore">
            <Protected>
              <ExplorePage />
            </Protected>
          </Route>
          <Route path="/notifications">
            <Protected>
              <NotificationsPage />
            </Protected>
          </Route>
          <Route path="/search">
            <Protected>
              <SearchPage />
            </Protected>
          </Route>
          <Route path="/u/:username">
            <Protected>
              <ProfilePage />
            </Protected>
          </Route>
          <Route path="/post/:id">
            <Protected>
              <PostPage />
            </Protected>
          </Route>
          <Route path="/settings">
            <Protected>
              <SettingsPage />
            </Protected>
          </Route>
          <Route>
            <Protected>
              <NotFound />
            </Protected>
          </Route>
        </Switch>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  if (!clerkPubKey) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#2a1717]">
        Missing VITE_CLERK_PUBLISHABLE_KEY
      </div>
    );
  }
  return (
    <WouterRouter base={basePath}>
      <ClerkProviderWithRoutes />
    </WouterRouter>
  );
}

export default App;

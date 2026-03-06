const DeletedBlog = () => {
  return (
    <div className="min-h-screen bg-terminal-bg text-matrix p-8">
      <div className="max-w-2xl mx-auto mt-16">
        <article className="border border-matrix/30 rounded-lg p-8 bg-terminal-bg/80">
          <h1 className="font-terminal text-2xl mb-4 neon-pulse">
            dacc{"{whats_gone_is_never_forgotten}"}
          </h1>
          <p className="text-matrix/50 text-sm mb-6">
            Published on March 5, 2026
          </p>
          <div className="text-matrix/70 space-y-4 font-terminal text-sm">
            <p>
              This blog post has been removed. If you're seeing this, you
              probably shouldn't be here.
            </p>
            <p className="text-matrix/30">
              Some things on the internet are never truly deleted.
            </p>
          </div>
        </article>
      </div>
    </div>
  );
};

export default DeletedBlog;
